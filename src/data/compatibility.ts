/**
 * Compatibilite reelle des plugins. Donnees factuelles, non localisees :
 * les phrases qui les entourent vivent dans les fichiers de traduction.
 */
const versions = ['2024', '2025', '2026'] as const;

export const compatibility = {
  /** Logiciel hote (nom propre). */
  app: 'SketchUp',
  /** Systeme sur lequel les plugins ont ete testes (nom propre). */
  os: 'Windows',
  versions,
  /** Liste lisible, sans conjonction pour rester neutre entre les langues. */
  versionList: versions.join(', '),
  /** Chiffre cle affiche dans le bloc compatibilite. */
  versionRange: `${versions[0]}–${versions[versions.length - 1]}`,
} as const;
