import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme/tokens';

type FormMessageProps = {
  text: string;
  tone?: 'error' | 'success';
};

/** Mensagem inline de erro ou confirmação abaixo de um formulário. */
export function FormMessage({ text, tone = 'error' }: FormMessageProps) {
  const isError = tone === 'error';

  return (
    <View style={styles.row}>
      <Ionicons
        name={isError ? 'alert-circle' : 'checkmark-circle'}
        size={16}
        color={isError ? colors.danger : colors.primary}
      />
      <Text style={[styles.text, { color: isError ? colors.danger : colors.textSecondary }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  text: {
    ...typography.caption,
    flex: 1,
  },
});
