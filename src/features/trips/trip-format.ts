import { getCountryName } from '@/constants/countries';

const MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

/**
 * Datas vêm do Postgres como `YYYY-MM-DD`. A leitura é manual de propósito:
 * `new Date('2026-06-15')` é interpretado como UTC e, em fuso negativo,
 * volta um dia.
 */
function parseDate(value: string): { day: number; month: number; year: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
}

/** "15–30 jun 2026", "28 dez 2026 – 3 jan 2027", "Datas a definir". */
export function formatTripDates(start: string | null, end: string | null): string {
  const from = start ? parseDate(start) : null;
  const to = end ? parseDate(end) : null;

  if (!from && !to) return 'Datas a definir';
  if (from && !to) return `A partir de ${from.day} ${MONTHS[from.month]} ${from.year}`;
  if (!from && to) return `Até ${to.day} ${MONTHS[to.month]} ${to.year}`;
  if (!from || !to) return 'Datas a definir';

  if (from.year !== to.year) {
    return `${from.day} ${MONTHS[from.month]} ${from.year} – ${to.day} ${MONTHS[to.month]} ${to.year}`;
  }
  if (from.month !== to.month) {
    return `${from.day} ${MONTHS[from.month]} – ${to.day} ${MONTHS[to.month]} ${to.year}`;
  }
  return `${from.day}–${to.day} ${MONTHS[from.month]} ${from.year}`;
}

/**
 * Regiões usadas para sugerir o nome da viagem quando todos os destinos
 * pertencem ao mesmo grupo. É só uma conveniência de nomeação — o usuário pode
 * reescrever o nome à vontade.
 */
const REGIONS: readonly { label: string; codes: readonly string[] }[] = [
  { label: 'Europa Central', codes: ['DE', 'AT', 'CH', 'CZ', 'HU', 'PL', 'SK', 'SI', 'LI'] },
  { label: 'Europa Ocidental', codes: ['FR', 'BE', 'NL', 'LU', 'GB', 'IE', 'MC'] },
  { label: 'Sul da Europa', codes: ['PT', 'ES', 'IT', 'GR', 'MT', 'HR', 'AD', 'SM', 'VA'] },
  { label: 'Escandinávia', codes: ['SE', 'NO', 'DK', 'FI', 'IS'] },
  { label: 'Bálcãs', codes: ['RS', 'BA', 'ME', 'MK', 'AL', 'BG', 'RO', 'XK'] },
  { label: 'Sudeste Asiático', codes: ['TH', 'VN', 'KH', 'LA', 'MY', 'SG', 'ID', 'PH', 'MM'] },
  { label: 'Leste da Ásia', codes: ['JP', 'KR', 'CN', 'TW', 'HK', 'MO', 'MN'] },
  { label: 'Oriente Médio', codes: ['AE', 'QA', 'OM', 'JO', 'IL', 'SA', 'BH', 'KW', 'TR'] },
  { label: 'América do Sul', codes: ['BR', 'AR', 'CL', 'UY', 'PY', 'BO', 'PE', 'EC', 'CO', 'VE'] },
  { label: 'América Central', codes: ['MX', 'CR', 'PA', 'GT', 'BZ', 'NI', 'HN', 'SV'] },
  { label: 'América do Norte', codes: ['US', 'CA'] },
  { label: 'Oceania', codes: ['AU', 'NZ', 'FJ', 'PF'] },
  { label: 'Norte da África', codes: ['MA', 'EG', 'TN', 'DZ'] },
];

/**
 * Nome sugerido a partir dos destinos: um país vira o próprio nome, vários
 * países da mesma região viram o nome da região, e o resto vira uma lista.
 */
export function suggestTripName(countryCodes: readonly string[]): string {
  const codes = [...new Set(countryCodes.map((code) => code.toUpperCase()))];

  if (codes.length === 0) return 'Minha viagem';
  if (codes.length === 1) return getCountryName(codes[0]);

  const region = REGIONS.find((candidate) =>
    codes.every((code) => candidate.codes.includes(code)),
  );
  if (region) return region.label;

  const names = codes.map(getCountryName);
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names[0]}, ${names[1]} e mais ${names.length - 2}`;
}
