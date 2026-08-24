import type { IconName } from './icons';
import type { RouteId } from '../i18n/routes';

/**
 * Structure et noms propres des quatre plugins. Aucun texte localisable ici :
 * les descriptions vivent dans src/i18n/*.json, sous products.items.<id>.
 * `featureIcons` est aligne par index sur le tableau `features` du dictionnaire.
 */
export interface Product {
  /** Cle utilisee dans les fichiers de traduction. */
  id: 'quantisketch' | 'csvPoints' | 'paletteXl' | 'multiSelect';
  /** Nom propre du plugin, identique dans toutes les langues. */
  name: string;
  /** Icone de la carte et de l'en-tete de page. */
  icon: IconName;
  /** Identifiant de route, pour resoudre l'URL dans chaque langue. */
  route: RouteId;
  /** Icones des blocs de fonctionnalites, dans l'ordre du dictionnaire. */
  featureIcons: readonly IconName[];
}

export const products: readonly Product[] = [
  {
    id: 'quantisketch',
    name: 'QuantiSketch',
    icon: 'calculator',
    route: 'products.quantisketch',
    featureIcons: ['pointer', 'ruler', 'table'],
  },
  {
    id: 'csvPoints',
    name: 'Import CSV Points',
    icon: 'mapPin',
    route: 'products.csvPoints',
    featureIcons: ['fileText', 'mapPin', 'tag', 'layers'],
  },
  {
    id: 'paletteXl',
    name: 'PaletteXL',
    icon: 'swatches',
    route: 'products.paletteXl',
    featureIcons: ['maximize', 'search', 'folder', 'swatches'],
  },
  {
    id: 'multiSelect',
    name: 'Sélection Multiple',
    icon: 'marquee',
    route: 'products.multiSelect',
    featureIcons: ['filter', 'marquee', 'cube'],
  },
];

export function getProduct(id: Product['id']): Product {
  const product = products.find((candidate) => candidate.id === id);
  if (!product) {
    throw new Error(`Produit inconnu : ${id}`);
  }
  return product;
}
