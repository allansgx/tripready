import { StyleSheet, Text } from 'react-native';

import { colors, spacing, typography } from '@/theme/tokens';

/** Rótulo de seção em caixa alta ("PASSAPORTES", "CONTA"). */
export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  label: {
    ...typography.sectionLabel,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
});
