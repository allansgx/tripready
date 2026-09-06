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

/** Limite de dias para a contagem aparecer — evita poluir todos os cards. */
const COUNTDOWN_WINDOW_DAYS = 30;

/**
 * Aviso contextual de proximidade, só para viagens futuras dentro da janela.
 * `null` quando a viagem ainda está distante, já começou ou não tem data.
 */
export function formatStartCountdown(trip: DateRange, today: string = todayISO()): string | null {
  if (getTripStatus(trip, today) !== 'upcoming' || !trip.start_date) return null;

  const days = daysBetween(today, trip.start_date);
  if (days === null || days < 0 || days > COUNTDOWN_WINDOW_DAYS) return null;

  if (days === 0) return 'Começa hoje';
  if (days === 1) return 'Começa amanhã';
  return `Começa em ${days} dias`;
}
