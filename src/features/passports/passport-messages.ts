import { PassportRuleError } from '@/features/passports/passports-context';
import { t } from '@/i18n';

/**
 * Só `PassportRuleError` nasce escrito para ser lido: os erros da camada de
 * dados carregam a mensagem do Postgres, com nome de índice e de tabela.
 */
export function toPassportMessage(error: unknown): string {
  return error instanceof PassportRuleError ? error.message : t('passports.error.connection');
}
