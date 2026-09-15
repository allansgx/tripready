/**
 * Exceções ao nome-base de `CITY_SUGGESTIONS` (que é a lista pt-BR): só as
 * cidades cujo nome em inglês difere do português. A maioria das ~375
 * sugestões é igual nos três idiomas (Paris, Dubai, Bali) e não entra aqui —
 * ver a explicação do trade-off em `constants/cities.ts`.
 */
export const CITY_NAME_OVERRIDES: Readonly<Record<string, string>> = {
  // DE
  Berlim: 'Berlin',
  Munique: 'Munich',
  Colônia: 'Cologne',

  // AT
  Viena: 'Vienna',

  // BE
  Bruxelas: 'Brussels',
  Antuérpia: 'Antwerp',
  Lovaina: 'Leuven',

  // CH
  Zurique: 'Zurich',
  Genebra: 'Geneva',
  Lucerna: 'Lucerne',
  Berna: 'Bern',

  // CN
  Pequim: 'Beijing',
  Xangai: 'Shanghai',

  // DK
  Copenhague: 'Copenhagen',

  // EG
  Assuã: 'Aswan',

  // ES
  Sevilha: 'Seville',

  // FI
  Helsinque: 'Helsinki',

  // FR
  Marselha: 'Marseille',
  Estrasburgo: 'Strasbourg',

  // GB
  Londres: 'London',
  Edimburgo: 'Edinburgh',

  // GR
  Atenas: 'Athens',
  Creta: 'Crete',
  Tessalônica: 'Thessaloniki',
  Rodes: 'Rhodes',

  // HU
  Budapeste: 'Budapest',

  // ID
  Jacarta: 'Jakarta',

  // IL / JO
  Jerusalém: 'Jerusalem',
  'Mar Morto': 'Dead Sea',

  // IN
  'Nova Délhi': 'New Delhi',

  // IT
  Roma: 'Rome',
  Florença: 'Florence',
  Veneza: 'Venice',
  Milão: 'Milan',
  Nápoles: 'Naples',
  Bolonha: 'Bologna',

  // JO
  Amã: 'Amman',

  // JP
  Tóquio: 'Tokyo',

  // KE
  Nairóbi: 'Nairobi',
  Mombaça: 'Mombasa',

  // KR
  Seul: 'Seoul',

  // MX
  'Cidade do México': 'Mexico City',

  // MY
  Malaca: 'Malacca',
  Bornéu: 'Borneo',

  // NL
  Amsterdã: 'Amsterdam',
  Roterdã: 'Rotterdam',
  Haia: 'The Hague',

  // NP
  Catmandu: 'Kathmandu',

  // PA
  'Cidade do Panamá': 'Panama City',

  // PL
  Varsóvia: 'Warsaw',
  Cracóvia: 'Krakow',

  // PT
  Lisboa: 'Lisbon',

  // RO
  Bucareste: 'Bucharest',

  // RS
  Belgrado: 'Belgrade',

  // RU
  Moscou: 'Moscow',
  'São Petersburgo': 'Saint Petersburg',

  // SA
  Riade: 'Riyadh',
  Jidá: 'Jeddah',
  Meca: 'Mecca',

  // SE
  Estocolmo: 'Stockholm',
  Gotemburgo: 'Gothenburg',

  // SG
  Singapura: 'Singapore',

  // SI
  Liubliana: 'Ljubljana',

  // TN
  Tunes: 'Tunis',
  Cartago: 'Carthage',

  // TR
  Istambul: 'Istanbul',
  Capadócia: 'Cappadocia',
  Antália: 'Antalya',
  Éfeso: 'Ephesus',

  // US
  'Nova York': 'New York',

  // UY
  Montevidéu: 'Montevideo',

  // UZ
  Samarcanda: 'Samarkand',
  Bucara: 'Bukhara',

  // VA
  Vaticano: 'Vatican City',

  // VN
  Hanói: 'Hanoi',

  // ZA
  'Cidade do Cabo': 'Cape Town',
  Joanesburgo: 'Johannesburg',

  // CY
  Pafos: 'Paphos',
};
