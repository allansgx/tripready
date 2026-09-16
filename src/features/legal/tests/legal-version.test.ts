import assert from 'node:assert/strict';
import test from 'node:test';

import * as en from '../data/en.ts';
import * as es from '../data/es.ts';
import * as ptBR from '../data/pt-BR.ts';

/**
 * `sourceVersion` registra contra qual versão do pt-BR a tradução foi feita.
 * Mudar `version` no pt-BR sem atualizar a tradução deixa este teste
 * vermelho até alguém revisar `en`/`es` de propósito — é o mecanismo que
 * impede divergência silenciosa (§15.2 do plano de i18n).
 */

test('a versão de origem de en bate com a versão vigente do pt-BR', () => {
  assert.equal(en.privacyPolicy.sourceVersion, ptBR.privacyPolicy.version);
  assert.equal(en.termsOfUse.sourceVersion, ptBR.termsOfUse.version);
});

test('a versão de origem de es bate com a versão vigente do pt-BR', () => {
  assert.equal(es.privacyPolicy.sourceVersion, ptBR.privacyPolicy.version);
  assert.equal(es.termsOfUse.sourceVersion, ptBR.termsOfUse.version);
});

test('a versão exibida é a mesma nos três idiomas', () => {
  assert.equal(en.privacyPolicy.version, ptBR.privacyPolicy.version);
  assert.equal(es.privacyPolicy.version, ptBR.privacyPolicy.version);
  assert.equal(en.termsOfUse.version, ptBR.termsOfUse.version);
  assert.equal(es.termsOfUse.version, ptBR.termsOfUse.version);
});
