import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { RequirementCategory } from '@/types/models';

/**
 * Rótulos e ordem da checklist.
 *
 * Os requisitos em si não moram mais aqui: vieram para as tabelas
 * `requirement_templates` e `destination_groups` do Supabase, e chegam ao app
 * por `requirementCatalogService` + `resolveTripRequirements`. O que sobra
 * neste arquivo é apresentação — como cada categoria se chama e em que ordem
 * aparece —, que é decisão de interface e não regra de viagem.
 */

/** Ordem em que as categorias aparecem na checklist e na tela de preparação. */
export const CHECKLIST_CATEGORIES: readonly RequirementCategory[] = [
  'documents',
  'health',
  'money',
  'connectivity',
  'luggage',
] as const;

export const CATEGORY_LABELS: Record<RequirementCategory, string> = {
  documents: 'Documentos',
  health: 'Saúde',
  money: 'Dinheiro',
  connectivity: 'Conectividade',
  luggage: 'Bagagem',
};

/** Ícones do Ionicons por categoria. */
export const CATEGORY_ICONS: Record<RequirementCategory, IoniconName> = {
  documents: 'document-text',
  health: 'medkit',
  money: 'card',
  connectivity: 'wifi',
  luggage: 'bag-handle',
};

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const PRIORITY_LABELS = {
  required: 'Obrigatório',
  recommended: 'Recomendado',
  informational: 'Informativo',
} as const;
