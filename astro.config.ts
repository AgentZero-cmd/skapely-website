import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { SITE_URL } from './src/site.config';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',

  // Une seule forme d'URL sur tout le site : jamais de slash final.
  // `build.format: 'file'` produit dist/contact.html, servi tel quel par
  // Cloudflare Pages a /contact, sans redirection intermediaire.
  trailingSlash: 'never',
  build: { format: 'file' },

  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
