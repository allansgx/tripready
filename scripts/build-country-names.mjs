/**
 * Gera `src/i18n/countries/<locale>.ts` a partir de `Intl.DisplayNames`,
 * rodado aqui no Node — e não no aparelho, cujo ICU varia por versão de
 * Android e daria "Hungria" para um usuário e "HU" para outro. Os 255 códigos
 * vêm de `COUNTRIES`, a lista pt-BR hoje em `src/constants/countries.ts`, que
 * continua sendo a fonte da identidade de cada país.
 *
 * `OVERRIDES` preserva curadoria manual entre execuções: aplicado por cima do
 * nome bruto do ICU, por locale e código. Roda sob demanda (`npm run
 * countries`); os arquivos gerados são versionados.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { COUNTRIES } from '../src/constants/countries.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const LOCALES = ['pt-BR', 'en', 'es'];

/**
 * Exceções ao nome bruto do ICU, por locale. O inglês do CLDR abrevia "and"
 * como "&" e "Saint" como "St." em vários nomes — o pt-BR e o es já geram por
 * extenso ("e"/"y"), e aqui só o "&" foi trocado por "and", pelo mesmo motivo:
 * o app não usa abreviação em nenhum outro texto.
 */
const OVERRIDES = {
  en: {
    AG: 'Antigua and Barbuda',
    BA: 'Bosnia and Herzegovina',
    GS: 'South Georgia and South Sandwich Islands',
    HM: 'Heard and McDonald Islands',
    KN: 'St. Kitts and Nevis',
    PM: 'St. Pierre and Miquelon',
    SJ: 'Svalbard and Jan Mayen',
    ST: 'São Tomé and Príncipe',
    TC: 'Turks and Caicos Islands',
    TT: 'Trinidad and Tobago',
    VC: 'St. Vincent and Grenadines',
    WF: 'Wallis and Futuna',
  },
  es: {},
  'pt-BR': {},
};

function buildLocale(locale) {
  const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
  const overrides = OVERRIDES[locale] ?? {};

  const entries = COUNTRIES.map(({ code }) => [code, overrides[code] ?? displayNames.of(code)]);
  entries.sort(([a], [b]) => a.localeCompare(b));

  return entries;
}

function writeLocale(locale, entries) {
  const lines = entries.map(([code, name]) => `  ${code}: ${JSON.stringify(name)},`);

  const content = [
    '/**',
    ' * Gerado por `node scripts/build-country-names.mjs`. Para corrigir um nome,',
    ' * edite o mapa `OVERRIDES` do script e rode de novo — não este arquivo.',
    ' */',
    'export const COUNTRY_NAMES: Readonly<Record<string, string>> = {',
    ...lines,
    '};',
    '',
  ].join('\n');

  writeFileSync(join(root, 'src/i18n/countries', `${locale}.ts`), content);
}

for (const locale of LOCALES) {
  const entries = buildLocale(locale);
  writeLocale(locale, entries);
  console.log(`✓ ${locale}.ts (${entries.length} países)`);
}
