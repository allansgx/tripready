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
import { formatProgressLabel } from '@/features/trips/domain/trip-progress';
import { buildTripCountdown } from '@/features/trips/domain/trip-status';
import type { TripSummary } from '@/features/trips/domain/trip-summary';
import { USE_NATIVE_DRIVER, useReduceMotion } from '@/lib/animation';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import type { Season } from '@/types/models';

/**
 * Traços desenhados sobre o fundo quente da Home.
 *
 * O cinza dos tokens foi calibrado para o branco dos cards; aqui o fundo é bege
 * e um pouco vivo, então divisor, etiqueta e contorno do próximo passo são
 * tintas translúcidas — elas escurecem o que estiver atrás em vez de tapar,
 * o que é o que mantém a leitura de "conteúdo no ambiente".
 */
const INK_LINE = 'rgba(22,22,26,0.07)';
const INK_CHIP = 'rgba(22,22,26,0.05)';
const PRIMARY_WASH = 'rgba(108,78,227,0.08)';
const PRIMARY_EDGE = 'rgba(108,78,227,0.14)';

/**
 * O intervalo entre os blocos da composição, tirado do protótipo.
 *
 * Não sai da escala de `spacing` porque não existe lá: 24 aperta a tela e 32
 * afasta demais. O ritmo da Home é este, e ele vale para todos os intervalos
 * grandes — cabeçalho, contagem, divisor, progresso, próximo passo e dica.
 */
const BLOCK_GAP = 28;

const ENTRANCE_DURATION_MS = 420;
/** Distância que o conteúdo sobe ao aparecer. */
const ENTRANCE_OFFSET = 16;
const COUNT_UP_DURATION_MS = 1200;

/**
 * Entrada da tela: aparece subindo, uma vez só, quando a viagem chega.
 *
 * Com "reduzir movimento" ligado o conteúdo já nasce no lugar — nada aqui
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
 * A próxima viagem ocupando a Home inteira: quanto falta para viajar, quão
 * preparada a viagem está, qual é o próximo passo e o que esperar da estação —
 * nessa ordem, direto sobre o ambiente sazonal.
 *
 * Não há card envolvendo o conteúdo. O único bloco com aparência de card é o do
 * próximo passo, porque é o único acionável: contagem e progresso informam, e
 * informação não deve parecer botão. Quem abre a checklist é o "Verificar".
 *
 * Tudo o que a tela mostra é derivado: a contagem vem das datas, o progresso e
 * o próximo passo vêm da checklist já resumida em `TripSummary`, e a estação
 * vem dos destinos. Nada aqui é calculado de novo nem guardado no banco.
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

  const seasonTrail = formatSeasonTrail(seasons);
  const seasonTip = formatSeasonTip(seasons);

  // Uma viagem que já começou não é mais "a próxima".
  const eyebrow = countdown.kind === 'ongoing' ? 'Sua viagem' : 'Sua próxima viagem';

  const headline =
    countdown.days === null
      ? [countdown.message, countdown.label].filter(Boolean).join('. ')
      : `${countdown.days} ${countdown.days === 1 ? 'dia' : 'dias'} para viajar`;

  /**
   * O destino acima do nome, como no protótipo. Some quando o nome da viagem já
   * é o próprio destino — que é o caso mais comum, porque é o nome sugerido na
   * criação, e repetir "Estados Unidos" duas vezes seguidas não informa nada.
   */
  const destination = countryCodes.length > 0 ? suggestTripName(countryCodes) : null;
  const showsDestination = destination !== null && destination !== trip.name;

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
        </View>

        {/* A estação não é um filtro nem um seletor: é a legenda do que está
            caindo atrás. Por isso etiqueta, e não botão. */}
        {seasonTrail ? (
          <View style={styles.seasonChip}>
            <Text style={styles.seasonChipText} numberOfLines={1}>
              {seasonTrail}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Agrupado para o leitor de tela: "3 dias para viajar. 10–17 set 2026" é
          uma frase, e não três pedaços soltos. */}
      <View style={styles.countdown} accessible accessibilityLabel={`${headline}. ${dates}`}>
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
        <Text style={styles.dates}>{dates}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.preparation}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Preparação</Text>
          <Text style={styles.percent}>{progress.percent}%</Text>
        </View>
        <ProgressBar percent={progress.percent} height={5} />
        <Text style={styles.progressLabel}>{formatProgressLabel(progress)}</Text>
      </View>

      <View style={styles.nextStep}>
        <Text style={styles.nextStepLabel}>
          {nextStep
            ? '✨ Próximo passo'
            : progress.isReady
              ? '🎉 Tudo pronto'
              : '✨ Comece por aqui'}
        </Text>

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
  /**
   * `flexGrow` sem `flex`: em tela alta a composição cresce e a folga sobra ao
   * redor; em tela baixa não há folga, o bloco fica do tamanho do conteúdo e a
   * rolagem da tela assume. É o que evita ter de escolher entre espremer o
   * conteúdo e inventar rolagem onde ela não é necessária.
   *
   * Os blocos ficam empilhados a partir do topo, todos no tamanho natural, e a
   * sobra de altura fica embaixo. Nenhum deles é elástico de propósito: como o
   * `flexShrink` padrão do React Native é 0, um bloco elástico no meio da pilha
   * não encolhe quando falta espaço — ele transborda, e aí o `ScrollView` corta
   * o que passou em vez de rolar, porque a altura do conteúdo continua sendo a
   * da tela. Altura natural é o que garante que faltar espaço vire rolagem.
   *
   * O intervalo entre blocos é o do protótipo, que separa contagem, divisor,
   * progresso e próximo passo por 28 pontos. É o respiro que faz a tela parecer
   * composta em vez de empilhada, e é maior do que qualquer `spacing` isolado.
   */
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
  // O número é o centro visual da tela: é ele que responde "quanto falta?"
  // antes de qualquer leitura.
  // A contagem é o bloco mais isolado da tela no protótipo: um respiro a mais
  // acima do número, e o rótulo e a data soltos abaixo dele, sem se colar.
  countdown: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: INK_LINE,
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
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  // O único bloco com cara de card na tela, porque é o único acionável.
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
