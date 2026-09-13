import assert from 'node:assert/strict';
import test from 'node:test';

import { CITY_SUGGESTIONS } from '../cities.ts';
import { getCountry, normalizeSearch } from '../countries.ts';

/**
 * `CITY_SUGGESTIONS` é um `Record` de texto solto — nada barra uma chave
 * digitada errada (`'AI'` virar `'A1'`), e o único sintoma seria o país certo
 * nunca ganhar sugestão nenhuma, sem erro visível em lugar algum. Com dezenas
 * de países no catálogo, vale garantir isso em teste.
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
