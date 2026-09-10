import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTripCountdown,
  buildTripDayCount,
  daysUntilStart,
  formatReturnCountdown,
  getTripStatus,
} from '../domain/trip-status.ts';

/**
 * Testes da contagem regressiva da Home.
 *
 * O módulo é puro e recebe a data de hoje por parâmetro, então cada estado é
 * verificável sem relógio, sem fuso e sem banco.
 */

const TODAY = '2026-10-11';

function trip(start: string | null, end: string | null = null) {
  return { start_date: start, end_date: end };
}

test('dias até a partida contam em dias de calendário', () => {
  assert.equal(daysUntilStart(trip('2026-11-15'), TODAY), 35);
  assert.equal(daysUntilStart(trip(TODAY), TODAY), 0);
  assert.equal(daysUntilStart(trip(null), TODAY), null);
});

test('viagem futura mostra o número de dias', () => {
  const countdown = buildTripCountdown(trip('2026-11-15', '2026-11-27'), TODAY);

  assert.equal(countdown.kind, 'days');
  assert.equal(countdown.days, 35);
  assert.equal(countdown.message, null);
});

test('véspera e dia da partida não têm número a contar', () => {
  const tomorrow = buildTripCountdown(trip('2026-10-12'), TODAY);
  assert.equal(tomorrow.kind, 'tomorrow');
  assert.equal(tomorrow.days, null);
  assert.ok(tomorrow.message);

  const today = buildTripCountdown(trip(TODAY, '2026-10-27'), TODAY);
  // Nunca "0 dias". No dia da partida quem decide a tela é o `kind`: a Home
  // põe o destino no lugar do número e não usa frase nenhuma daqui.
  assert.equal(today.kind, 'today');
  assert.equal(today.days, null);
});

test('viagem em andamento inverte a contagem e mostra o dia atual', () => {
  const range = trip('2026-10-01', '2026-10-27');

  assert.equal(getTripStatus(range, TODAY), 'ongoing');

  const countdown = buildTripCountdown(range, TODAY);
  assert.equal(countdown.kind, 'ongoing');
  // O número deixa de ser o que falta e passa a ser onde a pessoa está.
  assert.equal(countdown.days, 11);
  assert.equal(countdown.label, 'de 27 dias');
});

test('viagem em andamento sem término não tem dia de quantos contar', () => {
  const countdown = buildTripCountdown(trip('2026-10-01'), TODAY);

  assert.equal(countdown.kind, 'ongoing');
  assert.equal(countdown.days, null);
  assert.ok(countdown.message);
});

test('a viagem situa o dia atual e o retorno', () => {
  const middle = buildTripDayCount(trip('2026-10-01', '2026-10-27'), TODAY);
  assert.deepEqual(middle, { day: 11, total: 27, remaining: 16 });

  // Primeiro dia é 1, e o último não conta "0 dias" para voltar.
  const first = buildTripDayCount(trip(TODAY, '2026-10-27'), TODAY);
  assert.equal(first?.day, 1);

  const last = buildTripDayCount(trip('2026-10-01', TODAY), TODAY);
  assert.deepEqual(last, { day: 11, total: 11, remaining: 0 });

  // Fora de uma viagem em andamento não existe dia a situar.
  assert.equal(buildTripDayCount(trip('2026-11-15', '2026-11-27'), TODAY), null);
  assert.equal(buildTripDayCount(trip('2026-10-01'), TODAY), null);
});

test('o retorno é legenda, não contagem regressiva', () => {
  assert.equal(formatReturnCountdown({ day: 3, total: 7, remaining: 4 }), 'volta em 4 dias');
  assert.equal(formatReturnCountdown({ day: 6, total: 7, remaining: 1 }), 'volta amanhã');
  assert.equal(formatReturnCountdown({ day: 7, total: 7, remaining: 0 }), 'último dia');
});

test('viagem sem data convida a escolher as datas', () => {
  const countdown = buildTripCountdown(trip(null), TODAY);

  assert.equal(countdown.kind, 'undated');
  assert.equal(countdown.days, null);
  assert.ok(countdown.label);
});
