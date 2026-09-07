import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui/progress-bar';
import { FlagRow } from '@/features/trips/flag-row';
import { formatTripDates } from '@/features/trips/trip-format';
import { formatProgressLabel } from '@/features/trips/trip-progress';
import { buildTripCountdown } from '@/features/trips/trip-status';
import type { TripSummary } from '@/features/trips/trip-summary';
import { USE_NATIVE_DRIVER, useReduceMotion } from '@/lib/animation';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

const ENTRANCE_DURATION_MS = 420;
/** Distância que o card sobe ao aparecer. */
const ENTRANCE_OFFSET = 16;
const COUNT_UP_DURATION_MS = 1200;

/**
 * Entrada do card: aparece subindo, uma vez só, quando a viagem chega.
 *
 * Com "reduzir movimento" ligado o card já nasce no lugar — o conteúdo nunca
 * depende do fim da animação para ficar legível.
 */
function useEntrance(reduceMotion: boolean) {
  // Inicializador de `useState`: o valor nasce uma vez e sobrevive a qualquer
  // re-renderização, então voltar para a aba não reinicia a animação.
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

/**
 * A contagem subindo de 0 até o número de dias.
 *
 * Roda em `requestAnimationFrame` porque o que muda é o texto, e não um estilo:
 * `Animated` não sabe animar o conteúdo de um `Text`. A curva é um ease-out
 * cúbico — arranca rápido e vai freando ao se aproximar do número final, que é
 * onde o olho para. Como o valor exibido é arredondado, os quadros que caem no
 * mesmo inteiro não re-renderizam nada.
 *
 * Devolve o número final direto quando não há o que animar (sem contagem ou com
 * "reduzir movimento" ligado).
 */
function useCountUp(target: number | null, animated: boolean): number | null {
  // O alvo viaja junto do valor: enquanto os quadros do número novo não chegam,
  // a contagem recomeça do zero em vez de exibir o resto da contagem anterior.
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
 * O bloco protagonista da Home: quanto falta para viajar, quão preparada a
 * viagem está e qual é o próximo passo — nessa ordem, em um card só.
 *
 * Tudo o que ele mostra é derivado: a contagem vem das datas, o progresso e o
 * próximo passo vêm da checklist já resumida em `TripSummary`. Nada aqui é
 * calculado de novo nem guardado no banco.
 */
export function NextTripHero({ summary, onOpen }: { summary: TripSummary; onOpen: () => void }) {
  const { trip, countryCodes, progress, nextStep } = summary;
  const countdown = buildTripCountdown(trip);
  const dates = formatTripDates(trip.start_date, trip.end_date);

  const reduceMotion = useReduceMotion();
  const entrance = useEntrance(reduceMotion);
  const countingDays = useCountUp(countdown.days, !reduceMotion);

  // Uma viagem que já começou não é mais "a próxima".
  const eyebrow = countdown.kind === 'ongoing' ? 'Sua viagem' : 'Sua próxima viagem';

  const headline =
    countdown.days === null
      ? countdown.message
      : `${countdown.days} ${countdown.days === 1 ? 'dia' : 'dias'} para viajar`;

  return (
    <Animated.View
      style={[
        styles.card,
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${trip.name}. ${headline}. ${progress.percent}% preparada.`}
        accessibilityHint="Abre a checklist da viagem"
        onPress={onOpen}
        style={({ pressed }) => [styles.top, pressed && styles.topPressed]}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>

        <View style={styles.destination}>
          <FlagRow codes={countryCodes} size={28} />
          <Text style={styles.name} numberOfLines={2}>
            {trip.name}
          </Text>
        </View>

        <View style={styles.countdown} accessibilityElementsHidden importantForAccessibility="no">
          {countdown.days === null ? (
            <Text style={styles.message} numberOfLines={2} adjustsFontSizeToFit>
              {countdown.message}
            </Text>
          ) : (
            <Text style={styles.days} numberOfLines={1} adjustsFontSizeToFit>
              {countingDays}
            </Text>
          )}
          {countdown.label ? <Text style={styles.countdownLabel}>{countdown.label}</Text> : null}
        </View>

        <Text style={styles.dates}>{dates}</Text>

        <View style={styles.divider} />

        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Preparação</Text>
          <Text style={styles.percent}>{progress.percent}%</Text>
        </View>
        <ProgressBar percent={progress.percent} height={8} />
        <Text style={styles.progressLabel}>{formatProgressLabel(progress)}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          nextStep ? `Próximo passo: ${nextStep.title}` : 'Abrir a checklist da viagem'
        }
        onPress={onOpen}
        style={({ pressed }) => [styles.footer, pressed && styles.footerPressed]}>
        <View style={styles.footerTexts}>
          {nextStep ? (
            <>
              <Text style={styles.footerLabel}>✨ Próximo passo</Text>
              <Text style={styles.footerTitle} numberOfLines={2}>
                {nextStep.title}
              </Text>
            </>
          ) : progress.isReady ? (
            <>
              <Text style={styles.footerLabel}>🎉 Tudo pronto</Text>
              <Text style={styles.footerTitle}>Você já verificou o que precisava</Text>
            </>
          ) : (
            <>
              <Text style={styles.footerLabel}>✨ Comece por aqui</Text>
              <Text style={styles.footerTitle}>Veja o que preparar para esta viagem</Text>
            </>
          )}
        </View>

        <View style={styles.footerAction}>
          <Text style={styles.footerActionText}>{nextStep ? 'Verificar' : 'Abrir'}</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.primary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  top: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  topPressed: {
    backgroundColor: colors.background,
  },
  eyebrow: {
    ...typography.sectionLabel,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  destination: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  name: {
    ...typography.title,
    color: colors.text,
  },
  // O número ocupa a tela inteira em largura: é ele que responde "quanto
  // falta?" antes de qualquer leitura.
  countdown: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  days: {
    ...typography.countdown,
    color: colors.text,
  },
  message: {
    ...typography.countdownMessage,
    color: colors.primary,
    textAlign: 'center',
  },
  countdownLabel: {
    ...typography.sectionLabel,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  dates: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  percent: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  footerPressed: {
    opacity: 0.7,
  },
  footerTexts: {
    flex: 1,
    gap: 2,
  },
  footerLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  footerTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerActionText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
});
