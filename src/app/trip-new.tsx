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
import { formatTripLimitMessage } from '@/features/trips/domain/trip-format';
import {
  canAddCountry,
  checkTripLimits,
  MAX_TRIP_COUNTRIES,
  MAX_TRIP_DURATION_DAYS,
  type TripLimitIssue,
} from '@/features/trips/domain/trip-limits';
import { useTripDraft } from '@/features/trips/hooks/use-trip-draft';
import { t, type MessageKey } from '@/i18n';
import { colors, spacing, typography } from '@/theme/tokens';

const LIMIT_MESSAGE_MAX: Partial<Record<TripLimitIssue, number>> = {
  countries: MAX_TRIP_COUNTRIES,
  duration: MAX_TRIP_DURATION_DAYS,
};

/** Frase do limite estourado; nula quando a viagem está dentro deles. */
function limitMessage(issue: TripLimitIssue | null): string | null {
  if (!issue) return null;
  return formatTripLimitMessage(issue, LIMIT_MESSAGE_MAX[issue]);
}

const STEPS = ['countries', 'cities', 'dates', 'name'] as const;
type Step = (typeof STEPS)[number];

/** O nome cabe no card da lista e no destaque da Home; acima disso, não cabe. */
const NAME_MAX_LENGTH = 60;

const TITLE_KEY: Record<Step, MessageKey> = {
  countries: 'trip.new.title.countries',
  cities: 'trip.new.title.cities',
  dates: 'trip.new.title.dates',
  name: 'trip.new.title.name',
};

const SUBTITLE_KEY: Record<Step, MessageKey> = {
  countries: 'trip.new.subtitle.countries',
  cities: 'trip.new.subtitle.cities',
  dates: 'trip.new.subtitle.dates',
  name: 'trip.new.subtitle.name',
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

  const limits = checkTripLimits({
    countryCodes,
    startDate: range.start,
    endDate: range.end,
  });

  function goBack() {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    setNotice(null);
    setStepIndex((current) => current - 1);
  }

  function goForward() {
    setNotice(null);
    setStepIndex((current) => current + 1);
  }

  // O país que não cabe não entra calado: a lista continua aberta e o rodapé
  // explica por que aquele toque não marcou nada.
  function selectCountry(country: Country) {
    if (!canAddCountry(countryCodes, country.code)) {
      setNotice(t('trip.limit.countries', { max: MAX_TRIP_COUNTRIES }));
      return;
    }
    setNotice(null);
    toggleCountry(country.code);
  }

  // Sem país nenhum não há cidade a escolher, e o fluxo volta para os destinos.
  function removeCountry(code: string) {
    toggleCountry(code);
    if (countryCodes.length === 1) setStepIndex(0);
  }

  async function createTrip() {
    if (!user || busy) return;

    // Última barreira antes de gravar: nenhum caminho da tela pode criar uma
    // viagem fora dos limites.
    if (!limits.isValid) {
      setNotice(limitMessage(limits.issue));
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const trip = await createTripWithDestinations(user.id, draft, resolvedName);
      router.replace({ pathname: '/trip-preparing', params: { tripId: trip.id } });
    } catch {
      setNotice(t('trip.new.error.createRetry'));
      setBusy(false);
    }
  }

  // Na etapa de países o aviso mora embaixo do botão, no lugar da orientação
  // que ele substitui; nas demais, acima. O rótulo do botão já conta quantos
  // países foram escolhidos, então não há contador a repetir aqui.
  const countriesHint =
    notice ?? (countryCodes.length === 0 ? t('trip.new.hint.chooseCountry') : null);

  const canContinue =
    step === 'countries'
      ? countryCodes.length > 0
      : step === 'dates'
        ? Boolean(range.start && range.end) && limits.isValid
        : true;

  // Um botão só por etapa: sem cidade escolhida, seguir é pular.
  const continueLabel =
    step === 'countries' && countryCodes.length > 0
      ? t('trip.new.continueWithCountries', { count: countryCodes.length })
      : step === 'cities'
        ? cities.length === 0
          ? t('trip.new.skipForNow')
          : t('trip.new.continueWithCities', { count: cities.length })
        : t('common.action.continue');

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(stepIndex === 0 ? 'common.action.close' : 'common.action.back')}
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
          {t('trip.new.stepIndicator', { current: stepIndex + 1, total: STEPS.length })}
        </Text>
      </View>

      <View style={styles.titles}>
        <Text style={styles.title}>{t(TITLE_KEY[step])}</Text>
        <Text style={styles.subtitle}>{t(SUBTITLE_KEY[step])}</Text>
      </View>

      {step === 'countries' ? (
        <CountryPickerList searchByCity onSelect={selectCountry} selectedCodes={countryCodes} />
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
                <DateRangePicker
                  value={range}
                  onChange={setRange}
                  maxDurationDays={MAX_TRIP_DURATION_DAYS}
                />
                <DateRangeSummary
                  value={range}
                  onClear={() => setRange({ start: null, end: null })}
                />
                <Text style={styles.hint}>
                  {limits.isValid
                    ? t('trip.limit.durationHint', { max: MAX_TRIP_DURATION_DAYS })
                    : limitMessage(limits.issue)}
                </Text>
              </View>
            ) : null}

            {step === 'name' ? (
              <View style={styles.nameArea}>
                <TextField
                  label={t('trip.name.label')}
                  value={name}
                  onChangeText={changeName}
                  placeholder={t('trip.new.name.placeholder')}
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
                  <ReviewHeader
                    label={t('trip.review.dates.label')}
                    a11yLabel={t('trip.review.dates.action')}
                    onEdit={() => setStepIndex(2)}
                  />
                  <DateRangeSummary value={range} />
                </View>

                <View style={styles.block}>
                  <ReviewHeader
                    label={t('trip.review.itinerary.label')}
                    a11yLabel={t('trip.review.itinerary.action')}
                    onEdit={() => setStepIndex(1)}
                  />
                  <CityStep countryCodes={countryCodes} selected={cities} />
                </View>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <View style={styles.footer}>
        {notice && step !== 'countries' ? <Text style={styles.notice}>{notice}</Text> : null}

        {step === 'name' ? (
          <Button
            label={t('trips.action.create')}
            onPress={() => void createTrip()}
            loading={busy}
          />
        ) : (
          <Button label={continueLabel} onPress={goForward} disabled={!canContinue} />
        )}

        {step === 'countries' && countriesHint ? (
          <Text style={styles.hint}>{countriesHint}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

/** O que é o bloco e o único caminho para mudá-lo. */
function ReviewHeader({
  label,
  a11yLabel,
  onEdit,
}: {
  label: string;
  a11yLabel: string;
  onEdit: () => void;
}) {
  return (
    <View style={styles.blockHeader}>
      <Text style={styles.blockLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        hitSlop={10}
        onPress={onEdit}>
        <Text style={styles.blockAction}>{t('common.action.change')}</Text>
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
