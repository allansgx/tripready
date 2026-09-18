import assert from 'node:assert/strict';
import test from 'node:test';

import { SUPPORTED_LOCALES } from '../locales.ts';
import { pluralForm } from '../plural.ts';

test('só 1 é singular, nos três idiomas', () => {
  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(pluralForm(locale, 1), 'one');
    assert.equal(pluralForm(locale, 2), 'other');
    assert.equal(pluralForm(locale, 11), 'other');
    assert.equal(pluralForm(locale, 100), 'other');
  }
});

/**
 * O CLDR classificaria `0` como `one` em português, o que daria "0 dia". O app
 * usa `other` e deixa a redação melhor para a forma `zero` da chave.
 */
test('zero usa a forma plural, inclusive em pt-BR', () => {
  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(pluralForm(locale, 0), 'other');
  }
});
