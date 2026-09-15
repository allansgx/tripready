import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { showDialog } from '@/components/ui/dialog';
import { CountryFlag } from '@/components/ui/country-flag';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { SectionLabel } from '@/components/ui/section-label';
import { TextField } from '@/components/ui/text-field';
import { getCountryName, type Country } from '@/constants/countries';
import { CountryPickerList } from '@/features/passports/country-picker-list';
import { usePassports } from '@/features/passports/passports-context';
import { CityStep } from '@/features/trips/components/city-step';
import { DateRangeSummary } from '@/features/trips/components/date-range-summary';
import {
  updateTripWithDestinations,
  type TripEditBaseline,
} from '@/features/trips/data/trip-persistence';
import {
  canAddCountry,
  checkTripLimits,
  formatCountrySelection,
  MAX_TRIP_DURATION_DAYS,
  TRIP_DURATION_HINT,
  TRIP_LIMIT_MESSAGES,
} from '@/features/trips/domain/trip-limits';
import { useTripDraft } from '@/features/trips/hooks/use-trip-draft';
import { t } from '@/i18n';
import { tripsService } from '@/services';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/** O nome cabe no card da lista e no destaque da Home; acima disso, não cabe. */
const NAME_MAX_LENGTH = 60;

/**
 * "Editar viagem": tela única com as mesmas seções e o mesmo `useTripDraft` do
 * fluxo de criação, inicializado com os dados existentes.
 */
export default function EditTripScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const { primary } = usePassports();

  const {
    draft,
    isDirty,
    toggleCountry,
    toggleCity,
    addCity,
    changeName,
    setRange,
    hydrate,
    resolvedName,
  } = useTripDraft();

  const [baseline, setBaseline] = useState<TripEditBaseline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pickingCountries, setPickingCountries] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    let active = true;

    tripsService
      .getDetail(tripId)
      .then((detail) => {
        if (!active || !detail) return;

        hydrate({
          name: detail.name,
          countryCodes: (detail.trip_countries ?? []).map((country) => country.country_code),
          cities: (detail.trip_cities ?? []).map((city) => ({
            countryCode: city.country_code,
            cityName: city.city_name,
          })),
          range: { start: detail.start_date, end: detail.end_date },
        });

        setBaseline({
          countryCodes: (detail.trip_countries ?? []).map((country) => country.country_code),
          cities: detail.trip_cities ?? [],
          requirements: detail.trip_requirements ?? [],
        });
      })
      .catch(() => {
        if (active) setNotice('Sua conexão oscilou. Toque em salvar para tentar de novo.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tripId, hydrate]);

  const limits = checkTripLimits({
    countryCodes: draft.countryCodes,
    startDate: draft.range.start,
    endDate: draft.range.end,
  });

  // O país que não cabe não entra calado: o rodapé explica por que aquele toque
  // não marcou nada.
  function selectCountry(country: Country) {
    if (!canAddCountry(draft.countryCodes, country.code)) {
      setNotice(TRIP_LIMIT_MESSAGES.countries);
      return;
    }
    setNotice(null);
    toggleCountry(country.code);
  }

  const close = useCallback(() => {
    if (!isDirty) {
      router.back();
      return;
    }

    showDialog('Descartar alterações?', 'Você tem alterações que ainda não foram salvas.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
    ]);
  }, [isDirty, router]);

  async function save() {
    if (!tripId || !baseline) return;

    // Última barreira antes de gravar: editar não pode levar a viagem para fora
    // dos limites.
    if (!limits.isValid) {
      setNotice(limits.message);
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      await updateTripWithDestinations(
        tripId,
        draft,
        resolvedName,
        baseline,
        primary?.country_code ?? null,
      );
      setSaved(true);
      setTimeout(() => router.back(), 900);
    } catch {
      setNotice('Sua conexão oscilou. Toque em "Salvar alterações" para tentar de novo.');
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.hint}>Abrindo sua viagem...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Mesmo seletor da criação, em tela cheia.
  if (pickingCountries) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.pickerHeader}>
          <Text style={styles.title}>Para onde você vai?</Text>
          <Text style={styles.subtitle}>Toque para adicionar ou remover países do roteiro.</Text>
        </View>

        <CountryPickerList
          searchByCity
          onSelect={selectCountry}
          selectedCodes={draft.countryCodes}
        />

        <View style={styles.footer}>
          <Button
            label="Concluir seleção"
            onPress={() => {
              setNotice(null);
              setPickingCountries(false);
            }}
            disabled={draft.countryCodes.length === 0}
          />
          {/* Aqui o botão não conta os países, então o contador segue útil — e
              dá lugar ao aviso quando o toque esbarra no teto. */}
          <Text style={styles.hint}>
            {notice ??
              (draft.countryCodes.length === 0
                ? 'Mantenha ao menos um país no roteiro.'
                : formatCountrySelection(draft.countryCodes.length))}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          hitSlop={12}
          onPress={close}
          style={styles.headerButton}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Editar viagem</Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {saved ? (
            <View style={styles.savedBanner}>
              <Text style={styles.savedText}>Viagem atualizada! 🎉</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionLabel>{t('trip.edit.section.name')}</SectionLabel>
            <TextField
              label="Nome da viagem"
              value={draft.name}
              onChangeText={changeName}
              placeholder="Europa Central"
              returnKeyType="done"
              maxLength={NAME_MAX_LENGTH}
              selectTextOnFocus
            />
          </View>

          <View style={styles.section}>
            <SectionLabel>{t('trip.edit.section.countries')}</SectionLabel>
            <View style={styles.countryList}>
              {draft.countryCodes.map((code) => (
                <View key={code} style={styles.countryRow}>
                  <CountryFlag code={code} />
                  <Text style={styles.countryName} numberOfLines={1}>
                    {getCountryName(code)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${getCountryName(code)}`}
                    hitSlop={10}
                    onPress={() => toggleCountry(code)}>
                    <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>

            <Button
              label="Adicionar ou remover países"
              variant="ghost"
              onPress={() => setPickingCountries(true)}
            />
          </View>

          {draft.countryCodes.length > 0 ? (
            <View style={styles.section}>
              <SectionLabel>{t('trip.edit.section.cities')}</SectionLabel>
              <CityStep
                countryCodes={draft.countryCodes}
                selected={draft.cities}
                onToggle={toggleCity}
                onAdd={addCity}
              />
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionLabel>{t('trip.edit.section.dates')}</SectionLabel>
            <DateRangePicker
              value={draft.range}
              onChange={setRange}
              maxDurationDays={MAX_TRIP_DURATION_DAYS}
            />
            <DateRangeSummary
              value={draft.range}
              onClear={() => setRange({ start: null, end: null })}
            />
            <Text style={styles.hint}>{limits.isValid ? TRIP_DURATION_HINT : limits.message}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <Button
          label="Salvar alterações"
          onPress={() => void save()}
          loading={busy}
          disabled={!isDirty || saved || draft.countryCodes.length === 0 || !limits.isValid}
        />
        {!isDirty && !saved ? (
          <Text style={styles.hint}>Altere algo acima para salvar.</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl - spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.bodyStrong, color: colors.text },
  pickerHeader: {
    paddingHorizontal: spacing.xl - spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  title: { ...typography.screenTitle, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  body: {
    paddingHorizontal: spacing.xl - spacing.xs,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  section: { gap: spacing.md },
  countryList: { gap: spacing.sm },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  countryName: { ...typography.body, color: colors.text, flex: 1 },
  savedBanner: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  savedText: { ...typography.bodyStrong, color: colors.primary, textAlign: 'center' },
  footer: {
    paddingHorizontal: spacing.xl - spacing.xs,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  notice: { ...typography.caption, color: colors.text },
  hint: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
