import assert from 'node:assert/strict';
import test from 'node:test';

import { monthNames, weekdayInitials } from '../format.ts';
import { SUPPORTED_LOCALES } from '../locales.ts';

test('cada idioma tem os 12 meses, na mesma posição', () => {
  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(monthNames(locale).length, 12);
  }
  assert.equal(monthNames('pt-BR')[0], 'janeiro');
  assert.equal(monthNames('en')[0], 'January');
  assert.equal(monthNames('es')[0], 'enero');
  assert.equal(monthNames('pt-BR')[11], 'dezembro');
  assert.equal(monthNames('en')[11], 'December');
  assert.equal(monthNames('es')[11], 'diciembre');
});

test('cada idioma tem 7 iniciais de dia, começando no domingo', () => {
  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(weekdayInitials(locale).length, 7);
  }
  assert.equal(weekdayInitials('pt-BR')[0], 'D');
  assert.equal(weekdayInitials('en')[0], 'S');
  assert.equal(weekdayInitials('es')[0], 'D');
});
