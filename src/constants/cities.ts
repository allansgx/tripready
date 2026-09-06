/**
 * Sugestões de cidades por país.
 *
 * É só um atalho para a etapa (opcional) de cidades: cobre destinos comuns e,
 * para qualquer país fora da lista, a tela permite digitar o nome da cidade.
 * O banco guarda apenas `trip_cities.city_name` como texto, então nada aqui
 * limita o que o usuário pode registrar.
 */
export const CITY_SUGGESTIONS: Record<string, readonly string[]> = {
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah'],
  AR: ['Buenos Aires', 'Bariloche', 'Mendoza', 'Córdoba', 'Ushuaia', 'Salta'],
  AT: ['Viena', 'Salzburgo', 'Innsbruck', 'Graz', 'Hallstatt'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Cairns', 'Adelaide'],
  BE: ['Bruxelas', 'Bruges', 'Antuérpia', 'Gante', 'Lovaina'],
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
  CA: ['Toronto', 'Vancouver', 'Montreal', 'Quebec', 'Ottawa', 'Calgary', 'Banff'],
  CH: ['Zurique', 'Genebra', 'Lucerna', 'Interlaken', 'Zermatt', 'Berna'],
  CL: ['Santiago', 'Valparaíso', 'Puerto Varas', 'San Pedro de Atacama', 'Punta Arenas'],
  CN: ['Pequim', 'Xangai', 'Xi’an', 'Guilin', 'Chengdu', 'Hong Kong'],
  CO: ['Bogotá', 'Medellín', 'Cartagena', 'Cali', 'Santa Marta'],
  CZ: ['Praga', 'Český Krumlov', 'Brno', 'Karlovy Vary'],
  DE: ['Berlim', 'Munique', 'Frankfurt', 'Hamburgo', 'Colônia', 'Dresden', 'Heidelberg'],
  DK: ['Copenhague', 'Aarhus', 'Odense'],
  EG: ['Cairo', 'Luxor', 'Assuã', 'Alexandria', 'Sharm el-Sheikh'],
  ES: ['Madri', 'Barcelona', 'Sevilha', 'Granada', 'Valência', 'Bilbao', 'Málaga', 'Toledo'],
  FI: ['Helsinque', 'Rovaniemi', 'Turku'],
  FR: ['Paris', 'Nice', 'Lyon', 'Marselha', 'Bordeaux', 'Estrasburgo', 'Cannes'],
  GB: ['Londres', 'Edimburgo', 'Manchester', 'Liverpool', 'Oxford', 'Bath', 'Glasgow'],
  GR: ['Atenas', 'Santorini', 'Mykonos', 'Creta', 'Tessalônica', 'Rodes'],
  HR: ['Zagreb', 'Dubrovnik', 'Split', 'Hvar', 'Zadar'],
  HU: ['Budapeste', 'Eger', 'Debrecen', 'Szentendre'],
  ID: ['Bali', 'Jacarta', 'Yogyakarta', 'Lombok'],
  IE: ['Dublin', 'Galway', 'Cork', 'Killarney'],
  IL: ['Tel Aviv', 'Jerusalém', 'Haifa', 'Mar Morto'],
  IN: ['Nova Délhi', 'Mumbai', 'Jaipur', 'Agra', 'Goa', 'Varanasi'],
  IS: ['Reykjavík', 'Akureyri', 'Vík'],
  IT: ['Roma', 'Florença', 'Veneza', 'Milão', 'Nápoles', 'Bolonha', 'Verona', 'Palermo'],
  JP: ['Tóquio', 'Kyoto', 'Osaka', 'Hiroshima', 'Nara', 'Sapporo', 'Hakone', 'Nagoya'],
  KR: ['Seul', 'Busan', 'Jeju', 'Gyeongju'],
  MA: ['Marrakech', 'Fez', 'Casablanca', 'Chefchaouen', 'Rabat'],
  MX: ['Cidade do México', 'Cancún', 'Playa del Carmen', 'Oaxaca', 'Guadalajara', 'Tulum'],
  NL: ['Amsterdã', 'Roterdã', 'Haia', 'Utrecht', 'Delft'],
  NO: ['Oslo', 'Bergen', 'Tromsø', 'Stavanger'],
  NZ: ['Auckland', 'Queenstown', 'Wellington', 'Christchurch', 'Rotorua'],
  PE: ['Lima', 'Cusco', 'Arequipa', 'Puno'],
  PL: ['Varsóvia', 'Cracóvia', 'Gdansk', 'Wroclaw'],
  PT: ['Lisboa', 'Porto', 'Faro', 'Coimbra', 'Madeira', 'Sintra', 'Braga'],
  RO: ['Bucareste', 'Brasov', 'Sibiu', 'Cluj-Napoca'],
  SE: ['Estocolmo', 'Gotemburgo', 'Malmö', 'Kiruna'],
  SG: ['Singapura'],
  TH: ['Bangkok', 'Chiang Mai', 'Phuket', 'Krabi', 'Koh Samui'],
  TR: ['Istambul', 'Capadócia', 'Antália', 'Éfeso', 'Pamukkale'],
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
  VN: ['Hanói', 'Ho Chi Minh', 'Hoi An', 'Ha Long'],
  ZA: ['Cidade do Cabo', 'Joanesburgo', 'Durban', 'Kruger'],
};

/** Sugestões de um país; vazio quando o país não está no catálogo. */
export function getCitySuggestions(countryCode: string): readonly string[] {
  return CITY_SUGGESTIONS[countryCode.trim().toUpperCase()] ?? [];
}
