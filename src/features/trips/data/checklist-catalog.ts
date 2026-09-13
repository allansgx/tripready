import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { RequirementCategory } from '@/types/models';

/**
 * Só a apresentação da checklist: rótulos, ícones e ordem. Os requisitos moram
 * nas tabelas do catálogo e chegam por `resolveTripRequirements`.
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
