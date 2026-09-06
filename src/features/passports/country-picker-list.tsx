import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { CountryFlag } from '@/components/ui/country-flag';
import { SearchField } from '@/components/ui/search-field';
import { searchCountries, type Country } from '@/constants/countries';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type CountryPickerListProps = {
  onSelect: (country: Country) => void;
  /** Códigos já usados: aparecem marcados e não são selecionáveis. */
  disabledCodes?: readonly string[];
  /**
   * Códigos selecionados no momento. Diferente de `disabledCodes`, continuam
   * clicáveis — é o modo multisseleção usado na criação de viagem.
   */
  selectedCodes?: readonly string[];
  /** Código em gravação, para mostrar o indicador na linha certa. */
  busyCode?: string | null;
  /** Conteúdo fixo acima da busca (título do modal, pergunta do onboarding). */
  header?: React.ReactNode;
};

/**
 * Busca de países com bandeira, compartilhada pelo modal de adicionar
 * passaporte e pelo onboarding — a lista de países vive só em
 * `@/constants/countries`.
 */
export function CountryPickerList({
  onSelect,
  disabledCodes = [],
  selectedCodes = [],
  busyCode = null,
  header,
}: CountryPickerListProps) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchCountries(query), [query]);
  const disabled = useMemo(() => new Set(disabledCodes), [disabledCodes]);
  const selected = useMemo(() => new Set(selectedCodes), [selectedCodes]);

  return (
    <FlatList
      data={results}
      keyExtractor={(country) => country.code}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      // Altura explícita: dentro de apresentações modais o `flex` do pai nem
      // sempre chega até aqui, e a lista acabava com altura zero.
      style={styles.list}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.headerArea}>
          {header}
          <SearchField placeholder="Buscar país..." value={query} onChangeText={setQuery} />
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Nenhum país encontrado para “{query}”.</Text>}
      renderItem={({ item }) => (
        <CountryRow
          country={item}
          disabled={disabled.has(item.code)}
          selected={selected.has(item.code)}
          busy={busyCode === item.code}
          onPress={() => onSelect(item)}
        />
      )}
    />
  );
}

function CountryRow({
  country,
  disabled,
  selected,
  busy,
  onPress,
}: {
  country: Country;
  disabled: boolean;
  selected: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  const blocked = disabled || busy;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={country.name}
      accessibilityState={{ disabled: blocked, selected }}
      accessibilityHint={disabled ? 'Já adicionado' : undefined}
      onPress={blocked ? undefined : onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && !blocked && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}>
      <CountryFlag code={country.code} />

      <Text style={styles.name} numberOfLines={1}>
        {country.name}
      </Text>

      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : disabled || selected ? (
        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    alignSelf: 'stretch',
  },
  content: {
    paddingHorizontal: spacing.xl - spacing.xs,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  headerArea: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  rowPressed: {
    backgroundColor: colors.primarySoft,
  },
  rowSelected: {
    backgroundColor: colors.primarySoft,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  name: {
    ...typography.body,
    flex: 1,
    color: colors.text,
  },
  empty: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
