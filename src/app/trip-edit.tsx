import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { CountryFlag } from '@/components/ui/country-flag';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { SectionLabel } from '@/components/ui/section-label';
import { TextField } from '@/components/ui/text-field';
import { getCountryName, type Country } from '@/constants/countries';
import { CountryPickerList } from '@/features/passports/country-picker-list';
import { CityStep } from '@/features/trips/city-step';
import { formatTripDates } from '@/features/trips/trip-format';
import {
  updateTripWithDestinations,
  type TripEditBaseline,
} from '@/features/trips/trip-persistence';
import { useTripDraft } from '@/features/trips/use-trip-draft';
import { tripsService } from '@/services';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/**
 * "Editar viagem" — tela única com as mesmas seções do fluxo de criação.
 *
 * Reaproveita os componentes de lá (`CountryPickerList`, `CityStep`,
 * `DateRangePicker`, `TextField`) e o mesmo estado de seleção (`useTripDraft`),
 * apenas inicializado com os dados existentes. A seleção de países entra em
 * tela cheia por um modo interno, e não por outra rota, para a edição continuar
 * sendo uma tela só.
 */
export default function EditTripScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();

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

  const close = useCallback(() => {
    if (!isDirty) {
      router.back();
      return;
    }

    Alert.alert('Descartar alterações?', 'Você tem alterações que ainda não foram salvas.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
    ]);
  }, [isDirty, router]);

  async function save() {
    if (!tripId || !baseline) return;

    setBusy(true);
    setNotice(null);
    try {
      await updateTripWithDestinations(tripId, draft, resolvedName, baseline);
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
          onSelect={(country: Country) => toggleCountry(country.code)}
          selectedCodes={draft.countryCodes}
        />

        <View style={styles.footer}>
          <Button
            label="Concluir seleção"
            onPress={() => setPickingCountries(false)}
            disabled={draft.countryCodes.length === 0}
          />
          {draft.countryCodes.length === 0 ? (
            <Text style={styles.hint}>Mantenha ao menos um país no roteiro.</Text>
          ) : null}
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
            <SectionLabel>Nome</SectionLabel>
            <TextField
              label="Nome da viagem"
              value={draft.name}
              onChangeText={changeName}
              placeholder="Europa Central"
              returnKeyType="done"
            />
          </View>

          <View style={styles.section}>
            <SectionLabel>Países</SectionLabel>
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
              <SectionLabel>Cidades</SectionLabel>
              <CityStep
                countryCodes={draft.countryCodes}
                selected={draft.cities}
                onToggle={toggleCity}
                onAdd={addCity}
              />
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionLabel>Datas</SectionLabel>
            <DateRangePicker value={draft.range} onChange={setRange} />
            <Text style={styles.datesSummary}>
              {draft.range.start && draft.range.end
                ? formatTripDates(draft.range.start, draft.range.end)
                : draft.range.start
                  ? 'Agora escolha a data de volta.'
                  : 'Escolha a data de ida.'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <Button
          label="Salvar alterações"
          onPress={() => void save()}
          loading={busy}
          disabled={!isDirty || saved || draft.countryCodes.length === 0}
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
  datesSummary: { ...typography.body, color: colors.text, textAlign: 'center' },
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
