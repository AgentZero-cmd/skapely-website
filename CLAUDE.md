# CLAUDE.md

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
