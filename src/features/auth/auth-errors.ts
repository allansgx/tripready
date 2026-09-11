/**
 * Tradução das mensagens de erro do Supabase Auth.
 *
 * O `AuthError` chega em inglês e é o texto que o usuário vê na tela, então as
 * mensagens mais comuns são mapeadas aqui. O que não estiver no mapa passa
 * direto — é melhor mostrar o texto original do que uma mensagem genérica.
 */
const MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed': 'Confirme o e-mail antes de entrar. Verifique sua caixa de entrada.',
  'User already registered': 'Este e-mail já está cadastrado.',
  'Unable to validate email address: invalid format': 'E-mail inválido.',
  'Signup requires a valid password': 'Informe uma senha válida.',
  'Email rate limit exceeded': 'Muitas tentativas seguidas. Aguarde alguns minutos.',
  'For security purposes, you can only request this after 60 seconds.':
    'Por segurança, aguarde 60 segundos antes de tentar de novo.',
};

/** A recusa do GoTrue lista os caracteres exigidos e muda com a política. */
const PASSWORD_REJECTION_PREFIX = 'Password should';
const PASSWORD_REJECTION_MESSAGE = 'A senha ainda não cumpre todos os requisitos da lista.';

export function toAuthMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Erro inesperado na autenticação.';
  }

  const mapped = MESSAGES[error.message];
  if (mapped) return mapped;

  if (error.message.startsWith(PASSWORD_REJECTION_PREFIX)) {
    return PASSWORD_REJECTION_MESSAGE;
  }

  return error.message;
}
