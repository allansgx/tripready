import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { TextField } from '@/components/ui/text-field';
import type { Country } from '@/constants/countries';
import { useAuth } from '@/features/auth/auth-context';
import { CountryPickerList } from '@/features/passports/country-picker-list';
import { CityStep } from '@/features/trips/city-step';
import { formatTripDates } from '@/features/trips/trip-format';
import { createTripWithDestinations } from '@/features/trips/trip-persistence';
import { useTripDraft } from '@/features/trips/use-trip-draft';
import { colors, spacing, typography } from '@/theme/tokens';

const STEPS = ['countries', 'cities', 'dates', 'name'] as const;
type Step = (typeof STEPS)[number];

const TITLES: Record<Step, string> = {
  countries: 'Para onde você vai?',
  cities: 'Quais cidades você pretende visitar?',
  dates: 'Quando você vai viajar?',
  name: 'Como quer chamar esta viagem?',
};

const SUBTITLES: Record<Step, string> = {
  countries: 'Escolha um ou mais países do seu roteiro.',
  cities: 'Escolha as cidades que já estão no plano. Dá para decidir isso depois.',
  dates: 'Toque na data de ida e depois na de volta.',
  name: 'Sugerimos um nome pelos destinos. Ajuste se quiser.',
};

export default function NewTripScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // Mesmo estado de seleção usado na edição: as regras de país/cidade/nome
  // vivem em um lugar só.
  const { draft, toggleCountry, toggleCity, addCity, changeName, setRange, resolvedName } =
    useTripDraft();

  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const step = STEPS[stepIndex];
  const { countryCodes, cities, range, name } = draft;

  function goBack() {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    setStepIndex((current) => current - 1);
  }

  async function createTrip() {
    if (!user) return;

    setBusy(true);
    setNotice(null);
    try {
      const trip = await createTripWithDestinations(user.id, draft, resolvedName);
      router.replace({ pathname: '/trip-preparing', params: { tripId: trip.id } });
    } catch {
      setNotice('Sua conexão oscilou. Toque em "Criar viagem" para tentar de novo.');
      setBusy(false);
    }
  }

  const canContinue =
    step === 'countries'
      ? countryCodes.length > 0
      : step === 'dates'
        ? Boolean(range.start && range.end)
        : true;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={stepIndex === 0 ? 'Fechar' : 'Voltar'}
          hitSlop={12}
          onPress={goBack}
          style={styles.headerButton}>
          <Ionicons
            name={stepIndex === 0 ? 'close' : 'chevron-back'}
            size={22}
            color={colors.text}
          />
        </Pressable>
        <Text style={styles.stepIndicator}>
          Etapa {stepIndex + 1} de {STEPS.length}
        </Text>
      </View>

      <View style={styles.titles}>
        <Text style={styles.title}>{TITLES[step]}</Text>
        <Text style={styles.subtitle}>{SUBTITLES[step]}</Text>
      </View>

      {step === 'countries' ? (
        <CountryPickerList
          searchByCity
          onSelect={(country: Country) => toggleCountry(country.code)}
          selectedCodes={countryCodes}
        />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {step === 'cities' ? (
              <CityStep
                countryCodes={countryCodes}
                selected={cities}
                onToggle={toggleCity}
                onAdd={addCity}
              />
            ) : null}

            {step === 'dates' ? (
              <View style={styles.datesArea}>
                <DateRangePicker value={range} onChange={setRange} />
                <Text style={styles.datesSummary}>
                  {range.start && range.end
                    ? formatTripDates(range.start, range.end)
                    : range.start
                      ? 'Agora escolha a data de volta.'
                      : 'Escolha a data de ida.'}
                </Text>
              </View>
            ) : null}

            {step === 'name' ? (
              <TextField
                label="Nome da viagem"
                value={name}
                onChangeText={changeName}
                placeholder="Minha viagem"
                returnKeyType="done"
              />
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <View style={styles.footer}>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        {step === 'name' ? (
          <Button label="Criar viagem" onPress={() => void createTrip()} loading={busy} />
        ) : (
          <Button
            label={
              step === 'countries' && countryCodes.length > 0
                ? `Continuar com ${countryCodes.length} ${countryCodes.length === 1 ? 'país' : 'países'}`
                : 'Continuar'
            }
            onPress={() => setStepIndex((current) => current + 1)}
            disabled={!canContinue}
          />
        )}

        {step === 'cities' ? (
          <Button
            label="Pular por enquanto"
            variant="ghost"
            onPress={() => setStepIndex((current) => current + 1)}
          />
        ) : null}

        {step === 'countries' && countryCodes.length === 0 ? (
          <Text style={styles.hint}>Escolha ao menos um país para continuar.</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl - spacing.xs,
    paddingTop: spacing.sm,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  stepIndicator: { ...typography.caption, color: colors.textSecondary },
  titles: {
    paddingHorizontal: spacing.xl - spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  title: { ...typography.screenTitle, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  body: {
    paddingHorizontal: spacing.xl - spacing.xs,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  datesArea: { gap: spacing.md },
  datesSummary: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl - spacing.xs,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  notice: { ...typography.caption, color: colors.text },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
