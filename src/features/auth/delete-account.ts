/**
 * Regras da exclusão permanente da conta.
 *
 * Puro de propósito: é o que dá para testar sem Supabase e sem renderizar a
 * tela. Quem fala com o servidor é `auth-service`.
 */

/** A palavra que o usuário digita para liberar a exclusão. */
export const DELETE_CONFIRMATION_WORD = 'Excluir';

/**
 * Só a palavra exata confirma. Variações de caixa, acento ou frase não contam:
 * a digitação existe para tornar a exclusão consciente, e afrouxar a
 * comparação esvaziaria a confirmação.
 *
 * O `trim` tolera apenas espaço nas pontas, que o teclado do celular acrescenta
 * com facilidade e que ninguém digitou de propósito.
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
