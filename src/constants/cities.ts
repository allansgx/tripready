// Caminhos relativos com extensão: carregado direto por
// `constants/tests/cities.test.ts` sob `node --test` — mesmo motivo do
// `countries.ts`.
import { getActiveLocale } from '../i18n/active-locale.ts';
import { CITY_NAME_OVERRIDES as OVERRIDES_EN } from '../i18n/cities/en.ts';
import { CITY_NAME_OVERRIDES as OVERRIDES_ES } from '../i18n/cities/es.ts';
import type { Locale } from '../i18n/locales.ts';

/**
 * Sugestões de cidades por país — um atalho, não um limite: a tela aceita
 * qualquer cidade digitada. Cada lista vai da mais visitada para a menos, em
 * pt-BR; `getCitySuggestions` aplica a exceção do idioma ativo por cima,
 * preservando a ordem. Trade-off (α) do plano: o nome escolhido nesta lista é
 * o que grava em `trip_cities.city_name`, e o que já está gravado nunca muda
 * de idioma — ver `tasks/plano-i18n.md`, §9.2.
 */
export const CITY_SUGGESTIONS: Record<string, readonly string[]> = {
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah'],
  AR: ['Buenos Aires', 'Bariloche', 'Mendoza', 'Córdoba', 'Ushuaia', 'Salta'],
  AT: ['Viena', 'Salzburgo', 'Innsbruck', 'Graz', 'Hallstatt'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Cairns', 'Adelaide'],
  AZ: ['Baku', 'Gabala', 'Sheki'],
  BE: ['Bruxelas', 'Bruges', 'Antuérpia', 'Gante', 'Lovaina'],
  BG: ['Sófia', 'Plovdiv', 'Varna', 'Bansko'],
  BR: [
    'São Paulo',
    'Rio de Janeiro',
    'Salvador',
    'Belo Horizonte',
    'Curitiba',
    'Florianópolis',
    'Recife',
    'Fortaleza',
    'Manaus',
    'Brasília',
  ],
  BS: ['Nassau', 'Exuma', 'Freeport', 'Paradise Island'],
  BZ: ['Belize City', 'Ambergris Caye', 'Caye Caulker', 'San Ignacio'],
  CA: ['Toronto', 'Vancouver', 'Montreal', 'Quebec', 'Ottawa', 'Calgary', 'Banff'],
  CH: ['Zurique', 'Genebra', 'Lucerna', 'Interlaken', 'Zermatt', 'Berna'],
  CL: ['Santiago', 'Valparaíso', 'Puerto Varas', 'San Pedro de Atacama', 'Punta Arenas'],
  CN: ['Pequim', 'Xangai', 'Xi’an', 'Guilin', 'Chengdu', 'Hong Kong'],
  CO: ['Bogotá', 'Medellín', 'Cartagena', 'Cali', 'Santa Marta'],
  CR: ['San José', 'La Fortuna', 'Manuel Antonio', 'Monteverde', 'Tamarindo'],
  CU: ['Havana', 'Varadero', 'Trinidad', 'Santiago de Cuba', 'Viñales'],
  CY: ['Lárnaca', 'Pafos', 'Nicósia', 'Ayia Napa'],
  CZ: ['Praga', 'Český Krumlov', 'Brno', 'Karlovy Vary'],
  DE: ['Berlim', 'Munique', 'Frankfurt', 'Hamburgo', 'Colônia', 'Dresden', 'Heidelberg'],
  DK: ['Copenhague', 'Aarhus', 'Odense'],
  DO: ['Punta Cana', 'Santo Domingo', 'Puerto Plata', 'Samaná', 'La Romana'],
  EG: ['Cairo', 'Luxor', 'Assuã', 'Alexandria', 'Sharm el-Sheikh'],
  ES: ['Madri', 'Barcelona', 'Sevilha', 'Granada', 'Valência', 'Bilbao', 'Málaga', 'Toledo'],
  FI: ['Helsinque', 'Rovaniemi', 'Turku'],
  FR: ['Paris', 'Nice', 'Lyon', 'Marselha', 'Bordeaux', 'Estrasburgo', 'Cannes'],
  GB: ['Londres', 'Edimburgo', 'Manchester', 'Liverpool', 'Oxford', 'Bath', 'Glasgow'],
  GE: ['Tbilisi', 'Batumi', 'Kazbegi', 'Kutaisi'],
  GR: ['Atenas', 'Santorini', 'Mykonos', 'Creta', 'Tessalônica', 'Rodes'],
  HR: ['Zagreb', 'Dubrovnik', 'Split', 'Hvar', 'Zadar'],
  HU: ['Budapeste', 'Eger', 'Debrecen', 'Szentendre'],
  ID: ['Bali', 'Jacarta', 'Yogyakarta', 'Lombok'],
  IE: ['Dublin', 'Galway', 'Cork', 'Killarney'],
  IL: ['Tel Aviv', 'Jerusalém', 'Haifa', 'Mar Morto'],
  IN: ['Nova Délhi', 'Mumbai', 'Jaipur', 'Agra', 'Goa', 'Varanasi'],
  IS: ['Reykjavík', 'Akureyri', 'Vík'],
  IT: ['Roma', 'Florença', 'Veneza', 'Milão', 'Nápoles', 'Bolonha', 'Verona', 'Palermo'],
  JM: ['Montego Bay', 'Negril', 'Ocho Rios', 'Kingston'],
  JO: ['Amã', 'Petra', 'Wadi Rum', 'Mar Morto', 'Aqaba'],
  JP: ['Tóquio', 'Kyoto', 'Osaka', 'Hiroshima', 'Nara', 'Sapporo', 'Hakone', 'Nagoya'],
  KE: ['Nairóbi', 'Maasai Mara', 'Mombaça', 'Diani Beach'],
  KH: ['Siem Reap', 'Phnom Penh', 'Sihanoukville', 'Battambang'],
  KR: ['Seul', 'Busan', 'Jeju', 'Gyeongju'],
  KZ: ['Almaty', 'Astana', 'Shymkent'],
  LK: ['Colombo', 'Kandy', 'Galle', 'Ella', 'Sigiriya'],
  MA: ['Marrakech', 'Fez', 'Casablanca', 'Chefchaouen', 'Rabat'],
  MG: ['Antananarivo', 'Nosy Be', 'Morondava'],
  MT: ['Valletta', 'Mdina', 'Sliema', 'Gozo'],
  MU: ['Port Louis', 'Grand Baie', 'Flic en Flac'],
  MX: ['Cidade do México', 'Cancún', 'Playa del Carmen', 'Oaxaca', 'Guadalajara', 'Tulum'],
  MY: ['Kuala Lumpur', 'Penang', 'Langkawi', 'Malaca', 'Bornéu'],
  NA: ['Windhoek', 'Sossusvlei', 'Swakopmund', 'Etosha'],
  NL: ['Amsterdã', 'Roterdã', 'Haia', 'Utrecht', 'Delft'],
  NO: ['Oslo', 'Bergen', 'Tromsø', 'Stavanger'],
  NP: ['Catmandu', 'Pokhara', 'Chitwan'],
  NZ: ['Auckland', 'Queenstown', 'Wellington', 'Christchurch', 'Rotorua'],
  PA: ['Cidade do Panamá', 'Bocas del Toro', 'San Blas', 'Boquete'],
  PE: ['Lima', 'Cusco', 'Arequipa', 'Puno'],
  PH: ['Manila', 'Cebu', 'Boracay', 'Palawan', 'Bohol'],
  PL: ['Varsóvia', 'Cracóvia', 'Gdansk', 'Wroclaw'],
  PR: ['San Juan', 'Vieques', 'Ponce', 'Rincón'],
  PT: ['Lisboa', 'Porto', 'Faro', 'Coimbra', 'Madeira', 'Sintra', 'Braga'],
  QA: ['Doha'],
  RO: ['Bucareste', 'Brasov', 'Sibiu', 'Cluj-Napoca'],
  RS: ['Belgrado', 'Novi Sad', 'Niš'],
  RU: ['Moscou', 'São Petersburgo', 'Sochi', 'Kazan'],
  SA: ['Riade', 'Jidá', 'Meca', 'AlUla'],
  SC: ['Mahé', 'Praslin', 'La Digue'],
  SE: ['Estocolmo', 'Gotemburgo', 'Malmö', 'Kiruna'],
  SG: ['Singapura'],
  SI: ['Liubliana', 'Bled', 'Piran', 'Postojna'],
  TH: ['Bangkok', 'Chiang Mai', 'Phuket', 'Krabi', 'Koh Samui'],
  TN: ['Tunes', 'Sousse', 'Hammamet', 'Djerba', 'Cartago'],
  TR: ['Istambul', 'Capadócia', 'Antália', 'Éfeso', 'Pamukkale'],
  TZ: ['Zanzibar', 'Serengeti', 'Arusha', 'Kilimanjaro'],
  US: [
    'Nova York',
    'Orlando',
    'Miami',
    'Los Angeles',
    'San Francisco',
    'Las Vegas',
    'Chicago',
    'Washington',
    'Boston',
    'Seattle',
  ],
  UY: ['Montevidéu', 'Punta del Este', 'Colonia del Sacramento'],
  UZ: ['Samarcanda', 'Bucara', 'Tashkent', 'Khiva'],
  VA: ['Vaticano'],
  VN: ['Hanói', 'Ho Chi Minh', 'Hoi An', 'Ha Long'],
  ZA: ['Cidade do Cabo', 'Joanesburgo', 'Durban', 'Kruger'],
};

const OVERRIDES_BY_LOCALE: Partial<Record<Locale, Readonly<Record<string, string>>>> = {
  en: OVERRIDES_EN,
  es: OVERRIDES_ES,
};

/** Sugestões de um país no idioma ativo; vazio quando o país não está no catálogo. */
export function getCitySuggestions(
  countryCode: string,
  locale: Locale = getActiveLocale(),
): readonly string[] {
  const base = CITY_SUGGESTIONS[countryCode.trim().toUpperCase()] ?? [];
  const overrides = OVERRIDES_BY_LOCALE[locale];
  if (!overrides) return base;

  return base.map((name) => overrides[name] ?? name);
}
