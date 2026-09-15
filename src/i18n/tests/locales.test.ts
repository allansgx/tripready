import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_LOCALE,
  FALLBACK_UI_LOCALE,
  isLocale,
  LANGUAGE_NAMES,
  normalizeLocale,
  pickLocale,
  SUPPORTED_LOCALES,
} from '../locales.ts';

test('a região é descartada e o idioma mais próximo vence', () => {
  assert.equal(normalizeLocale('pt-BR'), 'pt-BR');
  assert.equal(normalizeLocale('pt-PT'), 'pt-BR');
  assert.equal(normalizeLocale('pt'), 'pt-BR');
  assert.equal(normalizeLocale('en-US'), 'en');
  assert.equal(normalizeLocale('en-GB'), 'en');
  assert.equal(normalizeLocale('es-419'), 'es');
  assert.equal(normalizeLocale('es-MX'), 'es');
  assert.equal(normalizeLocale('es-ES'), 'es');
});

test('caixa, espaço e separador não mudam o resultado', () => {
  assert.equal(normalizeLocale('PT-br'), 'pt-BR');
  assert.equal(normalizeLocale('  en-US  '), 'en');
  assert.equal(normalizeLocale('pt_BR'), 'pt-BR');
});

test('idioma que o app não fala não é normalizado à força', () => {
  assert.equal(normalizeLocale('fr-FR'), null);
  assert.equal(normalizeLocale('ja'), null);
  assert.equal(normalizeLocale(''), null);
  assert.equal(normalizeLocale('   '), null);
});

test('a lista de preferências é percorrida na ordem do sistema', () => {
  assert.equal(pickLocale(['de-DE', 'es-ES', 'en-US']), 'es');
  assert.equal(pickLocale(['pt-PT', 'en-US']), 'pt-BR');
  assert.equal(pickLocale(['en-GB', 'pt-BR']), 'en');
});

test('sem nenhum idioma suportado o app abre em inglês', () => {
  assert.equal(pickLocale(['fr-FR', 'ja-JP']), FALLBACK_UI_LOCALE);
  assert.equal(pickLocale([]), FALLBACK_UI_LOCALE);
  assert.equal(FALLBACK_UI_LOCALE, 'en');
});

/**
 * As duas constantes respondem perguntas diferentes, e unificá-las seria a
 * "simplificação" que reintroduz o defeito: aparelho em japonês abre em inglês,
 * mas uma chave que falta continua caindo no dicionário canônico.
 */
test('o fallback de string não é o mesmo que o idioma inicial', () => {
  assert.equal(DEFAULT_LOCALE, 'pt-BR');
  assert.notEqual(DEFAULT_LOCALE, FALLBACK_UI_LOCALE);
});

test('isLocale recusa o que não está na lista', () => {
  assert.equal(isLocale('pt-BR'), true);
  assert.equal(isLocale('pt-PT'), false);
  assert.equal(isLocale(''), false);
  assert.equal(isLocale(null), false);
  assert.equal(isLocale(42), false);
});

test('todo idioma suportado tem nome próprio para a lista do Perfil', () => {
  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(typeof LANGUAGE_NAMES[locale], 'string');
    assert.ok(LANGUAGE_NAMES[locale].length > 0);
  }
});
