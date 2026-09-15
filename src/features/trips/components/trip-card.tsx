import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from '@/components/ui/progress-ring';
import { getCountryName } from '@/constants/countries';
import { TripCountryChips } from '@/features/trips/components/trip-country-chips';
import { formatTripDates } from '@/features/trips/domain/trip-format';
import type { TripProgress } from '@/features/trips/domain/trip-progress';
import {
  buildTripMoment,
  type TripMoment,
  type TripMomentKind,
} from '@/features/trips/domain/trip-status';
import type { TripSummary } from '@/features/trips/domain/trip-summary';
import { t, type MessageKey } from '@/i18n';
import {
  colors,
  prioritySoftColors,
  radius,
  shadow,
  spacing,
  tripMomentColors,
  typography,
} from '@/theme/tokens';

const MOMENT_LABEL_KEY: Record<TripMomentKind, MessageKey> = {
  completed: 'trip.moment.completed',
  boardingToday: 'trip.moment.boardingToday',
  ongoing: 'trip.moment.ongoing',
  undated: 'trip.moment.undated',
  tomorrow: 'trip.moment.tomorrow',
  daysUntil: 'trip.moment.daysUntil',
  monthsUntil: 'trip.moment.monthsUntil',
};

function momentLabel(moment: TripMoment): string {
  return t(MOMENT_LABEL_KEY[moment.kind], { days: moment.days ?? 0, months: moment.months ?? 0 });
}

/** "0/8 itens" até a checklist existir; antes disso, "Checklist em preparação". */
function progressFraction(progress: TripProgress): string {
  if (progress.total === 0) return t('trips.progress.empty');
  return t('trips.progress.fraction', {
    count: progress.total,
    done: progress.done,
    total: progress.total,
  });
}

/** Rótulo curto do pill ("3 obrigatórios"); nulo quando não há pendência. */
function pendingRequiredLabel(progress: TripProgress): string | null {
  if (progress.requiredPending === 0) return null;
  return t('trips.progress.requiredPending', { count: progress.requiredPending });
}

// Tintas escuras dos avisos: as cores dos tokens foram calibradas para pontos e
// ícones, e não leem bem como texto sobre o fundo diluído.
const PILL_URGENT_INK = '#C6383C';
const PILL_CALM_INK = '#946200';

/**
 * Card da listagem. Cada um tem um tom só, vindo de `buildTripMoment`, que
 * pinta a faixa e o anel. Viagem concluída não mostra fração nem obrigatórios.
 */
export function TripCard({ summary, onPress }: { summary: TripSummary; onPress: () => void }) {
  const { trip, countryCodes, progress, status } = summary;
  const isCompleted = status === 'completed';

  const moment = buildTripMoment(trip);
  const tone = tripMomentColors[moment.tone];
  const dates = formatTripDates(trip.start_date, trip.end_date);
  const fraction = progressFraction(progress);
  const pending = isCompleted ? null : pendingRequiredLabel(progress);
  // Véspera e dia do embarque: é o único momento em que o pendente vira pressa.
  const isUrgent = moment.tone === 'imminent';

  const spoken = [
    trip.name,
    momentLabel(moment),
    countryCodes.map((code) => getCountryName(code)).join(', '),
    dates,
    isCompleted ? null : fraction,
    progress.requiredPending > 0 && !isCompleted
      ? t('trips.requiredPendingCount', { count: progress.requiredPending })
      : null,
  ].filter(Boolean);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={spoken.join('. ')}
      accessibilityHint={t('a11y.tripCard.openChecklist')}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isCompleted ? styles.cardCompleted : styles.cardActive,
        pressed && styles.cardPressed,
      ]}>
      <View style={styles.top}>
        <Text style={styles.name} numberOfLines={2}>
          {trip.name}
        </Text>

        {/* O percentual fica dentro do anel: o arco sozinho dá a impressão, e o
            número diz o quanto de fato já foi verificado. */}
        <ProgressRing percent={progress.percent} size={48} strokeWidth={4} color={tone.accent} />
      </View>

      <View style={[styles.moment, { backgroundColor: tone.soft }]}>
        <View style={[styles.momentDot, { backgroundColor: tone.accent }]} />
        <Text style={[styles.momentLabel, { color: tone.text }]} numberOfLines={1}>
          {momentLabel(moment)}
        </Text>
      </View>

      <TripCountryChips codes={countryCodes} />

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.facts}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.dates} numberOfLines={1}>
            {dates}
          </Text>
          {isCompleted ? null : (
            <Text style={styles.fraction} numberOfLines={1}>
              {fraction}
            </Text>
          )}
        </View>

        {pending ? (
          <View
            style={[
              styles.pill,
              {
                backgroundColor: isUrgent
                  ? prioritySoftColors.required
                  : prioritySoftColors.recommended,
              },
            ]}>
            <Text style={[styles.pillText, { color: isUrgent ? PILL_URGENT_INK : PILL_CALM_INK }]}>
              {pending}
            </Text>
          </View>
        ) : !isCompleted && progress.isReady ? (
          <View style={[styles.pill, styles.readyPill]}>
            <Text style={[styles.pillText, styles.readyText]}>{t('trip.card.ready')}</Text>
          </View>
        ) : null}
      </View>
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
    gap: spacing.md,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  name: {
    ...typography.title,
    color: colors.text,
    flex: 1,
  },
  // A faixa ocupa a largura toda de propósito: ela é a legenda do card, e não
  // mais uma etiqueta disputando espaço com as outras.
  moment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  momentDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
  },
  momentLabel: {
    ...typography.caption,
    fontWeight: '600',
    flexShrink: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  facts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  dates: {
    ...typography.caption,
    color: colors.text,
    flexShrink: 1,
  },
  fraction: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pillText: {
    ...typography.caption,
    fontWeight: '600',
  },
  readyPill: {
    backgroundColor: colors.primarySoft,
  },
  readyText: {
    color: colors.primary,
  },
});
