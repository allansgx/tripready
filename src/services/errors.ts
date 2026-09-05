import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Erro de domínio da camada de dados.
 *
 * As telas só precisam tratar `DataAccessError`, sem conhecer o formato de erro
 * do PostgREST/Supabase.
 */
export class DataAccessError extends Error {
  readonly code?: string;
  readonly details?: string;

  constructor(message: string, options?: { code?: string; details?: string; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = 'DataAccessError';
    this.code = options?.code;
    this.details = options?.details;
  }
}

/**
 * Converte o par `{ data, error }` do Supabase em valor ou exceção.
 * Mantém `null` no retorno — use com `.maybeSingle()`.
 */
export function unwrap<T>(result: { data: T; error: PostgrestError | null }, context: string): T {
  if (result.error) {
    throw new DataAccessError(`${context}: ${result.error.message}`, {
      code: result.error.code,
      details: result.error.details,
      cause: result.error,
    });
  }
  return result.data;
}

/**
 * Igual a `unwrap`, mas garante que houve retorno. Use em listas e em
 * `.single()`, onde `null` significa que a linha não existe ou foi barrada
 * pelas policies de RLS.
 */
export function unwrapRequired<T>(
  result: { data: T | null; error: PostgrestError | null },
  context: string,
): T {
  const data = unwrap(result, context);
  if (data === null) {
    throw new DataAccessError(`${context}: nenhum registro retornado.`);
  }
  return data;
}
