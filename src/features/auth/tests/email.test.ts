import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeEmail, validateEmail } from '../email.ts';

test('campo vazio pede o e-mail', () => {
  assert.deepEqual(validateEmail(''), { kind: 'empty' });
  assert.deepEqual(validateEmail('   '), { kind: 'empty' });
  assert.deepEqual(validateEmail('\n\t'), { kind: 'empty' });
});

test('endereço incompleto é recusado', () => {
  assert.deepEqual(validateEmail('voce'), { kind: 'invalid' });
  assert.deepEqual(validateEmail('voce@'), { kind: 'invalid' });
  assert.deepEqual(validateEmail('@email.com'), { kind: 'invalid' });
  assert.deepEqual(validateEmail('voce@email'), { kind: 'invalid' });
  assert.deepEqual(validateEmail('voce@email.c'), { kind: 'invalid' });
});

test('espaço no meio e arroba repetida são recusados', () => {
  assert.deepEqual(validateEmail('vo ce@email.com'), { kind: 'invalid' });
  assert.deepEqual(validateEmail('voce@em ail.com'), { kind: 'invalid' });
  assert.deepEqual(validateEmail('voce@@email.com'), { kind: 'invalid' });
  assert.deepEqual(validateEmail('voce@email.com extra'), { kind: 'invalid' });
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
  assert.deepEqual(validateEmail('allan@gmai.com'), { kind: 'typo', suggestion: 'gmail.com' });
  assert.deepEqual(validateEmail('allan@gmial.com'), { kind: 'typo', suggestion: 'gmail.com' });
  assert.deepEqual(validateEmail('allan@gmail.con'), { kind: 'typo', suggestion: 'gmail.com' });
  assert.deepEqual(validateEmail('allan@hotmial.com'), { kind: 'typo', suggestion: 'hotmail.com' });
  assert.deepEqual(validateEmail('allan@outlok.com'), { kind: 'typo', suggestion: 'outlook.com' });
  assert.deepEqual(validateEmail('allan@yaho.com'), { kind: 'typo', suggestion: 'yahoo.com' });
  assert.deepEqual(validateEmail('allan@iclod.com'), { kind: 'typo', suggestion: 'icloud.com' });
});

test('a correção não depende da caixa nem de espaço', () => {
  assert.deepEqual(validateEmail('  Allan@GMAI.com '), { kind: 'typo', suggestion: 'gmail.com' });
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
