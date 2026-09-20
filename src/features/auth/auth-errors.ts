import { t, type MessageKey, type MessageParams } from '@/i18n';

/**
 * Erro interno do app (não do GoTrue) que já nasce sabendo como se traduzir.
 * Carrega a chave e os parâmetros em vez do texto: a tradução acontece em
 * `toAuthMessage`, no momento de exibir, com o idioma que estiver ativo então
 * — nunca no momento do `throw`, que poderia ter acontecido em outro idioma.
 */
export class AuthUiError extends Error {
  readonly key: MessageKey;
  readonly params?: MessageParams;

  constructor(key: MessageKey, params?: MessageParams) {
    super(key);
    this.name = 'AuthUiError';
    this.key = key;
    this.params = params;
  }
}

/**
 * Tradução das mensagens do Supabase Auth. O que não estiver no mapa cai numa
 * mensagem genérica: o texto original do GoTrue é sempre em inglês, e vazá-lo
 * para quem não fala o idioma é pior do que um aviso menos específico.
 */
const MESSAGE_KEYS: Record<string, MessageKey> = {
  'Invalid login credentials': 'auth.error.invalidCredentials',
  'Email not confirmed': 'auth.error.emailNotConfirmed',
  'User already registered': 'auth.error.userAlreadyRegistered',
  'Unable to validate email address: invalid format': 'auth.error.invalidEmailFormat',
  'Signup requires a valid password': 'auth.error.invalidPassword',
  'Email rate limit exceeded': 'auth.error.rateLimited',
  'Token has expired or is invalid': 'auth.error.invalidOrExpiredCode',
};

/**
 * Tradução por `code`: alguns erros do GoTrue usam a mesma mensagem em inglês
 * para situações diferentes, como senha atual ausente e senha atual errada.
 */
const CODE_MESSAGE_KEYS: Record<string, MessageKey> = {
  current_password_required: 'auth.error.currentPasswordRequired',
  current_password_invalid: 'auth.error.currentPasswordInvalid',
  same_password: 'auth.error.samePassword',
};

/** A recusa do GoTrue lista os caracteres exigidos e muda com a política. */
const PASSWORD_REJECTION_PREFIX = 'Password should';
// O número de segundos varia a cada resposta ("after 58 seconds.", "after 45
// seconds."...) — comparar a mensagem inteira nunca dava match, e o aviso
// caía sempre na mensagem genérica.
const RATE_LIMIT_PREFIX = 'For security purposes, you can only request this after';

/**
 * `true` quando o login falhou por falta de confirmação. A tela de login usa
 * isto para reenviar o código e levar direto à tela de confirmação, em vez de
 * só mostrar a mensagem — sem isso, quem fecha o app antes de confirmar não
 * tem como voltar a esse fluxo.
 */
export function isEmailNotConfirmedError(error: unknown): boolean {
  return error instanceof Error && error.message === 'Email not confirmed';
}

export function toAuthMessage(error: unknown): string {
  if (error instanceof AuthUiError) {
    return t(error.key, error.params);
  }

  if (!(error instanceof Error)) {
    return t('auth.error.unexpected');
  }

  const code = (error as { code?: unknown }).code;
  if (typeof code === 'string' && CODE_MESSAGE_KEYS[code]) {
    return t(CODE_MESSAGE_KEYS[code]);
  }

  const key = MESSAGE_KEYS[error.message];
  if (key) return t(key);

  if (error.message.startsWith(PASSWORD_REJECTION_PREFIX)) {
    return t('auth.error.passwordRejected');
  }

  if (error.message.startsWith(RATE_LIMIT_PREFIX)) {
    return t('auth.error.tooManyRequests');
  }

  return t('auth.error.unexpected');
}
