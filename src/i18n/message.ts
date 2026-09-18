import type { Locale } from './locales.ts';
import { pluralForm } from './plural.ts';

/** Uma frase, ou as formas dela quando o texto muda com a contagem. */
export type Message = string | { zero?: string; one: string; other: string };

export type Messages = Readonly<Record<string, Message>>;

export type MessageParams = Readonly<Record<string, string | number>>;

const PLACEHOLDER = /\{(\w+)\}/g;

function interpolate(text: string, params?: MessageParams): string {
  if (!params) return text;

  // Parâmetro ausente deixa o marcador visível: some da tela é pior de achar.
  return text.replace(PLACEHOLDER, (marker: string, name: string) => {
    const value = params[name];
    return value === undefined ? marker : String(value);
  });
}

function selectForm(message: Message, locale: Locale, params?: MessageParams): string {
  if (typeof message === 'string') return message;

  const count = params?.count;
  if (typeof count !== 'number') return message.other;
  if (count === 0 && message.zero !== undefined) return message.zero;

  return message[pluralForm(locale, count)];
}

/**
 * Procura no dicionário do idioma e depois no canônico. Devolver a própria
 * chave é o último recurso: `completeness.test.ts` existe para que isso nunca
 * chegue a acontecer em produção.
 */
export function resolveMessage(
  key: string,
  locale: Locale,
  messages: Messages,
  fallback: Messages,
  params?: MessageParams,
): string {
  const message = messages[key] ?? fallback[key];
  if (message === undefined) return key;

  return interpolate(selectForm(message, locale, params), params);
}
