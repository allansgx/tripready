import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AlertButton,
} from 'react-native';

import { Card } from '@/components/ui/card';
import { CountryFlag } from '@/components/ui/country-flag';
import { SectionLabel } from '@/components/ui/section-label';
import { getCountryName } from '@/constants/countries';
import { usePassports } from '@/features/passports/passports-context';
import type { Passport } from '@/types/models';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/** Seção "Passaportes" do Perfil: lista, principal, adicionar e remover. */
export function PassportsSection() {
  const { passports, isLoading, setPrimary, removePassport } = usePassports();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function run(passportId: string, action: () => Promise<void>) {
    setBusyId(passportId);
    try {
      await action();
    } catch (error) {
      Alert.alert(
        'Não foi possível concluir',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    } finally {
      setBusyId(null);
    }
  }

  function openActions(passport: Passport) {
    const name = getCountryName(passport.country_code);

    // O principal não é removível. Em vez de oferecer a ação e falhar depois da
    // confirmação, a própria explicação já indica o caminho de saída.
    if (passport.is_primary) {
      const isOnly = passports.length === 1;

      Alert.alert(
        name,
        isOnly
          ? 'Este é o seu único passaporte e está definido como principal. Para removê-lo, adicione outro passaporte e defina-o como principal.'
          : 'Passaporte principal. Para removê-lo, defina outro passaporte como principal antes.',
        isOnly
          ? [
              {
                text: 'Adicionar passaporte',
                onPress: () => router.push('/passport-picker'),
              },
              { text: 'Fechar', style: 'cancel' },
            ]
          : [{ text: 'Fechar', style: 'cancel' }],
      );
      return;
    }

    const buttons: AlertButton[] = [
      {
        text: 'Definir como principal',
        onPress: () => void run(passport.id, () => setPrimary(passport.id)),
      },
      {
        text: 'Remover passaporte',
        style: 'destructive',
        onPress: () =>
          Alert.alert(`Remover ${name}?`, 'Você pode adicioná-lo de novo quando quiser.', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Remover',
              style: 'destructive',
              onPress: () => void run(passport.id, () => removePassport(passport.id)),
            },
          ]),
      },
      { text: 'Cancelar', style: 'cancel' },
    ];

    Alert.alert(name, undefined, buttons);
  }

  return (
    <View>
      <SectionLabel>Passaportes</SectionLabel>

      <Card>
        {isLoading && passports.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}

        {passports.map((passport) => (
          <PassportRow
            key={passport.id}
            passport={passport}
            busy={busyId === passport.id}
            onPress={() => openActions(passport)}
          />
        ))}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar passaporte"
          onPress={() => router.push('/passport-picker')}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
          <View style={styles.addIcon}>
            <Ionicons name="add" size={18} color={colors.primary} />
          </View>
          <Text style={styles.addLabel}>Adicionar passaporte</Text>
        </Pressable>
      </Card>
    </View>
  );
}

function PassportRow({
  passport,
  busy,
  onPress,
}: {
  passport: Passport;
  busy: boolean;
  onPress: () => void;
}) {
  const name = getCountryName(passport.country_code);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={passport.is_primary ? `${name}, passaporte principal` : name}
      accessibilityHint="Abre as opções do passaporte"
      onPress={busy ? undefined : onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <CountryFlag code={passport.country_code} />

      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {passport.is_primary ? <Text style={styles.primaryTag}>Principal</Text> : null}
      </View>

      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <>
          {passport.is_primary ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          ) : null}
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </>
      )}
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
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  loading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
