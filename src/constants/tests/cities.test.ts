import assert from 'node:assert/strict';
import test from 'node:test';

import { CITY_NAME_OVERRIDES as OVERRIDES_EN } from '../../i18n/cities/en.ts';
import { CITY_NAME_OVERRIDES as OVERRIDES_ES } from '../../i18n/cities/es.ts';
import { CITY_SUGGESTIONS, getCitySuggestions } from '../cities.ts';
import { getCountry, normalizeSearch } from '../countries.ts';

/**
 * `CITY_SUGGESTIONS` é um `Record` de texto solto: uma chave digitada errada
 * não dá erro, só deixa o país sem sugestão nenhuma.
 */

test('toda chave de CITY_SUGGESTIONS é um código de país conhecido', () => {
  for (const code of Object.keys(CITY_SUGGESTIONS)) {
    assert.notEqual(getCountry(code), null, `código desconhecido: ${code}`);
  }
});

test('nenhuma lista de cidades repete o mesmo nome ignorando acento e caixa', () => {
  for (const [code, cities] of Object.entries(CITY_SUGGESTIONS)) {
    const seen = new Set<string>();
    for (const city of cities) {
      const key = normalizeSearch(city);
      assert.equal(seen.has(key), false, `cidade repetida em ${code}: ${city}`);
      seen.add(key);
    }
  }
});

test('nenhuma lista de cidades está vazia', () => {
  for (const [code, cities] of Object.entries(CITY_SUGGESTIONS)) {
    assert.ok(cities.length > 0, `lista vazia em ${code}`);
  }
});

test('toda chave de override é um nome que existe de fato em CITY_SUGGESTIONS', () => {
  const known = new Set(Object.values(CITY_SUGGESTIONS).flat());

  for (const [overrides, locale] of [
    [OVERRIDES_EN, 'en'],
    [OVERRIDES_ES, 'es'],
  ] as const) {
    for (const name of Object.keys(overrides)) {
      assert.ok(known.has(name), `${locale}: "${name}" não está em nenhuma lista pt-BR`);
    }
  }
});

test('nenhum override repete o nome-base — seria um no-op esquecido', () => {
  for (const overrides of [OVERRIDES_EN, OVERRIDES_ES]) {
    for (const [name, override] of Object.entries(overrides)) {
      assert.notEqual(override, name, `"${name}" está sobrescrito por ele mesmo`);
    }
  }
});

test('override aplicado: a sugestão sai traduzida no idioma pedido', () => {
  assert.deepEqual(getCitySuggestions('DE', 'pt-BR').slice(0, 2), ['Berlim', 'Munique']);
  assert.deepEqual(getCitySuggestions('DE', 'en').slice(0, 2), ['Berlin', 'Munich']);
  assert.deepEqual(getCitySuggestions('DE', 'es').slice(0, 2), ['Berlín', 'Múnich']);
});

test('cidade sem override cai na base, preservando a ordem', () => {
  assert.deepEqual(getCitySuggestions('AE', 'pt-BR'), getCitySuggestions('AE', 'en'));
  assert.deepEqual(getCitySuggestions('AE', 'pt-BR'), getCitySuggestions('AE', 'es'));
});

test('país fora do catálogo devolve lista vazia, em qualquer idioma', () => {
  assert.deepEqual(getCitySuggestions('XX', 'en'), []);
});
