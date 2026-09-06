import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;
const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

export type DateRange = { start: string | null; end: string | null };

function toISO(year: number, month: number, day: number): string {
  return `${year}-${`${month + 1}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
}

/**
 * Calendário de intervalo, escrito em JS puro para não depender de um módulo
 * nativo (o app precisa rodar no Expo Go sem build).
 *
 * A regra de seleção já impede intervalo invertido: tocar numa data anterior
 * ao início reinicia a seleção a partir dela, então a data final nunca fica
 * antes da inicial.
 */
export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => {
    if (value.start) {
      const [year, month] = value.start.split('-').map(Number);
      return { year, month: month - 1 };
    }
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  const cells = useMemo(() => {
    const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const result: (number | null)[] = Array.from({ length: firstWeekday }, () => null);
    for (let day = 1; day <= daysInMonth; day++) result.push(day);
    return result;
  }, [cursor]);

  function shiftMonth(delta: number) {
    setCursor((current) => {
      const month = current.month + delta;
      if (month < 0) return { year: current.year - 1, month: 11 };
      if (month > 11) return { year: current.year + 1, month: 0 };
      return { year: current.year, month };
    });
  }

  function handlePress(day: number) {
    const iso = toISO(cursor.year, cursor.month, day);

    if (!value.start || value.end) {
      onChange({ start: iso, end: null });
      return;
    }
    if (iso < value.start) {
      onChange({ start: iso, end: null });
      return;
    }
    onChange({ start: value.start, end: iso });
  }

  return (
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          hitSlop={10}
          onPress={() => shiftMonth(-1)}
          style={styles.monthButton}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>

        <Text style={styles.monthLabel}>
          {MONTH_NAMES[cursor.month]} de {cursor.year}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          hitSlop={10}
          onPress={() => shiftMonth(1)}
          style={styles.monthButton}>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((weekday, index) => (
          <Text key={`${weekday}-${index}`} style={styles.weekday}>
            {weekday}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.cell} />;
          }

          const iso = toISO(cursor.year, cursor.month, day);
          const isStart = iso === value.start;
          const isEnd = iso === value.end;
          const inRange =
            Boolean(value.start && value.end) && iso > value.start! && iso < value.end!;

          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              accessibilityLabel={`${day} de ${MONTH_NAMES[cursor.month]}`}
              accessibilityState={{ selected: isStart || isEnd }}
              onPress={() => handlePress(day)}
              style={[styles.cell, inRange && styles.cellInRange]}>
              <View style={[styles.dayCircle, (isStart || isEnd) && styles.dayCircleSelected]}>
                <Text
                  style={[styles.day, (isStart || isEnd) && styles.daySelected]}>
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  monthLabel: {
    ...typography.bodyStrong,
    color: colors.text,
    textTransform: 'capitalize',
  },
  weekRow: { flexDirection: 'row' },
  weekday: {
    ...typography.caption,
    color: colors.textSecondary,
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellInRange: { backgroundColor: colors.primarySoft },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: { backgroundColor: colors.primary },
  day: { ...typography.body, color: colors.text },
  daySelected: { color: colors.contrastText, fontWeight: '700' },
});
