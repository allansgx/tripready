import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { hasReminderPermission } from '@/features/notifications/data/reminder-permission';
import {
  diffReminders,
  getTripNotificationCandidates,
  selectTripsForReminders,
  type ReminderKind,
  type ReminderTrip,
  type ScheduledReminder,
  type TripReminder,
} from '@/features/notifications/domain/trip-reminders';
import type { ProgressItem } from '@/features/trips/domain/trip-progress';
import { t, type MessageKey } from '@/i18n';

/**
 * A ponte entre os lembretes que o domínio calcula e o sistema operacional.
 * Trocar isto por push remoto no futuro não toca em mais nada: o payload que
 * viaja no `data` é o mesmo que o Expo Push Service entregaria.
 */
const CHANNEL_ID = 'trip-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Sem canal, a notificação agendada não aparece no Android. */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: t('reminder.channelName'),
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

const TITLE_KEY: Record<ReminderKind, MessageKey> = {
  approaching: 'reminder.approaching.title',
  eve: 'reminder.eve.title',
};

const PENDING_BODY_KEY: Record<'required' | 'recommended', MessageKey> = {
  required: 'reminder.pending.required',
  recommended: 'reminder.pending.recommended',
};

/** Resolve o conteúdo do lembrete no idioma ativo, a partir do descritor puro do domínio. */
function resolveContent(reminder: TripReminder): { title: string; body: string } {
  const body = reminder.pending
    ? t(PENDING_BODY_KEY[reminder.pending.kind], { count: reminder.pending.count })
    : t('reminder.eve.genericBody');

  return { title: t(TITLE_KEY[reminder.kind]), body };
}

/** O que o toque precisa saber para navegar, e o diff para reconciliar. */
type ReminderPayload = {
  tripId: string;
  kind: string;
  key: string;
  signature: string;
};

export function readTripId(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null;
  const tripId = (data as Partial<ReminderPayload>).tripId;
  return typeof tripId === 'string' && tripId.length > 0 ? tripId : null;
}

/**
 * Os lembretes que já estão no sistema. O registro é o próprio SO: guardar uma
 * cópia em disco só criaria um segundo estado para dessincronizar.
 */
async function readScheduled(): Promise<ScheduledReminder[]> {
  const all = await Notifications.getAllScheduledNotificationsAsync();

  return all.flatMap((item) => {
    const data = item.content.data as Partial<ReminderPayload> | undefined;
    if (!data?.tripId || !data.key || !data.signature) return [];

    return [{ id: item.identifier, key: data.key, tripId: data.tripId, signature: data.signature }];
  });
}

async function apply(
  scheduled: readonly ScheduledReminder[],
  desired: readonly TripReminder[],
): Promise<void> {
  const { toCancel, toSchedule } = diffReminders(scheduled, desired);

  for (const id of toCancel) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  if (toSchedule.length > 0) await ensureAndroidChannel();

  for (const reminder of toSchedule) {
    const { title, body } = resolveContent(reminder);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          tripId: reminder.tripId,
          kind: reminder.kind,
          key: reminder.key,
          signature: reminder.signature,
        } satisfies ReminderPayload,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.fireAt,
        channelId: CHANNEL_ID,
      },
    });
  }
}

type TripWithRequirements = ReminderTrip & {
  trip_requirements: readonly ProgressItem[] | null;
};

/**
 * Reconcilia a agenda inteira. Lembrete de viagem que saiu da lista — excluída,
 * concluída ou distante demais — não encontra correspondente e é cancelado.
 */
export async function syncAllTripReminders(trips: readonly TripWithRequirements[]): Promise<void> {
  if (!(await hasReminderPermission())) return;

  const desired = selectTripsForReminders(trips).flatMap((trip) =>
    getTripNotificationCandidates(trip, trip.trip_requirements ?? []),
  );

  await apply(await readScheduled(), desired);
}

/** Reconcilia uma viagem só, sem tocar nas demais. */
export async function syncTripReminders(
  trip: ReminderTrip,
  requirements: readonly ProgressItem[],
): Promise<void> {
  if (!(await hasReminderPermission())) return;

  const scheduled = (await readScheduled()).filter((item) => item.tripId === trip.id);
  await apply(scheduled, getTripNotificationCandidates(trip, requirements));
}

export async function cancelTripReminders(tripId: string): Promise<void> {
  const scheduled = (await readScheduled()).filter((item) => item.tripId === tripId);

  for (const item of scheduled) {
    await Notifications.cancelScheduledNotificationAsync(item.id);
  }
}

/** Distância do "agora" fingido até a partida, para os dois marcos caberem. */
const PREVIEW_LEAD_DAYS = 30;

const PREVIEW_SECONDS = [5, 10];

/**
 * Só em `__DEV__`: dispara os lembretes reais da viagem em segundos, para dar
 * para conferir a experiência sem esperar dias. O "agora" recuado faz os dois
 * marcos entrarem; o conteúdo é o mesmo que chegaria na data certa.
 *
 * Não carrega `key` nem `signature`, então `readScheduled` o ignora e a
 * reconciliação não o confunde com um lembrete de verdade.
 */
export async function scheduleReminderPreview(
  trip: ReminderTrip,
  requirements: readonly ProgressItem[],
): Promise<number> {
  if (!trip.start_date) return 0;

  const pretendNow = new Date(`${trip.start_date}T09:00:00`);
  pretendNow.setDate(pretendNow.getDate() - PREVIEW_LEAD_DAYS);

  const reminders = getTripNotificationCandidates(trip, requirements, pretendNow);
  if (reminders.length > 0) await ensureAndroidChannel();

  for (const [index, reminder] of reminders.entries()) {
    const { title, body } = resolveContent(reminder);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { tripId: reminder.tripId, kind: reminder.kind },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: PREVIEW_SECONDS[index] ?? (index + 1) * 5,
        channelId: CHANNEL_ID,
      },
    });
  }

  return reminders.length;
}
