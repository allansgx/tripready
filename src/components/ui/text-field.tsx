import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { FormMessage } from '@/components/ui/form-message';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type TextFieldProps = TextInputProps & {
  label: string;
  /**
   * Mensagem do problema deste campo. Sem ela o campo é exatamente o que sempre
   * foi — o contorno só muda de cor quando há o que corrigir.
   */
  error?: string | null;
  /** Campo apenas de leitura: fundo apagado e cadeado à direita. */
  locked?: boolean;
};

/**
 * Campo de formulário. `secureTextEntry` já traz o olho de mostrar/ocultar, com
 * a alternância interna.
 */
export function TextField({
  label,
  error,
  locked,
  secureTextEntry,
  style,
  ...rest
}: TextFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          editable={!locked}
          secureTextEntry={isPassword && !revealed}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            error ? styles.inputError : null,
            locked ? styles.inputLocked : null,
            locked || isPassword ? styles.inputWithAccessory : null,
            style,
          ]}
          {...rest}
        />
        {locked ? (
          <Ionicons
            name="lock-closed"
            size={16}
            color={colors.textSecondary}
            style={styles.accessoryIcon}
          />
        ) : isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            hitSlop={8}
            onPress={() => setRevealed((current) => !current)}
            style={styles.accessoryIcon}>
            <Ionicons name={revealed ? 'eye-off' : 'eye'} size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
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
  inputLocked: {
    backgroundColor: colors.background,
    color: colors.textSecondary,
  },
  inputWithAccessory: {
    paddingRight: spacing.xxl,
  },
  accessoryIcon: {
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
    marginTop: -9,
  },
});
