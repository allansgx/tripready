import { StyleSheet, Text } from 'react-native';

import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Rótulo de seção em caixa alta ("PASSAPORTES", "CONTA"). A caixa vem escrita
 * assim na chave do dicionário — nunca de `toUpperCase()`, que aplicaria a
 * regra de maiúsculas do português a qualquer idioma.
 */
export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    ...typography.sectionLabel,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
});
