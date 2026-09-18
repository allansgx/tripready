/**
 * Exceções ao nome-base de `CITY_SUGGESTIONS` (que é a lista pt-BR): só as
 * cidades cujo nome em espanhol difere do português. O espanhol compartilha
 * muito exônimo com o português, então esta lista é bem menor que a de `en.ts`
 * — ver a explicação do trade-off em `constants/cities.ts`.
 */
export const CITY_NAME_OVERRIDES: Readonly<Record<string, string>> = {
  // DE
  Berlim: 'Berlín',
  Munique: 'Múnich',
  Colônia: 'Colonia',

  // BE
  Antuérpia: 'Amberes',

  // CH
  Zurique: 'Zúrich',
  Genebra: 'Ginebra',

  // CN
  Pequim: 'Pekín',
  Xangai: 'Shanghái',

  // EG
  Cairo: 'El Cairo',
  Assuã: 'Asuán',
  Alexandria: 'Alejandría',

  // FR
  Marselha: 'Marsella',

  // GR
  Tessalônica: 'Tesalónica',
  Rodes: 'Rodas',

  // IL / JO
  Jerusalém: 'Jerusalén',
  'Mar Morto': 'Mar Muerto',

  // IN
  'Nova Délhi': 'Nueva Delhi',

  // IT
  Milão: 'Milán',
  Bolonha: 'Bolonia',

  // JO
  Amã: 'Amán',

  // JP
  Tóquio: 'Tokio',

  // KR
  Seul: 'Seúl',

  // MT
  Valletta: 'La Valeta',

  // MX
  'Cidade do México': 'Ciudad de México',

  // NL
  Amsterdã: 'Ámsterdam',
  Roterdã: 'Róterdam',
  Haia: 'La Haya',

  // NP
  Catmandu: 'Katmandú',

  // PA
  'Cidade do Panamá': 'Ciudad de Panamá',

  // RU
  Moscou: 'Moscú',
  'São Petersburgo': 'San Petersburgo',

  // SA
  Riade: 'Riad',
  Jidá: 'Yeda',
  Meca: 'La Meca',

  // SG
  Singapura: 'Singapur',

  // TN
  Tunes: 'Túnez',

  // TR
  Istambul: 'Estambul',
  Antália: 'Antalya',

  // US
  'Nova York': 'Nueva York',

  // UZ
  Bucara: 'Bujará',

  // VA
  Vaticano: 'Ciudad del Vaticano',

  // ZA
  'Cidade do Cabo': 'Ciudad del Cabo',
  Joanesburgo: 'Johannesburgo',

  // CU
  Havana: 'La Habana',
};
