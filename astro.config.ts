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

  // Astro 5 comprimait le HTML en respectant les regles d'espacement HTML.
  // Astro 7 fait passer le defaut a 'jsx', qui supprime l'espace entre deux
  // elements inline, comme React : `<span>a</span> <em>b</em>` rendrait `ab`.
  // On garde le comportement d'origine.
  compressHTML: true,

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
