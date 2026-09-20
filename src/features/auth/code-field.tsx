import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { t } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type CodeFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  length: number;
  error?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
};

/**
 * Caixas de dígito são só a aparência. Por baixo, um único `TextInput`
 * invisível cobre a fileira inteira — é o que permite `textContentType`
 * "oneTimeCode" (autofill do código no iOS) sem alternar foco entre 6 campos.
 */
export function CodeField({
  value,
  onChangeText,
  length,
  error,
  autoFocus,
  onSubmitEditing,
}: CodeFieldProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  function handleChange(text: string) {
    onChangeText(text.replace(/[^0-9]/g, '').slice(0, length));
  }

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={styles.row}
      accessible
      accessibilityLabel={t('a11y.codeField.label')}>
      {digits.map((digit, index) => (
        <View
          key={index}
          style={[
            styles.box,
            focused && index === value.length && styles.boxFocused,
            error && styles.boxError,
          ]}>
          <Text style={styles.digit}>{digit}</Text>
        </View>
      ))}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmitEditing}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  boxFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  boxError: {
    borderColor: colors.danger,
  },
  digit: {
    ...typography.title,
    color: colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
});
