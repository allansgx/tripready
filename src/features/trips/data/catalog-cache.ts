import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Locale } from '@/i18n/locales';
import { requirementCatalogService, type TranslatedCatalog } from '@/services';

const TTL_MS = 24 * 60 * 60 * 1000;
const VERSION = 'v1';

type CacheEntry = TranslatedCatalog & { fetchedAt: number };

function keyFor(locale: Locale): string {
  return `tripready.catalog.${locale}.${VERSION}`;
}

async function readCache(locale: Locale): Promise<CacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(locale));
    return raw ? (JSON.parse(raw) as CacheEntry) : null;
  } catch {
    return null;
  }
}

async function writeCache(locale: Locale, entry: CacheEntry): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(locale), JSON.stringify(entry));
  } catch {
    // Sem cache não impede o app de funcionar — só perde a resposta instantânea.
  }
}

async function revalidate(locale: Locale): Promise<TranslatedCatalog> {
  const fresh = await requirementCatalogService.loadTranslatedCatalog(locale);
  void writeCache(locale, { ...fresh, fetchedAt: Date.now() });
  return fresh;
}

/**
 * Catálogo traduzido do banco, servido do disco na hora — mesmo vencido —
 * enquanto uma atualização roda por trás (stale-while-revalidate, §11 do
 * plano de i18n). Sem cache nenhum, a primeira leitura espera a rede; com rede
 * fora do ar e cache frio, quem chama cai no texto gravado em
 * `trip_requirements` (§12).
 */
export const catalogCache = {
  async get(locale: Locale): Promise<TranslatedCatalog> {
    const cached = await readCache(locale);
    if (!cached) return revalidate(locale);

    if (Date.now() - cached.fetchedAt > TTL_MS) {
      void revalidate(locale).catch(() => {});
    }

    return { templates: cached.templates, groups: cached.groups };
  },
};
