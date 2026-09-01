# CLAUDE.md

Consignes de travail sur ce dépôt. Le `README.md` reste la référence détaillée ; ce
fichier dit ce qu'il ne faut pas casser, et pourquoi.

## Stack — versions exactes

Lues dans `package.json` et `package-lock.json`, pas de mémoire :

| Paquet | Version |
| --- | --- |
| `astro` | **7.2.9** |
| `tailwindcss` / `@tailwindcss/vite` | **4.3.3** |
| `typescript` | **5.9.3** |
| `zod` | **3.25.76** |
| `vite` (transitif) | **8.2.2** |
| Node | **≥ 22.12.0** (`.nvmrc`, `engines`) |
| Dev | `wrangler` 4.125.0, `@astrojs/check` 0.9.10, `@cloudflare/workers-types` 5.20260823.1, `@fontsource-variable/inter` 5.3.0 |

**Astro 7 est récent** (7.0.0 le 22 juin 2026, 7.2.9 le 27 août 2026), et le dépôt a été
livré en Astro 5 avant d'être migré. **Ne pas raisonner en Astro 5**, ne pas supposer
qu'une API connue existe encore ou se comporte pareil : deux majeures d'écart. En cas de
doute sur une API, une option ou un défaut, **vérifier la documentation d'Astro 7** avant
d'écrire — une réponse de mémoire vaut ici zéro.

## Ce n'est PAS Next.js

Piège récurrent, à écarter d'emblée. Ce dépôt est **Astro**, en sortie statique :

- **pas de `'use client'`** ni de `'use server'`, pas de React Server Components ;
- **pas d'`app/` ni de `pages/api` à la Next**, pas de route handler, pas de `next/*` ;
- **aucun framework UI** : ni React, ni Vue, ni Svelte, et aucune intégration Astro qui
  en ajouterait un. Le rendu, c'est `.astro` + TypeScript + Tailwind ;
- les endpoints sont des `APIRoute` Astro (`src/pages/*.ts`), évalués **au build**. Le
  seul code qui tourne à l'exécution est la **Pages Function Cloudflare**
  (`functions/api/subscribe.ts`), sur le runtime Workers — pas Node, pas Next.

## Commandes

```bash
npm run dev              # astro dev, http://localhost:4321
npm run build            # genere dist/ — 24 pages
npm run preview          # sert dist/ tel qu'Astro l'a produit
npm run pages:dev        # wrangler pages dev dist --kv RATE_LIMIT_KV
```

**`npm run check` doit passer avant tout commit.** Il enchaîne trois contrôles, et
chacun couvre ce que les autres ne voient pas :

1. **`astro check`** — types et templates `.astro` (58 fichiers). Une faute de frappe
   dans une clé de dictionnaire échoue ici.
2. **`check:functions`** — `tsc -p functions/tsconfig.json --noEmit`. **`astro check` ne
   couvre pas `functions/`**, d'où ce tsconfig dédié, qui inclut aussi `src/i18n/**` et
   `src/site.config.ts` parce que la fonction les importe.
3. **`check:i18n`** — `scripts/check-i18n.mjs` : **parité stricte** des clés entre
   `fr.json` et `en.json`, et **détection des valeurs identiques** dans les deux langues,
   presque toujours le signe d'une donnée à déplacer vers `src/data/`. Quatre coïncidences
   réelles sont déclarées dans `IDENTICAL_ALLOWED` ; une exception caduque échoue aussi.

## Structure

| Chemin | Rôle |
| --- | --- |
| `src/site.config.ts` | Domaine, marque, e-mail, drapeau de publication — **source unique** |
| `src/data/` | Données **non localisées** : produits, icônes, compatibilité |
| `src/i18n/` | `fr.json`, `en.json`, table des routes, utilitaires typés |
| `src/layouts/BaseLayout.astro` | Métadonnées, `canonical`, `hreflang`, en-tête, pied de page |
| `src/components/` | Composants partagés ; `components/pages/` porte les corps de page |
| `src/pages/` | Routes : français à la racine, anglais sous `en/` |
| `src/styles/global.css` | Jetons de thème Tailwind et styles de base |
| `public/` | Servi tel quel : `favicon.svg`, `_headers` |
| `functions/api/` | Pages Function Cloudflare du formulaire |
| `scripts/` | Contrôles hors build |

Chaque page existe **deux fois en route** (`contact.astro` et `en/contact.astro`, cinq
lignes chacune : langue + identifiant, puis délégation) et **une seule fois en contenu**,
dans `src/components/pages/`. Ajouter une page passe d'abord par `src/i18n/routes.ts` :
menu, sélecteur de langue, `hreflang` et sitemap en découlent seuls.

## `src/data/` contre `src/i18n/` — et pourquoi

La règle : **`src/i18n/` ne contient que du texte localisable.** Tout le reste vit dans
`src/data/` ou `src/site.config.ts` — noms propres (« SketchUp », « Windows »), numéros
de version, identifiants d'icône, ordre d'affichage.

**Pourquoi cette séparation existe** : une donnée factuelle recopiée dans deux
dictionnaires **diverge dès qu'on n'en corrige qu'un**, et le contrôle de parité ne le
verra pas — les deux clés sont bien présentes. Ajouter une version supportée deviendrait
une modification à deux endroits, et un nom propre n'a de toute façon pas de traduction.
Les données sont injectées par interpolation : `"Testé sur {app} {versions} sous {os}."`

## Réglages à ne pas casser

- **`compressHTML: true`** (`astro.config.ts`) — Astro 7 fait passer le défaut à `'jsx'`,
  qui supprime l'espace séparant deux éléments rendus en ligne, comme React :
  `<span>a</span> <em>b</em>` rendrait `ab`. Retirer cette ligne **modifie les 24 pages**.
- **`trailingSlash: 'never'` + `build.format: 'file'`** — une seule forme d'URL :
  `dist/contact.html` servi à `/contact`, sans slash final ni `index.html` imbriqué,
  **aligné sur la redirection 303 de la Pages Function** vers `/contact/merci` et
  `/en/contact/thank-you`. Changer l'un sans l'autre casse le formulaire sans JavaScript.
- **`output: 'static'`, aucun adaptateur** — aucun runtime Astro en production.
- **`i18n.routing` : `prefixDefaultLocale: false` / `redirectToDefaultLocale: false`** —
  depuis Astro 6, le second ne peut valoir `true` que si le premier vaut `true`.

## Domaine, e-mail et publication

Tout est dans **`src/site.config.ts`**, et **nulle part ailleurs** : `SITE_URL`,
`SITE_NAME`, `CONTACT_EMAIL` (dérivé du domaine), `SUBSCRIBE_ENDPOINT`, `SITE_PRIVATE`.
`astro.config.ts`, les `canonical`, les `hreflang`, le sitemap et `robots.txt` en découlent.
**Ne jamais écrire le domaine ou l'adresse en dur** ailleurs.

**Le site est en refus d'indexation** (`SITE_PRIVATE = true`) : en ligne, pas publié.
**Le passer en public demande DEUX gestes :**

1. `SITE_PRIVATE = false` dans `src/site.config.ts` ;
2. **supprimer `public/_headers`**, fichier statique qui pose un en-tête
   `X-Robots-Tag: noindex, nofollow` et qui **ne peut pas lire la constante**.

Seule entorse au principe du geste unique, délibérée : le `X-Robots-Tag` est le seul des
trois mécanismes qui ne dépende pas du crawl. Oublier le second geste laisse le site
désindexé alors que tout le code dit le contraire.

## Règle du vert

Plafond : **3 zones vertes permanentes par page**. Le **halo de focus est exclu** du
comptage — transitoire, sur un seul élément à la fois, et c'est un signal
d'accessibilité : jamais retiré ni atténué pour tenir le plafond.

L'accueil et les pages produit sont à **3/3 : plus aucune marge**, toute nouvelle zone
verte impose d'en retirer une autre. Pour les quatre usages autorisés, la liste nommée
des éléments et la commande de recomptage, voir **« Charte visuelle » du README**.

## Véracité du contenu

Ce site présente des produits réels. **Aucun fait inventé**, même pour « illustrer » ou
remplir une mise en page : **pas de témoignage** ni de citation de client, **pas de chiffre
d'utilisateurs**, de téléchargements ni de note, **pas de prix**, pas de palier tarifaire,
pas de date de sortie non décidée.

La compatibilité est **SketchUp 2024 / 2025 / 2026 sous Windows**
(`src/data/compatibility.ts`). **Mac n'est pas testé** : le site le dit tel quel — ne ni
laisser entendre le contraire, ni élargir la liste des versions sans vérification.

## Piège Tailwind

Le scanner de Tailwind 4 lit **les fichiers `.md` de la racine**, `README.md` et ce
fichier compris. **Un mot anglais isolé dans la prose peut y devenir un candidat de
classe** et ajouter une règle morte au CSS : c'est arrivé sur ce dépôt avec un terme de
mise en page anglais employé seul. Préférer le français, et **recompter les classes
générées** après toute édition d'un `.md` racine.

## Pages légales

`mentions-legales` / `legal-notice` et `confidentialite` / `privacy` portent des marqueurs
**`[[À COMPLÉTER : ...]]`** : raison sociale, adresse, SIRET, hébergeur, sous-traitants,
durée de conservation, modalités d'exercice des droits. **Ne jamais inventer ces valeurs**,
ni en proposer une « plausible » à titre d'exemple : laisser le marqueur. À renseigner par
l'éditeur, puis à relire par un professionnel du droit.

## Variables d'environnement

Attendues par la Pages Function. **Ne jamais écrire de valeur dans le dépôt**, ni réelle
ni d'exemple réaliste : `.env.example` est un modèle vide, en local les valeurs vont dans
`.dev.vars` (ignoré par git), en production dans Cloudflare Pages, marquées secrètes.

| Variable | Rôle |
| --- | --- |
| `RESEND_API_KEY` | Clé d'API Resend |
| `CONTACT_TO_EMAIL` | Adresse qui reçoit les notifications |
| `CONTACT_FROM_EMAIL` | Adresse expéditrice, sur un domaine vérifié dans Resend |
| `RATE_LIMIT_KV` | Binding KV, **optionnel** : absent, la limitation par IP se désactive avec un avertissement |

## Conventions git

- **PR obligatoire. Jamais de push direct sur `master`.**
- **Vérifier qu'une PR n'est pas déjà mergée avant d'y pousser** : un commit poussé sur
  la branche d'une PR fermée n'atteint jamais `master`. C'est déjà arrivé ici.
- **Commits atomiques** : un changement, une raison, un commit.
- **Conventional commits en français, sans accent dans le sujet** :
  `type(portee): sujet a l'infinitif`, minuscule, sans point final. Types employés :
  `feat`, `fix`, `refactor`, `chore`, `docs`, `build(deps)`.
- **`npm run check` passe avant tout commit.**

## Évolution prévue

Contexte d'orientation, pas une tâche. **Ne rien mettre en place pour cette section
aujourd'hui** : elle existe pour éviter les décisions qui fermeraient cette porte.

- **Le site est statique aujourd'hui parce qu'il n'a aucun besoin dynamique**, pas parce
  que le statique serait une contrainte définitive.

- **À terme, il accueillera un tunnel d'achat et un accès client aux licences.** Le chemin
  prévu est l'**adaptateur Cloudflare** avec `prerender = false` sur les **seules routes
  concernées**, le reste du site restant prérendu. Ce n'est pas un changement de
  framework.

- **La logique de licence et la clé secrète Stripe vivent dans le backend séparé** (dépôt
  `skapely-api`), **jamais dans ce dépôt**. Le site consomme une API : il ne gère ni les
  licences ni les paiements lui-même.
