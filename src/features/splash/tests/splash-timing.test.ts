import assert from 'node:assert/strict';
import test from 'node:test';

import { BASE_DECK_HEIGHT, BASE_DECK_ID, CLOUD_DECKS } from '../domain/cloud-decks.ts';
import {
  SPLASH_BEATS,
  SPLASH_EXIT_MS,
  STATUS_BAR_FLIP_AT,
  canLeaveSplash,
  splashSchedule,
} from '../domain/splash-timing.ts';

/** A abertura é cobrada toda vez que o app abre: o orçamento é curto de propósito. */

test('a abertura inteira cabe em 1,5s', () => {
  const total = splashSchedule(false).holdAt + SPLASH_EXIT_MS;

  assert.ok(total <= 1500, `abertura longa demais: ${total}ms`);
  assert.ok(total >= 1000, `abertura curta demais para o voo caber: ${total}ms`);
});

test('a entrega ao app acontece depois de o avião sair da tela', () => {
  const { takeoff } = SPLASH_BEATS;
  assert.ok(splashSchedule(false).holdAt >= takeoff.at + takeoff.duration);
});

test('sem movimento a abertura é mais curta', () => {
  assert.ok(splashSchedule(true).holdAt < splashSchedule(false).holdAt);
});

test('o céu termina de mudar de altitude antes da entrega', () => {
  const { climb } = SPLASH_BEATS;
  assert.ok(climb.at + climb.duration <= splashSchedule(false).holdAt);
});

test('a barra de status troca antes de o roxo chegar ao topo', () => {
  const { climb } = SPLASH_BEATS;
  assert.ok(STATUS_BAR_FLIP_AT > climb.at);
  assert.ok(STATUS_BAR_FLIP_AT < climb.at + climb.duration);
});

test('nenhuma camada de nuvem continua entrando depois da entrega', () => {
  const { holdAt } = splashSchedule(false);

  for (const deck of CLOUD_DECKS) {
    assert.ok(deck.at + deck.duration <= holdAt, `camada "${deck.id}" termina tarde demais`);
  }
});

test('as camadas de cima entram depois da de baixo, descendo e menores', () => {
  const base = CLOUD_DECKS.find((deck) => deck.id === BASE_DECK_ID);
  assert.ok(base, 'o banco de base sumiu da lista');
  assert.ok(base.from > 0, 'o banco de base sobe para o lugar');

  for (const deck of CLOUD_DECKS.filter((item) => item.id !== BASE_DECK_ID)) {
    assert.ok(deck.at > base.at, `camada "${deck.id}" não espera a de baixo`);
    assert.ok(deck.from < 0, `camada "${deck.id}" deveria descer`);
    assert.ok(deck.scale < 1, `camada "${deck.id}" deveria ser menor que a de base`);
    // Mais alta na tela é o que faz a camada parecer mais distante.
    assert.ok(deck.top < base.top, `camada "${deck.id}" deveria ficar mais alta`);
  }
});

test('o banco de base fica exatamente onde sempre esteve', () => {
  const base = CLOUD_DECKS.find((deck) => deck.id === BASE_DECK_ID);
  assert.ok(base);
  // Topo + altura do desenho = o rodapé da tela, sem folga nem sobra.
  assert.equal(Number((base.top + BASE_DECK_HEIGHT).toFixed(4)), 1);
  assert.equal(base.scale, 1);
});

test('as camadas estão ordenadas da mais distante para a mais próxima', () => {
  // A ordem da lista é a de desenho: a mais próxima cobre as de trás.
  const scales = CLOUD_DECKS.map((deck) => deck.scale);
  assert.deepEqual(
    scales,
    [...scales].sort((a, b) => a - b),
  );
});

test('a saída exige animação pronta e app pronto', () => {
  assert.equal(canLeaveSplash({ holdReached: true, isAppReady: true }), true);
  assert.equal(canLeaveSplash({ holdReached: true, isAppReady: false }), false);
  assert.equal(canLeaveSplash({ holdReached: false, isAppReady: true }), false);
  assert.equal(canLeaveSplash({ holdReached: false, isAppReady: false }), false);
});
