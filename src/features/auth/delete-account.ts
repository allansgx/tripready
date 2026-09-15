/**
 * Regras da exclusão da conta. Quem fala com o servidor é `auth-service`.
 *
 * Importa só das camadas puras de `i18n` (`locales`, `messages/*`), nunca de
 * `src/i18n/index.ts`: aquele módulo carrega `expo-localization`, que não
 * resolve sob `node --test`, e este arquivo precisa continuar carregável ali.
 */
import { DEFAULT_LOCALE, type Locale } from '../../i18n/locales.ts';
import type { Message } from '../../i18n/message.ts';
import { messages as en } from '../../i18n/messages/en.ts';
import { messages as es } from '../../i18n/messages/es.ts';
import { messages as ptBR, type MessageKey } from '../../i18n/messages/pt-BR.ts';

const DICTIONARIES: Record<Locale, Readonly<Record<MessageKey, Message>>> = {
  'pt-BR': ptBR,
  en,
  es,
};

/** A palavra que o usuário digita para liberar a exclusão, no idioma dado. */
export function getDeleteConfirmationWord(locale: Locale): string {
  const message = DICTIONARIES[locale]['auth.deleteAccount.confirmationWord'];
  return typeof message === 'string' ? message : '';
}

function normalize(value: string): string {
  return value.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Confirma a palavra do idioma ativo e também a de pt-BR — para quem trocou de
 * idioma no meio do fluxo não ficar travado por uma palavra que já não vê mais
 * na tela. Sem acento e sem caixa: a intenção de digitar a palavra certa é o
 * que importa, não a grafia exata do teclado.
 */
export function isDeleteConfirmed(value: string, locale: Locale): boolean {
  const typed = normalize(value);
  if (!typed) return false;

  return (
    typed === normalize(getDeleteConfirmationWord(locale)) ||
    typed === normalize(getDeleteConfirmationWord(DEFAULT_LOCALE))
  );
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
