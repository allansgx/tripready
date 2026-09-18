import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DeleteAccountError,
  getDeleteConfirmationWord,
  isDeleteConfirmed,
} from '../delete-account.ts';

/**
 * A confirmação por digitação é a única barreira entre um toque e uma conta
 * apagada para sempre, então cada variação que *não* pode passar está listada.
 */

test('campo vazio ou incompleto não confirma', () => {
  assert.equal(isDeleteConfirmed('', 'pt-BR'), false);
  assert.equal(isDeleteConfirmed(' ', 'pt-BR'), false);
  assert.equal(isDeleteConfirmed('Exc', 'pt-BR'), false);
  assert.equal(isDeleteConfirmed('Exclui', 'pt-BR'), false);
});

test('outras palavras não confirmam', () => {
  assert.equal(isDeleteConfirmed('Deletar', 'pt-BR'), false);
  assert.equal(isDeleteConfirmed('Apagar', 'pt-BR'), false);
  assert.equal(isDeleteConfirmed('Sim', 'pt-BR'), false);
  assert.equal(isDeleteConfirmed('Remove', 'en'), false);
});

test('palavra certa com texto em volta não confirma', () => {
  assert.equal(isDeleteConfirmed('Excluir conta', 'pt-BR'), false);
  assert.equal(isDeleteConfirmed('Excluir!', 'pt-BR'), false);
  assert.equal(isDeleteConfirmed('quero Excluir', 'pt-BR'), false);
  assert.equal(isDeleteConfirmed('Ex cluir', 'pt-BR'), false);
});

test('a palavra do idioma ativo confirma', () => {
  assert.equal(isDeleteConfirmed('Excluir', 'pt-BR'), true);
  assert.equal(isDeleteConfirmed('Delete', 'en'), true);
  assert.equal(isDeleteConfirmed('Eliminar', 'es'), true);
  assert.equal(isDeleteConfirmed(getDeleteConfirmationWord('pt-BR'), 'pt-BR'), true);
});

/**
 * Sem acento e sem caixa: a intenção de digitar a palavra certa é o que
 * importa, não a grafia exata do teclado.
 */
test('caixa e acento não impedem a confirmação', () => {
  assert.equal(isDeleteConfirmed('excluir', 'pt-BR'), true);
  assert.equal(isDeleteConfirmed('EXCLUIR', 'pt-BR'), true);
  assert.equal(isDeleteConfirmed('Excluír', 'pt-BR'), true);
  assert.equal(isDeleteConfirmed('delete', 'en'), true);
  assert.equal(isDeleteConfirmed('eliminar', 'es'), true);
});

/**
 * A palavra de pt-BR também confirma em qualquer idioma: quem trocou de
 * idioma no meio do fluxo não fica travado por uma palavra que já não vê mais
 * na tela.
 */
test('a palavra de pt-BR confirma mesmo com outro idioma ativo', () => {
  assert.equal(isDeleteConfirmed('Excluir', 'en'), true);
  assert.equal(isDeleteConfirmed('Excluir', 'es'), true);
});

test('a palavra de outro idioma que não o ativo nem pt-BR não confirma', () => {
  assert.equal(isDeleteConfirmed('Delete', 'es'), false);
  assert.equal(isDeleteConfirmed('Eliminar', 'en'), false);
});

test('espaço nas pontas é tolerado', () => {
  assert.equal(isDeleteConfirmed(' Excluir', 'pt-BR'), true);
  assert.equal(isDeleteConfirmed('Excluir ', 'pt-BR'), true);
  assert.equal(isDeleteConfirmed('   Excluir   ', 'pt-BR'), true);
  assert.equal(isDeleteConfirmed('\nExcluir\t', 'pt-BR'), true);
});

test('a palavra de cada idioma está disponível para exibição', () => {
  assert.equal(getDeleteConfirmationWord('pt-BR'), 'Excluir');
  assert.equal(getDeleteConfirmationWord('en'), 'Delete');
  assert.equal(getDeleteConfirmationWord('es'), 'Eliminar');
});

test('o motivo da falha viaja junto com o erro', () => {
  const error = new DeleteAccountError('connection');

  assert.ok(error instanceof Error);
  assert.equal(error.name, 'DeleteAccountError');
  assert.equal(error.reason, 'connection');
});
