import { SITE_URL } from '../site.config';
import type { Locale } from './ui';

/**
 * Table des routes du site : source unique pour la navigation, le selecteur de
 * langue, les liens alternatifs hreflang et le sitemap.
 *
 * Convention d'URL : jamais de slash final (astro.config.ts fixe
 * trailingSlash: 'never' et build.format: 'file'). Seule la racine du site
 * francaise s'ecrit '/'.
 */
export const routes = {
  home: { fr: '/', en: '/en' },
  'products.quantisketch': { fr: '/produits/quantisketch', en: '/en/products/quantisketch' },
  'products.csvPoints': { fr: '/produits/import-csv-points', en: '/en/products/csv-points-import' },
  'products.paletteXl': { fr: '/produits/palettexl', en: '/en/products/palettexl' },
  'products.multiSelect': { fr: '/produits/selection-multiple', en: '/en/products/multi-select' },
  about: { fr: '/a-propos', en: '/en/about' },
  contact: { fr: '/contact', en: '/en/contact' },
  contactSuccess: { fr: '/contact/merci', en: '/en/contact/thank-you' },
  contactError: { fr: '/contact/erreur', en: '/en/contact/error' },
  legal: { fr: '/mentions-legales', en: '/en/legal-notice' },
  privacy: { fr: '/confidentialite', en: '/en/privacy' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteId = keyof typeof routes;

/** Chemin absolu d'une page, dans la langue demandee. */
export function pathFor(id: RouteId, locale: Locale): string {
  return routes[id][locale];
}

/** URL complete d'une page : canonical, hreflang, sitemap. */
export function urlFor(id: RouteId, locale: Locale): string {
  return new URL(pathFor(id, locale), SITE_URL).href;
}

/** Pages de confirmation du formulaire : hors sitemap et en noindex. */
const unlisted: readonly RouteId[] = ['contactSuccess', 'contactError'];

export function isUnlisted(id: RouteId): boolean {
  return unlisted.includes(id);
}

/** Routes publiees dans le sitemap, dans l'ordre de la table. */
export const listedRoutes: readonly RouteId[] = (Object.keys(routes) as RouteId[]).filter(
  (id) => !isUnlisted(id),
);

/**
 * Ancre de la section des plugins sur l'accueil : il n'y a pas de page d'index
 * des plugins, le menu pointe donc vers cette section.
 */
export const productsAnchor = 'plugins';

export function productsHref(locale: Locale): string {
  return `${pathFor('home', locale)}#${productsAnchor}`;
}
