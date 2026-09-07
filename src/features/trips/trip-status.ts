import type { Trip } from '@/types/models';

/**
 * Estado da viagem, sempre derivado das datas — não existe coluna `status` no
 * banco. Esta é a única fonte da regra: ordenação, card e seções consomem daqui.
 */
export type TripStatus = 'ongoing' | 'upcoming' | 'completed';

type DateRange = Pick<Trip, 'start_date' | 'end_date'>;

/**
 * Data de hoje no fuso do usuário, em `YYYY-MM-DD`.
 *
 * Montada a partir das partes locais do `Date` de propósito: `toISOString()`
 * converte para UTC e, em fuso negativo, devolveria o dia anterior à noite —
 * uma viagem que começa hoje apareceria como próxima.
 */
export function todayISO(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * - `completed`: a data de término já passou.
 * - `ongoing`: já começou e ainda não terminou.
 * - `upcoming`: todo o resto, inclusive viagens sem datas definidas.
 *
 * Datas em `YYYY-MM-DD` comparam corretamente como texto, então não há
 * conversão para `Date` — o que evita qualquer deslocamento de fuso.
 */
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

/**
 * Dias que faltam para a viagem começar.
 *
 * `0` no dia da partida e `null` quando não há data de início ou ela é
 * ilegível. Números negativos são possíveis para viagens que já começaram —
 * quem decide o que fazer com isso é quem chama.
 */
export function daysUntilStart(trip: DateRange, today: string = todayISO()): number | null {
  if (!trip.start_date) return null;
  return daysBetween(today, trip.start_date);
}

/** Limite de dias para a contagem aparecer — evita poluir todos os cards. */
const COUNTDOWN_WINDOW_DAYS = 30;

/**
 * Aviso contextual de proximidade, só para viagens futuras dentro da janela.
 * `null` quando a viagem ainda está distante, já começou ou não tem data.
 */
export function formatStartCountdown(trip: DateRange, today: string = todayISO()): string | null {
  if (getTripStatus(trip, today) !== 'upcoming' || !trip.start_date) return null;

  const days = daysUntilStart(trip, today);
  if (days === null || days < 0 || days > COUNTDOWN_WINDOW_DAYS) return null;

  if (days === 0) return 'Começa hoje';
  if (days === 1) return 'Começa amanhã';
  return `Começa em ${days} dias`;
}

/**
 * A contagem regressiva da Home, sem limite de janela: a próxima viagem é uma
 * só, e a pergunta "quanto falta?" vale mesmo faltando meses.
 *
 * O `kind` existe para a tela decidir a forma sem reinterpretar textos: só
 * `days` tem número grande a exibir; os demais trazem uma frase pronta. Nunca
 * existe "0 dias" — o dia da partida vira "É hoje!", que é o que a pessoa
 * espera ler.
 *
 * Vale para viagens ativas (em andamento ou futuras), que são as únicas que a
 * Home destaca; uma viagem concluída não tem contagem a fazer.
 */
export type TripCountdownKind = 'days' | 'tomorrow' | 'today' | 'ongoing' | 'undated';

export type TripCountdown = {
  kind: TripCountdownKind;
  /** Preenchido apenas em `days` — o número protagonista da Home. */
  days: number | null;
  /** Frase grande quando não há número a mostrar. */
  message: string | null;
  /** Legenda de apoio, abaixo do número ou da frase. */
  label: string | null;
};

export function buildTripCountdown(trip: DateRange, today: string = todayISO()): TripCountdown {
  const days = daysUntilStart(trip, today);

  // O dia da partida vem antes do estado: para `getTripStatus` a viagem já
  // começou, mas quem embarca hoje quer ler "É hoje!", não "boa viagem".
  if (days === 0) {
    return { kind: 'today', days: null, message: 'É hoje! ✈️', label: 'Boa viagem!' };
  }

  if (getTripStatus(trip, today) === 'ongoing') {
    return {
      kind: 'ongoing',
      days: null,
      message: 'Boa viagem! ✈️',
      label: 'Viagem em andamento',
    };
  }

  if (days === null) {
    return {
      kind: 'undated',
      days: null,
      message: 'Quase lá ✈️',
      label: 'Escolha as datas para ver a contagem',
    };
  }

  if (days === 1) {
    return {
      kind: 'tomorrow',
      days: null,
      message: 'Amanhã é o grande dia ✈️',
      label: 'Últimos preparativos',
    };
  }

  return { kind: 'days', days, message: null, label: 'dias para viajar' };
}
