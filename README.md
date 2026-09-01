# skapely-website

Site vitrine bilingue (français par défaut, anglais sous `/en`) présentant les quatre
plugins SketchUp de Skapely. Site statique, sans base de données, sans authentification
et sans paiement : son rôle est la présentation et la collecte de contacts.

- **Astro 7** en sortie statique (`output: 'static'`)
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

État au **28 août 2026** : `npm audit` remonte **0 vulnérabilité**. Cette section garde
la trace de la façon dont on y est arrivé, pour ne pas refaire l'analyse.

### Historique

Le site a été livré en **Astro 5.18.2**, sur laquelle `npm audit` remontait **trois
paquets et dix avis** : `astro` (high, huit avis), plus `esbuild` (low) et `sharp` (high)
tirés par lui. Le site publié n'était pas atteint — `output: 'static'`, aucun adaptateur,
donc aucun runtime en production, et aucune des fonctionnalités visées n'était utilisée —
mais **5.18.2 est la dernière 5.x publiée** et aucun correctif n'a été rétroporté dans
cette branche : les correctifs atterrissent en 6.1.6, 6.1.10, 6.3.3, 6.4.6, 7.0.4, 7.0.6
et après 7.0.9.

Le dépôt est donc passé en **Astro 7.2.9 le 28 août 2026**, un saut de deux majeures
(Astro 6.0.0 le 10 mars 2026, Astro 7.0.0 le 22 juin 2026). À noter, si la question se
repose : **la 7.0.10 n'existe pas**, la 7.0.x s'arrête à 7.0.9 et la première version
hors de tous les avis est 7.1.0.

Les trois paquets sortent des plages vulnérables sans intervention : `esbuild` passe en
0.28.2 (l'avis vise `<0.28.1`) et `sharp` en 0.35.4 (l'avis vise `<0.35.0`).

### Ce que la migration a demandé

Deux lignes de configuration, aucune modification de code applicatif :

- **`compressHTML: true`** dans `astro.config.ts`. Astro 7 fait passer le défaut de `true`
  à `'jsx'`, qui supprime l'espace séparant deux éléments rendus en ligne — `<span>`,
  `<em>` — comme le fait React. Sans cette ligne, `<span>a</span> <em>b</em>` rendrait
  `ab` sur les 24 pages.
- **Node 22.12.0 minimum**, exigé par Astro 7 : voir `.nvmrc`, le champ `engines` de
  `package.json` et l'étape 3 de la section Déploiement.

La configuration i18n, `trailingSlash: 'never'` et `build.format: 'file'` ont été
revérifiées et **n'ont demandé aucun changement**. Attention si la config i18n est
retouchée : depuis Astro 6, `i18n.routing.redirectToDefaultLocale` ne peut valoir `true`
que si `prefixDefaultLocale` vaut `true`. Notre couple `false`/`false` reste valide.

### Effets de bord assumés

- **Le bundle CSS a changé de nom** : `_astro/a-propos.*.css` est devenu
  `_astro/Card.*.css`, Rollup 8 nommant le chunk d'après un autre module d'entrée. C'est
  la **seule** ligne de l'inventaire de `dist/` qui a bougé : 35 fichiers avant, 35 après,
  mêmes 24 pages, mêmes sept `woff2` au hachage identique, `robots.txt` et `sitemap.xml`
  identiques à l'octet.
- **Le script embarqué du formulaire est minifié par un autre minifieur** (Vite 8) : `const`
  et guillemets deviennent `var` et accents graves. Code sémantiquement identique.
- **Le plancher navigateur du CSS est passé de Safari 14 à Safari 16.4** (Chrome 104+,
  Firefox 102+). Vite 8 émet la syntaxe d'intervalle des media queries,
  `@media (width>=40rem)` au lieu de `@media (min-width:40rem)`, et laisse tomber des
  préfixes `-webkit-`. Le mode de défaillance est bénin : sur un mobile plus ancien, des
  points de rupture qui ne s'appliquent pas laissent la page en une colonne, ce qui est
  la mise en page mobile prévue. **Pour revenir en arrière**, sans quoi il faudrait le
  redécouvrir :

  ```ts
  // astro.config.ts
  vite: {
    plugins: [tailwindcss()],
    build: { cssTarget: ['chrome107', 'edge107', 'firefox104', 'safari16'] },
  },
  ```

  Cette ligne restaure `@media (min-width:40rem)` et les préfixes. Elle n'est
  volontairement pas posée : un site vitrine livré en 2026 n'a pas à porter Safari 14.

### Fonctionnalités d'Astro 6 et 7 repérées et non implémentées

Signalées pour plus tard, délibérément écartées de la migration :

- **`security.csp`** — Content Security Policy native, stabilisée en Astro 6.
- **`astro:fonts`** — module de polices stabilisé en Astro 6, qui remplacerait
  `@fontsource-variable/inter`.
- **`cache` et `routeRules`** — stabilisés en Astro 7, sans objet en sortie statique.
- **Nouveau système de `logger`** — stabilisé en Astro 7.

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
public/                 Servi tel quel : favicon.svg, _headers
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

### Le site est en refus d'indexation

Le site est **en ligne mais pas encore publié**. Tant que c'est le cas, il refuse d'être
indexé, par **trois mécanismes** qui ne se recouvrent pas :

| Mécanisme | Fichier | Ce qu'il couvre |
| --- | --- | --- |
| `Disallow: /` | `src/pages/robots.txt.ts` | Empêche le parcours par les robots qui respectent `robots.txt` |
| `noindex, nofollow` | `src/layouts/BaseLayout.astro` | Lu **seulement si la page est parcourue** — donc pas quand `robots.txt` l'interdit |
| `X-Robots-Tag` | `public/_headers` | Posé sur **chaque réponse HTTP**, même pour une URL jamais parcourue |

Les deux premiers dépendent du parcours : `Disallow: /` empêche l'exploration mais
**n'empêche pas** une URL découverte autrement — un lien partagé, par exemple — d'être
listée. Le troisième est le seul qui ne dépende de rien : c'est lui qui ferme ce cas.

Le sitemap, lui, **continue d'être généré normalement** : `src/pages/sitemap.xml.ts`
n'est pas concerné. Seule la ligne `Sitemap:` de `robots.txt` est retirée tant que le
site est privé, pour ne pas livrer la liste des URLs à des robots à qui on vient de dire
de ne pas venir.

### Passer le site en public

**Deux gestes, pas un** :

1. **`SITE_PRIVATE = false`** dans `src/site.config.ts`. Cela restitue d'un coup
   `Allow: /` et la ligne `Sitemap:` dans `robots.txt`, et retire la balise `robots` des
   pages publiées (les pages `unlisted` et la 404 retrouvent leur `noindex, follow`).
2. **Supprimer `public/_headers`** — ou y commenter la ligne `X-Robots-Tag`.

Le second geste est facile à oublier, et c'est **la seule entorse au principe du réglage
unique** de `src/site.config.ts` : `public/_headers` est un fichier statique copié tel
quel dans `dist/`, il ne peut pas lire une constante TypeScript. Sans ce second geste, le
site reste désindexé alors que tout le code dit le contraire.

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
