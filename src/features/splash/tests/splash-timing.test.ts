import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SPLASH_EXIT_SCALE,
  WAITING_NOTE_AFTER_HOLD_MS,
  canLeaveSplash,
  splashSchedule,
} from '../domain/splash-timing.ts';

/** A abertura é cobrada toda vez que o app abre: o orçamento é curto de propósito. */

test('a abertura inteira cabe em 1s', () => {
  const { holdAt, exitMs } = splashSchedule(false);

  assert.ok(holdAt + exitMs <= 1000, `abertura longa demais: ${holdAt + exitMs}ms`);
});

test('a marca fica em quadro tempo suficiente para ser lida', () => {
  assert.ok(splashSchedule(false).holdAt >= 300);
});

test('sem movimento a abertura é mais curta dos dois lados', () => {
  const cheia = splashSchedule(false);
  const reduzida = splashSchedule(true);

  assert.ok(reduzida.holdAt < cheia.holdAt);
  assert.ok(reduzida.exitMs < cheia.exitMs);
});

test('o crescimento da saída é um respiro, não um salto', () => {
  assert.ok(SPLASH_EXIT_SCALE > 1);
  assert.ok(SPLASH_EXIT_SCALE <= 1.15);
});

test('a mensagem de espera só aparece depois de a abertura ter falhado em entregar', () => {
  const { holdAt, exitMs } = splashSchedule(false);

  assert.ok(WAITING_NOTE_AFTER_HOLD_MS > exitMs, 'a mensagem apareceria numa abertura normal');
  assert.ok(holdAt + WAITING_NOTE_AFTER_HOLD_MS >= 2000);
});

test('a saída exige animação pronta e app pronto', () => {
  assert.equal(canLeaveSplash({ holdReached: true, isAppReady: true }), true);
  assert.equal(canLeaveSplash({ holdReached: true, isAppReady: false }), false);
  assert.equal(canLeaveSplash({ holdReached: false, isAppReady: true }), false);
  assert.equal(canLeaveSplash({ holdReached: false, isAppReady: false }), false);
});
