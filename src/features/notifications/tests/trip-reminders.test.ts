import assert from 'node:assert/strict';
import test from 'node:test';

import type { ProgressItem } from '../../trips/domain/trip-progress.ts';
import {
  diffReminders,
  getTripNotificationCandidates,
  selectTripsForReminders,
  type ScheduledReminder,
  type TripReminder,
} from '../domain/trip-reminders.ts';

/** O "agora" entra por parâmetro, então cada marco é verificável sem relógio. */
const NOW = new Date(2026, 9, 11, 8, 0);

/** Datas relativas a `NOW`, para os marcos caírem onde cada teste precisa. */
const IN_7_DAYS = '2026-10-18';
const IN_1_DAY = '2026-10-12';
const IN_60_DAYS = '2026-12-10';

function trip(start: string | null, end: string | null = null, id = 'trip-1') {
  return { id, start_date: start, end_date: end };
}

function items(...entries: [ProgressItem['priority'], boolean][]): ProgressItem[] {
  return entries.map(([priority, completed]) => ({ priority, completed }));
}

const PENDING_REQUIRED = items(['required', false], ['required', false], ['recommended', true]);
const ALL_REQUIRED_DONE = items(['required', true], ['required', true]);

function find(reminders: TripReminder[], kind: 'approaching' | 'eve') {
  return reminders.find((reminder) => reminder.kind === kind) ?? null;
}

test('a 7 dias com obrigatório pendente gera o lembrete de aproximação', () => {
  const reminders = getTripNotificationCandidates(trip(IN_7_DAYS), PENDING_REQUIRED, NOW);
  const approaching = find(reminders, 'approaching');

  assert.ok(approaching);
  assert.equal(approaching.title, '✈️ Sua viagem está chegando');
  assert.equal(approaching.body, 'Você ainda tem 2 itens obrigatórios para revisar.');
  // Marco de D-7 às 9h locais do dia 11, que é o próprio dia de hoje às 8h.
  assert.equal(approaching.fireAt.getHours(), 9);
  assert.equal(approaching.fireAt.getDate(), 11);
});

test('a 7 dias sem obrigatório pendente usa a mensagem leve do recomendado', () => {
  const reminders = getTripNotificationCandidates(
    trip(IN_7_DAYS),
    items(['required', true], ['recommended', false]),
    NOW,
  );

  const approaching = find(reminders, 'approaching');
  assert.ok(approaching);
  assert.equal(approaching.body, 'Você tem 1 item recomendado para dar uma olhada.');
});

test('a 7 dias com tudo verificado não gera lembrete de aproximação', () => {
  const reminders = getTripNotificationCandidates(trip(IN_7_DAYS), ALL_REQUIRED_DONE, NOW);

  assert.equal(find(reminders, 'approaching'), null);
  // A véspera continua de pé: ela não depende de pendência.
  assert.ok(find(reminders, 'eve'));
});

test('a véspera com pendências informa a quantidade de obrigatórios', () => {
  const reminders = getTripNotificationCandidates(trip(IN_1_DAY), PENDING_REQUIRED, NOW);
  const eve = find(reminders, 'eve');

  assert.ok(eve);
  assert.equal(eve.title, '✈️ Amanhã é o grande dia!');
  assert.equal(eve.body, 'Você ainda tem 2 itens obrigatórios para revisar.');
});

test('a véspera sem pendências convida à revisão, sem número', () => {
  const reminders = getTripNotificationCandidates(trip(IN_1_DAY), ALL_REQUIRED_DONE, NOW);
  const eve = find(reminders, 'eve');

  assert.ok(eve);
  assert.equal(eve.title, '✈️ Amanhã é o grande dia!');
  assert.equal(eve.body, 'Faça uma última revisão da sua checklist antes de viajar.');
});

test('um item pendente usa o singular', () => {
  const reminders = getTripNotificationCandidates(trip(IN_1_DAY), items(['required', false]), NOW);

  assert.equal(find(reminders, 'eve')?.body, 'Você ainda tem 1 item obrigatório para revisar.');
});

test('viagem concluída não gera notificação nenhuma', () => {
  const reminders = getTripNotificationCandidates(
    trip('2026-09-01', '2026-09-10'),
    PENDING_REQUIRED,
    NOW,
  );

  assert.deepEqual(reminders, []);
});

test('viagem em andamento não gera notificação nenhuma', () => {
  const reminders = getTripNotificationCandidates(
    trip('2026-10-05', '2026-10-20'),
    PENDING_REQUIRED,
    NOW,
  );

  assert.deepEqual(reminders, []);
});

test('viagem sem data não gera notificação nenhuma', () => {
  assert.deepEqual(getTripNotificationCandidates(trip(null), PENDING_REQUIRED, NOW), []);
});

test('informativo pendente não conta como pendência', () => {
  const reminders = getTripNotificationCandidates(
    trip(IN_7_DAYS),
    items(['required', true], ['informational', false], ['informational', false]),
    NOW,
  );

  assert.equal(find(reminders, 'approaching'), null);
  assert.equal(
    find(reminders, 'eve')?.body,
    'Faça uma última revisão da sua checklist antes de viajar.',
  );
});

test('marco cuja hora já passou não é agendado', () => {
  // Mesmo dia do marco de D-7, mas às 10h: as 9h ficaram para trás.
  const late = new Date(2026, 9, 11, 10, 0);
  const reminders = getTripNotificationCandidates(trip(IN_7_DAYS), PENDING_REQUIRED, late);

  assert.equal(find(reminders, 'approaching'), null);
  assert.ok(find(reminders, 'eve'));
});

test('viagem distante ainda agenda, porque o disparo é que fica longe', () => {
  const reminders = getTripNotificationCandidates(trip(IN_60_DAYS), PENDING_REQUIRED, NOW);

  assert.equal(reminders.length, 2);
  assert.equal(find(reminders, 'approaching')?.fireAt.getMonth(), 11);
});

test('a seleção respeita a janela e o teto de viagens', () => {
  const trips = [
    trip('2026-12-01', null, 'c'),
    trip('2026-10-20', null, 'a'),
    trip('2027-06-01', null, 'longe'),
    trip('2026-11-05', null, 'b'),
    trip(null, null, 'sem-data'),
    trip('2026-10-25', null, 'd'),
    trip('2026-11-20', null, 'e'),
    trip('2026-11-25', null, 'f'),
  ];

  const selected = selectTripsForReminders(trips, '2026-10-11');

  assert.deepEqual(
    selected.map((item) => item.id),
    ['a', 'd', 'b', 'e', 'f'],
  );
});

test('viagem já começada fica fora da seleção', () => {
  const selected = selectTripsForReminders(
    [trip('2026-10-11', null, 'hoje'), trip('2026-10-05', '2026-10-20', 'andando')],
    '2026-10-11',
  );

  assert.deepEqual(selected, []);
});

function scheduled(reminder: TripReminder, id = `os-${reminder.key}`): ScheduledReminder {
  return { id, key: reminder.key, tripId: reminder.tripId, signature: reminder.signature };
}

test('o desejado já agendado não cancela nem reagenda nada', () => {
  const desired = getTripNotificationCandidates(trip(IN_7_DAYS), PENDING_REQUIRED, NOW);
  const diff = diffReminders(
    desired.map((reminder) => scheduled(reminder)),
    desired,
  );

  assert.deepEqual(diff.toCancel, []);
  assert.deepEqual(diff.toSchedule, []);
});

test('lembrete de viagem ausente da lista é cancelado', () => {
  const removed = getTripNotificationCandidates(trip(IN_7_DAYS), PENDING_REQUIRED, NOW);
  const kept = getTripNotificationCandidates(
    trip(IN_7_DAYS, null, 'trip-2'),
    PENDING_REQUIRED,
    NOW,
  );

  const diff = diffReminders(
    [...removed, ...kept].map((reminder) => scheduled(reminder)),
    kept,
  );

  assert.deepEqual(diff.toCancel.sort(), ['os-trip-1:approaching', 'os-trip-1:eve']);
  assert.deepEqual(diff.toSchedule, []);
});

test('viagem excluída cancela tudo quando nada mais é desejado', () => {
  const existing = getTripNotificationCandidates(trip(IN_7_DAYS), PENDING_REQUIRED, NOW);
  const diff = diffReminders(
    existing.map((reminder) => scheduled(reminder)),
    [],
  );

  assert.equal(diff.toCancel.length, 2);
  assert.deepEqual(diff.toSchedule, []);
});

test('contagem alterada cancela e reagenda a mesma chave', () => {
  const before = getTripNotificationCandidates(trip(IN_7_DAYS), PENDING_REQUIRED, NOW);
  const after = getTripNotificationCandidates(
    trip(IN_7_DAYS),
    items(['required', false], ['required', true]),
    NOW,
  );

  const diff = diffReminders(
    before.map((reminder) => scheduled(reminder)),
    after,
  );

  assert.deepEqual(diff.toCancel.sort(), ['os-trip-1:approaching', 'os-trip-1:eve']);
  assert.deepEqual(diff.toSchedule.map((reminder) => reminder.key).sort(), [
    'trip-1:approaching',
    'trip-1:eve',
  ]);
});

test('obrigatórios concluídos depois do agendamento cancelam só o de pendência', () => {
  const before = getTripNotificationCandidates(trip(IN_7_DAYS), PENDING_REQUIRED, NOW);
  const after = getTripNotificationCandidates(trip(IN_7_DAYS), ALL_REQUIRED_DONE, NOW);

  const diff = diffReminders(
    before.map((reminder) => scheduled(reminder)),
    after,
  );

  assert.ok(diff.toCancel.includes('os-trip-1:approaching'));
  assert.deepEqual(
    diff.toSchedule.map((reminder) => reminder.key),
    ['trip-1:eve'],
  );
});

test('cópia duplicada do mesmo lembrete é cancelada', () => {
  const desired = getTripNotificationCandidates(trip(IN_1_DAY), ALL_REQUIRED_DONE, NOW);
  const [eve] = desired;

  const diff = diffReminders([scheduled(eve, 'os-1'), scheduled(eve, 'os-2')], desired);

  assert.deepEqual(diff.toCancel, ['os-2']);
  assert.deepEqual(diff.toSchedule, []);
});

test('notificação alheia não entra no diff e é preservada pelo escopo', () => {
  const desired = getTripNotificationCandidates(trip(IN_1_DAY), ALL_REQUIRED_DONE, NOW);
  const diff = diffReminders([], desired);

  assert.deepEqual(diff.toCancel, []);
  assert.equal(diff.toSchedule.length, 1);
});
