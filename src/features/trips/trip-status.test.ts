import assert from 'node:assert/strict';
import test from 'node:test';

import { buildTripCountdown, daysUntilStart, getTripStatus } from './trip-status.ts';

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

test('véspera e dia da partida trocam o número por uma frase', () => {
  const tomorrow = buildTripCountdown(trip('2026-10-12'), TODAY);
  assert.equal(tomorrow.kind, 'tomorrow');
  assert.equal(tomorrow.days, null);

  const today = buildTripCountdown(trip(TODAY, '2026-10-27'), TODAY);
  assert.equal(today.kind, 'today');
  // Nunca "0 dias": no dia da partida a contagem vira "É hoje!".
  assert.equal(today.days, null);
  assert.match(today.message ?? '', /hoje/i);
});

test('viagem em andamento deixa de contar e deseja boa viagem', () => {
  const range = trip('2026-10-01', '2026-10-27');

  assert.equal(getTripStatus(range, TODAY), 'ongoing');

  const countdown = buildTripCountdown(range, TODAY);
  assert.equal(countdown.kind, 'ongoing');
  assert.equal(countdown.days, null);
});

test('viagem sem data convida a escolher as datas', () => {
  const countdown = buildTripCountdown(trip(null), TODAY);

  assert.equal(countdown.kind, 'undated');
  assert.equal(countdown.days, null);
  assert.ok(countdown.label);
});
