import type { APIRoute } from 'astro';
import { SITE_PRIVATE, SITE_URL } from '../site.config';

/**
 * robots.txt genere depuis SITE_URL, jamais ecrit en dur.
 *
 * TEMPORAIRE — tant que SITE_PRIVATE vaut true, le site est en ligne mais pas
 * publie : on refuse tout le site. La ligne `Sitemap:` est volontairement
 * retiree dans ce cas, parce qu'annoncer le plan du site tout en interdisant
 * son exploration reviendrait a livrer la liste complete des URLs a des robots
 * a qui on vient de dire de ne pas venir.
 *
 * A LA PUBLICATION : passer SITE_PRIVATE a false dans src/site.config.ts. La
 * branche ci-dessous restitue alors `Allow: /` et la ligne `Sitemap:` — rien
 * n'est a reecrire de memoire. Penser aussi a supprimer public/_headers, qui
 * pose un X-Robots-Tag et ne peut pas lire la constante.
 *
 * src/pages/sitemap.xml.ts n'est pas concerne : le sitemap continue d'etre
 * genere normalement dans les deux cas.
 */
export const GET: APIRoute = () => {
  const body = SITE_PRIVATE
    ? ['User-agent: *', 'Disallow: /', ''].join('\n')
    : ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
