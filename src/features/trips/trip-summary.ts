import { computeTripProgress, type TripProgress } from '@/features/trips/trip-progress';
import {
  formatStartCountdown,
  getTripStatus,
  todayISO,
  type TripStatus,
} from '@/features/trips/trip-status';
import type { TripWithRelations } from '@/services/trips';
import type { Trip } from '@/types/models';

export type TripSummary = {
  trip: Trip;
  countryCodes: string[];
  progress: TripProgress;
  status: TripStatus;
  /** "Começa em 5 dias" — só para viagens futuras próximas. */
  countdown: string | null;
};

/** Prioridade de exibição: em andamento, depois próximas, depois concluídas. */
const STATUS_ORDER: Record<TripStatus, number> = {
  ongoing: 0,
  upcoming: 1,
  completed: 2,
};

export function toTripSummary(row: TripWithRelations, today: string = todayISO()): TripSummary {
  const { trip_countries, trip_requirements, ...trip } = row;

  return {
    trip,
    countryCodes: (trip_countries ?? []).map((country) => country.country_code),
    progress: computeTripProgress(trip_requirements ?? []),
    status: getTripStatus(trip, today),
    countdown: formatStartCountdown(trip, today),
  };
}

/**
 * Ordena por relevância para o momento:
 *
 * 1. Em andamento — as que terminam antes primeiro.
 * 2. Próximas — pela data de início mais próxima; sem data vão ao fim do grupo.
 * 3. Concluídas — término mais recente primeiro.
 *
 * A ordenação é feita aqui, e não no SQL, porque depende da data de hoje no
 * fuso do usuário e muda de sentido conforme o status. Quando entrar paginação,
 * vira consulta por período no serviço.
 */
export function buildTripSummaries(rows: readonly TripWithRelations[]): TripSummary[] {
  const today = todayISO();

  return rows
    .map((row) => toTripSummary(row, today))
    .sort((a, b) => {
      const orderA = STATUS_ORDER[a.status];
      const orderB = STATUS_ORDER[b.status];
      if (orderA !== orderB) return orderA - orderB;

      if (a.status === 'completed') {
        const endA = a.trip.end_date ?? a.trip.start_date ?? '';
        const endB = b.trip.end_date ?? b.trip.start_date ?? '';
        return endB.localeCompare(endA);
      }

      if (a.status === 'ongoing') {
        const endA = a.trip.end_date ?? a.trip.start_date ?? '';
        const endB = b.trip.end_date ?? b.trip.start_date ?? '';
        return endA.localeCompare(endB);
      }

      // Próximas: sem data vão para o fim, entre si pela criação mais recente.
      const startA = a.trip.start_date;
      const startB = b.trip.start_date;
      if (!startA && !startB) return b.trip.created_at.localeCompare(a.trip.created_at);
      if (!startA) return 1;
      if (!startB) return -1;
      return startA.localeCompare(startB);
    });
}

/** Separa a lista nas seções da tela: ativas (em andamento + próximas) e histórico. */
export function splitTripSections(summaries: readonly TripSummary[]) {
  return {
    active: summaries.filter((summary) => summary.status !== 'completed'),
    history: summaries.filter((summary) => summary.status === 'completed'),
  };
}
