import { getLocales } from 'expo-localization';
import { useSyncExternalStore } from 'react';

import {
  apply,
  getActiveLocale,
  getChoice,
  getDeviceLocale,
  initDeviceLocale,
  subscribe,
} from './active-locale.ts';
import { DEFAULT_LOCALE, pickLocale, type Locale } from './locales.ts';
import { resolveMessage, type MessageParams, type Messages } from './message.ts';
import { messages as en } from './messages/en.ts';
import { messages as es } from './messages/es.ts';
import { messages as ptBR, type MessageKey } from './messages/pt-BR.ts';
import { readLocaleChoice, writeLocaleChoice } from './storage.ts';

export type { Locale, MessageKey, MessageParams };
export { getDeviceLocale };

const DICTIONARIES: Record<Locale, Messages> = { 'pt-BR': ptBR, en, es };

/**
 * Falha de leitura não é "idioma não suportado": cai no canônico, e não no
 * inglês que `pickLocale` daria a um aparelho em japonês.
 */
function readDeviceLocale(): Locale {
  try {
    return pickLocale(getLocales().map((locale) => locale.languageTag));
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** Lido uma vez: a primeira renderização já sai no idioma do aparelho. */
initDeviceLocale(readDeviceLocale());

export function getLocale(): Locale {
  return getActiveLocale();
}

/**
 * Estado de módulo, e não contexto: domínio, serviços e o agendador de
 * notificações também produzem texto, e nenhum deles é componente.
 */
export function t(key: MessageKey, params?: MessageParams): string {
  const locale = getActiveLocale();
  return resolveMessage(key, locale, DICTIONARIES[locale], DICTIONARIES[DEFAULT_LOCALE], params);
}

/** Assinar em um ponto alto da árvore é o que faz a troca redesenhar a tela. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getActiveLocale, getActiveLocale);
}

/** Nulo quando a pessoa segue o aparelho, para a tela marcar a opção certa. */
export function useLocaleChoice(): Locale | null {
  return useSyncExternalStore(subscribe, getChoice, getChoice);
}

/** A escolha gravada neste aparelho. Nunca levanta erro. */
export async function loadLocaleChoice(): Promise<void> {
  const stored = await readLocaleChoice();
  if (stored) apply(stored);
}

/** Nulo volta a seguir o aparelho. A tela muda antes de a gravação terminar. */
export function chooseLocale(next: Locale | null): void {
  apply(next);
  void writeLocaleChoice(next);
}

/**
 * A escolha vinda do perfil, para um aparelho que ainda não tem nenhuma. Relê o
 * armazenamento em vez de olhar o estado em memória: assim não depende de o
 * carregamento local ter terminado antes da resposta do servidor.
 */
export async function seedLocaleChoice(next: Locale | null): Promise<void> {
  if (next === null) return;
  if (await readLocaleChoice()) return;

  apply(next);
  void writeLocaleChoice(next);
}
