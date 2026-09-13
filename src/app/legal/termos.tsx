import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { useAuth } from '@/features/auth/auth-context';
import { LegalDocumentView } from '@/features/legal/components/legal-document-view';
import { termsOfUse } from '@/features/legal/data/legal-documents';
import { colors, spacing, typography } from '@/theme/tokens';

export default function TermsOfUseScreen() {
  const { session } = useAuth();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={termsOfUse.title}
          subtitle={`Versão ${termsOfUse.version} · em vigor desde ${termsOfUse.effectiveDate}`}
          fallbackHref={session ? '/profile' : '/login'}
        />

        <LegalDocumentView document={termsOfUse} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Versão {termsOfUse.version} — {termsOfUse.effectiveDate}
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
