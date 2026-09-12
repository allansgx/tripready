import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DateRange } from '@/components/ui/date-range-picker';
import { formatTripDate } from '@/features/trips/domain/trip-format';
import { countTripDays } from '@/features/trips/domain/trip-status';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/**
 * O que já foi escolhido no calendário, logo abaixo dele.
 *
 * Antes da primeira data é só uma instrução; a partir dela vira o resultado em
 * destaque, com a duração — que é o número que a pessoa quer conferir antes de
 * seguir, e o que separa "12 a 24" de "treze dias de viagem".
 *
 * O "Limpar" só existe junto do calendário. Na conferência final o cartão vai
 * sem ação nenhuma: limpar ali deixaria a viagem sem data e sem calendário à
 * vista, e quem edita é o "Alterar" do cabeçalho do bloco.
 */
export function DateRangeSummary({ value, onClear }: { value: DateRange; onClear?: () => void }) {
  const days = countTripDays(value.start, value.end);

  if (!value.start) {
    return <Text style={styles.hint}>Escolha a data de ida no calendário.</Text>;
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>IDA</Text>
          <Text style={styles.date}>{formatTripDate(value.start)}</Text>
        </View>

        <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />

        <View style={styles.column}>
          <Text style={styles.label}>VOLTA</Text>
          <Text style={[styles.date, !value.end && styles.datePending]}>
            {value.end ? formatTripDate(value.end) : 'a escolher'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.duration}>
          {days === null
            ? 'Agora toque na data de volta.'
            : `${days} ${days === 1 ? 'dia' : 'dias'} de viagem`}
        </Text>

        {onClear ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpar datas"
            hitSlop={10}
            onPress={onClear}>
            <Text style={styles.action}>Limpar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  column: { flex: 1, gap: spacing.xs },
  label: { ...typography.sectionLabel, color: colors.primary },
  date: { ...typography.bodyStrong, color: colors.text },
  datePending: { color: colors.textSecondary, fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  duration: { ...typography.caption, color: colors.text, flex: 1 },
  action: { ...typography.caption, fontWeight: '600', color: colors.primary },
});
