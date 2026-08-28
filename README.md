# skapely-website

Site vitrine bilingue (français par défaut, anglais sous `/en`) présentant les quatre
plugins SketchUp de Skapely. Site statique, sans base de données, sans authentification
et sans paiement : son rôle est la présentation et la collecte de contacts.

- **Astro 5** en sortie statique (`output: 'static'`)
- **Tailwind CSS 4** en configuration CSS (`@tailwindcss/vite` + `@theme`)
- **TypeScript strict**
- **Cloudflare Pages** pour l'hébergement, plus une Pages Function pour le formulaire
- Une seule dépendance de production côté serveur : **Zod**, utilisée par la fonction

## Démarrer en local

```bash
npm install
npm run dev          # http://localhost:4321
```

Autres commandes :

```bash
npm run build            # génère dist/
npm run preview          # sert dist/ tel qu'Astro l'a produit
npm run check            # astro check + typage des functions + parité des traductions
npm run check:i18n       # compare fr.json et en.json
npm run check:functions   # typage de functions/ avec son propre tsconfig
```

`npm run check` doit passer avant tout commit : `astro check` ne couvre pas `functions/`,
d'où le script dédié.

## Vulnérabilités npm et version d'Astro

`npm install` signale des vulnérabilités. Voici l'état relevé le **24 août 2026**, pour
ne pas avoir à refaire l'analyse à chaque installation. **Ne pas lancer
`npm audit fix --force`** : la seule correction proposée est une montée en Astro 7, qui
est une décision à prendre (voir plus bas), pas un correctif automatique.

### Ce qui est signalé

`npm audit` remonte trois paquets et dix avis au total :

| Paquet | Sévérité npm | Version installée | Origine |
| --- | --- | --- | --- |
| `astro` | high | 5.18.2 | dépendance directe |
| `esbuild` | low | 0.27.7 | tiré par `astro` |
| `sharp` | high | 0.34.5 | tiré par `astro` |

Les huit avis portés par `astro` lui-même, avec la version qui les corrige :

| Avis | Sévérité | Corrigé en |
| --- | --- | --- |
| XSS `define:vars`, balise `</script>` mal assainie | moderate | 6.1.6 |
| Rejeu des paramètres chiffrés des server islands | low | 6.1.10 |
| XSS par noms d'attributs en spread | moderate | 6.4.6 |
| XSS spread dans `renderHTMLElement` | moderate | 7.0.6 |
| XSS sur les directives `transition:*` d'îlots hydratés | low | 7.0.4 |
| XSS réfléchi, propriétés d'animation de View Transitions | moderate | après 7.0.9 |
| SSRF par en-tête Host sur la page d'erreur prérendue | high | 6.4.6 |
| XSS réfléchi par nom de slot | high | 6.3.3 |

À noter : `wrangler` tire ses propres copies d'`esbuild` (0.28.1) et de `sharp` (0.35.2),
toutes deux **hors des plages vulnérables**. Seules les copies tirées par `astro` sont
concernées.

### Pourquoi le site publié n'est pas atteint

Chaque point ci-dessous a été vérifié sur ce dépôt, pas supposé :

- **Aucun runtime en production.** `output: 'static'` et aucun adaptateur : `dist/` ne
  contient aucun fichier JavaScript serveur. Cloudflare Pages sert des fichiers HTML déjà
  rendus, Astro ne s'exécute jamais côté serveur. Or les avis « XSS réfléchi » et « SSRF
  par en-tête Host » supposent un rendu au moment de la requête.
- **Aucune des fonctionnalités visées n'est utilisée** : zéro `define:vars`, zéro
  `server:defer`, zéro directive `transition:*` (les occurrences de `transition:` dans le
  CSS sont des propriétés d'animation, sans rapport), ni `ClientRouter` ni
  `ViewTransitions`, aucun slot nommé, aucun spread d'attributs `{...}`.
- **Le rendu au build ne consomme que nos propres fichiers** (`src/i18n/*.json`,
  `src/data/`), jamais une entrée extérieure.
- **`sharp` n'est jamais appelé** : pas d'`astro:assets`, pas de composant `<Image>`,
  aucune image dans le dépôt. Les CVE libvips supposent le traitement d'une image.
- **L'avis `esbuild` ne vise que le serveur de développement propre à esbuild**
  (`--servedir`), et sur Windows uniquement (« This issue affects Windows environments
  only »). `astro dev` sert les fichiers via Vite ; esbuild n'intervient que pour la
  transformation et le bundling. À garder en tête si le poste de développement est sous
  Windows, mais le chemin vulnérable n'est pas emprunté.

Le risque résiduel se limite donc à la machine de développement, pas au site déployé.

### Version d'Astro : décision à prendre

État du registre npm au 24 août 2026 :

- dernière version publiée : **7.2.6**, le 24 août 2026 ;
- **Astro 6.0.0** : 10 mars 2026 — **Astro 7.0.0** : 22 juin 2026 ;
- version installée : **5.18.2**, publiée le 26 mai 2026, qui est la **dernière 5.x
  existante**.

Aucun des correctifs listés plus haut n'a été rétroporté dans la branche 5 : ils
atterrissent en 6.1.6, 6.3.3, 6.4.6, 7.0.4 et 7.0.6.

**Le site publié n'est pas atteint, mais Astro 5.18.2 est la dernière 5.x et ne reçoit
plus de correctifs de sécurité ; une migration vers la majeure courante est à décider.**

Cette décision se prend séparément et n'est pas tranchée ici. Si elle est prise, elle
implique de relire les notes de migration 5 → 6 → 7 et de revérifier la configuration
i18n, `trailingSlash` et `build.format`, sur lesquelles repose la forme des URL.

## Structure

```
src/
  site.config.ts        Domaine, nom de marque, adresse de contact — source unique
  data/                 Données non localisées : produits, icônes, compatibilité
  i18n/                 fr.json, en.json, utilitaires et table des routes
  layouts/              Gabarit de page (métadonnées, hreflang, en-tête, pied de page)
  components/           Composants partagés ; components/pages/ contient les corps de page
  pages/                Routes : français à la racine, anglais sous en/
  styles/global.css     Jetons de thème Tailwind et styles de base
functions/api/          Pages Function du formulaire de contact
```

### Pourquoi deux fichiers de route par page

Chaque page existe une fois en français et une fois en anglais
(`src/pages/contact.astro` et `src/pages/en/contact.astro`), mais son contenu vit dans un
seul composant de `src/components/pages/`. Les fichiers de route font cinq lignes : ils
fixent la langue et l'identifiant de page, puis délèguent. L'URL se lit donc directement
dans l'arborescence, et les slugs traduits (`/produits/...` contre `/en/products/...`) ne
demandent aucune mécanique supplémentaire.

## Internationalisation

### Règle de base

Aucun texte visible n'est écrit dans un composant ou une page. Tout passe par
`src/i18n/fr.json` et `src/i18n/en.json`, exposés comme un objet typé :

```astro
---
import { getDictionary } from '../i18n/ui';
const t = getDictionary(locale);
---
<h1>{t.home.hero.title}</h1>
```

Une faute de frappe dans une clé casse `astro check`, et une clé manquante côté anglais
aussi (`en.json` est annoté `typeof fr.json` dans `src/i18n/ui.ts`).

### Ce qui ne va PAS dans les fichiers de traduction

Les noms propres et les données structurelles restent dans `src/data/` et
`src/site.config.ts` : noms des plugins, « SketchUp », « Windows », numéros de version,
identifiants d'icône, ordre d'affichage. Ils sont injectés dans les phrases par
interpolation :

```json
"supported": "Testé sur {app} {versions} sous {os}."
```

`npm run check:i18n` signale toute valeur écrite à l'identique dans les deux langues :
c'est presque toujours le signe d'une donnée à déplacer vers `src/data/`. Les rares
coïncidences réelles (« Contact », « Plugins ») sont listées et commentées en tête de
`scripts/check-i18n.mjs`.

### Ajouter une traduction

1. Ajouter la clé dans `src/i18n/fr.json`, à l'endroit qui correspond à son usage.
2. Ajouter la même clé dans `src/i18n/en.json` avec un contenu anglais rédigé.
3. `npm run check:i18n`.

### Ajouter une page

1. Déclarer la route dans `src/i18n/routes.ts` avec ses deux chemins (jamais de slash
   final ; seule la racine française s'écrit `/`).
2. Ajouter les titres et descriptions dans `meta` des deux dictionnaires.
3. Écrire le corps de la page dans `src/components/pages/`.
4. Créer les deux fichiers de route, en copiant un fichier existant du même type.

Le menu, le sélecteur de langue, les `hreflang` et le sitemap se mettent à jour seuls à
partir de la table de routes. Une page qui ne doit pas être indexée s'ajoute à la liste
`unlisted` de `src/i18n/routes.ts`.

## Charte visuelle

Les couleurs, rayons et ombres sont déclarés comme jetons dans `src/styles/global.css` et
s'utilisent comme classes (`bg-canvas`, `text-ink`, `rounded-card`, `shadow-card`). Aucune
valeur hexadécimale ne doit être répétée dans le markup.

**Règle du vert.** Le vert `#16A34A` est un accent rare, jamais une couleur de
remplissage. Il est réservé à quatre usages, et à rien d'autre :

1. le badge de statut (fond vert pâle `#DCFCE7`, texte vert foncé `#15803D`) ;
2. un chiffre clé par page ;
3. l'élément de navigation actif, un seul ;
4. le halo de focus des champs et des éléments focusables.

**Plafond : 3 zones vertes permanentes par page.**

Le halo de focus (usage 4) est **exclu du comptage** : il est transitoire, n'apparaît que
sur un élément à la fois, et c'est un signal d'accessibilité, pas de la décoration. Il ne
doit jamais être retiré ou atténué pour tenir le plafond.

État actuel : l'accueil et les pages produit sont **à 3/3** — élément de navigation actif,
badge « Lancement à venir », chiffre clé « 2024–2026 ». **Il n'y a plus aucune marge :
toute nouvelle zone verte impose d'en retirer une autre.** La page contact est à 2 (nav
actif, case de consentement cochée), plus le message de succès du formulaire quand il
s'affiche.

Ne sont pas verts, et ne doivent pas le devenir : les liens de navigation, les liens du
pied de page, les liens de carte (« En savoir plus »), et les boutons d'action principaux,
tous en anthracite. Les pastilles d'icônes sont en gris `#F3F4F6`.

Pour recompter après une modification, lister **nommément** les éléments rendus qui
portent `text-accent`, `bg-accent-soft` ou `accent-accent` dans `dist/`, plutôt que de se
contenter d'un nombre d'occurrences de classes :

```bash
npm run build
grep -o '<[^>]*\(text-accent\|bg-accent-soft\|accent-accent\)[^>]*>[^<]\{0,60\}' dist/index.html
```

## Formulaire de contact

Le formulaire poste vers `functions/api/subscribe.ts`, qui valide l'entrée avec Zod puis
envoie une notification par l'API Resend.

- **Sans JavaScript** : la fonction répond par une redirection 303 vers une vraie page
  (`/contact/merci` ou `/contact/erreur`, et leurs équivalents anglais).
- **Avec JavaScript** : la réponse est du JSON, affiché à côté du formulaire sans
  rechargement.
- L'adresse de contact est aussi affichée en clair sur la page, pour que le site reste
  utile si la fonction n'est pas déployée.

Protections : champ honeypot, consentement obligatoire, longueurs plafonnées (nom 100,
e-mail 254, message 2 000 caractères), et limitation à 5 envois par adresse IP et par
heure. Le compteur stocke une empreinte SHA-256 tronquée de l'IP, jamais l'adresse. La
notification est envoyée en texte brut : la saisie du visiteur n'est jamais interprétée
comme du HTML.

### Variables d'environnement

Voir `.env.example`. Aucune de ces valeurs ne doit être versionnée.

| Variable | Rôle |
| --- | --- |
| `RESEND_API_KEY` | Clé d'API Resend |
| `CONTACT_TO_EMAIL` | Adresse qui reçoit les notifications |
| `CONTACT_FROM_EMAIL` | Adresse expéditrice, sur un domaine vérifié dans Resend |

### Tester la fonction en local

```bash
cp .env.example .dev.vars     # .dev.vars est ignoré par git
npm run build
npm run pages:dev             # wrangler pages dev dist --kv RATE_LIMIT_KV
```

## Déploiement sur Cloudflare Pages

1. **Créer le projet** et le relier au dépôt Git.
2. **Build** : commande `npm run build`, dossier de sortie `dist`. Le dossier `functions/`
   est détecté automatiquement.
3. **Version de Node** : Astro 7 exige **Node 22.12.0 ou plus**. Le dépôt porte un
   `.nvmrc` à `22.12.0` et un champ `engines` dans `package.json`. En ceinture et
   bretelles, poser aussi `NODE_VERSION` à `22.12.0` dans
   *Settings > Environment variables*, au cas où Pages n'honorerait pas le `.nvmrc` :
   sans cela le build échoue en production alors qu'il passe en local.
4. **Variables d'environnement** : renseigner les trois variables ci-dessus dans
   *Settings > Environment variables*, en les marquant comme secrètes.
5. **Namespace KV** : créer un namespace, puis le lier au projet sous le nom
   `RATE_LIMIT_KV` dans *Settings > Functions > KV namespace bindings*. Sans ce binding,
   le formulaire continue de fonctionner mais la limitation par IP est désactivée et un
   avertissement est journalisé.
6. **Règle de rate limiting** : poser en complément une règle sur `/api/subscribe` dans
   *Security > WAF > Rate limiting rules*. Le compteur KV est une première barrière, pas
   une protection de bordure.
7. **Domaine** : ajouter le domaine personnalisé dans *Custom domains*.

### Changer de domaine ou de marque

Tout est dans `src/site.config.ts` : `SITE_URL` (aujourd'hui `https://skapely.fr`),
`SITE_NAME` et `CONTACT_EMAIL`, qui dérive du domaine. `astro.config.ts` importe
`SITE_URL`, et les canonical, `hreflang`, le sitemap et `robots.txt` en découlent. Le
domaine n'est écrit qu'une seule fois dans tout le dépôt.

## Reste à compléter

- **Mentions légales et politique de confidentialité** : les deux pages portent des
  marqueurs `[[À COMPLÉTER : ...]]` (raison sociale, adresse, SIRET, hébergeur,
  sous-traitants, durée de conservation, modalités d'exercice des droits). Le contenu doit
  être renseigné puis relu par un professionnel du droit avant la mise en ligne.
- **Image Open Graph** : aucune n'est déclarée, faute de visuel. À ajouter dans
  `src/layouts/BaseLayout.astro` quand une image existera.
- **Captures d'écran des plugins** : les pages produit sont conçues pour se passer
  d'images ; des captures pourront s'y insérer sans refonte.
- **Compatibilité Mac** : non testée à ce jour, et le site le dit tel quel. À mettre à
  jour dans `src/data/compatibility.ts` et dans les deux dictionnaires le cas échéant.
