/**
 * Jeu ferme d'icones, style lineaire, une seule famille.
 * Chaque valeur est le contenu interne d'un <svg viewBox="0 0 24 24">, dessine
 * au trait : le composant Icon fournit le contour, la graisse et la couleur.
 */
export const icons = {
  calculator:
    '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
  mapPin: '<path d="M20 10c0 5-8 11-8 11s-8-6-8-11a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  pointer: '<path d="m4 4 6.5 16 2.5-6.5L19.5 11 4 4Z"/>',
  ruler:
    '<path d="M3.5 15.5 8.5 20.5a1.5 1.5 0 0 0 2.1 0L20.5 10.6a1.5 1.5 0 0 0 0-2.1L15.5 3.5a1.5 1.5 0 0 0-2.1 0L3.5 13.4a1.5 1.5 0 0 0 0 2.1Z"/><path d="m8 11 2 2M11 8l2 2M14 5l2 2M5 14l2 2"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
  fileText:
    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  tag: '<path d="M3 11V5a2 2 0 0 1 2-2h6l10 10-8 8L3 11Z"/><circle cx="7.5" cy="7.5" r="1.25"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  maximize: '<path d="M15 3h6v6M21 3l-7 7M9 21H3v-6M3 21l7-7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  folder: '<path d="M4 6a2 2 0 0 1 2-2h3l2 2.5h7a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"/>',
  swatches:
    '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
  marquee:
    '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/>',
  cube: '<path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3Z"/><path d="m3.5 7.5 8.5 4.5 8.5-4.5M12 12v9"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  check: '<path d="m5 13 4 4L19 7"/>',
} as const;

export type IconName = keyof typeof icons;
