import type { Locale } from '@/i18n/locales';

import { LEGAL_IDENTITY } from '@/features/legal/data/identity';
import type { LegalDocument } from '@/features/legal/data/types';

export { LEGAL_IDENTITY };
export type {
  LegalBlock,
  LegalDocument,
  TranslatedLegalDocument,
} from '@/features/legal/data/types';

export type LegalDocuments = {
  privacyPolicy: LegalDocument;
  termsOfUse: LegalDocument;
};

/**
 * Documentos legais no idioma pedido. `require()` tardio, e não `import`
 * estático: os ~84 KB de texto jurídico dos três idiomas só são avaliados
 * quando alguém de fato abre uma tela legal, nunca no boot do app (§15.2 do
 * plano de i18n).
 */
export function getLegalDocuments(locale: Locale): LegalDocuments {
  switch (locale) {
    case 'en':
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('@/features/legal/data/en');
    case 'es':
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('@/features/legal/data/es');
    case 'pt-BR':
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('@/features/legal/data/pt-BR');
  }
}
