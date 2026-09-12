import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { CountryFlag } from '@/components/ui/country-flag';
import { getCitySuggestions } from '@/constants/cities';
import { getCountryName, normalizeSearch } from '@/constants/countries';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export type SelectedCity = { countryCode: string; cityName: string };

/**
 * Seleção de cidades por país escolhido.
 *
 * As sugestões cobrem destinos comuns; para qualquer outro lugar, o campo de
 * texto adiciona a cidade digitada — `trip_cities.city_name` é texto livre.
 *
 * Com mais de um país, os blocos viram sanfona: um roteiro de quatro países
 * abria quatro listas de chips com quatro campos de texto, e a tela deixava de
 * caber. Um país só continua aberto, porque esconder a única coisa da tela não
 * ajuda ninguém.
 *
 * Sem handlers, a mesma lista vira leitura: só as cidades escolhidas, como
 * etiquetas. É a forma que a conferência final usa, onde o bloco é informação
 * e quem edita é o "Alterar" do cabeçalho — um chip que responde ao toque no
 * meio de uma revisão é justamente o que se remove sem querer.
 */
export function CityStep({
  countryCodes,
  selected,
  onToggle,
  onAdd,
  onRemoveCountry,
}: {
  countryCodes: readonly string[];
  selected: readonly SelectedCity[];
  /** Sem ele os chips viram etiquetas, e as sugestões não escolhidas somem. */
  onToggle?: (city: SelectedCity) => void;
  /** Sem ele o campo de digitar cidade não aparece. */
  onAdd?: (city: SelectedCity) => void;
  /** Quando existe, cada país ganha um botão que o tira do roteiro. */
  onRemoveCountry?: (code: string) => void;
}) {
  const [openCode, setOpenCode] = useState<string | null>(countryCodes[0] ?? null);

  // Fechar tudo é uma escolha válida e precisa sobreviver; o que não sobrevive
  // é um país aberto que saiu do roteiro.
  const open =
    openCode !== null && !countryCodes.includes(openCode) ? (countryCodes[0] ?? null) : openCode;

  const collapsible = countryCodes.length > 1;

  return (
    <View style={styles.container}>
      {countryCodes.map((code) => (
        <CountrySection
          key={code}
          code={code}
          selected={selected.filter((city) => city.countryCode === code)}
          expanded={!collapsible || open === code}
          collapsible={collapsible}
          onOpen={() => setOpenCode((current) => (current === code ? null : code))}
          onToggle={onToggle}
          onAdd={onAdd}
          onRemoveCountry={onRemoveCountry}
        />
      ))}
    </View>
  );
}

function CountrySection({
  code,
  selected,
  expanded,
  collapsible,
  onOpen,
  onToggle,
  onAdd,
  onRemoveCountry,
}: {
  code: string;
  selected: readonly SelectedCity[];
  expanded: boolean;
  collapsible: boolean;
  onOpen: () => void;
  onToggle?: (city: SelectedCity) => void;
  onAdd?: (city: SelectedCity) => void;
  onRemoveCountry?: (code: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const countryName = getCountryName(code);
  const suggestions = getCitySuggestions(code);

  // A comparação ignora acento e caixa: "sao paulo" e "São Paulo" são a mesma
  // cidade, e o `unique` de `trip_cities` não sabe disso.
  const selectedKeys = new Set(selected.map((city) => normalizeSearch(city.cityName)));
  const suggestionKeys = new Set(suggestions.map(normalizeSearch));

  // Cidades digitadas pelo usuário entram depois das sugestões.
  const custom = selected
    .map((city) => city.cityName)
    .filter((cityName) => !suggestionKeys.has(normalizeSearch(cityName)));

  const summary =
    selected.length > 0 ? selected.map((city) => city.cityName).join(', ') : 'Nenhuma cidade ainda';

  function submitDraft() {
    const typed = draft.trim();
    if (!typed) return;

    // Digitou uma sugestão: vale a grafia do catálogo, para não aparecerem duas
    // versões da mesma cidade lado a lado.
    const known = suggestions.find((name) => normalizeSearch(name) === normalizeSearch(typed));
    const cityName = known ?? typed;

    if (!selectedKeys.has(normalizeSearch(cityName))) {
      onAdd?.({ countryCode: code, cityName });
    }
    setDraft('');
  }

  return (
    <Animated.View layout={LinearTransition.duration(180)} style={styles.section}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole={collapsible ? 'button' : undefined}
          accessibilityLabel={countryName}
          accessibilityState={collapsible ? { expanded } : undefined}
          accessibilityHint={collapsible ? 'Mostra as cidades deste país' : undefined}
          onPress={collapsible ? onOpen : undefined}
          style={styles.header}>
          <CountryFlag code={code} />

          <View style={styles.headerTexts}>
            <Text style={styles.sectionTitle}>{countryName}</Text>
            <Text style={styles.sectionSummary} numberOfLines={1}>
              {summary}
            </Text>
          </View>

          {collapsible ? (
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          ) : null}
        </Pressable>

        {onRemoveCountry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remover ${countryName} do roteiro`}
            hitSlop={10}
            onPress={() => onRemoveCountry(code)}
            style={styles.removeButton}>
            <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={styles.body}>
          {onToggle ? (
            <View style={styles.chips}>
              {suggestions.map((cityName) => {
                const isSelected = selectedKeys.has(normalizeSearch(cityName));

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

              {/*
                A cidade digitada só existe na tela porque está selecionada:
                tocá-la não desmarca, apaga. Por isso ela leva um "x" no lugar
                do certinho — o ícone conta o que o toque faz.
              */}
              {custom.map((cityName) => (
                <Pressable
                  key={cityName}
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${cityName}`}
                  onPress={() => onToggle({ countryCode: code, cityName })}
                  style={[styles.chip, styles.chipSelected]}>
                  <Text style={[styles.chipLabel, styles.chipLabelSelected]}>{cityName}</Text>
                  <Ionicons name="close" size={14} color={colors.contrastText} />
                </Pressable>
              ))}
            </View>
          ) : selected.length > 0 ? (
            <View style={styles.chips}>
              {selected.map((city) => (
                <View key={city.cityName} style={[styles.chip, styles.chipSelected]}>
                  <Text style={[styles.chipLabel, styles.chipLabelSelected]}>{city.cityName}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyBody}>Cidades a definir neste país.</Text>
          )}

          {onAdd ? (
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
          ) : null}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  section: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  header: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
  },
  headerTexts: { flex: 1, gap: 2 },
  sectionTitle: { ...typography.bodyStrong, color: colors.text },
  sectionSummary: { ...typography.caption, color: colors.textSecondary },
  removeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  body: { gap: spacing.md, paddingBottom: spacing.sm },
  emptyBody: { ...typography.caption, color: colors.textSecondary },
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
