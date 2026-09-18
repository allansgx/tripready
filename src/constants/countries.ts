// Caminhos relativos com extensão: `getCountry`/`normalizeSearch` são
// carregados direto por `constants/tests/cities.test.ts` sob `node --test`,
// que não resolve o alias `@/` nem entende `expo-localization` — daí ler o
// idioma ativo em `active-locale.ts`, e não em `src/i18n/index.ts`.
import { getActiveLocale } from '../i18n/active-locale.ts';
import { COUNTRY_NAMES as NAMES_EN } from '../i18n/countries/en.ts';
import { COUNTRY_NAMES as NAMES_ES } from '../i18n/countries/es.ts';
import { COUNTRY_NAMES as NAMES_PT_BR } from '../i18n/countries/pt-BR.ts';
import type { Locale } from '../i18n/locales.ts';

/**
 * Fonte única de países do app. Só o código ISO 3166-1 alpha-2 é persistido
 * (`trip_countries`, `passports`, `visa_rules`); o nome sai sempre do idioma
 * ativo, nunca do banco.
 */

export type Country = {
  /** ISO 3166-1 alpha-2, sempre em maiúsculas. */
  code: string;
  name: string;
};

/**
 * A lista dos 251 códigos suportados, em pt-BR — é o que
 * `scripts/build-country-names.mjs` lê para saber quais códigos gerar nos
 * outros idiomas. Para o nome no idioma ativo, use `getCountryName`/
 * `getCountries`: esta lista nunca muda de idioma sozinha.
 */
export const COUNTRIES: readonly Country[] = [
  { code: 'AF', name: 'Afeganistão' },
  { code: 'ZA', name: 'África do Sul' },
  { code: 'AL', name: 'Albânia' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' },
  { code: 'AI', name: 'Anguila' },
  { code: 'AQ', name: 'Antártida' },
  { code: 'AG', name: 'Antígua e Barbuda' },
  { code: 'SA', name: 'Arábia Saudita' },
  { code: 'DZ', name: 'Argélia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armênia' },
  { code: 'AW', name: 'Aruba' },
  { code: 'AU', name: 'Austrália' },
  { code: 'AT', name: 'Áustria' },
  { code: 'AZ', name: 'Azerbaijão' },
  { code: 'BS', name: 'Bahamas' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BB', name: 'Barbados' },
  { code: 'BH', name: 'Barein' },
  { code: 'BE', name: 'Bélgica' },
  { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BM', name: 'Bermudas' },
  { code: 'BY', name: 'Bielorrússia' },
  { code: 'BO', name: 'Bolívia' },
  { code: 'BA', name: 'Bósnia e Herzegovina' },
  { code: 'BW', name: 'Botsuana' },
  { code: 'BR', name: 'Brasil' },
  { code: 'BN', name: 'Brunei' },
  { code: 'BG', name: 'Bulgária' },
  { code: 'BF', name: 'Burquina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'BT', name: 'Butão' },
  { code: 'CV', name: 'Cabo Verde' },
  { code: 'CM', name: 'Camarões' },
  { code: 'KH', name: 'Camboja' },
  { code: 'CA', name: 'Canadá' },
  { code: 'QA', name: 'Catar' },
  { code: 'KZ', name: 'Cazaquistão' },
  { code: 'TD', name: 'Chade' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CY', name: 'Chipre' },
  { code: 'VA', name: 'Cidade do Vaticano' },
  { code: 'CO', name: 'Colômbia' },
  { code: 'KM', name: 'Comores' },
  { code: 'CD', name: 'Congo - Kinshasa' },
  { code: 'KP', name: 'Coreia do Norte' },
  { code: 'KR', name: 'Coreia do Sul' },
  { code: 'CI', name: 'Costa do Marfim' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'HR', name: 'Croácia' },
  { code: 'CU', name: 'Cuba' },
  { code: 'CW', name: 'Curaçao' },
  { code: 'DK', name: 'Dinamarca' },
  { code: 'DJ', name: 'Djibuti' },
  { code: 'DM', name: 'Dominica' },
  { code: 'EG', name: 'Egito' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'AE', name: 'Emirados Árabes Unidos' },
  { code: 'EC', name: 'Equador' },
  { code: 'ER', name: 'Eritreia' },
  { code: 'SK', name: 'Eslováquia' },
  { code: 'SI', name: 'Eslovênia' },
  { code: 'ES', name: 'Espanha' },
  { code: 'SZ', name: 'Essuatíni' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'EE', name: 'Estônia' },
  { code: 'ET', name: 'Etiópia' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'PH', name: 'Filipinas' },
  { code: 'FI', name: 'Finlândia' },
  { code: 'FR', name: 'França' },
  { code: 'GA', name: 'Gabão' },
  { code: 'GM', name: 'Gâmbia' },
  { code: 'GH', name: 'Gana' },
  { code: 'GE', name: 'Geórgia' },
  { code: 'GI', name: 'Gibraltar' },
  { code: 'GD', name: 'Granada' },
  { code: 'GR', name: 'Grécia' },
  { code: 'GL', name: 'Groenlândia' },
  { code: 'GP', name: 'Guadalupe' },
  { code: 'GU', name: 'Guam' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'GG', name: 'Guernsey' },
  { code: 'GY', name: 'Guiana' },
  { code: 'GF', name: 'Guiana Francesa' },
  { code: 'GN', name: 'Guiné' },
  { code: 'GQ', name: 'Guiné Equatorial' },
  { code: 'GW', name: 'Guiné-Bissau' },
  { code: 'HT', name: 'Haiti' },
  { code: 'HN', name: 'Honduras' },
  { code: 'HK', name: 'Hong Kong, RAE da China' },
  { code: 'HU', name: 'Hungria' },
  { code: 'YE', name: 'Iêmen' },
  { code: 'BV', name: 'Ilha Bouvet' },
  { code: 'CX', name: 'Ilha Christmas' },
  { code: 'IM', name: 'Ilha de Man' },
  { code: 'NF', name: 'Ilha Norfolk' },
  { code: 'AX', name: 'Ilhas Aland' },
  { code: 'KY', name: 'Ilhas Cayman' },
  { code: 'CC', name: 'Ilhas Cocos (Keeling)' },
  { code: 'CK', name: 'Ilhas Cook' },
  { code: 'FO', name: 'Ilhas Faroé' },
  { code: 'GS', name: 'Ilhas Geórgia do Sul e Sandwich do Sul' },
  { code: 'HM', name: 'Ilhas Heard e McDonald' },
  { code: 'FK', name: 'Ilhas Malvinas' },
  { code: 'MP', name: 'Ilhas Marianas do Norte' },
  { code: 'MH', name: 'Ilhas Marshall' },
  { code: 'UM', name: 'Ilhas Menores Distantes dos EUA' },
  { code: 'PN', name: 'Ilhas Pitcairn' },
  { code: 'SB', name: 'Ilhas Salomão' },
  { code: 'TC', name: 'Ilhas Turcas e Caicos' },
  { code: 'VI', name: 'Ilhas Virgens Americanas' },
  { code: 'VG', name: 'Ilhas Virgens Britânicas' },
  { code: 'IN', name: 'Índia' },
  { code: 'ID', name: 'Indonésia' },
  { code: 'IR', name: 'Irã' },
  { code: 'IQ', name: 'Iraque' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'IS', name: 'Islândia' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Itália' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'JP', name: 'Japão' },
  { code: 'JE', name: 'Jersey' },
  { code: 'JO', name: 'Jordânia' },
  { code: 'XK', name: 'Kosovo' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'LA', name: 'Laos' },
  { code: 'LS', name: 'Lesoto' },
  { code: 'LV', name: 'Letônia' },
  { code: 'LB', name: 'Líbano' },
  { code: 'LR', name: 'Libéria' },
  { code: 'LY', name: 'Líbia' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lituânia' },
  { code: 'LU', name: 'Luxemburgo' },
  { code: 'MO', name: 'Macau, RAE da China' },
  { code: 'MK', name: 'Macedônia do Norte' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MY', name: 'Malásia' },
  { code: 'MW', name: 'Malaui' },
  { code: 'MV', name: 'Maldivas' },
  { code: 'ML', name: 'Mali' },
  { code: 'MT', name: 'Malta' },
  { code: 'MA', name: 'Marrocos' },
  { code: 'MQ', name: 'Martinica' },
  { code: 'MU', name: 'Maurício' },
  { code: 'MR', name: 'Mauritânia' },
  { code: 'YT', name: 'Mayotte' },
  { code: 'MX', name: 'México' },
  { code: 'MM', name: 'Mianmar (Birmânia)' },
  { code: 'FM', name: 'Micronésia' },
  { code: 'MZ', name: 'Moçambique' },
  { code: 'MD', name: 'Moldávia' },
  { code: 'MC', name: 'Mônaco' },
  { code: 'MN', name: 'Mongólia' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'MS', name: 'Montserrat' },
  { code: 'NA', name: 'Namíbia' },
  { code: 'NR', name: 'Nauru' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NI', name: 'Nicarágua' },
  { code: 'NE', name: 'Níger' },
  { code: 'NG', name: 'Nigéria' },
  { code: 'NU', name: 'Niue' },
  { code: 'NO', name: 'Noruega' },
  { code: 'NC', name: 'Nova Caledônia' },
  { code: 'NZ', name: 'Nova Zelândia' },
  { code: 'OM', name: 'Omã' },
  { code: 'NL', name: 'Países Baixos' },
  { code: 'BQ', name: 'Países Baixos Caribenhos' },
  { code: 'PW', name: 'Palau' },
  { code: 'PA', name: 'Panamá' },
  { code: 'PG', name: 'Papua-Nova Guiné' },
  { code: 'PK', name: 'Paquistão' },
  { code: 'PY', name: 'Paraguai' },
  { code: 'PE', name: 'Peru' },
  { code: 'PF', name: 'Polinésia Francesa' },
  { code: 'PL', name: 'Polônia' },
  { code: 'PR', name: 'Porto Rico' },
  { code: 'PT', name: 'Portugal' },
  { code: 'KE', name: 'Quênia' },
  { code: 'KG', name: 'Quirguistão' },
  { code: 'KI', name: 'Quiribati' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'CF', name: 'República Centro-Africana' },
  { code: 'CG', name: 'República do Congo' },
  { code: 'DO', name: 'República Dominicana' },
  { code: 'RE', name: 'Reunião' },
  { code: 'RO', name: 'Romênia' },
  { code: 'RW', name: 'Ruanda' },
  { code: 'RU', name: 'Rússia' },
  { code: 'EH', name: 'Saara Ocidental' },
  { code: 'WS', name: 'Samoa' },
  { code: 'AS', name: 'Samoa Americana' },
  { code: 'SM', name: 'San Marino' },
  { code: 'SH', name: 'Santa Helena' },
  { code: 'LC', name: 'Santa Lúcia' },
  { code: 'BL', name: 'São Bartolomeu' },
  { code: 'KN', name: 'São Cristóvão e Névis' },
  { code: 'MF', name: 'São Martinho' },
  { code: 'PM', name: 'São Pedro e Miquelão' },
  { code: 'ST', name: 'São Tomé e Príncipe' },
  { code: 'VC', name: 'São Vicente e Granadinas' },
  { code: 'CQ', name: 'Sark' },
  { code: 'SC', name: 'Seicheles' },
  { code: 'SN', name: 'Senegal' },
  { code: 'SL', name: 'Serra Leoa' },
  { code: 'RS', name: 'Sérvia' },
  { code: 'SG', name: 'Singapura' },
  { code: 'SX', name: 'Sint Maarten' },
  { code: 'SY', name: 'Síria' },
  { code: 'SO', name: 'Somália' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudão' },
  { code: 'SS', name: 'Sudão do Sul' },
  { code: 'SE', name: 'Suécia' },
  { code: 'CH', name: 'Suíça' },
  { code: 'SR', name: 'Suriname' },
  { code: 'SJ', name: 'Svalbard e Jan Mayen' },
  { code: 'TJ', name: 'Tadjiquistão' },
  { code: 'TH', name: 'Tailândia' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TZ', name: 'Tanzânia' },
  { code: 'CZ', name: 'Tchéquia' },
  { code: 'IO', name: 'Território Britânico do Oceano Índico' },
  { code: 'TF', name: 'Territórios Franceses do Sul' },
  { code: 'PS', name: 'Territórios palestinos' },
  { code: 'TL', name: 'Timor-Leste' },
  { code: 'TG', name: 'Togo' },
  { code: 'TK', name: 'Tokelau' },
  { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad e Tobago' },
  { code: 'TN', name: 'Tunísia' },
  { code: 'TM', name: 'Turcomenistão' },
  { code: 'TR', name: 'Turquia' },
  { code: 'TV', name: 'Tuvalu' },
  { code: 'UA', name: 'Ucrânia' },
  { code: 'UG', name: 'Uganda' },
  { code: 'UY', name: 'Uruguai' },
  { code: 'UZ', name: 'Uzbequistão' },
  { code: 'VU', name: 'Vanuatu' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnã' },
  { code: 'WF', name: 'Wallis e Futuna' },
  { code: 'ZM', name: 'Zâmbia' },
  { code: 'ZW', name: 'Zimbábue' },
];

const NAMES_BY_LOCALE: Record<Locale, Readonly<Record<string, string>>> = {
  'pt-BR': NAMES_PT_BR,
  en: NAMES_EN,
  es: NAMES_ES,
};

/**
 * Uma lista por idioma, já com o nome localizado e ordenada por
 * `localeCompare` — computada uma vez no carregamento do módulo, e não a cada
 * chamada. A ordem do arquivo `COUNTRIES` deixa de importar para quem lê daqui.
 */
function buildLocaleList(locale: Locale): readonly Country[] {
  const names = NAMES_BY_LOCALE[locale];
  const list = COUNTRIES.map(({ code }) => ({ code, name: names[code] ?? code }));
  list.sort((a, b) => a.name.localeCompare(b.name, locale));
  return list;
}

const COUNTRIES_BY_LOCALE: Record<Locale, readonly Country[]> = {
  'pt-BR': buildLocaleList('pt-BR'),
  en: buildLocaleList('en'),
  es: buildLocaleList('es'),
};

/** Todos os países no idioma ativo (ou informado), já ordenados. */
export function getCountries(locale: Locale = getActiveLocale()): readonly Country[] {
  return COUNTRIES_BY_LOCALE[locale];
}

/** Busca um país pelo código, no idioma ativo. Devolve `null` para código desconhecido. */
export function getCountry(
  code: string | null | undefined,
  locale: Locale = getActiveLocale(),
): Country | null {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  const name = NAMES_BY_LOCALE[locale][upper];
  return name ? { code: upper, name } : null;
}

/** Nome do país no idioma ativo, caindo no próprio código quando ele não é conhecido. */
export function getCountryName(code: string, locale: Locale = getActiveLocale()): string {
  return getCountry(code, locale)?.name ?? code.trim().toUpperCase();
}

/**
 * Bandeira derivada do código, por "regional indicator symbol". O iOS desenha a
 * bandeira; o Android mostra as duas letras, que é o esperado.
 */
export function getFlagEmoji(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return normalized;

  const REGIONAL_INDICATOR_A = 0x1f1e6;
  const LETTER_A = 'A'.charCodeAt(0);

  return String.fromCodePoint(
    ...[...normalized].map((letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - LETTER_A),
  );
}

/**
 * Tira acentos e caixa para a busca casar "Italia" com "Itália". Exportada para
 * a busca de cidades aplicar exatamente a mesma regra.
 */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Filtra países por nome ou código, no idioma ativo. Consulta vazia devolve a
 * lista inteira, já ordenada.
 */
export function searchCountries(
  query: string,
  locale: Locale = getActiveLocale(),
): readonly Country[] {
  const list = getCountries(locale);
  const term = normalizeSearch(query);
  if (!term) return list;

  return list.filter(
    (country) =>
      normalizeSearch(country.name).includes(term) || normalizeSearch(country.code).includes(term),
  );
}
