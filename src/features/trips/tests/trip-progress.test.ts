import assert from 'node:assert/strict';
import test from 'node:test';

import { computeTripProgress } from '../domain/trip-progress.ts';

/** A fração do card precisa contar exatamente o que a porcentagem conta. */

test('itens informativos ficam fora da fração', () => {
  const progress = computeTripProgress([
    { priority: 'required', completed: true },
    { priority: 'required', completed: false },
    { priority: 'recommended', completed: false },
    // Informativo não entra nem no numerador nem no denominador.
    { priority: 'informational', completed: false },
  ]);

  assert.equal(progress.total, 3);
  assert.equal(progress.done, 1);
  assert.equal(progress.percent, 33);
  assert.equal(progress.informationalTotal, 1);
});

test('um item só continua contável normalmente', () => {
  const progress = computeTripProgress([{ priority: 'required', completed: false }]);

  assert.equal(progress.total, 1);
  assert.equal(progress.done, 0);
});

test('checklist vazia zera tudo', () => {
  const progress = computeTripProgress([]);

  assert.equal(progress.total, 0);
  assert.equal(progress.done, 0);
  assert.equal(progress.percent, 0);
  assert.equal(progress.isReady, false);
});

test('pronta só quando existe obrigatório e todos estão verificados', () => {
  assert.equal(
    computeTripProgress([{ priority: 'recommended', completed: true }]).isReady,
    false,
    'sem obrigatório não há o que declarar pronto',
  );

  assert.equal(
    computeTripProgress([
      { priority: 'required', completed: true },
      { priority: 'required', completed: false },
    ]).isReady,
    false,
  );

  assert.equal(
    computeTripProgress([
      { priority: 'required', completed: true },
      { priority: 'required', completed: true },
    ]).isReady,
    true,
  );
});

test('pendentes obrigatórios são a diferença entre total e feitos', () => {
  const progress = computeTripProgress([
    { priority: 'required', completed: true },
    { priority: 'required', completed: false },
    { priority: 'required', completed: false },
  ]);

  assert.equal(progress.requiredTotal, 3);
  assert.equal(progress.requiredDone, 1);
  assert.equal(progress.requiredPending, 2);
});
