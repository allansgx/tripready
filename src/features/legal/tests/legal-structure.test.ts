import assert from 'node:assert/strict';
import test from 'node:test';

import type { LegalDocument } from '../data/types.ts';
import * as en from '../data/en.ts';
import * as es from '../data/es.ts';
import * as ptBR from '../data/pt-BR.ts';

/**
 * Não garante que a tradução esteja certa — isso é revisão humana. Garante
 * que nenhuma seção, item de lista ou bloco tenha ficado para trás na
 * tradução: mesma sequência de `kind` e mesmo tamanho de cada lista nos três
 * idiomas (§15.2 do plano de i18n).
 */

function shape(document: LegalDocument) {
  return document.blocks.map((block) =>
    block.kind === 'list' ? `list(${block.items.length})` : block.kind,
  );
}

const DOCUMENTS: [string, LegalDocument][] = [
  ['privacyPolicy', ptBR.privacyPolicy],
  ['termsOfUse', ptBR.termsOfUse],
];

test('en tem a mesma sequência de blocos e o mesmo tamanho de lista do pt-BR', () => {
  for (const [name, document] of DOCUMENTS) {
    const translated = name === 'privacyPolicy' ? en.privacyPolicy : en.termsOfUse;
    assert.deepEqual(shape(translated), shape(document), `estrutura divergente em en/${name}`);
  }
});

test('es tem a mesma sequência de blocos e o mesmo tamanho de lista do pt-BR', () => {
  for (const [name, document] of DOCUMENTS) {
    const translated = name === 'privacyPolicy' ? es.privacyPolicy : es.termsOfUse;
    assert.deepEqual(shape(translated), shape(document), `estrutura divergente em es/${name}`);
  }
});

test('nenhum bloco de texto fica vazio em nenhum idioma', () => {
  const documents = [
    ptBR.privacyPolicy,
    ptBR.termsOfUse,
    en.privacyPolicy,
    en.termsOfUse,
    es.privacyPolicy,
    es.termsOfUse,
  ];

  for (const document of documents) {
    for (const block of document.blocks) {
      const texts = block.kind === 'list' ? block.items : [block.text];
      for (const text of texts) {
        assert.ok(text.trim().length > 0, `bloco vazio em ${document.title}`);
      }
    }
  }
});
