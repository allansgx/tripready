import assert from 'node:assert/strict';
import test from 'node:test';

import { computeTripProgress, formatProgressFraction } from '../domain/trip-progress.ts';

/** A fração do card precisa contar exatamente o que a porcentagem conta. */

test('a fração usa o mesmo recorte da porcentagem', () => {
  const progress = computeTripProgress([
    { priority: 'required', completed: true },
    { priority: 'required', completed: false },
    { priority: 'recommended', completed: false },
    // Informativo não entra nem no numerador nem no denominador.
    { priority: 'informational', completed: false },
  ]);

  assert.equal(formatProgressFraction(progress), '1/3 itens');
  assert.equal(progress.percent, 33);
});

test('um item só não vira plural', () => {
  const progress = computeTripProgress([{ priority: 'required', completed: false }]);

  assert.equal(formatProgressFraction(progress), '0/1 item');
});

test('checklist ainda vazia não mostra fração', () => {
  assert.equal(formatProgressFraction(computeTripProgress([])), 'Checklist em preparação');
});
