import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DELETE_CONFIRMATION_WORD,
  DeleteAccountError,
  isDeleteConfirmed,
} from '../delete-account.ts';

/**
 * A confirmação por digitação é a única barreira entre um toque e uma conta
 * apagada para sempre, então cada variação que *não* pode passar está listada.
 */

test('campo vazio ou incompleto não confirma', () => {
  assert.equal(isDeleteConfirmed(''), false);
  assert.equal(isDeleteConfirmed(' '), false);
  assert.equal(isDeleteConfirmed('Exc'), false);
  assert.equal(isDeleteConfirmed('Exclui'), false);
});

test('variações de caixa não confirmam', () => {
  assert.equal(isDeleteConfirmed('excluir'), false);
  assert.equal(isDeleteConfirmed('EXCLUIR'), false);
  assert.equal(isDeleteConfirmed('ExCluir'), false);
  assert.equal(isDeleteConfirmed('excluiR'), false);
});

test('outras palavras não confirmam', () => {
  assert.equal(isDeleteConfirmed('Excluír'), false);
  assert.equal(isDeleteConfirmed('Deletar'), false);
  assert.equal(isDeleteConfirmed('Apagar'), false);
  assert.equal(isDeleteConfirmed('Sim'), false);
});

test('palavra certa com texto em volta não confirma', () => {
  assert.equal(isDeleteConfirmed('Excluir conta'), false);
  assert.equal(isDeleteConfirmed('Excluir!'), false);
  assert.equal(isDeleteConfirmed('quero Excluir'), false);
  assert.equal(isDeleteConfirmed('Ex cluir'), false);
});

test('a palavra exata confirma', () => {
  assert.equal(isDeleteConfirmed('Excluir'), true);
  assert.equal(isDeleteConfirmed(DELETE_CONFIRMATION_WORD), true);
});

test('espaço nas pontas é tolerado', () => {
  assert.equal(isDeleteConfirmed(' Excluir'), true);
  assert.equal(isDeleteConfirmed('Excluir '), true);
  assert.equal(isDeleteConfirmed('   Excluir   '), true);
  assert.equal(isDeleteConfirmed('\nExcluir\t'), true);
});

test('o motivo da falha viaja junto com o erro', () => {
  const error = new DeleteAccountError('connection');

  assert.ok(error instanceof Error);
  assert.equal(error.name, 'DeleteAccountError');
  assert.equal(error.reason, 'connection');
});
