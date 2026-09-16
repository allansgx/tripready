import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { useAuth } from '@/features/auth/auth-context';
import { LegalDocumentView } from '@/features/legal/components/legal-document-view';
import { getLegalDocuments } from '@/features/legal/data';
import { getLocale, t } from '@/i18n';
import { colors, spacing, typography } from '@/theme/tokens';

export default function TermsOfUseScreen() {
  const { session } = useAuth();
  const { termsOfUse } = getLegalDocuments(getLocale());

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={termsOfUse.title}
          subtitle={t('legal.document.subtitle', {
            version: termsOfUse.version,
            date: termsOfUse.effectiveDate,
          })}
          fallbackHref={session ? '/profile' : '/login'}
        />

        <LegalDocumentView document={termsOfUse} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('legal.document.footer', {
              version: termsOfUse.version,
              date: termsOfUse.effectiveDate,
            })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.xl - spacing.xs,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  footer: { marginTop: spacing.xl },
  footerText: { ...typography.caption, color: colors.textSecondary },
});
