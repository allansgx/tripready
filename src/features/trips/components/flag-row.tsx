import { Platform, StyleSheet, Text, View } from 'react-native';

import { getCountryName, getFlagEmoji } from '@/constants/countries';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const MAX_VISIBLE = 5;

/** Bandeiras dos países, com "+N" para o que passar de `max`. */
export function FlagRow({
  codes,
  size = 22,
  max = MAX_VISIBLE,
}: {
  codes: readonly string[];
  size?: number;
  max?: number;
}) {
  const visible = codes.slice(0, max);
  const remaining = codes.length - visible.length;
  // O rótulo lista todos: o "+N" corta a linha, não a informação.
  const label = codes.map(getCountryName).join(', ');

  return (
    <View style={styles.row} accessibilityLabel={label}>
      {visible.map((code) => (
        <Text key={code} style={[styles.flag, { fontSize: size, lineHeight: size * 1.25 }]}>
          {Platform.OS === 'android' ? code.toUpperCase() : getFlagEmoji(code)}
        </Text>
      ))}
      {remaining > 0 ? (
        <View style={styles.moreChip}>
          <Text style={styles.more}>+{remaining}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  flag: {
    color: colors.text,
    fontWeight: Platform.OS === 'android' ? '700' : '400',
  },
  // A contagem nunca encolhe: é a menor peça da linha e a que não pode virar
  // reticências.
  moreChip: {
    flexShrink: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  more: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
