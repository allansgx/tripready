import assert from 'node:assert/strict';
import test from 'node:test';

import { cooldownSecondsForAttempt } from '../resend-cooldown.ts';

test('a espera dobra a cada tentativa, até o teto', () => {
  assert.equal(cooldownSecondsForAttempt(0), 60);
  assert.equal(cooldownSecondsForAttempt(1), 120);
  assert.equal(cooldownSecondsForAttempt(2), 240);
  assert.equal(cooldownSecondsForAttempt(3), 300, 'teto de 5 minutos');
  assert.equal(cooldownSecondsForAttempt(10), 300, 'continua no teto');
});
