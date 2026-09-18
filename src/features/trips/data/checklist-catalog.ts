import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { t, type MessageKey } from '@/i18n';
import type { RequirementCategory, RequirementPriority } from '@/types/models';

/**
 * Só a apresentação da checklist: rótulos, ícones e ordem. Os requisitos moram
 * nas tabelas do catálogo e chegam por `resolveTripRequirements`. Formatador de
 * apresentação, como `trip-format.ts`: nenhum teste trava este arquivo a texto
 * em português, então `categoryLabel`/`priorityLabel` chamam `t()` direto em
 * vez de devolver descritor.
 */

/** Ordem em que as categorias aparecem na checklist e na tela de preparação. */
export const CHECKLIST_CATEGORIES: readonly RequirementCategory[] = [
  'documents',
  'health',
  'money',
  'connectivity',
  'luggage',
] as const;

const CATEGORY_LABEL_KEY: Record<RequirementCategory, MessageKey> = {
  documents: 'checklist.category.documents',
  health: 'checklist.category.health',
  money: 'checklist.category.money',
  connectivity: 'checklist.category.connectivity',
  luggage: 'checklist.category.luggage',
};

export function categoryLabel(category: RequirementCategory): string {
  return t(CATEGORY_LABEL_KEY[category]);
}

/** Ícones do Ionicons por categoria. */
export const CATEGORY_ICONS: Record<RequirementCategory, IoniconName> = {
  documents: 'document-text',
  health: 'medkit',
  money: 'card',
  connectivity: 'wifi',
  luggage: 'bag-handle',
};

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

const PRIORITY_LABEL_KEY: Record<RequirementPriority, MessageKey> = {
  required: 'checklist.priority.required',
  recommended: 'checklist.priority.recommended',
  informational: 'checklist.priority.informational',
};

export function priorityLabel(priority: RequirementPriority): string {
  return t(PRIORITY_LABEL_KEY[priority]);
}
