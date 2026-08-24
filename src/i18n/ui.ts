import fr from './fr.json';
import enDictionary from './en.json';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

/**
 * Noms de langue en endonyme : ils s'ecrivent de la meme facon quelle que soit
 * la langue de la page, ce sont donc des donnees et non du contenu localisable.
 */
export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
};

/** Le dictionnaire francais fait foi : c'est lui qui definit le jeu de cles. */
export type Dictionary = typeof fr;

/**
 * L'annotation ci-dessous est le premier garde-fou de parite : si une cle
 * manque cote anglais, `astro check` echoue. Le second est npm run check:i18n.
 */
const en: Dictionary = enDictionary;

const dictionaries: Record<Locale, Dictionary> = { fr, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Remplace les marqueurs {nom} d'un modele de phrase par leurs valeurs. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}
