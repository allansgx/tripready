import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { TripFilter } from '@/features/trips/domain/trip-summary';
import { t, type MessageKey } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const FILTERS: readonly { value: TripFilter; labelKey: MessageKey }[] = [
  { value: 'all', labelKey: 'trips.filter.all' },
  { value: 'ongoing', labelKey: 'trips.filter.ongoing' },
  { value: 'upcoming', labelKey: 'trips.filter.upcoming' },
  { value: 'completed', labelKey: 'trips.filter.completed' },
];

/**
 * Os filtros da lista. Os quatro aparecem sempre, mesmo vazios: esconder
 * opções faria a barra mudar de tamanho a cada embarque.
 */
export function TripFilterBar({
  value,
  onChange,
}: {
  value: TripFilter;
  onChange: (filter: TripFilter) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {FILTERS.map((filter) => {
        const selected = filter.value === value;
        const label = t(filter.labelKey);

        return (
          <Pressable
            key={filter.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={t('a11y.tripFilter.filterBy', { filter: label.toLowerCase() })}
            onPress={() => onChange(filter.value)}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && !selected && styles.chipPressed,
            ]}>
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipPressed: {
    backgroundColor: colors.divider,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.contrastText,
  },
});
