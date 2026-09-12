import { useRouter } from 'expo-router';
import { Platform, StyleSheet, Text } from 'react-native';

import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Aviso de aceite dos documentos legais, com os dois links.
 *
 * `lead` completa a frase com a ação da tela — "Ao continuar" na entrada,
 * "Ao criar sua conta" no cadastro.
 */
export function LegalConsentNotice({ lead }: { lead: string }) {
  const router = useRouter();

  return (
    <Text style={styles.notice}>
      {lead}, você concorda com os{' '}
      <Text
        style={styles.link}
        accessibilityRole="link"
        onPress={() => router.push('/legal/termos')}>
        Termos de uso
      </Text>{' '}
      e com a{' '}
      <Text
        style={styles.link}
        accessibilityRole="link"
        onPress={() => router.push('/legal/privacidade')}>
        Política de privacidade
      </Text>
      .
    </Text>
  );
}

const styles = StyleSheet.create({
  notice: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: Platform.OS === 'web' ? spacing.lg : 0,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
});
