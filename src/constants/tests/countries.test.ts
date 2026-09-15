import assert from 'node:assert/strict';
import test from 'node:test';

import { SUPPORTED_LOCALES } from '../../i18n/locales.ts';
import { getCountries, getCountry, getCountryName, searchCountries } from '../countries.ts';

test('os 3 idiomas têm o mesmo conjunto de 251 códigos', () => {
  const [first, ...rest] = SUPPORTED_LOCALES.map(
    (locale) => new Set(getCountries(locale).map((country) => country.code)),
  );

  assert.equal(first.size, 251);
  for (const codes of rest) {
    assert.deepEqual([...codes].sort(), [...first].sort());
  }
});

test('o nome do país muda com o idioma informado', () => {
  assert.equal(getCountryName('DE', 'pt-BR'), 'Alemanha');
  assert.equal(getCountryName('DE', 'en'), 'Germany');
  assert.equal(getCountryName('DE', 'es'), 'Alemania');
});

test('código desconhecido cai no próprio código, em qualquer idioma', () => {
  assert.equal(getCountryName('XX', 'pt-BR'), 'XX');
  assert.equal(getCountry('XX', 'en'), null);
});

test('getCountries devolve a lista ordenada pelo nome no idioma pedido', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const names = getCountries(locale).map((country) => country.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, locale));
    assert.deepEqual(names, sorted);
  }
});

test('a busca por nome casa no idioma pedido, sem acento nem caixa', () => {
  assert.ok(searchCountries('alema', 'pt-BR').some((country) => country.code === 'DE'));
  assert.ok(searchCountries('german', 'en').some((country) => country.code === 'DE'));
  assert.ok(searchCountries('aleman', 'es').some((country) => country.code === 'DE'));
});

test('a busca por código funciona em qualquer idioma', () => {
  for (const locale of SUPPORTED_LOCALES) {
    assert.ok(searchCountries('br', locale).some((country) => country.code === 'BR'));
  }
});
