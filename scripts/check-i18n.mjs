/**
 * Controle des dictionnaires de traduction.
 *
 * 1. Parite : fr.json et en.json doivent porter exactement le meme jeu de cles.
 * 2. Valeurs identiques : une chaine ecrite a l'identique dans les deux langues
 *    est presque toujours une donnee structurelle (nom propre, identifiant,
 *    gabarit) qui n'a rien a faire dans un dictionnaire et devrait vivre dans
 *    src/data/ ou src/site.config.ts.
 *
 * En fonctionnement normal, ce script affiche « 0 anomalie ». S'il affiche
 * autre chose, il y a quelque chose a corriger : ne pas prendre l'habitude
 * d'ignorer sa sortie.
 */
import { readFileSync } from 'node:fs';

const dir = new URL('../src/i18n/', import.meta.url);
const read = (name) => JSON.parse(readFileSync(new URL(name, dir), 'utf8'));

/**
 * Exceptions declarees : valeurs volontairement identiques en francais et en
 * anglais, parce que le mot s'ecrit de la meme facon dans les deux langues.
 * Ce sont de vraies coincidences linguistiques, pas des donnees structurelles.
 *
 * Toute valeur identique NON declaree ici fait echouer le script. A l'inverse,
 * une exception devenue caduque (cle disparue, ou traductions devenues
 * differentes) fait echouer aussi : la liste doit rester le reflet exact de la
 * realite, sinon elle ne veut plus rien dire.
 */
const IDENTICAL_ALLOWED = {
  'nav.products': "« Plugins » s'ecrit de la meme facon en francais et en anglais",
  'nav.contact': "« Contact » s'ecrit de la meme facon en francais et en anglais",
  'contact.form.message': "libelle du champ « Message », identique dans les deux langues",
  'legal.sections[3].title': "titre de la section « Contact » des mentions legales",
};

const isAllowed = (key) => Object.hasOwn(IDENTICAL_ALLOWED, key);

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
const undeclaredIdentical = [...fr.entries()].filter(
  ([key, value]) => en.get(key) === value && !isAllowed(key),
);
const staleExceptions = Object.keys(IDENTICAL_ALLOWED).filter(
  (key) => !fr.has(key) || fr.get(key) !== en.get(key),
);

console.log(`fr.json : ${fr.size} valeurs`);
console.log(`en.json : ${en.size} valeurs`);

let anomalies = 0;

const report = (label, entries, render) => {
  if (entries.length === 0) {
    console.log(`OK    ${label} : aucune`);
    return;
  }
  anomalies += entries.length;
  console.log(`ECHEC ${label} : ${entries.length}`);
  for (const entry of entries) console.log(`        - ${render(entry)}`);
};

report('cles presentes en fr mais absentes en en', missingInEn, (key) => key);
report('cles presentes en en mais absentes en fr', missingInFr, (key) => key);
report(
  'valeurs identiques non declarees',
  undeclaredIdentical,
  ([key, value]) => `${key} = ${JSON.stringify(value)}`,
);
report(
  'exceptions declarees devenues caduques',
  staleExceptions,
  (key) => `${key} (a retirer de IDENTICAL_ALLOWED)`,
);

const declared = Object.entries(IDENTICAL_ALLOWED);
console.log(`\nExceptions declarees (${declared.length}) :`);
for (const [key, reason] of declared) {
  console.log(`  - ${key} : ${reason}`);
}

if (anomalies > 0) {
  console.log(`\n${anomalies} anomalie(s).`);
  process.exitCode = 1;
} else {
  console.log('\n0 anomalie.');
}
