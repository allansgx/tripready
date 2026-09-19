import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { CountryFlag } from '@/components/ui/country-flag';
import { getCountryName } from '@/constants/countries';
import { usePassports } from '@/features/passports/passports-context';
import { t } from '@/i18n';
import { colors, spacing, typography } from '@/theme/tokens';
import type { Passport } from '@/types/models';

/**
 * Escolha do passaporte entre os que a pessoa cadastrou. Serve à criação da
 * viagem, à troca e à revisão de uma viagem que perdeu o passaporte, que são a
 * mesma pergunta feita em três momentos.
 *
 * Não oferece cadastrar um passaporte novo: o perfil sempre tem pelo menos um,
 * e sair para outro fluxo no meio de uma escolha custa o rascunho.
 */
export function PassportChoiceList({
  selectedCountryCode,
  onSelect,
}: {
  selectedCountryCode: string | null;
  onSelect: (countryCode: string) => void;
}) {
  const { passports, isLoading, hasPendingRules } = usePassports();

  if (isLoading && passports.length === 0) {
    return (
      <Card>
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </Card>
    );
  }

  return (
    <Card>
      {passports.map((passport) => (
        <PassportChoiceRow
          key={passport.id}
          passport={passport}
          selected={passport.country_code === selectedCountryCode}
          pendingRules={hasPendingRules(passport.country_code)}
          onPress={() => onSelect(passport.country_code)}
        />
      ))}
    </Card>
  );
}

function PassportChoiceRow({
  passport,
  selected,
  pendingRules,
  onPress,
}: {
  passport: Passport;
  selected: boolean;
  pendingRules: boolean;
  onPress: () => void;
}) {
  const name = getCountryName(passport.country_code);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={name}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <CountryFlag code={passport.country_code} />

      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {passport.is_primary ? (
          <Text style={styles.primaryTag}>{t('passports.section.primaryTag')}</Text>
        ) : null}
        {/* Estado, e não alerta: a escolha continua livre, e o que muda é o que
            a checklist vai conseguir afirmar. */}
        {pendingRules ? (
          <Text style={styles.pendingTag}>{t('passports.section.pendingRulesTag')}</Text>
        ) : null}
      </View>

      {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  rowPressed: {
    backgroundColor: colors.background,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.body,
    color: colors.text,
  },
  primaryTag: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  pendingTag: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  loading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
