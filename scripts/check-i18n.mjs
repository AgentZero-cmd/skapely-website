/**
 * Controle des dictionnaires de traduction.
 *
 * 1. Parite : fr.json et en.json doivent porter exactement le meme jeu de cles.
 * 2. Valeurs identiques : une chaine ecrite a l'identique dans les deux langues
 *    est presque toujours une donnee structurelle (nom propre, identifiant)
 *    qui n'a rien a faire dans un dictionnaire. Les rares coincidences
 *    linguistiques reelles sont listees ci-dessous, et documentees.
 */
import { readFileSync } from 'node:fs';

const dir = new URL('../src/i18n/', import.meta.url);
const read = (name) => JSON.parse(readFileSync(new URL(name, dir), 'utf8'));

/** Coincidences linguistiques assumees : le mot s'ecrit pareil dans les deux langues. */
const IDENTICAL_ALLOWED = new Set([
  'nav.products', // « Plugins » s'ecrit de la meme facon en francais et en anglais
  'nav.contact', // « Contact » aussi
  'contact.form.message', // le libelle du champ « Message » est identique
  'legal.sections[3].title', // titre de section « Contact »
]);

function flatten(value, prefix = '', out = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, out));
  } else if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
  } else {
    out.set(prefix, value);
  }
  return out;
}

const fr = flatten(read('fr.json'));
const en = flatten(read('en.json'));

const missingInEn = [...fr.keys()].filter((key) => !en.has(key));
const missingInFr = [...en.keys()].filter((key) => !fr.has(key));
const identical = [...fr.entries()].filter(
  ([key, value]) => en.get(key) === value && !IDENTICAL_ALLOWED.has(key),
);

console.log(`fr.json : ${fr.size} valeurs`);
console.log(`en.json : ${en.size} valeurs`);

const report = (label, entries, render) => {
  if (entries.length === 0) {
    console.log(`OK   ${label} : aucun`);
    return 0;
  }
  console.log(`ECHEC ${label} : ${entries.length}`);
  for (const entry of entries) console.log(`      - ${render(entry)}`);
  return 1;
};

let failures = 0;
failures += report('cles presentes en fr mais absentes en en', missingInEn, (key) => key);
failures += report('cles presentes en en mais absentes en fr', missingInFr, (key) => key);
failures += report(
  'valeurs identiques dans les deux langues',
  identical,
  ([key, value]) => `${key} = ${JSON.stringify(value)}`,
);

if (failures > 0) {
  console.log(`\n${failures} controle(s) en echec.`);
  process.exitCode = 1;
} else {
  console.log(`\nParite verifiee dans les deux sens. Exceptions documentees : ${
    [...IDENTICAL_ALLOWED].join(', ') || 'aucune'
  }.`);
}
