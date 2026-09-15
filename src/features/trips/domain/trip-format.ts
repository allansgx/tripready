import { getCountryName } from '@/constants/countries';
import type { TripLimitIssue } from '@/features/trips/domain/trip-limits';
import type { TripStatus } from '@/features/trips/domain/trip-status';
import { getLocale, t, type MessageKey } from '@/i18n';
import { monthAbbreviations } from '@/i18n/format';
import type { Season } from '@/types/models';

/**
 * Formatação, não regra de negócio: por isso, ao contrário de
 * `trip-limits.ts`/`trip-status.ts`, este módulo chama `t()` diretamente em
 * vez de devolver um descritor. Não há teste travando este arquivo a um
 * texto em português (nenhum `trip-format.test.ts` existe) nem necessidade de
 * rodar sob `node --test`, então nada aqui precisa ficar livre de idioma — a
 * própria função já entrega a frase pronta, só que agora no idioma ativo.
 */

// Leitura manual: `new Date('2026-06-15')` é UTC e, em fuso negativo, volta um dia.
function parseDate(value: string): { day: number; month: number; year: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
}

/** "15–30 jun 2026" em pt-BR, "Jun 15–30, 2026" em inglês, "Datas a definir" sem nenhuma. */
export function formatTripDates(start: string | null, end: string | null): string {
  const locale = getLocale();
  const months = monthAbbreviations(locale);

  const from = start ? parseDate(start) : null;
  const to = end ? parseDate(end) : null;

  if (!from && !to) return t('date.range.undated');
  if (from && !to) {
    return t('date.range.openStart', { day: from.day, month: months[from.month], year: from.year });
  }
  if (!from && to) {
    return t('date.range.openEnd', { day: to.day, month: months[to.month], year: to.year });
  }
  if (!from || !to) return t('date.range.undated');

  if (from.year !== to.year) {
    return t('date.range.diffYear', {
      fromDay: from.day,
      fromMonth: months[from.month],
      fromYear: from.year,
      toDay: to.day,
      toMonth: months[to.month],
      toYear: to.year,
    });
  }
  if (from.month !== to.month) {
    return t('date.range.diffMonth', {
      fromDay: from.day,
      fromMonth: months[from.month],
      toDay: to.day,
      toMonth: months[to.month],
      year: to.year,
    });
  }
  return t('date.range.sameMonth', {
    fromDay: from.day,
    toDay: to.day,
    month: months[from.month],
    year: from.year,
  });
}

const LIMIT_MESSAGE_KEY: Record<TripLimitIssue, MessageKey> = {
  countries: 'trip.limit.countries',
  duration: 'trip.limit.duration',
  range: 'trip.limit.range',
};

/**
 * Frase do limite de `checkTripLimits` estourado; `max` é o teto da própria
 * regra (`countries`/`duration`), ignorado em `range`. Compartilhada por
 * "Criar viagem" e "Editar viagem", que usam o mesmo limite.
 */
export function formatTripLimitMessage(issue: TripLimitIssue, max?: number): string {
  return t(LIMIT_MESSAGE_KEY[issue], { max: max ?? 0 });
}

/** "12 out 2026" — uma data solta, fora de um intervalo. */
export function formatTripDate(value: string): string {
  const date = parseDate(value);
  if (!date) return '';
  return t('date.single', {
    day: date.day,
    month: monthAbbreviations(getLocale())[date.month],
    year: date.year,
  });
}

/** Regiões para sugerir o nome quando todos os destinos são do mesmo grupo. */
const REGIONS: readonly { labelKey: MessageKey; codes: readonly string[] }[] = [
  {
    labelKey: 'trip.region.centralEurope',
    codes: ['DE', 'AT', 'CH', 'CZ', 'HU', 'PL', 'SK', 'SI', 'LI'],
  },
  { labelKey: 'trip.region.westernEurope', codes: ['FR', 'BE', 'NL', 'LU', 'GB', 'IE', 'MC'] },
  {
    labelKey: 'trip.region.southernEurope',
    codes: ['PT', 'ES', 'IT', 'GR', 'MT', 'HR', 'AD', 'SM', 'VA'],
  },
  { labelKey: 'trip.region.scandinavia', codes: ['SE', 'NO', 'DK', 'FI', 'IS'] },
  { labelKey: 'trip.region.balkans', codes: ['RS', 'BA', 'ME', 'MK', 'AL', 'BG', 'RO', 'XK'] },
  {
    labelKey: 'trip.region.southeastAsia',
    codes: ['TH', 'VN', 'KH', 'LA', 'MY', 'SG', 'ID', 'PH', 'MM'],
  },
  { labelKey: 'trip.region.eastAsia', codes: ['JP', 'KR', 'CN', 'TW', 'HK', 'MO', 'MN'] },
  {
    labelKey: 'trip.region.middleEast',
    codes: ['AE', 'QA', 'OM', 'JO', 'IL', 'SA', 'BH', 'KW', 'TR'],
  },
  {
    labelKey: 'trip.region.southAmerica',
    codes: ['BR', 'AR', 'CL', 'UY', 'PY', 'BO', 'PE', 'EC', 'CO', 'VE'],
  },
  {
    labelKey: 'trip.region.centralAmerica',
    codes: ['MX', 'CR', 'PA', 'GT', 'BZ', 'NI', 'HN', 'SV'],
  },
  { labelKey: 'trip.region.northAmerica', codes: ['US', 'CA'] },
  { labelKey: 'trip.region.oceania', codes: ['AU', 'NZ', 'FJ', 'PF'] },
  { labelKey: 'trip.region.northAfrica', codes: ['MA', 'EG', 'TN', 'DZ'] },
];

/**
 * Nome sugerido a partir dos destinos: um país vira o próprio nome, vários
 * países da mesma região viram o nome da região, e o resto vira uma lista.
 */
export function suggestTripName(countryCodes: readonly string[]): string {
  const codes = [...new Set(countryCodes.map((code) => code.toUpperCase()))];

  if (codes.length === 0) return t('trip.name.default');
  if (codes.length === 1) return getCountryName(codes[0]);

  const region = REGIONS.find((candidate) => codes.every((code) => candidate.codes.includes(code)));
  if (region) return t(region.labelKey);

  const names = codes.map(getCountryName);
  if (names.length === 2) return t('trip.name.twoCountries', { a: names[0], b: names[1] });
  return t('trip.name.moreCountries', { a: names[0], b: names[1], count: names.length - 2 });
}

/** Como cada estação se apresenta na checklist. */
const SEASONS: Record<Season, { emoji: string; nameKey: MessageKey; complementKey: MessageKey }> = {
  winter: { emoji: '❄️', nameKey: 'season.name.winter', complementKey: 'season.complement.winter' },
  spring: { emoji: '🌸', nameKey: 'season.name.spring', complementKey: 'season.complement.spring' },
  summer: { emoji: '☀️', nameKey: 'season.name.summer', complementKey: 'season.complement.summer' },
  autumn: { emoji: '🍂', nameKey: 'season.name.autumn', complementKey: 'season.complement.autumn' },
};

/** Quantas estações o ano tem: atravessar todas elas é o caso que vira contagem. */
const SEASON_COUNT = 4;

/**
 * As estações da viagem em uma linha: "☀️ Verão" ou "☀️ Verão · 🍂 Outono". Nas
 * quatro vira "🌎 4 estações", porque a trilha inteira não cabe no cabeçalho.
 */
export function formatSeasonContext(seasons: readonly Season[]): string | null {
  if (seasons.length === 0) return null;
  if (seasons.length >= SEASON_COUNT) {
    return t('season.context.allSeasons', { count: SEASON_COUNT });
  }

  return seasons
    .map((season) => `${SEASONS[season].emoji} ${t(SEASONS[season].nameKey)}`)
    .join(' · ');
}

/** Com duas ou mais estações, empilhar os ícones vira ruído. */
const MANY_SEASONS_EMOJI = '🌱';

/** A frase muda de tempo verbal conforme a viagem já começou ou terminou. */
const TRAVEL_VERB_KEY: Record<TripStatus, MessageKey> = {
  upcoming: 'trip.travelVerb.upcoming',
  ongoing: 'trip.travelVerb.ongoing',
  completed: 'trip.travelVerb.completed',
};

const CROSSING_VERB_KEY: Record<TripStatus, MessageKey> = {
  upcoming: 'trip.crossingVerb.upcoming',
  ongoing: 'trip.crossingVerb.ongoing',
  completed: 'trip.crossingVerb.completed',
};

/**
 * Palavra do número por extenso, só para 2–4: é a única faixa que
 * `summarizeTripSeasons` alcança (uma estação tem frase própria, e o ano só
 * tem quatro). Nenhum idioma tem "duas/três/quatro" como forma de plural — são
 * palavras diferentes, não flexão —, por isso a tabela e não `t()` com plural.
 */
const SEASON_COUNT_KEY: Partial<Record<number, MessageKey>> = {
  2: 'trip.seasonCount.two',
  3: 'trip.seasonCount.three',
  4: 'trip.seasonCount.four',
};

export type TripSeasonSummary = {
  /** Estação que dá a cor do card — a primeira do percurso. */
  season: Season;
  emoji: string;
  headline: string;
  /** Só existe quando há mais de uma estação: "Inverno → Primavera". */
  detail: string | null;
};

/**
 * Uma estação vira frase direta; mais de uma, a contagem e o percurso.
 *
 * `${verbo} ${complemento}` funciona nos três idiomas porque a ordem sujeito +
 * verbo + "em/no + estação" é a mesma em pt-BR, en e es para esta frase — não é
 * concatenação ingênua, é um padrão conferido nos três antes de manter a forma
 * em duas tabelas em vez de doze chaves de frase inteira.
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
      headline: `${t(TRAVEL_VERB_KEY[status])} ${t(SEASONS[season].complementKey)}`,
      detail: null,
    };
  }

  const countKey = SEASON_COUNT_KEY[seasons.length];
  const countWord = countKey ? t(countKey) : String(seasons.length);

  return {
    season: seasons[0],
    emoji: MANY_SEASONS_EMOJI,
    headline: `${t(CROSSING_VERB_KEY[status])} ${countWord} ${t('season.plural')}`,
    detail: seasons.map((season) => t(SEASONS[season].nameKey)).join(' → '),
  };
}
