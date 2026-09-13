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
import { CityStep } from '@/features/trips/components/city-step';
import { DateRangeSummary } from '@/features/trips/components/date-range-summary';
import { createTripWithDestinations } from '@/features/trips/data/trip-persistence';
import { useTripDraft } from '@/features/trips/hooks/use-trip-draft';
import { colors, spacing, typography } from '@/theme/tokens';

const STEPS = ['countries', 'cities', 'dates', 'name'] as const;
type Step = (typeof STEPS)[number];

/** O nome cabe no card da lista e no destaque da Home; acima disso, não cabe. */
const NAME_MAX_LENGTH = 60;

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
  name: 'Confira o roteiro e ajuste o nome se quiser.',
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

  // Sem país nenhum não há cidade a escolher, e o fluxo volta para os destinos.
  function removeCountry(code: string) {
    toggleCountry(code);
    if (countryCodes.length === 1) setStepIndex(0);
  }

  async function createTrip() {
    if (!user || busy) return;

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

  // Um botão só por etapa: sem cidade escolhida, seguir é pular.
  const continueLabel =
    step === 'countries' && countryCodes.length > 0
      ? `Continuar com ${countryCodes.length} ${countryCodes.length === 1 ? 'país' : 'países'}`
      : step === 'cities'
        ? cities.length === 0
          ? 'Pular por enquanto'
          : `Continuar com ${cities.length} ${cities.length === 1 ? 'cidade' : 'cidades'}`
        : 'Continuar';

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
                onRemoveCountry={removeCountry}
              />
            ) : null}

            {step === 'dates' ? (
              <View style={styles.datesArea}>
                <DateRangePicker value={range} onChange={setRange} />
                <DateRangeSummary
                  value={range}
                  onClear={() => setRange({ start: null, end: null })}
                />
              </View>
            ) : null}

            {step === 'name' ? (
              <View style={styles.nameArea}>
                <TextField
                  label="Nome da viagem"
                  value={name}
                  onChangeText={changeName}
                  placeholder="Minha viagem"
                  returnKeyType="done"
                  maxLength={NAME_MAX_LENGTH}
                  // O nome sugerido já vem escrito no campo: tocar seleciona
                  // tudo, para trocá-lo custar uma digitada e não uma apagada.
                  selectTextOnFocus
                  onSubmitEditing={() => void createTrip()}
                />

                {/*
                  A conferência repete os blocos das etapas anteriores em vez de
                  resumi-los em outro formato, mas aqui eles são informação: o
                  que muda cada um é o "Alterar" do cabeçalho, que devolve a
                  pessoa à etapa dona daquela decisão. Um chip que responde ao
                  toque no meio de uma revisão é o que se desfaz sem querer — e
                  tirar um país leva junto as cidades dele.
                */}
                <View style={styles.block}>
                  <ReviewHeader label="Datas" onEdit={() => setStepIndex(2)} />
                  <DateRangeSummary value={range} />
                </View>

                <View style={styles.block}>
                  <ReviewHeader label="Roteiro" onEdit={() => setStepIndex(1)} />
                  <CityStep countryCodes={countryCodes} selected={cities} />
                </View>
              </View>
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
            label={continueLabel}
            onPress={() => setStepIndex((current) => current + 1)}
            disabled={!canContinue}
          />
        )}

        {step === 'countries' && countryCodes.length === 0 ? (
          <Text style={styles.hint}>Escolha ao menos um país para continuar.</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

/** O que é o bloco e o único caminho para mudá-lo. */
function ReviewHeader({ label, onEdit }: { label: string; onEdit: () => void }) {
  return (
    <View style={styles.blockHeader}>
      <Text style={styles.blockLabel}>{label.toUpperCase()}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Alterar ${label.toLowerCase()}`}
        hitSlop={10}
        onPress={onEdit}>
        <Text style={styles.blockAction}>Alterar</Text>
      </Pressable>
    </View>
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
  nameArea: { gap: spacing.xl },
  block: { gap: spacing.sm },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  blockLabel: { ...typography.sectionLabel, color: colors.textSecondary },
  blockAction: { ...typography.caption, fontWeight: '600', color: colors.primary },
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
