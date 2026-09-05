import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Country } from '@/constants/countries';
import { CountryPickerList } from '@/features/passports/country-picker-list';
import { usePassports } from '@/features/passports/passports-context';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Etapa única de onboarding: qual passaporte o usuário usa para viajar.
 *
 * O layout raiz só monta esta rota quando o usuário está autenticado e ainda
 * não tem nenhum passaporte — por isso ela aparece uma única vez, e nunca para
 * quem já cadastrou um. A nacionalidade é sempre escolhida aqui: nada é
 * inferido do perfil do Google ou da Apple.
 *
 * O país escolhido vira o passaporte principal (é o primeiro do usuário), e
 * assim que ele existe o layout raiz libera a área principal automaticamente.
 */
export default function OnboardingScreen() {
  const { addPassport } = usePassports();
  const [busyCode, setBusyCode] = useState<string | null>(null);

  async function handleSelect(country: Country) {
    setBusyCode(country.code);
    try {
      await addPassport(country.code);
    } catch (error) {
      Alert.alert(
        'Não foi possível salvar',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
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
