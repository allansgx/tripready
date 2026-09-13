import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { showDialog } from '@/components/ui/dialog';
import type { Country } from '@/constants/countries';
import { CountryPickerList } from '@/features/passports/country-picker-list';
import { toPassportMessage } from '@/features/passports/passport-messages';
import { usePassports } from '@/features/passports/passports-context';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Etapa única de onboarding: qual passaporte o usuário usa para viajar. A
 * nacionalidade é sempre escolhida aqui, nunca inferida do provedor de login.
 */
export default function OnboardingScreen() {
  const { addPassport } = usePassports();
  const [busyCode, setBusyCode] = useState<string | null>(null);

  async function handleSelect(country: Country) {
    setBusyCode(country.code);
    try {
      await addPassport(country.code);
    } catch (error) {
      showDialog('Não foi possível salvar', toPassportMessage(error));
      setBusyCode(null);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <CountryPickerList
        onSelect={handleSelect}
        busyCode={busyCode}
        header={
          <View style={styles.header}>
            <Text style={styles.title}>Qual passaporte você usa para viajar?</Text>
            <Text style={styles.subtitle}>
              Usamos essa informação para descobrir os requisitos de cada destino. Você pode
              adicionar outros passaportes depois, no seu perfil.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.screenTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
