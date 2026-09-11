import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { FormMessage } from '@/components/ui/form-message';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type TextFieldProps = TextInputProps & {
  label: string;
  /**
   * Mensagem do problema deste campo. Sem ela o campo é exatamente o que sempre
   * foi — o contorno só muda de cor quando há o que corrigir.
   */
  error?: string | null;
};

/** Campo de formulário no mesmo padrão visual dos cartões da referência. */
export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? <FormMessage text={error} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    ...typography.sectionLabel,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  inputError: {
    borderColor: colors.danger,
  },
});
