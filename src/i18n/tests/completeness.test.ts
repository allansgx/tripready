import assert from 'node:assert/strict';
import test from 'node:test';

import type { Locale } from '../locales.ts';
import type { Message, Messages } from '../message.ts';
import { messages as en } from '../messages/en.ts';
import { messages as es } from '../messages/es.ts';
import { messages as ptBR } from '../messages/pt-BR.ts';

/**
 * O tipo `MessageKey` já impede uma chave de faltar em `en` ou `es`. O que o
 * compilador não vê é o que este arquivo cobre: forma de plural declarada em um
 * idioma e não no outro, e marcador de interpolação que sumiu na tradução.
 */
const CANONICAL: Messages = ptBR;
const TRANSLATIONS: [Locale, Messages][] = [
  ['en', en],
  ['es', es],
];

function forms(message: Message): string[] {
  return typeof message === 'string' ? [] : Object.keys(message).sort();
}

function placeholders(message: Message): string[] {
  const texts =
    typeof message === 'string'
      ? [message]
      : Object.values(message).filter((text): text is string => typeof text === 'string');

  const found = new Set<string>();
  for (const text of texts) {
    for (const match of text.matchAll(/\{(\w+)\}/g)) found.add(match[1]);
  }

  return [...found].sort();
}

test('os três idiomas têm exatamente as mesmas chaves', () => {
  const expected = Object.keys(CANONICAL).sort();

  for (const [locale, messages] of TRANSLATIONS) {
    assert.deepEqual(Object.keys(messages).sort(), expected, `chaves divergentes em ${locale}`);
  }
});

test('uma chave com plural declara as mesmas formas em todo idioma', () => {
  for (const [key, message] of Object.entries(CANONICAL)) {
    for (const [locale, messages] of TRANSLATIONS) {
      assert.deepEqual(
        forms(messages[key]),
        forms(message),
        `formas de plural divergentes em ${locale} na chave ${key}`,
      );
    }
  }
});

test('nenhum marcador de interpolação se perde na tradução', () => {
  for (const [key, message] of Object.entries(CANONICAL)) {
    for (const [locale, messages] of TRANSLATIONS) {
      assert.deepEqual(
        placeholders(messages[key]),
        placeholders(message),
        `marcadores divergentes em ${locale} na chave ${key}`,
      );
    }
  }
});

test('nenhuma frase fica vazia', () => {
  for (const [locale, messages] of [['pt-BR', CANONICAL], ...TRANSLATIONS] as [
    Locale,
    Messages,
  ][]) {
    for (const [key, message] of Object.entries(messages)) {
      const texts = typeof message === 'string' ? [message] : Object.values(message);
      for (const text of texts) {
        assert.ok(
          typeof text === 'string' && text.trim().length > 0,
          `frase vazia em ${locale} na chave ${key}`,
        );
      }
    }
  }
});
