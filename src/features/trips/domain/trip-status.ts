import type { Trip } from '@/types/models';

/**
 * Estado da viagem, sempre derivado das datas — não existe coluna `status` no
 * banco. Esta é a única fonte da regra: ordenação, card e seções consomem daqui.
 */
export type TripStatus = 'ongoing' | 'upcoming' | 'completed';

type DateRange = Pick<Trip, 'start_date' | 'end_date'>;

// Partes locais do `Date`, e não `toISOString()`: em fuso negativo o UTC
// devolveria o dia anterior à noite.
export function todayISO(now: Date = new Date()): string {
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** `upcoming` cobre também as viagens sem datas definidas. */
export function getTripStatus(trip: DateRange, today: string = todayISO()): TripStatus {
  const { start_date: start, end_date: end } = trip;

  if (end && end < today) return 'completed';
  if (start && start <= today) return 'ongoing';
  return 'upcoming';
}

/** Diferença em dias de calendário entre duas datas `YYYY-MM-DD`. */
function daysBetween(from: string, to: string): number | null {
  const parse = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    // Date.UTC neutraliza horário de verão: só a distância entre dias importa.
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  };

  const start = parse(from);
  const end = parse(to);
  if (start === null || end === null) return null;

  return Math.round((end - start) / 86_400_000);
}

/** Duração em dias, contando o primeiro e o último: de 12 a 14 são três dias. */
export function countTripDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;

  const span = daysBetween(start, end);
  if (span === null || span < 0) return null;
  return span + 1;
}

/** Dias até a partida: `0` no dia, negativo em viagem já começada. */
export function daysUntilStart(trip: DateRange, today: string = todayISO()): number | null {
  if (!trip.start_date) return null;
  return daysBetween(today, trip.start_date);
}

/**
 * O momento da viagem no card da lista: o tom decide a cor, `kind` decide a
 * frase. Nenhum texto aqui — `days`/`months` só existem para os dois `kind`
 * que precisam de número, e a tela resolve `t('trip.moment.' + kind, ...)`.
 */
export type TripMomentTone = 'ongoing' | 'imminent' | 'upcoming' | 'completed';

export type TripMomentKind =
  'completed' | 'boardingToday' | 'ongoing' | 'undated' | 'tomorrow' | 'daysUntil' | 'monthsUntil';

export type TripMoment = {
  tone: TripMomentTone;
  kind: TripMomentKind;
  /** Só em `daysUntil`. */
  days?: number;
  /** Só em `monthsUntil`. */
  months?: number;
};

/** Até aqui a espera se conta em dias; acima disso, em meses. */
const MOMENT_DAYS_WINDOW = 45;

/** Média de dias por mês, só para arredondar a espera longa. */
const DAYS_PER_MONTH = 30.44;

export function buildTripMoment(trip: DateRange, today: string = todayISO()): TripMoment {
  if (getTripStatus(trip, today) === 'completed') {
    return { tone: 'completed', kind: 'completed' };
  }

  const days = daysUntilStart(trip, today);

  // Antes do estado: para `getTripStatus` a viagem já começou.
  if (days === 0) return { tone: 'imminent', kind: 'boardingToday' };

  if (getTripStatus(trip, today) === 'ongoing') {
    return { tone: 'ongoing', kind: 'ongoing' };
  }

  // Sem data não há espera a anunciar, então a faixa diz o que fazer a respeito.
  if (days === null) return { tone: 'upcoming', kind: 'undated' };

  if (days === 1) return { tone: 'imminent', kind: 'tomorrow' };
  if (days <= MOMENT_DAYS_WINDOW) return { tone: 'upcoming', kind: 'daysUntil', days };

  const months = Math.round(days / DAYS_PER_MONTH);
  return { tone: 'upcoming', kind: 'monthsUntil', months };
}

/** Onde a pessoa está dentro da viagem: dia 3 de 7, faltando 4 para voltar. */
export type TripDayCount = {
  /** 1 no dia da partida. */
  day: number;
  total: number;
  /** Dias até o término, 0 no último dia. */
  remaining: number;
};

export function buildTripDayCount(
  trip: DateRange,
  today: string = todayISO(),
): TripDayCount | null {
  const { start_date: start, end_date: end } = trip;
  if (!start || !end) return null;
  if (getTripStatus(trip, today) !== 'ongoing') return null;

  const elapsed = daysBetween(start, today);
  const span = daysBetween(start, end);
  const left = daysBetween(today, end);
  if (elapsed === null || span === null || left === null || span < 0) return null;

  return { day: elapsed + 1, total: span + 1, remaining: left };
}

/** O que dizer sobre o retorno; a tela resolve `t('trip.returnCountdown.' + kind, ...)`. */
export type ReturnCountdownKind = 'lastDay' | 'tomorrow' | 'daysLeft';

export type ReturnCountdown = {
  kind: ReturnCountdownKind;
  /** Só em `daysLeft`. */
  days?: number;
};

export function describeReturnCountdown(dayCount: TripDayCount): ReturnCountdown {
  if (dayCount.remaining === 0) return { kind: 'lastDay' };
  if (dayCount.remaining === 1) return { kind: 'tomorrow' };
  return { kind: 'daysLeft', days: dayCount.remaining };
}

/**
 * A contagem da Home. Nenhuma frase: `kind` decide a forma
 * (`days`/`ongoing` têm número grande, os demais viram frase pronta na tela),
 * e `totalDays` só existe para a viagem em andamento com término definido.
 */
export type TripCountdownKind = 'days' | 'tomorrow' | 'today' | 'ongoing' | 'undated';

export type TripCountdown = {
  kind: TripCountdownKind;
  /** Dias que faltam em `days`, dia atual da viagem em `ongoing`. */
  days: number | null;
  /** Só em `ongoing`, quando a viagem tem término definido. */
  totalDays?: number;
};

export function buildTripCountdown(trip: DateRange, today: string = todayISO()): TripCountdown {
  const days = daysUntilStart(trip, today);

  // Antes do estado: para `getTripStatus` a viagem já começou.
  if (days === 0) {
    return { kind: 'today', days: null };
  }

  // Com a viagem acontecendo a contagem inverte: o número passa a ser o dia.
  if (getTripStatus(trip, today) === 'ongoing') {
    const dayCount = buildTripDayCount(trip, today);
    if (dayCount) {
      return { kind: 'ongoing', days: dayCount.day, totalDays: dayCount.total };
    }

    // Viagem sem término definido: não há "de quantos" a dizer.
    return { kind: 'ongoing', days: null };
  }

  if (days === null) {
    return { kind: 'undated', days: null };
  }

  if (days === 1) {
    return { kind: 'tomorrow', days: null };
  }

  return { kind: 'days', days };
}
