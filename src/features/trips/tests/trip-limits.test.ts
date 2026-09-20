import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canAddCountry,
  checkTripLimits,
  hasReachedTripLimit,
  MAX_TRIP_COUNTRIES,
  MAX_TRIP_DURATION_DAYS,
  MAX_TRIPS_PER_USER,
} from '../domain/trip-limits.ts';

/** Códigos de dois caracteres, quantos o teste pedir. */
function countries(count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    String.fromCharCode(65 + Math.floor(index / 26), 65 + (index % 26)),
  );
}

/** Data `count` dias depois de 1º de janeiro de 2026, contando o próprio dia 1. */
function endAfter(days: number): string {
  const date = new Date(Date.UTC(2026, 0, 1));
  date.setUTCDate(date.getUTCDate() + days - 1);
  return date.toISOString().slice(0, 10);
}

const START = '2026-01-01';

test('um país cabe na viagem', () => {
  assert.equal(
    checkTripLimits({ countryCodes: ['BR'], startDate: null, endDate: null }).isValid,
    true,
  );
});

test('o teto de países é permitido', () => {
  const result = checkTripLimits({
    countryCodes: countries(MAX_TRIP_COUNTRIES),
    startDate: null,
    endDate: null,
  });

  assert.equal(result.isValid, true);
  assert.equal(result.issue, null);
});

test('um país acima do teto não passa', () => {
  const result = checkTripLimits({
    countryCodes: countries(MAX_TRIP_COUNTRIES + 1),
    startDate: null,
    endDate: null,
  });

  assert.equal(result.isValid, false);
  assert.equal(result.issue, 'countries');
});

test('uma viagem curta passa', () => {
  const result = checkTripLimits({
    countryCodes: ['BR'],
    startDate: START,
    endDate: endAfter(10),
  });

  assert.equal(result.isValid, true);
});

test('a duração máxima exata é permitida', () => {
  const result = checkTripLimits({
    countryCodes: ['BR'],
    startDate: START,
    endDate: endAfter(MAX_TRIP_DURATION_DAYS),
  });

  assert.equal(result.isValid, true);
  assert.equal(result.issue, null);
});

test('um dia acima da duração máxima não passa', () => {
  const result = checkTripLimits({
    countryCodes: ['BR'],
    startDate: START,
    endDate: endAfter(MAX_TRIP_DURATION_DAYS + 1),
  });

  assert.equal(result.isValid, false);
  assert.equal(result.issue, 'duration');
});

test('volta antes da ida não passa', () => {
  const result = checkTripLimits({
    countryCodes: ['BR'],
    startDate: '2026-06-10',
    endDate: '2026-06-01',
  });

  assert.equal(result.isValid, false);
  assert.equal(result.issue, 'range');
});

test('viagem sem datas continua válida', () => {
  assert.equal(
    checkTripLimits({ countryCodes: ['BR'], startDate: null, endDate: null }).isValid,
    true,
  );
  assert.equal(
    checkTripLimits({ countryCodes: ['BR'], startDate: START, endDate: null }).isValid,
    true,
  );
});

test('duas viagens com períodos sobrepostos são as duas válidas', () => {
  const a = checkTripLimits({
    countryCodes: ['PT'],
    startDate: '2026-09-10',
    endDate: '2026-09-20',
  });
  const b = checkTripLimits({
    countryCodes: ['ES'],
    startDate: '2026-09-15',
    endDate: '2026-09-25',
  });

  assert.equal(a.isValid, true);
  assert.equal(b.isValid, true);
});

test('uma viagem nova durante outra em andamento é válida', () => {
  // A regra olha uma viagem por vez: não existe entrada para as demais.
  const result = checkTripLimits({
    countryCodes: ['IT'],
    startDate: '2026-09-12',
    endDate: '2026-09-18',
  });

  assert.equal(result.isValid, true);
});

test('o país já escolhido pode sair mesmo no teto', () => {
  const chosen = countries(MAX_TRIP_COUNTRIES);

  assert.equal(canAddCountry(chosen, chosen[0]), true);
  assert.equal(canAddCountry(chosen, 'ZZ'), false);
  assert.equal(canAddCountry(chosen.slice(0, -1), 'ZZ'), true);
});

test('os limites são os do produto', () => {
  assert.equal(MAX_TRIP_COUNTRIES, 20);
  assert.equal(MAX_TRIP_DURATION_DAYS, 180);
  assert.equal(MAX_TRIPS_PER_USER, 10);
});

test('a conta abaixo do teto cria outra viagem', () => {
  assert.equal(hasReachedTripLimit(0), false);
  assert.equal(hasReachedTripLimit(MAX_TRIPS_PER_USER - 1), false);
});

test('a conta no teto não cria outra viagem', () => {
  assert.equal(hasReachedTripLimit(MAX_TRIPS_PER_USER), true);
  assert.equal(hasReachedTripLimit(MAX_TRIPS_PER_USER + 1), true);
});

test('contagem desconhecida não barra a criação', () => {
  // Quem recusa nesse caso é a policy; a lista ainda carregando não decide.
  assert.equal(hasReachedTripLimit(null), false);
});
