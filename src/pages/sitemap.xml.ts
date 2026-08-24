import type { APIRoute } from 'astro';
import { listedRoutes, urlFor } from '../i18n/routes';
import { locales } from '../i18n/ui';

/**
 * Sitemap construit depuis la table de routes plutot que depuis l'arborescence :
 * les slugs etant traduits (/produits/... et /en/products/...), les liens
 * alternatifs ne peuvent pas etre deduits d'un simple prefixe de langue.
 */
export const GET: APIRoute = () => {
  const entries = listedRoutes.flatMap((id) =>
    locales.map((locale) => {
      const alternates = locales
        .map(
          (other) =>
            `    <xhtml:link rel="alternate" hreflang="${other}" href="${urlFor(id, other)}" />`,
        )
        .join('\n');

      return [
        '  <url>',
        `    <loc>${urlFor(id, locale)}</loc>`,
        alternates,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(id, 'fr')}" />`,
        '  </url>',
      ].join('\n');
    }),
  );

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
