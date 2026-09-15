import { StyleSheet, Text, View } from 'react-native';

import { CountryFlag } from '@/components/ui/country-flag';
import { getCountryName } from '@/constants/countries';
import { t } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/** Quantos destinos cabem na linha antes de o resto virar contagem. */
const MAX_VISIBLE = 3;

/**
 * Os destinos em chips de bandeira e nome, com o excedente em "+N": o card tem
 * altura previsível com um destino ou com doze. São informação, não filtros.
 */
export function TripCountryChips({ codes }: { codes: readonly string[] }) {
  if (codes.length === 0) return null;

  const visible = codes.slice(0, MAX_VISIBLE);
  const hidden = codes.length - visible.length;

  return (
    <View style={styles.row}>
      {visible.map((code) => (
        <View key={code} style={styles.chip}>
          <CountryFlag code={code} size={15} />
          <Text style={styles.name} numberOfLines={1}>
            {getCountryName(code)}
          </Text>
        </View>
      ))}

      {hidden > 0 ? (
        <View style={[styles.chip, styles.more]}>
          <Text
            style={styles.name}
            accessibilityLabel={t('a11y.tripCountryChips.more', { count: hidden })}>
            +{hidden}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  // A contagem nunca encolhe: ela é a menor peça da linha e a que não pode
  // virar reticências.
  more: {
    flexShrink: 0,
    paddingLeft: spacing.md,
  },
  name: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
