import type { Locale } from './locales.ts';

/** A forma que a regra de plural escolhe. `zero` não sai daqui: é da chave. */
export type PluralForm = 'one' | 'other';

/**
 * O CLDR trata `0` como singular em português ("0 dia"). O app não segue: nos
 * três idiomas só `1` é singular, e uma frase melhor para zero se escreve na
 * forma `zero` da própria chave.
 */
const RULES: Record<Locale, (count: number) => PluralForm> = {
  'pt-BR': (count) => (count === 1 ? 'one' : 'other'),
  en: (count) => (count === 1 ? 'one' : 'other'),
  es: (count) => (count === 1 ? 'one' : 'other'),
};

export function pluralForm(locale: Locale, count: number): PluralForm {
  return RULES[locale](count);
}
