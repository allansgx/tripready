import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CountryFlag } from '@/components/ui/country-flag';
import { getCitySuggestions } from '@/constants/cities';
import { getCountryName } from '@/constants/countries';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export type SelectedCity = { countryCode: string; cityName: string };

/**
 * Seleção de cidades por país escolhido.
 *
 * As sugestões cobrem destinos comuns; para qualquer outro lugar, o campo de
 * texto adiciona a cidade digitada — `trip_cities.city_name` é texto livre.
 */
export function CityStep({
  countryCodes,
  selected,
  onToggle,
  onAdd,
}: {
  countryCodes: readonly string[];
  selected: readonly SelectedCity[];
  onToggle: (city: SelectedCity) => void;
  onAdd: (city: SelectedCity) => void;
}) {
  return (
    <View style={styles.container}>
      {countryCodes.map((code) => (
        <CountrySection
          key={code}
          code={code}
          selected={selected.filter((city) => city.countryCode === code)}
          onToggle={onToggle}
          onAdd={onAdd}
        />
      ))}
    </View>
  );
}

function CountrySection({
  code,
  selected,
  onToggle,
  onAdd,
}: {
  code: string;
  selected: readonly SelectedCity[];
  onToggle: (city: SelectedCity) => void;
  onAdd: (city: SelectedCity) => void;
}) {
  const [draft, setDraft] = useState('');
  const suggestions = getCitySuggestions(code);
  const selectedNames = new Set(selected.map((city) => city.cityName));

  // Cidades digitadas pelo usuário entram junto das sugestões.
  const custom = selected
    .map((city) => city.cityName)
    .filter((cityName) => !suggestions.includes(cityName));

  function submitDraft() {
    const cityName = draft.trim();
    if (!cityName) return;
    if (!selectedNames.has(cityName)) {
      onAdd({ countryCode: code, cityName });
    }
    setDraft('');
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <CountryFlag code={code} />
        <Text style={styles.sectionTitle}>{getCountryName(code)}</Text>
      </View>

      <View style={styles.chips}>
        {[...suggestions, ...custom].map((cityName) => {
          const isSelected = selectedNames.has(cityName);
          return (
            <Pressable
              key={cityName}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onToggle({ countryCode: code, cityName })}
              style={[styles.chip, isSelected && styles.chipSelected]}>
              {isSelected ? (
                <Ionicons name="checkmark" size={14} color={colors.contrastText} />
              ) : null}
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {cityName}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={
            suggestions.length > 0 ? 'Adicionar outra cidade' : 'Digite uma cidade deste país'
          }
          placeholderTextColor={colors.textSecondary}
          returnKeyType="done"
          onSubmitEditing={submitDraft}
          autoCapitalize="words"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar cidade"
          onPress={submitDraft}
          style={styles.addButton}>
          <Ionicons name="add" size={20} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl },
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { ...typography.bodyStrong, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { ...typography.caption, fontWeight: '600', color: colors.text },
  chipLabelSelected: { color: colors.contrastText },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
