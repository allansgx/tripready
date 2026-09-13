import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeEmail, validateEmail } from '../email.ts';

const EMPTY = 'Digite seu e-mail.';
const INVALID = 'Digite um e-mail válido.';

test('campo vazio pede o e-mail', () => {
  assert.equal(validateEmail(''), EMPTY);
  assert.equal(validateEmail('   '), EMPTY);
  assert.equal(validateEmail('\n\t'), EMPTY);
});

test('endereço incompleto é recusado', () => {
  assert.equal(validateEmail('voce'), INVALID);
  assert.equal(validateEmail('voce@'), INVALID);
  assert.equal(validateEmail('@email.com'), INVALID);
  assert.equal(validateEmail('voce@email'), INVALID);
  assert.equal(validateEmail('voce@email.c'), INVALID);
});

test('espaço no meio e arroba repetida são recusados', () => {
  assert.equal(validateEmail('vo ce@email.com'), INVALID);
  assert.equal(validateEmail('voce@em ail.com'), INVALID);
  assert.equal(validateEmail('voce@@email.com'), INVALID);
  assert.equal(validateEmail('voce@email.com extra'), INVALID);
});

test('endereço comum é aceito', () => {
  assert.equal(validateEmail('voce@email.com'), null);
  assert.equal(validateEmail('nome.sobrenome@empresa.com.br'), null);
  assert.equal(validateEmail('nome+viagem@email.com'), null);
  assert.equal(validateEmail('n@e.co'), null);
});

test('espaço nas pontas não invalida', () => {
  assert.equal(validateEmail('  voce@email.com  '), null);
  assert.equal(validateEmail('\nvoce@email.com\t'), null);
});

test('erro de digitação em provedor conhecido é recusado com a correção', () => {
  assert.equal(validateEmail('allan@gmai.com'), 'Você quis dizer @gmail.com?');
  assert.equal(validateEmail('allan@gmial.com'), 'Você quis dizer @gmail.com?');
  assert.equal(validateEmail('allan@gmail.con'), 'Você quis dizer @gmail.com?');
  assert.equal(validateEmail('allan@hotmial.com'), 'Você quis dizer @hotmail.com?');
  assert.equal(validateEmail('allan@outlok.com'), 'Você quis dizer @outlook.com?');
  assert.equal(validateEmail('allan@yaho.com'), 'Você quis dizer @yahoo.com?');
  assert.equal(validateEmail('allan@iclod.com'), 'Você quis dizer @icloud.com?');
});

test('a correção não depende da caixa nem de espaço', () => {
  assert.equal(validateEmail('  Allan@GMAI.com '), 'Você quis dizer @gmail.com?');
});

test('o provedor escrito certo passa', () => {
  assert.equal(validateEmail('allan@gmail.com'), null);
  assert.equal(validateEmail('allan@hotmail.com'), null);
  assert.equal(validateEmail('allan@outlook.com'), null);
  assert.equal(validateEmail('allan@yahoo.com.br'), null);
  assert.equal(validateEmail('allan@icloud.com'), null);
});

test('domínio legítimo parecido com provedor não é recusado', () => {
  // Comparar por semelhança quebraria estes; a lista fechada não.
  assert.equal(validateEmail('allan@mail.com'), null);
  assert.equal(validateEmail('allan@gmail.com.br'), null);
  assert.equal(validateEmail('allan@hotmail.co.uk'), null);
  assert.equal(validateEmail('allan@outlook.com.br'), null);
});

test('caixa não invalida', () => {
  assert.equal(validateEmail('Voce@Email.com'), null);
  assert.equal(validateEmail('VOCE@EMAIL.COM'), null);
});

test('a forma canônica tira espaço e baixa a caixa', () => {
  assert.equal(normalizeEmail('  Voce@Email.com  '), 'voce@email.com');
  assert.equal(normalizeEmail('VOCE@EMAIL.COM'), 'voce@email.com');
  assert.equal(normalizeEmail('voce@email.com'), 'voce@email.com');
  assert.equal(normalizeEmail('   '), '');
});
