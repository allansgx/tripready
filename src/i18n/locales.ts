/**
 * Os idiomas do app e como um locale do sistema vira um deles. Nada aqui
 * conhece React, armazenamento ou banco: é a tabela que o resto consulta.
 *
 * Caminhos relativos com extensão dentro de `src/i18n`, e não o alias `@/`:
 * estes módulos são carregados direto pelo `node --test`, que resolve pelo
 * arquivo real.
 */

export const SUPPORTED_LOCALES = ['pt-BR', 'en', 'es'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Para onde uma chave ausente cai: o pt-BR é o único dicionário completo. */
export const DEFAULT_LOCALE: Locale = 'pt-BR';

/**
 * Idioma inicial de quem está com o aparelho em um idioma que o app não fala.
 * Separado de `DEFAULT_LOCALE` de propósito: quem tem o telefone em francês lê
 * inglês antes de português, mas uma chave que falta continua caindo no pt-BR.
 */
export const FALLBACK_UI_LOCALE: Locale = 'en';

/**
 * O nome de cada idioma escrito nele mesmo, e por isso nunca traduzido: quem
 * trocou o app para um idioma que não lê precisa reconhecer o próprio na lista
 * para conseguir voltar.
 */
export const LANGUAGE_NAMES: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'English',
  es: 'Español',
};

const BY_LANGUAGE: Record<string, Locale> = {
  pt: 'pt-BR',
  en: 'en',
  es: 'es',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * A região é descartada: `pt-PT` e `es-419` recebem o idioma mais próximo que o
 * app fala. Nulo quando não fala nenhum — quem decide o que fazer com isso é
 * `pickLocale`.
 */
export function normalizeLocale(tag: string): Locale | null {
  const language = tag.trim().toLowerCase().split(/[-_]/)[0];
  return BY_LANGUAGE[language] ?? null;
}

/**
 * O primeiro idioma suportado da lista de preferências do sistema. A ordem
 * importa: quem tem "alemão, espanhol" recebe espanhol, e não o padrão.
 */
export function pickLocale(tags: readonly string[]): Locale {
  for (const tag of tags) {
    const locale = normalizeLocale(tag);
    if (locale) return locale;
  }
  return FALLBACK_UI_LOCALE;
}
