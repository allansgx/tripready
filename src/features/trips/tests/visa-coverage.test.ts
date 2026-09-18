import assert from 'node:assert/strict';
import test from 'node:test';

import { destinationsWithoutVerifiedRule } from '../domain/visa-coverage.ts';

/**
 * O aviso da viagem só pode citar destino que realmente ficou sem regra: é o que
 * impede que a ausência de dado vire "não precisa de visto".
 */

test('destino com regra conferida não é citado', () => {
  const missing = destinationsWithoutVerifiedRule(
    ['PT', 'MA'],
    [
      { country_code: 'PT', visa_rule_id: 'rule-1' },
      { country_code: 'MA', visa_rule_id: null },
    ],
    'BR',
  );

  assert.deepEqual(missing, ['MA']);
});

test('o país do passaporte nunca entra, e viagem doméstica não avisa nada', () => {
  assert.deepEqual(destinationsWithoutVerifiedRule(['BR'], [], 'BR'), []);
  assert.deepEqual(destinationsWithoutVerifiedRule(['BR', 'AR'], [], 'BR'), ['AR']);
});

test('sem passaporte principal não há o que afirmar', () => {
  assert.deepEqual(destinationsWithoutVerifiedRule(['AR', 'CL'], [], null), []);
});

test('país repetido aparece uma vez só, e a comparação ignora a caixa', () => {
  const missing = destinationsWithoutVerifiedRule(
    ['ar', 'AR', 'cl'],
    [{ country_code: 'cl', visa_rule_id: 'rule-2' }],
    'br',
  );

  assert.deepEqual(missing, ['AR']);
});

test('item global não cobre país nenhum', () => {
  const missing = destinationsWithoutVerifiedRule(
    ['AR'],
    [{ country_code: null, visa_rule_id: 'rule-3' }],
    'BR',
  );

  assert.deepEqual(missing, ['AR']);
});
