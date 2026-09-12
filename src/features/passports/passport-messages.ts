import { PassportRuleError } from '@/features/passports/passports-context';

/**
 * Texto que o usuário lê quando algo dá errado com passaportes.
 *
 * Só `PassportRuleError` nasce escrito para ser lido — os erros da camada de
 * dados carregam a mensagem do Postgres, que não ajuda quem está escolhendo um
 * país e ainda expõe nome de índice e de tabela.
 */
export function toPassportMessage(error: unknown): string {
  return error instanceof PassportRuleError ? error.message : 'Sua conexão oscilou. Tente de novo.';
}
