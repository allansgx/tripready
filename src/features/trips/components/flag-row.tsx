import { Platform, StyleSheet, Text, View } from 'react-native';

import { getCountryName, getFlagEmoji } from '@/constants/countries';
import { colors, typography } from '@/theme/tokens';

const MAX_VISIBLE = 5;

/** Bandeiras dos países, no máximo cinco, com "+N" para o restante. */
export function FlagRow({ codes, size = 22 }: { codes: readonly string[]; size?: number }) {
  const visible = codes.slice(0, MAX_VISIBLE);
  const remaining = codes.length - visible.length;
  const label = codes.map(getCountryName).join(', ');

  return (
    <View style={styles.row} accessibilityLabel={label}>
      {visible.map((code) => (
        <Text key={code} style={[styles.flag, { fontSize: size, lineHeight: size * 1.25 }]}>
          {Platform.OS === 'android' ? code.toUpperCase() : getFlagEmoji(code)}
        </Text>
      ))}
      {remaining > 0 ? <Text style={styles.more}>+{remaining}</Text> : null}
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
  more: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
