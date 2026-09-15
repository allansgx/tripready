// Caminho relativo com extensão, e não o alias `@/`: este módulo é carregado
// direto pelo `node --test`, que resolve pelo arquivo real.
import {
  computeTripProgress,
  type ProgressItem,
  type TripProgress,
} from '../../trips/domain/trip-progress.ts';
import { daysUntilStart, getTripStatus, todayISO } from '../../trips/domain/trip-status.ts';

/**
 * Quais lembretes uma viagem deveria ter hoje e o que precisa ser agendado ou
 * cancelado para chegar lá. Nada aqui conhece `expo-notifications`: a infra
 * recebe a lista pronta e só conversa com o sistema operacional.
 */
export type ReminderKind = 'approaching' | 'eve';

export type ReminderTrip = {
  id: string;
  start_date: string | null;
  end_date: string | null;
};

/**
 * O que o lembrete tem a dizer sobre pendências, sem texto: `null` quando não
 * há nada específico a citar — a véspera ainda mostra o lembrete, só que com a
 * mensagem genérica de revisão. A tela resolve `t('reminder.pending.' + kind, ...)`.
 */
export type ReminderPending = { kind: 'required' | 'recommended'; count: number } | null;

export type TripReminder = {
  /** `${tripId}:${kind}` — é o que torna a duplicata impossível. */
  key: string;
  tripId: string;
  kind: ReminderKind;
  fireAt: Date;
  pending: ReminderPending;
  /** Muda quando o conteúdo ou a data mudam, forçando o reagendamento. */
  signature: string;
};

/** Um lembrete já registrado no sistema operacional. */
export type ScheduledReminder = {
  /** Identificador devolvido no agendamento; é por ele que se cancela. */
  id: string;
  key: string;
  tripId: string;
  signature: string;
};

/** Hora local do disparo, igual nos dois marcos. */
const REMINDER_HOUR = 9;

/** Além desta distância não há o que lembrar, e o agendamento só ocuparia espaço. */
const REMINDER_WINDOW_DAYS = 90;

/** O iOS guarda 64 notificações locais pendentes e descarta o excedente calado. */
const MAX_TRIPS_WITH_REMINDERS = 5;

type ReminderMarker = {
  kind: ReminderKind;
  daysBefore: number;
  /** `undefined` quando não há pendência que justifique o lembrete. */
  build: (progress: TripProgress) => ReminderPending | undefined;
};

/** Pendentes que contam para o progresso e não são obrigatórios. */
function recommendedPending(progress: TripProgress): number {
  return progress.total - progress.done - progress.requiredPending;
}

const MARKERS: readonly ReminderMarker[] = [
  {
    kind: 'approaching',
    daysBefore: 7,
    build: (progress) => {
      if (progress.requiredPending > 0) {
        return { kind: 'required', count: progress.requiredPending };
      }

      const recommended = recommendedPending(progress);
      if (recommended > 0) {
        return { kind: 'recommended', count: recommended };
      }

      return undefined;
    },
  },
  {
    kind: 'eve',
    daysBefore: 1,
    build: (progress) =>
      progress.requiredPending > 0 ? { kind: 'required', count: progress.requiredPending } : null,
  },
];

/**
 * Instante do marco em hora local. Construtor local, e não `Date.UTC`: as nove
 * da manhã são as de quem viaja, não as de Greenwich.
 */
function markerDate(startDate: string, daysBefore: number): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setDate(date.getDate() - daysBefore);
  date.setHours(REMINDER_HOUR, 0, 0, 0);
  return date;
}

/**
 * Os lembretes que deveriam existir para esta viagem. Devolve lista vazia para
 * viagem sem data, em andamento ou concluída, e omite o marco cuja hora já
 * passou — agendar para o passado não notifica ninguém.
 */
export function getTripNotificationCandidates(
  trip: ReminderTrip,
  requirements: readonly ProgressItem[],
  now: Date = new Date(),
): TripReminder[] {
  if (!trip.start_date) return [];
  if (getTripStatus(trip, todayISO(now)) !== 'upcoming') return [];

  const progress = computeTripProgress(requirements);
  const reminders: TripReminder[] = [];

  for (const marker of MARKERS) {
    const fireAt = markerDate(trip.start_date, marker.daysBefore);
    if (!fireAt || fireAt.getTime() <= now.getTime()) continue;

    const pending = marker.build(progress);
    if (pending === undefined) continue;

    reminders.push({
      key: `${trip.id}:${marker.kind}`,
      tripId: trip.id,
      kind: marker.kind,
      fireAt,
      pending,
      signature: `${fireAt.toISOString()}|${marker.kind}|${pending?.kind ?? 'none'}|${pending?.count ?? 0}`,
    });
  }

  return reminders;
}

/** As viagens que valem um agendamento: as mais próximas dentro da janela. */
export function selectTripsForReminders<T extends ReminderTrip>(
  trips: readonly T[],
  today: string = todayISO(),
): T[] {
  return trips
    .filter((trip) => {
      const days = daysUntilStart(trip, today);
      return days !== null && days > 0 && days <= REMINDER_WINDOW_DAYS;
    })
    .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''))
    .slice(0, MAX_TRIPS_WITH_REMINDERS);
}

export type ReminderDiff = {
  /** Identificadores a cancelar no sistema operacional. */
  toCancel: string[];
  toSchedule: TripReminder[];
};

/**
 * O que mudar para que o agendado vire o desejado. Idempotente: rodar duas
 * vezes seguidas não produz nada, porque o que já confere é deixado em paz.
 *
 * `scheduled` deve trazer só o escopo que se quer reconciliar — tudo o que
 * sobrar dele é cancelado, e é assim que viagem excluída perde os lembretes.
 */
export function diffReminders(
  scheduled: readonly ScheduledReminder[],
  desired: readonly TripReminder[],
): ReminderDiff {
  const desiredByKey = new Map(desired.map((reminder) => [reminder.key, reminder]));

  const toCancel: string[] = [];
  const kept = new Set<string>();

  for (const item of scheduled) {
    const match = desiredByKey.get(item.key);

    // A terceira condição descarta a cópia repetida de um lembrete correto,
    // caso alguma versão anterior tenha deixado duas agendadas.
    if (match && match.signature === item.signature && !kept.has(item.key)) {
      kept.add(item.key);
      continue;
    }

    toCancel.push(item.id);
  }

  return {
    toCancel,
    toSchedule: desired.filter((reminder) => !kept.has(reminder.key)),
  };
}
