import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkPassword,
  getPasswordStrength,
  isPasswordValid,
  PASSWORD_RULES,
} from '../password.ts';

/**
 * A validação da tela precisa concordar com a do Supabase Auth: aceitar o que
 * ele aceita e recusar o que ele recusa. Os casos de símbolo são os que mais
 * importam, porque são onde as duas podem divergir sem ninguém perceber.
 */

test('senha vazia não cumpre nada', () => {
  assert.deepEqual(checkPassword(''), {
    length: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    symbol: false,
  });
  assert.equal(isPasswordValid(''), false);
});

test('cada requisito é avaliado sozinho', () => {
  assert.deepEqual(checkPassword('abcdefgh'), {
    length: true,
    uppercase: false,
    lowercase: true,
    digit: false,
    symbol: false,
  });

  assert.deepEqual(checkPassword('Abcdef1'), {
    length: false,
    uppercase: true,
    lowercase: true,
    digit: true,
    symbol: false,
  });
});

test('falta um requisito, senha inválida', () => {
  assert.equal(isPasswordValid('Abcdef1!'.slice(0, 7)), false, 'curta demais');
  assert.equal(isPasswordValid('abcdef1!x'), false, 'sem maiúscula');
  assert.equal(isPasswordValid('ABCDEF1!X'), false, 'sem minúscula');
  assert.equal(isPasswordValid('Abcdefg!x'), false, 'sem número');
  assert.equal(isPasswordValid('Abcdefg1x'), false, 'sem símbolo');
});

test('senha com todos os requisitos é válida', () => {
  assert.equal(isPasswordValid('Abcdef1!'), true);
  assert.equal(isPasswordValid('Viagem2026#'), true);
  assert.equal(isPasswordValid('P@ssw0rd'), true);
});

test('todo símbolo do GoTrue cumpre o requisito', () => {
  const symbols = [...`!@#$%^&*()_+-=[]{};'\\:"|<>?,./\`~`];

  assert.equal(symbols.length, 32);

  for (const symbol of symbols) {
    assert.equal(
      checkPassword(`Abcdefg1${symbol}`).symbol,
      true,
      `o símbolo ${symbol} deveria contar`,
    );
  }
});

test('caractere fora do conjunto do GoTrue não é símbolo', () => {
  // O servidor recusaria estas senhas; a tela precisa recusar antes.
  assert.equal(checkPassword('Abcdefg1£').symbol, false);
  assert.equal(checkPassword('Abcdefg1§').symbol, false);
  assert.equal(checkPassword('Abcdefg1€').symbol, false);
  assert.equal(checkPassword('Abcdefg1✈').symbol, false);
  assert.equal(checkPassword('Abcdefg1 ').symbol, false, 'espaço não é símbolo');
});

test('letra acentuada não vale como maiúscula nem minúscula', () => {
  assert.equal(checkPassword('ÁÉÍÓÚ123!').uppercase, false);
  assert.equal(checkPassword('áéíóú123!').lowercase, false);
});

test('a força depende só do comprimento', () => {
  assert.equal(getPasswordStrength(''), 'weak');
  assert.equal(getPasswordStrength('Abc1!'), 'weak');
  assert.equal(getPasswordStrength('Abcdef1'), 'weak', '7 caracteres');
  assert.equal(getPasswordStrength('Abcdef1!'), 'medium', '8 caracteres');
  assert.equal(getPasswordStrength('Abcdef1!abc'), 'medium', '11 caracteres');
  assert.equal(getPasswordStrength('Abcdef1!abcd'), 'strong', '12 caracteres');
  assert.equal(getPasswordStrength('a'.repeat(40)), 'strong');
});

test('força e validade são independentes', () => {
  // Doze caracteres sem número: forte no medidor, recusada no envio.
  const longWithoutDigit = 'Abcdefghij!x';

  assert.equal(longWithoutDigit.length, 12);
  assert.equal(getPasswordStrength(longWithoutDigit), 'strong');
  assert.equal(isPasswordValid(longWithoutDigit), false);
});

test('a lista exibida cobre exatamente os requisitos avaliados', () => {
  const listed = PASSWORD_RULES.map((rule) => rule.id).sort();
  const evaluated = Object.keys(checkPassword('qualquer')).sort();

  assert.deepEqual(listed, evaluated);
});
