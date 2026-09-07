import { getCountryName } from '@/constants/countries';
import type { TripStatus } from '@/features/trips/trip-status';
import type { Season } from '@/types/models';

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

  const region = REGIONS.find((candidate) => codes.every((code) => candidate.codes.includes(code)));
  if (region) return region.label;

  const names = codes.map(getCountryName);
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names[0]}, ${names[1]} e mais ${names.length - 2}`;
}

/** Como cada estação se apresenta na checklist. */
const SEASONS: Record<Season, { emoji: string; label: string; complement: string }> = {
  winter: { emoji: '❄️', label: 'Inverno', complement: 'no inverno' },
  spring: { emoji: '🌸', label: 'Primavera', complement: 'na primavera' },
  summer: { emoji: '☀️', label: 'Verão', complement: 'no verão' },
  autumn: { emoji: '🍂', label: 'Outono', complement: 'no outono' },
};

/**
 * As estações da viagem em linha: "❄️ Inverno" ou "🍂 Outono · ❄️ Inverno".
 *
 * É a legenda do clima que a Home anima dentro do card — sem ela, folhas caindo
 * são só um enfeite sem explicação. `null` quando a viagem não tem datas e,
 * portanto, não tem estação a afirmar.
 */
export function formatSeasonTrail(seasons: readonly Season[]): string | null {
  if (seasons.length === 0) return null;

  return seasons.map((season) => `${SEASONS[season].emoji} ${SEASONS[season].label}`).join(' · ');
}

/**
 * Um broto no lugar dos emojis somados: com duas ou mais estações, empilhar os
 * ícones vira ruído e nenhum deles representa a viagem inteira.
 */
const MANY_SEASONS_EMOJI = '🌱';

/** A frase muda de tempo verbal conforme a viagem já começou ou terminou. */
const TRAVEL_VERB: Record<TripStatus, string> = {
  upcoming: 'Você vai viajar',
  ongoing: 'Você está viajando',
  completed: 'Você viajou',
};

const CROSSING_VERB: Record<TripStatus, string> = {
  upcoming: 'Sua viagem passa por',
  ongoing: 'Sua viagem passa por',
  completed: 'Sua viagem passou por',
};

const COUNT_WORDS = ['nenhuma', 'uma', 'duas', 'três', 'quatro'] as const;

export type TripSeasonSummary = {
  /** Estação que dá a cor do card — a primeira do percurso. */
  season: Season;
  emoji: string;
  headline: string;
  /** Só existe quando há mais de uma estação: "Inverno → Primavera". */
  detail: string | null;
};

/**
 * O aviso de estação da viagem.
 *
 * Uma estação vira uma frase direta; mais de uma vira a contagem seguida do
 * percurso, porque nesse caso o que interessa é a mudança — arrumar mala para
 * inverno e primavera não é a mesma coisa que arrumar para uma só.
 *
 * `null` quando a viagem não tem datas: sem elas não há estação a afirmar.
 */
export function summarizeTripSeasons(
  seasons: readonly Season[],
  status: TripStatus,
): TripSeasonSummary | null {
  if (seasons.length === 0) return null;

  if (seasons.length === 1) {
    const season = seasons[0];
    return {
      season,
      emoji: SEASONS[season].emoji,
      headline: `${TRAVEL_VERB[status]} ${SEASONS[season].complement}`,
      detail: null,
    };
  }

  return {
    season: seasons[0],
    emoji: MANY_SEASONS_EMOJI,
    headline: `${CROSSING_VERB[status]} ${COUNT_WORDS[seasons.length] ?? seasons.length} estações`,
    detail: seasons.map((season) => SEASONS[season].label).join(' → '),
  };
}
