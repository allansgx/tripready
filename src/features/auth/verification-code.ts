/** Tamanho do código de verificação. Espelha `otp_length` no painel do Supabase. */
export const VERIFICATION_CODE_LENGTH = 6;

export function isVerificationCodeComplete(value: string): boolean {
  return value.length === VERIFICATION_CODE_LENGTH && /^\d+$/.test(value);
}
