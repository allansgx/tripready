import assert from 'node:assert/strict';
import test from 'node:test';

import { pickTravelTips, travelTips } from '../data/travel-tips.ts';

/**
 * O carrossel da Home vazia mostra 5 das 15 dicas, sorteadas.
 *
 * O que não pode quebrar sem ninguém ver: a mesma dica aparecendo duas vezes no
 * carrossel, ou uma dica que não existe no catálogo.
 */

/** Gerador determinístico: os testes precisam de sorteio, não de surpresa. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

test('o catálogo tem 15 dicas, com ids únicos', () => {
  assert.equal(travelTips.length, 15);
  assert.equal(new Set(travelTips.map((tip) => tip.id)).size, 15);
});

test('nenhuma dica é longa o bastante para estourar o card', () => {
  for (const tip of travelTips) {
    assert.ok(tip.text.length <= 140, `${tip.id} tem ${tip.text.length} caracteres`);
  }
});

test('o sorteio devolve a quantidade pedida, sem repetir, ao longo de várias sementes', () => {
  for (let seed = 1; seed <= 200; seed += 1) {
    const picked = pickTravelTips(5, travelTips, seededRandom(seed));

    assert.equal(picked.length, 5);
    assert.equal(new Set(picked.map((tip) => tip.id)).size, 5);

    for (const tip of picked) {
      assert.ok(
        travelTips.some((candidate) => candidate.id === tip.id),
        `${tip.id} não está no catálogo`,
      );
    }
  }
});

test('pedir mais do que existe devolve o catálogo inteiro, sem buraco', () => {
  const picked = pickTravelTips(travelTips.length + 3, travelTips, seededRandom(7));

  assert.equal(picked.length, travelTips.length);
  assert.equal(new Set(picked.map((tip) => tip.id)).size, travelTips.length);
});

test('o catálogo não é alterado pelo sorteio', () => {
  const before = travelTips.map((tip) => tip.id);
  pickTravelTips(5, travelTips, seededRandom(3));

  assert.deepEqual(
    travelTips.map((tip) => tip.id),
    before,
  );
});
