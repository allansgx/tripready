export const MIN_PASSWORD_LENGTH = 8;

const STRONG_PASSWORD_LENGTH = 12;

/** Conjunto fechado do GoTrue: fora dele o servidor não conta como símbolo. */
const SYMBOLS = `!@#$%^&*()_+-=[]{};'\\:"|<>?,./\`~`;

export type PasswordRule = 'length' | 'uppercase' | 'lowercase' | 'digit' | 'symbol';

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export const PASSWORD_RULES: readonly { id: PasswordRule; label: string }[] = [
  { id: 'length', label: `Pelo menos ${MIN_PASSWORD_LENGTH} caracteres` },
  { id: 'uppercase', label: 'Letra maiúscula' },
  { id: 'lowercase', label: 'Letra minúscula' },
  { id: 'digit', label: 'Número' },
  { id: 'symbol', label: 'Símbolo' },
];

export const PASSWORD_STRENGTH_LABELS: Record<PasswordStrength, string> = {
  weak: 'Fraca',
  medium: 'Média',
  strong: 'Forte',
};

/** ASCII de propósito: o GoTrue não conta `Á` como maiúscula. */
export function checkPassword(value: string): Record<PasswordRule, boolean> {
  return {
    length: value.length >= MIN_PASSWORD_LENGTH,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    digit: /[0-9]/.test(value),
    symbol: [...value].some((character) => SYMBOLS.includes(character)),
  };
}

export function isPasswordValid(value: string): boolean {
  return Object.values(checkPassword(value)).every(Boolean);
}

/** Só o comprimento: uma senha longa sem número é forte e continua inválida. */
export function getPasswordStrength(value: string): PasswordStrength {
  if (value.length >= STRONG_PASSWORD_LENGTH) return 'strong';
  if (value.length >= MIN_PASSWORD_LENGTH) return 'medium';
  return 'weak';
}
