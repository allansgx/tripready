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

/** O momento da viagem no card da lista: uma frase curta e um tom para a cor. */
export type TripMomentTone = 'ongoing' | 'imminent' | 'upcoming' | 'completed';

export type TripMoment = {
  tone: TripMomentTone;
  label: string;
};

/** Até aqui a espera se conta em dias; acima disso, em meses. */
const MOMENT_DAYS_WINDOW = 45;

/** Média de dias por mês, só para arredondar a espera longa. */
const DAYS_PER_MONTH = 30.44;

export function buildTripMoment(trip: DateRange, today: string = todayISO()): TripMoment {
  if (getTripStatus(trip, today) === 'completed') {
    return { tone: 'completed', label: 'Concluída' };
  }

  const days = daysUntilStart(trip, today);

  // Antes do estado: para `getTripStatus` a viagem já começou.
  if (days === 0) return { tone: 'imminent', label: 'Embarque hoje' };

  if (getTripStatus(trip, today) === 'ongoing') {
    return { tone: 'ongoing', label: 'Viagem em andamento' };
  }

  // Sem data não há espera a anunciar, então a faixa diz o que fazer a respeito.
  if (days === null) return { tone: 'upcoming', label: 'Escolha as datas' };

  if (days === 1) return { tone: 'imminent', label: 'Começa amanhã' };
  if (days <= MOMENT_DAYS_WINDOW) return { tone: 'upcoming', label: `Começa em ${days} dias` };

  const months = Math.round(days / DAYS_PER_MONTH);
  return { tone: 'upcoming', label: `Começa em ${months} ${months === 1 ? 'mês' : 'meses'}` };
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

/** Legenda do retorno, em minúsculas porque é apoio e não manchete. */
export function formatReturnCountdown(dayCount: TripDayCount): string {
  if (dayCount.remaining === 0) return 'último dia';
  if (dayCount.remaining === 1) return 'volta amanhã';
  return `volta em ${dayCount.remaining} dias`;
}

/**
 * A contagem da Home. O `kind` decide a forma sem reinterpretar textos: `days`
 * e `ongoing` têm número grande, os demais trazem uma frase pronta.
 */
export type TripCountdownKind = 'days' | 'tomorrow' | 'today' | 'ongoing' | 'undated';

export type TripCountdown = {
  kind: TripCountdownKind;
  /** Dias que faltam em `days`, dia atual da viagem em `ongoing`. */
  days: number | null;
  /** Frase grande quando não há número a mostrar. */
  message: string | null;
  /** Legenda de apoio, abaixo do número ou da frase. */
  label: string | null;
};

export function buildTripCountdown(trip: DateRange, today: string = todayISO()): TripCountdown {
  const days = daysUntilStart(trip, today);

  // Antes do estado: para `getTripStatus` a viagem já começou.
  if (days === 0) {
    return { kind: 'today', days: null, message: 'Chegou a hora!', label: 'Boa viagem!' };
  }

  // Com a viagem acontecendo a contagem inverte: o número passa a ser o dia.
  if (getTripStatus(trip, today) === 'ongoing') {
    const dayCount = buildTripDayCount(trip, today);
    if (dayCount) {
      return {
        kind: 'ongoing',
        days: dayCount.day,
        message: null,
        label: `de ${dayCount.total} dias`,
      };
    }

    // Viagem sem término definido: não há "de quantos" a dizer.
    return {
      kind: 'ongoing',
      days: null,
      message: 'Aproveite!',
      label: 'Viagem em andamento',
    };
  }

  if (days === null) {
    return {
      kind: 'undated',
      days: null,
      message: 'Quase lá...',
      label: 'Escolha as datas para ver a contagem',
    };
  }

  if (days === 1) {
    return {
      kind: 'tomorrow',
      days: null,
      message: 'Falta 1 dia',
      label: 'Últimos preparativos',
    };
  }

  return { kind: 'days', days, message: null, label: 'dias para viajar' };
}
