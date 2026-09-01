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

/**
 * TEMPORAIRE — le site est en ligne mais pas encore publie.
 *
 * Tant que ce drapeau vaut true :
 *   - src/pages/robots.txt.ts refuse tout le site (`Disallow: /`) ;
 *   - src/layouts/BaseLayout.astro pose `noindex, nofollow` sur chaque page.
 *
 * A LA PUBLICATION, il faut DEUX gestes, pas un :
 *   1. passer cette constante a false ;
 *   2. supprimer public/_headers, qui pose un en-tete X-Robots-Tag et qui, etant
 *      un fichier statique, ne peut pas lire cette constante.
 *
 * Le second geste est facile a oublier : sans lui le site reste desindexe alors
 * que tout le code dit le contraire. Voir la section « Passer le site en public »
 * du README.
 */
export const SITE_PRIVATE = true;
