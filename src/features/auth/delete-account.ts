/** Regras da exclusão da conta. Quem fala com o servidor é `auth-service`. */

/** A palavra que o usuário digita para liberar a exclusão. */
export const DELETE_CONFIRMATION_WORD = 'Excluir';

/**
 * Só a palavra exata confirma: a digitação existe para tornar a exclusão
 * consciente. O `trim` tolera apenas o espaço que o teclado acrescenta.
 */
export function isDeleteConfirmed(value: string): boolean {
  return value.trim() === DELETE_CONFIRMATION_WORD;
}

/**
 * Por que a exclusão não foi concluída, no nível em que a tela precisa saber:
 * cada motivo tem uma saída diferente para o usuário.
 */
export type DeleteAccountFailure = 'session' | 'connection' | 'unknown';

export class DeleteAccountError extends Error {
  readonly reason: DeleteAccountFailure;

  constructor(reason: DeleteAccountFailure, options?: { cause?: unknown }) {
    super(`Exclusão de conta não concluída: ${reason}`, { cause: options?.cause });
    this.name = 'DeleteAccountError';
    this.reason = reason;
  }
}
