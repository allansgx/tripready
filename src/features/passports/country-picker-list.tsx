import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CountryFlag } from '@/components/ui/country-flag';
import { SearchField } from '@/components/ui/search-field';
import { searchCountries, type Country } from '@/constants/countries';
import { searchDestinations, type DestinationMatch } from '@/constants/destinations';
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
  /** Também encontra o país pelo nome de uma cidade; ligado só no roteiro. */
  searchByCity?: boolean;
  /** Conteúdo fixo acima da busca (título do modal, pergunta do onboarding). */
  header?: React.ReactNode;
};

/** Busca de países com bandeira, compartilhada pelas telas que escolhem país. */
export function CountryPickerList({
  onSelect,
  disabledCodes = [],
  selectedCodes = [],
  busyCode = null,
  searchByCity = false,
  header,
}: CountryPickerListProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<DestinationMatch>>(null);

  const results = useMemo<DestinationMatch[]>(
    () =>
      searchByCity
        ? searchDestinations(query)
        : searchCountries(query).map((country) => ({ country, city: null })),
    [query, searchByCity],
  );

  const disabled = useMemo(() => new Set(disabledCodes), [disabledCodes]);
  const selected = useMemo(() => new Set(selectedCodes), [selectedCodes]);

  // Só limpa e devolve o foco quando houve busca: sem nada digitado, abrir o
  // teclado encolheria a lista e empurraria a linha de baixo.
  function handleSelect(country: Country) {
    onSelect(country);
    if (!query) return;

    setQuery('');
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    inputRef.current?.focus();
  }

  return (
    <FlatList
      ref={listRef}
      data={results}
      keyExtractor={(item) => item.country.code}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      // Altura explícita: dentro de apresentações modais o `flex` do pai nem
      // sempre chega até aqui, e a lista acabava com altura zero.
      style={styles.list}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.headerArea}>
          {header}
          <SearchField
            ref={inputRef}
            placeholder={searchByCity ? 'Buscar país ou cidade...' : 'Buscar país...'}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          {searchByCity ? 'Nenhum destino encontrado' : 'Nenhum país encontrado'} para “{query}”.
        </Text>
      }
      renderItem={({ item }) => (
        <CountryRow
          match={item}
          disabled={disabled.has(item.country.code)}
          selected={selected.has(item.country.code)}
          busy={busyCode === item.country.code}
          onPress={() => handleSelect(item.country)}
        />
      )}
    />
  );
}

function CountryRow({
  match,
  disabled,
  selected,
  busy,
  onPress,
}: {
  match: DestinationMatch;
  disabled: boolean;
  selected: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  const { country, city } = match;
  const blocked = disabled || busy;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={city ? `${country.name}, ${city}` : country.name}
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

      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {country.name}
        </Text>
        {city ? (
          <Text style={styles.city} numberOfLines={1}>
            {city}
          </Text>
        ) : null}
      </View>

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
  texts: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.body,
    color: colors.text,
  },
  city: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  empty: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
