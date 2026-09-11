import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from '@/components/ui/progress-ring';
import { getCountryName } from '@/constants/countries';
import { TripCountryChips } from '@/features/trips/components/trip-country-chips';
import { formatTripDates } from '@/features/trips/domain/trip-format';
import {
  formatPendingRequiredLabel,
  formatProgressFraction,
} from '@/features/trips/domain/trip-progress';
import { buildTripMoment } from '@/features/trips/domain/trip-status';
import type { TripSummary } from '@/features/trips/domain/trip-summary';
import {
  colors,
  prioritySoftColors,
  radius,
  shadow,
  spacing,
  tripMomentColors,
  typography,
} from '@/theme/tokens';

/**
 * Tintas escuras dos avisos do rodapé.
 *
 * Os fundos saem de `prioritySoftColors`, mas o texto precisa de uma versão
 * mais fechada da mesma cor para ler sobre o fundo diluído — o vermelho e o
 * âmbar dos tokens foram calibrados para pontos e ícones, não para texto.
 */
const PILL_URGENT_INK = '#C6383C';
const PILL_CALM_INK = '#946200';

/**
 * Card da listagem.
 *
 * A leitura é sempre a mesma, de cima para baixo: qual é a viagem, em que ponto
 * ela está, para onde ela vai e o que falta preparar. O nome ocupa o título
 * sozinho — é como a pessoa chama a viagem, e nenhum destino toma esse lugar.
 *
 * Cada card tem um tom só, vindo de `buildTripMoment`: ele pinta a faixa do
 * momento e o anel do progresso. É o que deixa a lista legível de relance —
 * roxo é a viagem acontecendo, âmbar é a que parte agora, verde é a que ainda
 * dá tempo de preparar e cinza é a que já passou.
 *
 * Viagens concluídas mantêm o mesmo desenho, no tom cinza, mas sem fração e sem
 * pílula de obrigatórios: cobrar preparação de uma viagem que já aconteceu não
 * leva ninguém a lugar nenhum.
 */
export function TripCard({ summary, onPress }: { summary: TripSummary; onPress: () => void }) {
  const { trip, countryCodes, progress, status } = summary;
  const isCompleted = status === 'completed';

  const moment = buildTripMoment(trip);
  const tone = tripMomentColors[moment.tone];
  const dates = formatTripDates(trip.start_date, trip.end_date);
  const fraction = formatProgressFraction(progress);
  const pending = isCompleted ? null : formatPendingRequiredLabel(progress);
  // Véspera e dia do embarque: é o único momento em que o pendente vira pressa.
  const isUrgent = moment.tone === 'imminent';

  const spoken = [
    trip.name,
    moment.label,
    countryCodes.map(getCountryName).join(', '),
    dates,
    isCompleted ? null : fraction,
    pending ? `${pending} pendentes` : null,
  ].filter(Boolean);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={spoken.join('. ')}
      accessibilityHint="Abre a checklist da viagem"
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
          {moment.label}
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
            <Text style={[styles.pillText, styles.readyText]}>Pronta 🎉</Text>
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
