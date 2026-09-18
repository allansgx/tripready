import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { showDialog } from '@/components/ui/dialog';
import type { Country } from '@/constants/countries';
import { CountryPickerList } from '@/features/passports/country-picker-list';
import { usePassports } from '@/features/passports/passports-context';
import { t } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/** Fica na raiz das rotas para ser apresentado como sheet nativo sobre as abas. */
export default function PassportPickerScreen() {
  const { addPassport, usedCountryCodes } = usePassports();
  const router = useRouter();
  const [busyCode, setBusyCode] = useState<string | null>(null);

  async function handleSelect(country: Country) {
    setBusyCode(country.code);
    try {
      await addPassport(country.code);
      router.back();
    } catch (error) {
      showDialog(
        t('passports.picker.addFailed.title'),
        error instanceof Error ? error.message : t('passports.picker.addFailed.fallback'),
      );
    } finally {
      setBusyCode(null);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <CountryPickerList
        onSelect={handleSelect}
        disabledCodes={usedCountryCodes}
        busyCode={busyCode}
        header={
          <View style={styles.header}>
            <Text style={styles.title}>{t('passports.picker.title')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.action.close')}
              hitSlop={12}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.close, pressed && styles.closePressed]}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
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
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
    flex: 1,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePressed: {
    backgroundColor: colors.primarySoft,
  },
});
