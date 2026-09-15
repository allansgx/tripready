import type { Message } from '../message.ts';

/**
 * Dicionário canônico: toda chave nasce aqui. `en.ts` e `es.ts` são tipados
 * contra `MessageKey`, então esquecer uma tradução é erro de compilação, e não
 * texto faltando em produção.
 */
export const messages = {
  'profile.language.title': 'Idioma',
  'profile.language.system': 'Padrão do dispositivo',
} as const satisfies Record<string, Message>;

export type MessageKey = keyof typeof messages;
