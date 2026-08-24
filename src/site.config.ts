/**
 * Source unique de verite pour l'identite du site.
 * Le domaine ne doit apparaitre nulle part ailleurs dans le depot :
 * astro.config.ts, les canonical, les hreflang, le sitemap et robots.txt
 * derivent tous de SITE_URL.
 */

/** Origine du site, sans slash final. */
export const SITE_URL = 'https://skapely.fr';

/** Nom de la marque (nom propre, donc hors fichiers de traduction). */
export const SITE_NAME = 'Skapely';

/** Adresse de contact publique, affichee en clair sur la page contact. */
export const CONTACT_EMAIL = `contact@${new URL(SITE_URL).hostname}`;

/** Chemin de la Pages Function qui recoit le formulaire de contact. */
export const SUBSCRIBE_ENDPOINT = '/api/subscribe';
