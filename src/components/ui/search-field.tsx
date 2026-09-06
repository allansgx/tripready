import { Ionicons } from '@expo/vector-icons';
import type { Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

type SearchFieldProps = Omit<TextInputProps, 'style'> & {
  placeholder?: string;
  /**
   * Referência ao input, para quem usa o campo poder devolver o foco. No React
   * 19 `ref` é uma prop comum, então segue no spread junto com o resto.
   */
  ref?: Ref<TextInput>;
};

/** Campo de busca com lupa, no padrão da referência. */
export function SearchField({ placeholder = 'Buscar...', ...rest }: SearchFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Ionicons name="search" size={18} color={colors.textSecondary} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    paddingVertical: spacing.md,
  },
});
