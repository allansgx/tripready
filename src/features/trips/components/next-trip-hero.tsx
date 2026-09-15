import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui/progress-bar';
import { FlagRow } from '@/features/trips/components/flag-row';
import { pickTravelTips } from '@/features/trips/data/travel-tips';
import { formatSeasonContext, formatTripDates } from '@/features/trips/domain/trip-format';
import type { TripProgress } from '@/features/trips/domain/trip-progress';
import {
  buildTripCountdown,
  buildTripDayCount,
  describeReturnCountdown,
  type ReturnCountdown,
  type TripCountdown,
} from '@/features/trips/domain/trip-status';
import type { TripSummary } from '@/features/trips/domain/trip-summary';
import { t } from '@/i18n';
import { USE_NATIVE_DRIVER, useReduceMotion } from '@/lib/animation';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import type { Season } from '@/types/models';

/** Frase grande e legenda de apoio da contagem; nenhuma vem do domínio. */
function countdownText(countdown: TripCountdown): { message: string | null; label: string | null } {
  switch (countdown.kind) {
    case 'today':
      return { message: t('trip.countdown.today.message'), label: t('trip.countdown.today.label') };
    case 'ongoing':
      return countdown.totalDays !== undefined
        ? {
            message: null,
            label: t('trip.countdown.ongoing.label', { totalDays: countdown.totalDays }),
          }
        : { message: t('trip.countdown.ongoingUndated.message'), label: t('trip.moment.ongoing') };
    case 'undated':
      return {
        message: t('trip.countdown.undated.message'),
        label: t('trip.countdown.undated.label'),
      };
    case 'tomorrow':
      return {
        message: t('trip.countdown.tomorrow.message'),
        label: t('trip.countdown.tomorrow.label'),
      };
    case 'days':
      return { message: null, label: t('trip.countdown.days.label') };
  }
}

function returnCountdownText(countdown: ReturnCountdown): string {
  if (countdown.kind === 'lastDay') return t('trip.returnCountdown.lastDay');
  if (countdown.kind === 'tomorrow') return t('trip.returnCountdown.tomorrow');
  return t('trip.returnCountdown.daysLeft', { days: countdown.days ?? 0 });
}

/** "8 de 11 itens verificados", sempre no mesmo formato. */
function progressLabel(progress: TripProgress): string {
  if (progress.total === 0) return t('trips.progress.empty');
  return t('trips.progress.checked', {
    count: progress.total,
    done: progress.done,
    total: progress.total,
  });
}

/** O que a checklist ainda tem pendente, no recorte da porcentagem. */
function pendingLabel(progress: TripProgress): string {
  if (progress.total === 0) return t('trips.progress.empty');
  const pending = progress.total - progress.done;
  if (pending === 0) return t('trips.progress.allChecked');
  return t('trips.progress.pending', { count: pending });
}

/** O que a checklist oferece a quem já embarcou: os itens `informational`. */
function referenceLabel(progress: TripProgress): string {
  if (progress.informationalTotal === 0) return t('trips.progress.referenceEmpty');
  return t('trips.progress.reference', { count: progress.informationalTotal });
}

// Tintas translúcidas: o cinza dos tokens foi calibrado para o branco dos
// cards, e aqui o fundo é o ambiente sazonal.
const INK_LINE = 'rgba(22,22,26,0.07)';
const INK_RULE = 'rgba(22,22,26,0.14)';
const INK_CHIP = 'rgba(22,22,26,0.05)';
const PRIMARY_WASH = 'rgba(108,78,227,0.08)';
const PRIMARY_EDGE = 'rgba(108,78,227,0.14)';

// Roxo dessaturado: no dia do embarque o progresso não deve puxar o olho antes
// do nome da viagem.
const PRIMARY_CALM = '#A396D6';

// Fora da escala de `spacing`: 24 aperta a tela e 32 afasta demais.
const BLOCK_GAP = 28;

const ENTRANCE_DURATION_MS = 420;
/** Distância que o conteúdo sobe ao aparecer. */
const ENTRANCE_OFFSET = 16;
const COUNT_UP_DURATION_MS = 1200;

/** Bandeiras no cabeçalho antes de o resto virar contagem. */
const HEADER_FLAGS = 3;
const HEADER_FLAG_SIZE = 18;

/** A dica não fala de estação: os destinos de uma mesma viagem não combinam. */
const TIP_LABEL = '💡 Dica da viagem';

function useEntrance(reduceMotion: boolean) {
  // Inicializador de `useState`: voltar para a aba não reinicia a animação.
  const [entrance] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) {
      entrance.setValue(1);
      return;
    }

    Animated.timing(entrance, {
      toValue: 1,
      duration: ENTRANCE_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [entrance, reduceMotion]);

  return entrance;
}

// Em `requestAnimationFrame` porque o que muda é o texto: `Animated` não anima
// o conteúdo de um `Text`.
function useCountUp(target: number | null, animated: boolean): number | null {
  // O alvo viaja junto do valor: a contagem recomeça do zero em vez de exibir o
  // resto da contagem anterior.
  const [count, setCount] = useState<{ target: number; value: number } | null>(null);

  useEffect(() => {
    if (target === null || !animated) return;

    let frame = 0;
    let startedAt: number | null = null;

    const step = (timestamp: number) => {
      startedAt ??= timestamp;
      const elapsed = Math.min(1, (timestamp - startedAt) / COUNT_UP_DURATION_MS);
      setCount({ target, value: Math.round(target * (1 - (1 - elapsed) ** 3)) });
      if (elapsed < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [target, animated]);

  if (target === null || !animated) return target;
  return count?.target === target ? count.value : 0;
}

/**
 * A próxima viagem ocupando a Home: nome, destinos, estações, contagem,
 * preparação, próximo passo e uma dica de preparo. Embarque e viagem em
 * andamento são variações da mesma composição, não telas separadas.
 */
export function NextTripHero({
  summary,
  seasons,
  onOpen,
}: {
  summary: TripSummary;
  /** Estações da viagem, já resolvidas pela tela — o conteúdo só as veste. */
  seasons: readonly Season[];
  onOpen: () => void;
}) {
  const { trip, countryCodes, progress, nextStep } = summary;
  const countdown = buildTripCountdown(trip);
  const countdownContent = countdownText(countdown);
  const dates = formatTripDates(trip.start_date, trip.end_date);

  const reduceMotion = useReduceMotion();
  const entrance = useEntrance(reduceMotion);
  const countingDays = useCountUp(countdown.days, !reduceMotion);

  // `useState`, e não `useMemo`: o React pode recalcular um memo, e aqui isso
  // seria a dica trocando debaixo do olho de quem lê.
  const [tip] = useState(() => pickTravelTips(1)[0]);

  const isDeparture = countdown.kind === 'today';
  const isOngoing = countdown.kind === 'ongoing';
  const dayCount = buildTripDayCount(trip);

  const seasonContext = formatSeasonContext(seasons);

  // O leitor de tela ouve "Dia 3 de 7": o número sozinho não carrega a inversão
  // que a tela faz na viagem em andamento.
  const headline =
    isOngoing && dayCount
      ? t('a11y.tripHero.dayOf', { day: dayCount.day, total: dayCount.total })
      : countdown.days === null
        ? [countdownContent.message, countdownContent.label].filter(Boolean).join('. ')
        : `${countdown.days} ${countdownContent.label}`;

  const sectionTitle = isOngoing ? 'Na viagem' : isDeparture ? 'Antes de embarcar' : 'Preparação';
  const sectionNote = isOngoing
    ? dayCount && returnCountdownText(describeReturnCountdown(dayCount))
    : isDeparture
      ? pendingLabel(progress)
      : null;
  // A porcentagem é a linguagem da preparação: some junto com ela.
  const showsPercent = !isDeparture && !isOngoing;

  const nextStepLabel = nextStep
    ? isDeparture
      ? '✨ Verifique agora'
      : '✨ Próximo passo'
    : progress.isReady
      ? '🎉 Tudo pronto'
      : '✨ Comece por aqui';

  return (
    <Animated.View
      style={[
        styles.content,
        {
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [ENTRANCE_OFFSET, 0],
              }),
            },
          ],
        },
      ]}>
      {/* Coluna, e não linha: nada divide a largura com o nome da viagem. */}
      <View style={styles.header}>
        {seasonContext ? (
          <View style={styles.seasonChip}>
            <Text style={styles.seasonChipText} numberOfLines={1}>
              {seasonContext}
            </Text>
          </View>
        ) : null}

        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {trip.name}
        </Text>

        {countryCodes.length > 0 ? (
          <FlagRow codes={countryCodes} size={HEADER_FLAG_SIZE} max={HEADER_FLAGS} />
        ) : null}
      </View>

      {isDeparture ? (
        <View
          style={styles.departure}
          accessible
          accessibilityLabel={`${countdownContent.message}. ${dates}`}>
          <Text style={styles.departureMessage} numberOfLines={1} adjustsFontSizeToFit>
            {countdownContent.message}
          </Text>

          <View style={styles.dateRule}>
            <View style={styles.rule} />
            <Text style={styles.departureDates}>{dates}</Text>
            <View style={styles.rule} />
          </View>

          <Ionicons name="airplane-outline" size={17} color={colors.textSecondary} />
        </View>
      ) : (
        <View style={styles.countdown} accessible accessibilityLabel={`${headline}. ${dates}`}>
          {countdown.days === null ? (
            <Text style={styles.message} numberOfLines={2} adjustsFontSizeToFit>
              {countdownContent.message}
            </Text>
          ) : (
            <Text
              style={[styles.days, isOngoing && styles.daysOngoing]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {countingDays}
            </Text>
          )}
          {countdownContent.label ? (
            <Text style={styles.countdownLabel}>{countdownContent.label}</Text>
          ) : null}
          <Text style={styles.dates}>{dates}</Text>
        </View>
      )}

      {/* A preparação sai do ambiente sazonal e vira superfície: daqui para
          baixo é conteúdo de trabalho, não mais ambientação. */}
      <View style={styles.panel}>
        <View style={styles.preparation}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{sectionTitle}</Text>
            {showsPercent ? (
              <Text style={styles.percent}>{progress.percent}%</Text>
            ) : sectionNote ? (
              <Text style={styles.sideNote}>{sectionNote}</Text>
            ) : null}
          </View>

          {/* Medir preparação é cobrança para quem já está viajando. */}
          {isOngoing ? null : (
            <ProgressBar
              percent={progress.percent}
              height={5}
              color={isDeparture ? PRIMARY_CALM : colors.primary}
            />
          )}

          <Text style={styles.progressLabel}>
            {isOngoing ? referenceLabel(progress) : progressLabel(progress)}
          </Text>
        </View>

        <View style={styles.nextStep}>
          <Text style={styles.nextStepLabel}>{nextStepLabel}</Text>

          <View style={styles.nextStepRow}>
            <Text style={styles.nextStepTitle} numberOfLines={3}>
              {nextStep
                ? nextStep.title
                : progress.isReady
                  ? 'Você já verificou todos os itens importantes.'
                  : 'Veja o que falta conferir antes de viajar.'}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                nextStep ? `Verificar: ${nextStep.title}` : 'Abrir a checklist da viagem'
              }
              accessibilityHint="Abre a checklist da viagem"
              onPress={onOpen}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
              <Text style={styles.actionLabel}>{nextStep ? 'Verificar' : 'Abrir'}</Text>
              <Ionicons name="chevron-forward" size={13} color={colors.contrastText} />
            </Pressable>
          </View>
        </View>

        <View style={styles.tip}>
          <Text style={styles.tipLabel}>{TIP_LABEL}</Text>
          <Text style={styles.tipText}>{tip.text}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // `flexGrow` sem `flex`: blocos em altura natural, para faltar espaço virar
  // rolagem em vez de transbordo cortado pelo `ScrollView`.
  content: {
    flexGrow: 1,
    gap: BLOCK_GAP,
  },
  header: {
    alignItems: 'center',
    gap: spacing.md,
  },
  // Uma linha só, com reticências: o nome nunca quebra por causa do resto.
  name: {
    ...typography.screenTitle,
    color: colors.text,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  seasonChip: {
    maxWidth: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: INK_CHIP,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: INK_LINE,
  },
  seasonChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  countdown: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  days: {
    ...typography.countdown,
    color: colors.text,
  },
  daysOngoing: {
    color: colors.primary,
  },
  message: {
    ...typography.countdownMessage,
    color: colors.primary,
    textAlign: 'center',
  },
  countdownLabel: {
    ...typography.sectionLabel,
    fontSize: 11,
    letterSpacing: 1.8,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  dates: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  departure: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  departureMessage: {
    ...typography.departureName,
    color: colors.text,
    textAlign: 'center',
  },
  dateRule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rule: {
    width: 28,
    height: 1,
    backgroundColor: INK_RULE,
  },
  departureDates: {
    ...typography.caption,
    letterSpacing: 0.4,
    color: colors.textSecondary,
  },
  // As margens negativas desfazem o respiro da Home — `spacing.xl` nas laterais
  // e `spacing.xxl` embaixo — para o painel ir de borda a borda e descer até o
  // fim. O respiro volta como padding aqui dentro.
  panel: {
    flexGrow: 1,
    gap: spacing.xl,
    marginHorizontal: -spacing.xl,
    marginBottom: -spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    // A barra de abas do iOS é translúcida e flutua sobre o conteúdo.
    paddingBottom: spacing.xxl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  preparation: {
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)',
  },
  progressTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  percent: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  sideNote: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  // O único bloco com cara de card, porque é o único acionável.
  nextStep: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl - spacing.sm,
    backgroundColor: PRIMARY_WASH,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PRIMARY_EDGE,
  },
  nextStepLabel: {
    ...typography.sectionLabel,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  nextStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nextStepTitle: {
    ...typography.body,
    fontWeight: '400',
    color: colors.text,
    flex: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md - 2,
    backgroundColor: colors.primary,
  },
  actionPressed: {
    backgroundColor: colors.primaryPressed,
  },
  actionLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.contrastText,
  },
  tip: {
    gap: spacing.xs,
  },
  tipLabel: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tipText: {
    ...typography.caption,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
