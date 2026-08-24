import { z } from 'zod';
import { getDictionary, locales, type Locale } from '../../src/i18n/ui';
import { pathFor } from '../../src/i18n/routes';

interface Env {
  /** Cle de l'API Resend. Jamais journalisee, jamais renvoyee au client. */
  RESEND_API_KEY: string;
  /** Destinataire de la notification. */
  CONTACT_TO_EMAIL: string;
  /** Expediteur declare aupres de Resend, sur un domaine verifie. */
  CONTACT_FROM_EMAIL: string;
  /** Compteur anti-abus. Optionnel : voir la note dans limiterVerdict(). */
  RATE_LIMIT_KV?: KVNamespace;
}

/** Plafond d'envois autorises depuis une meme adresse IP, par heure glissee. */
const MAX_SUBMISSIONS_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_SECONDS = 3600;

/**
 * Corps de la notification envoyee a l'exploitant du site. Ce texte ne
 * s'affiche jamais sur le site : il n'a donc pas sa place dans les fichiers de
 * traduction, dont le role est le contenu visible par les visiteurs.
 */
const NOTIFICATION = {
  subject: 'Nouveau contact depuis le site',
  intro: 'Un visiteur a laisse ses coordonnees via le formulaire de contact.',
  labels: {
    name: 'Nom',
    email: 'E-mail',
    locale: 'Langue',
    message: 'Message',
  },
  empty: '(non renseigne)',
} as const;

const localeSchema = z.enum(locales);

const submissionSchema = z.object({
  email: z.string().trim().min(1).max(254).email(),
  name: z.string().trim().max(100).optional(),
  message: z.string().trim().max(2000).optional(),
  consent: z.literal('yes'),
});

type ErrorKey = 'method' | 'payload' | 'email' | 'consent' | 'tooLong' | 'rateLimit' | 'server';

function messageFor(locale: Locale, key: ErrorKey): string {
  return getDictionary(locale).contact.errors[key];
}

/** Traduit la premiere anomalie de validation en cle de message. */
function errorKeyFor(issue: z.ZodIssue): ErrorKey {
  if (issue.code === 'too_big') return 'tooLong';
  const field = issue.path[0];
  if (field === 'email') return 'email';
  if (field === 'consent') return 'consent';
  return 'payload';
}

/** Empreinte non reversible de l'IP : on ne stocke jamais l'adresse elle-meme. */
async function fingerprint(ip: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return [...new Uint8Array(digest)]
    .slice(0, 8)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compte les envois par IP dans le KV. Si le binding n'est pas declare, on
 * laisse passer plutot que de casser le formulaire, et on le signale dans les
 * journaux : la creation du namespace fait partie de la procedure de
 * deploiement decrite dans le README, avec une regle de rate limiting posee au
 * tableau de bord Cloudflare en complement.
 */
async function isRateLimited(env: Env, request: Request): Promise<boolean> {
  const store = env.RATE_LIMIT_KV;
  if (!store) {
    console.warn('subscribe: RATE_LIMIT_KV absent, limitation par IP desactivee');
    return false;
  }

  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return false;

  const window = Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * 1000));
  const key = `rl:${window}:${await fingerprint(ip)}`;
  const count = Number((await store.get(key)) ?? '0');

  if (count >= MAX_SUBMISSIONS_PER_HOUR) return true;

  await store.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS });
  return false;
}

/** Ne conserve que le domaine : l'adresse complete ne doit jamais etre journalisee. */
function domainOf(email: string): string {
  return email.slice(email.indexOf('@'));
}

function wantsJson(request: Request): boolean {
  return (request.headers.get('Accept') ?? '').includes('application/json');
}

/**
 * Sans JavaScript, le navigateur suit une redirection vers une vraie page ;
 * avec JavaScript, la reponse est du JSON affiche a cote du formulaire.
 */
function respond(
  request: Request,
  locale: Locale,
  outcome: { ok: true } | { ok: false; status: number; key: ErrorKey },
): Response {
  if (wantsJson(request)) {
    const ok = outcome.ok;
    const message = ok
      ? getDictionary(locale).contact.status.success
      : messageFor(locale, outcome.key);
    return new Response(JSON.stringify({ ok, message }), {
      status: ok ? 200 : outcome.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const target = pathFor(outcome.ok ? 'contactSuccess' : 'contactError', locale);
  return new Response(null, {
    status: 303,
    headers: { Location: new URL(target, request.url).toString() },
  });
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, message: messageFor('fr', 'method') }), {
      status: 405,
      headers: { 'Content-Type': 'application/json; charset=utf-8', Allow: 'POST' },
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return respond(request, 'fr', { ok: false, status: 400, key: 'payload' });
  }

  const read = (field: string): string | undefined => {
    const value = form.get(field);
    return typeof value === 'string' ? value : undefined;
  };

  // La langue conditionne la page de retour : on la resout avant tout le reste.
  const localeResult = localeSchema.safeParse(read('locale'));
  const locale: Locale = localeResult.success ? localeResult.data : 'fr';

  // Piege a robots : on repond comme si tout s'etait bien passe, sans rien envoyer.
  if ((read('website') ?? '') !== '') {
    return respond(request, locale, { ok: true });
  }

  const parsed = submissionSchema.safeParse({
    email: read('email') ?? '',
    name: read('name') || undefined,
    message: read('message') || undefined,
    consent: read('consent'),
  });

  if (!parsed.success) {
    const [issue] = parsed.error.issues;
    const key: ErrorKey = issue ? errorKeyFor(issue) : 'payload';
    return respond(request, locale, { ok: false, status: 400, key });
  }

  if (await isRateLimited(env, request)) {
    return respond(request, locale, { ok: false, status: 429, key: 'rateLimit' });
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    console.error('subscribe: variables d environnement manquantes');
    return respond(request, locale, { ok: false, status: 500, key: 'server' });
  }

  const { email, name, message } = parsed.data;
  const { labels, empty } = NOTIFICATION;
  const body = [
    NOTIFICATION.intro,
    '',
    `${labels.name} : ${name ?? empty}`,
    `${labels.email} : ${email}`,
    `${labels.locale} : ${locale}`,
    '',
    `${labels.message} :`,
    message ?? empty,
  ].join('\n');

  try {
    // Envoi en texte brut uniquement : la saisie du visiteur n'est jamais
    // interpretee comme du HTML.
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: NOTIFICATION.subject,
        text: body,
      }),
    });

    if (!sent.ok) {
      console.error(`subscribe: envoi refuse (${sent.status}) pour ${domainOf(email)}`);
      return respond(request, locale, { ok: false, status: 500, key: 'server' });
    }
  } catch {
    console.error(`subscribe: envoi impossible pour ${domainOf(email)}`);
    return respond(request, locale, { ok: false, status: 500, key: 'server' });
  }

  return respond(request, locale, { ok: true });
};
