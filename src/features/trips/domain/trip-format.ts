import { getCountryName } from '@/constants/countries';
import type { TripStatus } from '@/features/trips/domain/trip-status';
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

// Leitura manual: `new Date('2026-06-15')` é UTC e, em fuso negativo, volta um dia.
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

/** "12 out 2026" — uma data solta, fora de um intervalo. */
export function formatTripDate(value: string): string {
  const date = parseDate(value);
  if (!date) return '';
  return `${date.day} ${MONTHS[date.month]} ${date.year}`;
}

/** Regiões para sugerir o nome quando todos os destinos são do mesmo grupo. */
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
const SEASONS: Record<
  Season,
  { emoji: string; label: string; complement: string; possessive: string; tip: string }
> = {
  winter: {
    emoji: '❄️',
    label: 'Inverno',
    complement: 'no inverno',
    possessive: 'do inverno',
    tip: 'Vai fazer frio. Um casaco impermeável e boas meias dão conta do dia inteiro.',
  },
  spring: {
    emoji: '🌸',
    label: 'Primavera',
    complement: 'na primavera',
    possessive: 'da primavera',
    tip: 'Dias floridos com chuvas rápidas. Uma jaqueta leve resolve as duas coisas.',
  },
  summer: {
    emoji: '☀️',
    label: 'Verão',
    complement: 'no verão',
    possessive: 'do verão',
    tip: 'Sol firme. Protetor solar, roupas leves e uma garrafa de água deixam o passeio melhor.',
  },
  autumn: {
    emoji: '🍂',
    label: 'Outono',
    complement: 'no outono',
    possessive: 'do outono',
    tip: 'Período de folhas douradas. Leve um casaco leve para as noites mais frescas.',
  },
};

/** As estações em linha: "❄️ Inverno" ou "🍂 Outono · ❄️ Inverno". */
export function formatSeasonTrail(seasons: readonly Season[]): string | null {
  if (seasons.length === 0) return null;

  return seasons.map((season) => `${SEASONS[season].emoji} ${SEASONS[season].label}`).join(' · ');
}

export type SeasonTip = {
  /** "🍂 Dica do outono". */
  label: string;
  text: string;
};

/** A dica da estação de chegada; atravessando duas, vale a primeira. */
export function formatSeasonTip(seasons: readonly Season[]): SeasonTip | null {
  if (seasons.length === 0) return null;

  const season = SEASONS[seasons[0]];
  return { label: `${season.emoji} Dica ${season.possessive}`, text: season.tip };
}

/** Com duas ou mais estações, empilhar os ícones vira ruído. */
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

/** Uma estação vira frase direta; mais de uma, a contagem e o percurso. */
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
