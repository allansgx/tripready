import { DEFAULT_LOCALE, type Locale } from './locales.ts';

/**
 * O idioma ativo, isolado do resto de `index.ts` para que módulos puros — sem
 * `expo-localization` nem `react`, carregados direto por `node --test` — também
 * possam ler o idioma corrente. `index.ts` continua sendo a porta pública única;
 * este módulo é implementação, e por isso não é reexportado por `messages/*`.
 *
 * Caminho relativo com extensão, como o resto de `src/i18n`: por quem é lido.
 */

let deviceLocale: Locale = DEFAULT_LOCALE;
let choice: Locale | null = null;
let active: Locale = deviceLocale;

const listeners = new Set<() => void>();

/** Chamado uma vez por `index.ts`, síncrono, antes de qualquer leitura. */
export function initDeviceLocale(locale: Locale): void {
  deviceLocale = locale;
  active = choice ?? deviceLocale;
}

export function getDeviceLocale(): Locale {
  return deviceLocale;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function apply(next: Locale | null): void {
  choice = next;
  active = next ?? deviceLocale;
  for (const listener of listeners) listener();
}

export function getActiveLocale(): Locale {
  return active;
}

export function getChoice(): Locale | null {
  return choice;
}
