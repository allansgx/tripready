import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTripCountdown,
  buildTripDayCount,
  buildTripMoment,
  countTripDays,
  daysUntilStart,
  describeReturnCountdown,
  getTripStatus,
} from '../domain/trip-status.ts';

/** A data de hoje entra por parâmetro, então cada estado é verificável sem relógio. */

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
});

test('véspera e dia da partida não têm número a contar', () => {
  const tomorrow = buildTripCountdown(trip('2026-10-12'), TODAY);
  assert.equal(tomorrow.kind, 'tomorrow');
  assert.equal(tomorrow.days, null);

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
  assert.equal(countdown.totalDays, 27);
});

test('viagem em andamento sem término não tem dia de quantos contar', () => {
  const countdown = buildTripCountdown(trip('2026-10-01'), TODAY);

  assert.equal(countdown.kind, 'ongoing');
  assert.equal(countdown.days, null);
  assert.equal(countdown.totalDays, undefined);
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

test('o retorno é descrito por kind, não por contagem regressiva', () => {
  assert.deepEqual(describeReturnCountdown({ day: 3, total: 7, remaining: 4 }), {
    kind: 'daysLeft',
    days: 4,
  });
  assert.deepEqual(describeReturnCountdown({ day: 6, total: 7, remaining: 1 }), {
    kind: 'tomorrow',
  });
  assert.deepEqual(describeReturnCountdown({ day: 7, total: 7, remaining: 0 }), {
    kind: 'lastDay',
  });
});

test('viagem sem data convida a escolher as datas', () => {
  const countdown = buildTripCountdown(trip(null), TODAY);

  assert.equal(countdown.kind, 'undated');
  assert.equal(countdown.days, null);
});

/** O tom importa tanto quanto o `kind`: é ele que decide a cor do card. */

test('viagem concluída e viagem em andamento se apresentam pelo estado', () => {
  assert.deepEqual(buildTripMoment(trip('2026-09-01', '2026-09-10'), TODAY), {
    tone: 'completed',
    kind: 'completed',
  });

  assert.deepEqual(buildTripMoment(trip('2026-10-01', '2026-10-27'), TODAY), {
    tone: 'ongoing',
    kind: 'ongoing',
  });
});

test('véspera e dia do embarque compartilham o tom de urgência', () => {
  // Para `getTripStatus` a viagem que parte hoje já começou; quem embarca
  // precisa ler o embarque, e não "em andamento".
  assert.deepEqual(buildTripMoment(trip(TODAY, '2026-10-20'), TODAY), {
    tone: 'imminent',
    kind: 'boardingToday',
  });

  assert.deepEqual(buildTripMoment(trip('2026-10-12'), TODAY), {
    tone: 'imminent',
    kind: 'tomorrow',
  });
});

test('a espera se conta em dias até a janela e em meses depois dela', () => {
  assert.deepEqual(buildTripMoment(trip('2026-10-24'), TODAY), {
    tone: 'upcoming',
    kind: 'daysUntil',
    days: 13,
  });

  // 45 dias ainda é uma contagem útil; 46 vira "2 meses" para o card não
  // exibir números que ninguém consegue dimensionar.
  assert.deepEqual(buildTripMoment(trip('2026-11-25'), TODAY), {
    tone: 'upcoming',
    kind: 'daysUntil',
    days: 45,
  });
  assert.deepEqual(buildTripMoment(trip('2026-11-26'), TODAY), {
    tone: 'upcoming',
    kind: 'monthsUntil',
    months: 2,
  });
  assert.equal(buildTripMoment(trip('2027-02-11'), TODAY).months, 4);
});

test('viagem sem data mostra o próximo passo no lugar da contagem', () => {
  assert.deepEqual(buildTripMoment(trip(null), TODAY), {
    tone: 'upcoming',
    kind: 'undated',
  });
});

test('a duração conta o primeiro e o último dia', () => {
  assert.equal(countTripDays('2026-10-12', '2026-10-24'), 13);
  assert.equal(countTripDays('2026-10-12', '2026-10-12'), 1);
  assert.equal(countTripDays('2026-12-28', '2027-01-03'), 7);
});

test('sem as duas datas, ou com o intervalo invertido, não há duração', () => {
  assert.equal(countTripDays('2026-10-12', null), null);
  assert.equal(countTripDays(null, '2026-10-24'), null);
  assert.equal(countTripDays('2026-10-24', '2026-10-12'), null);
});
