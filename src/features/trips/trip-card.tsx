import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui/progress-bar';
import { FlagRow } from '@/features/trips/flag-row';
import { formatTripDates } from '@/features/trips/trip-format';
import {
  formatPendingRequiredLabel,
  formatProgressLabel,
} from '@/features/trips/trip-progress';
import type { TripSummary } from '@/features/trips/trip-summary';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

/**
 * Card da listagem.
 *
 * Viagens ativas mostram progresso e obrigatórios pendentes; concluídas trocam
 * isso pelo registro do que já aconteceu, sem cobrar preparação de uma viagem
 * que já terminou. Cidades continuam só no detalhe.
 */
export function TripCard({ summary, onPress }: { summary: TripSummary; onPress: () => void }) {
  const { trip, countryCodes, progress, status, countdown } = summary;
  const isCompleted = status === 'completed';
  const pending = formatPendingRequiredLabel(progress);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isCompleted
          ? `${trip.name}, viagem concluída`
          : `${trip.name}, ${progress.percent}% preparada`
      }
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isCompleted ? styles.cardCompleted : styles.cardActive,
        pressed && styles.cardPressed,
      ]}>
      <View style={styles.top}>
        <FlagRow codes={countryCodes} />
        {isCompleted ? (
          <View style={styles.completedTag}>
            <Ionicons name="checkmark" size={13} color={colors.textSecondary} />
            <Text style={styles.completedText}>Viagem concluída</Text>
          </View>
        ) : (
          <Text style={styles.percent}>{progress.percent}%</Text>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {trip.name}
      </Text>

      {isCompleted ? (
        <Text style={styles.dates}>{formatTripDates(trip.start_date, trip.end_date)}</Text>
      ) : (
        <>
          {status === 'ongoing' ? (
            <View style={styles.ongoingRow}>
              <View style={styles.ongoingDot} />
              <Text style={styles.ongoingText}>Viagem em andamento</Text>
            </View>
          ) : countdown ? (
            <Text style={styles.countdown}>{countdown}</Text>
          ) : null}

          <Text style={styles.progressLabel}>{formatProgressLabel(progress)}</Text>

          <ProgressBar percent={progress.percent} />

          <View style={styles.bottom}>
            <Text style={styles.dates}>{formatTripDates(trip.start_date, trip.end_date)}</Text>

            {pending ? (
              <View style={styles.pendingPill}>
                <Text style={styles.pendingText}>{pending}</Text>
              </View>
            ) : progress.isReady ? (
              <View style={styles.readyPill}>
                <Text style={styles.readyText}>Pronta 🎉</Text>
              </View>
            ) : null}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardActive: {
    ...shadow.card,
  },
  // Sem sombra e com fundo levemente rebaixado: discreto, mas com o mesmo
  // contraste de texto de um card ativo — não deve parecer desabilitado.
  cardCompleted: {
    backgroundColor: '#FAFAFB',
  },
  cardPressed: {
    backgroundColor: colors.background,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  percent: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  completedText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  name: {
    ...typography.title,
    color: colors.text,
  },
  ongoingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ongoingDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  ongoingText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  countdown: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  dates: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  pendingPill: {
    backgroundColor: '#FDECEC',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pendingText: {
    ...typography.caption,
    fontWeight: '600',
    color: '#C6383C',
  },
  readyPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  readyText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
});
