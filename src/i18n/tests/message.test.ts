import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveMessage, type Messages } from '../message.ts';

const CANONICAL: Messages = {
  greeting: 'Olá',
  'only.here': 'Só existe em pt-BR',
  items: {
    zero: 'Nenhum item',
    one: '{count} item',
    other: '{count} itens',
  },
  progress: '{done} de {total} verificados',
};

const TRANSLATED: Messages = {
  greeting: 'Hello',
  items: {
    one: '{count} item',
    other: '{count} items',
  },
  progress: '{done} of {total} checked',
};

function resolve(key: string, params?: Record<string, string | number>) {
  return resolveMessage(key, 'en', TRANSLATED, CANONICAL, params);
}

test('a frase do idioma ativo vence', () => {
  assert.equal(resolve('greeting'), 'Hello');
});

test('chave ausente no idioma ativo cai no canônico', () => {
  assert.equal(resolve('only.here'), 'Só existe em pt-BR');
});

test('chave ausente nos dois devolve a própria chave, nunca undefined', () => {
  assert.equal(resolve('nao.existe'), 'nao.existe');
});

test('a contagem escolhe a forma', () => {
  assert.equal(resolve('items', { count: 1 }), '1 item');
  assert.equal(resolve('items', { count: 3 }), '3 items');
});

/** A forma `zero` do canônico não vaza para um idioma que não a declarou. */
test('sem forma zero no idioma ativo, zero usa o plural', () => {
  assert.equal(resolve('items', { count: 0 }), '0 items');
});

test('a forma zero é usada quando a chave a declara', () => {
  assert.equal(resolveMessage('items', 'pt-BR', CANONICAL, CANONICAL, { count: 0 }), 'Nenhum item');
  assert.equal(resolveMessage('items', 'pt-BR', CANONICAL, CANONICAL, { count: 1 }), '1 item');
});

test('sem count a frase cai na forma plural', () => {
  assert.equal(resolve('items'), '{count} items');
});

test('vários parâmetros são substituídos', () => {
  assert.equal(resolve('progress', { done: 2, total: 9 }), '2 of 9 checked');
});

test('parâmetro ausente deixa o marcador visível', () => {
  assert.equal(resolve('progress', { done: 2 }), '2 of {total} checked');
});

test('parâmetro a mais é ignorado sem quebrar', () => {
  assert.equal(resolve('greeting', { sobrando: 'x' }), 'Hello');
});
