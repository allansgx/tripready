import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui/progress-bar';
import { FlagRow } from '@/features/trips/components/flag-row';
import {
  formatSeasonTip,
  formatSeasonTrail,
  formatTripDates,
  suggestTripName,
} from '@/features/trips/domain/trip-format';
import {
  formatPendingLabel,
  formatProgressLabel,
  formatReferenceLabel,
} from '@/features/trips/domain/trip-progress';
import {
  buildTripCountdown,
  buildTripDayCount,
  formatReturnCountdown,
} from '@/features/trips/domain/trip-status';
import type { TripSummary } from '@/features/trips/domain/trip-summary';
import { USE_NATIVE_DRIVER, useReduceMotion } from '@/lib/animation';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import type { Season } from '@/types/models';

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

// Bandeiras no cabeçalho do embarque antes de a fila virar lista; o resto vira
// contagem ao lado.
const DEPARTURE_FLAGS = 4;

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
 * A próxima viagem ocupando a Home: contagem, preparação, próximo passo e a
 * dica da estação. Embarque e viagem em andamento são variações da mesma
 * composição, não telas separadas.
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
  const dates = formatTripDates(trip.start_date, trip.end_date);

  const reduceMotion = useReduceMotion();
  const entrance = useEntrance(reduceMotion);
  const countingDays = useCountUp(countdown.days, !reduceMotion);

  const isDeparture = countdown.kind === 'today';
  const isOngoing = countdown.kind === 'ongoing';
  const dayCount = buildTripDayCount(trip);

  const seasonTrail = formatSeasonTrail(seasons);
  const seasonTip = formatSeasonTip(seasons);

  const eyebrow = isDeparture
    ? 'Embarque hoje'
    : countdown.kind === 'ongoing'
      ? 'Sua viagem'
      : 'Sua próxima viagem';

  // O leitor de tela ouve "Dia 3 de 7": o número sozinho não carrega a inversão
  // que a tela faz na viagem em andamento.
  const headline =
    isOngoing && dayCount
      ? `Dia ${dayCount.day} de ${dayCount.total}`
      : countdown.days === null
        ? [countdown.message, countdown.label].filter(Boolean).join('. ')
        : `${countdown.days} ${countdown.days === 1 ? 'dia' : 'dias'} para viajar`;

  // Some quando o nome da viagem já é o próprio destino, que é o nome sugerido
  // na criação.
  const destination = countryCodes.length > 0 ? suggestTripName(countryCodes) : null;
  const showsDestination = destination !== null && destination !== trip.name;

  const departureFlags = countryCodes.slice(0, DEPARTURE_FLAGS);
  const hiddenFlags = countryCodes.length - departureFlags.length;

  const sectionTitle = isOngoing ? 'Na viagem' : isDeparture ? 'Antes de embarcar' : 'Preparação';
  const sectionNote = isOngoing
    ? dayCount && formatReturnCountdown(dayCount)
    : isDeparture
      ? formatPendingLabel(progress)
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
      <View style={styles.header}>
        <View style={styles.identity}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>

          {isDeparture ? (
            <View style={styles.flags}>
              <FlagRow codes={departureFlags} />
              {hiddenFlags > 0 ? (
                <View style={styles.flagsChip}>
                  <Text
                    style={styles.flagsChipText}
                    accessibilityLabel={`e mais ${hiddenFlags} ${
                      hiddenFlags === 1 ? 'destino' : 'destinos'
                    }`}>
                    +{hiddenFlags}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <>
              {showsDestination ? (
                <View style={styles.destination}>
                  <FlagRow codes={countryCodes} size={15} />
                  <Text style={styles.destinationName} numberOfLines={1}>
                    {destination}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.name} numberOfLines={2}>
                {trip.name}
              </Text>
            </>
          )}
        </View>

        {seasonTrail ? (
          <View style={styles.seasonChip}>
            <Text style={styles.seasonChipText} numberOfLines={1}>
              {seasonTrail}
            </Text>
          </View>
        ) : null}
      </View>

      {isDeparture ? (
        <View
          style={styles.departure}
          accessible
          accessibilityLabel={`Hoje é o dia. ${trip.name}. ${dates}`}>
          <Text style={styles.departureLabel}>Hoje é o dia</Text>

          <Text style={styles.departureName} numberOfLines={2} adjustsFontSizeToFit>
            {trip.name}
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
              {countdown.message}
            </Text>
          ) : (
            <Text
              style={[styles.days, isOngoing && styles.daysOngoing]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {countingDays}
            </Text>
          )}
          {countdown.label ? <Text style={styles.countdownLabel}>{countdown.label}</Text> : null}
          <Text style={styles.dates}>{dates}</Text>
        </View>
      )}

      <View style={styles.divider} />

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
          {isOngoing ? formatReferenceLabel(progress) : formatProgressLabel(progress)}
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

      {seasonTip ? (
        <View style={styles.tip}>
          <Text style={styles.tipLabel}>{seasonTip.label}</Text>
          <Text style={styles.tipText}>{seasonTip.text}</Text>
        </View>
      ) : null}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  identity: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.sectionLabel,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  destination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flagsChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: INK_CHIP,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: INK_LINE,
  },
  flagsChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  destinationName: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  name: {
    ...typography.title,
    color: colors.text,
  },
  seasonChip: {
    flexShrink: 1,
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
  departureLabel: {
    ...typography.sectionLabel,
    fontSize: 11,
    letterSpacing: 1.8,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  departureName: {
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
  divider: {
    height: 1,
    backgroundColor: INK_RULE,
  },
  preparation: {
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
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
