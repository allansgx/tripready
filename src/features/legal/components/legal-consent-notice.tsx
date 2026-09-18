import { useRouter } from 'expo-router';
import { Fragment, type ReactNode } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';

import { t } from '@/i18n';
import { colors, spacing, typography } from '@/theme/tokens';

const TEMPLATE_KEYS = {
  continue: 'legal.consent.continue',
  createAccount: 'legal.consent.createAccount',
} as const;

/** Troca `{nome}` por um nó React — os links, aqui — sem quebrar a frase em pedaços. */
function renderWithParts(template: string, parts: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/g).map((token, index) => {
    const match = /^\{(\w+)\}$/.exec(token);
    const part = match ? parts[match[1]] : undefined;
    return <Fragment key={index}>{part ?? token}</Fragment>;
  });
}

/**
 * Aviso de aceite com os dois links. `variant` escolhe a frase inteira no
 * idioma ativo — a ação da tela não é mais montada por concatenação, porque a
 * ordem das palavras muda de um idioma para o outro.
 */
export function LegalConsentNotice({ variant }: { variant: keyof typeof TEMPLATE_KEYS }) {
  const router = useRouter();

  return (
    <Text style={styles.notice}>
      {renderWithParts(t(TEMPLATE_KEYS[variant]), {
        terms: (
          <Text
            style={styles.link}
            accessibilityRole="link"
            onPress={() => router.push('/legal/termos')}>
            {t('legal.termsOfUse.linkLabel')}
          </Text>
        ),
        privacy: (
          <Text
            style={styles.link}
            accessibilityRole="link"
            onPress={() => router.push('/legal/privacidade')}>
            {t('legal.privacyPolicy.linkLabel')}
          </Text>
        ),
      })}
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
