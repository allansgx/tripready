import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

/**
 * O convite para ligar os lembretes, mostrado na checklist porque é ali que os
 * itens que o lembrete vai citar estão à vista.
 */
export function ReminderOptInCard({
  onEnable,
  onDismiss,
  busy = false,
}: {
  onEnable: () => void;
  onDismiss: () => void;
  busy?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('reminder.optIn.title')}</Text>
      <Text style={styles.message}>{t('reminder.optIn.message')}</Text>

      <View style={styles.actions}>
        <Button label={t('reminder.optIn.enable')} onPress={onEnable} loading={busy} />
        <Button
          label={t('reminder.optIn.dismiss')}
          variant="ghost"
          onPress={onDismiss}
          disabled={busy}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadow.card,
  },
  title: { ...typography.bodyStrong, color: colors.text },
  message: { ...typography.caption, color: colors.textSecondary },
  actions: { marginTop: spacing.md, gap: spacing.sm },
});
