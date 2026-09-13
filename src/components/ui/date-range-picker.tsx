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

type Month = { year: number; month: number };

function toISO(year: number, month: number, day: number): string {
  return `${year}-${`${month + 1}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
}

function monthFromISO(value: string): Month {
  const [year, month] = value.split('-').map(Number);
  return { year, month: month - 1 };
}

/** Meses em linha reta, para comparar meses de anos diferentes. */
function monthKey({ year, month }: Month): number {
  return year * 12 + month;
}

/**
 * Calendário de intervalo em JS puro, para rodar no Expo Go sem build. Tocar
 * numa data anterior ao início reinicia a seleção, então nunca há intervalo
 * invertido.
 */
export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const today = new Date();
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  const [cursor, setCursor] = useState<Month>(() =>
    value.start
      ? monthFromISO(value.start)
      : { year: today.getFullYear(), month: today.getMonth() },
  );

  // O piso é o mês atual, exceto na edição de uma viagem que já começou.
  const [floor] = useState<Month>(() => {
    const current = { year: today.getFullYear(), month: today.getMonth() };
    const started = value.start ? monthFromISO(value.start) : null;
    return started && monthKey(started) < monthKey(current) ? started : current;
  });

  const [pickingMonth, setPickingMonth] = useState(false);
  const [pickerYear, setPickerYear] = useState(cursor.year);

  const cells = useMemo(() => {
    const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const result: (number | null)[] = Array.from({ length: firstWeekday }, () => null);
    for (let day = 1; day <= daysInMonth; day++) result.push(day);
    return result;
  }, [cursor]);

  const canGoBack = monthKey(cursor) > monthKey(floor);

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

  // Escolha direta de mês e ano, no lugar do calendário — não sobre ele.
  if (pickingMonth) {
    const canGoBackYear = pickerYear > floor.year;

    return (
      <View style={styles.container}>
        <View style={styles.monthRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ano anterior"
            accessibilityState={{ disabled: !canGoBackYear }}
            hitSlop={10}
            onPress={canGoBackYear ? () => setPickerYear((year) => year - 1) : undefined}
            style={styles.monthButton}>
            <Ionicons
              name="chevron-back"
              size={18}
              color={canGoBackYear ? colors.text : colors.border}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar ao calendário"
            hitSlop={10}
            onPress={() => setPickingMonth(false)}>
            <Text style={styles.monthLabel}>{pickerYear}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Próximo ano"
            hitSlop={10}
            onPress={() => setPickerYear((year) => year + 1)}
            style={styles.monthButton}>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.monthGrid}>
          {MONTH_NAMES.map((name, index) => {
            const blocked = monthKey({ year: pickerYear, month: index }) < monthKey(floor);
            const isCurrent = cursor.year === pickerYear && cursor.month === index;

            return (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityState={{ disabled: blocked, selected: isCurrent }}
                onPress={
                  blocked
                    ? undefined
                    : () => {
                        setCursor({ year: pickerYear, month: index });
                        setPickingMonth(false);
                      }
                }
                style={[
                  styles.monthCell,
                  isCurrent && styles.monthCellSelected,
                  blocked && styles.monthCellBlocked,
                ]}>
                <Text style={[styles.monthCellLabel, isCurrent && styles.monthCellLabelSelected]}>
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          accessibilityState={{ disabled: !canGoBack }}
          hitSlop={10}
          onPress={canGoBack ? () => shiftMonth(-1) : undefined}
          style={styles.monthButton}>
          <Ionicons name="chevron-back" size={18} color={canGoBack ? colors.text : colors.border} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${MONTH_NAMES[cursor.month]} de ${cursor.year}. Escolher outro mês`}
          hitSlop={10}
          onPress={() => {
            setPickerYear(cursor.year);
            setPickingMonth(true);
          }}
          style={styles.monthLabelRow}>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[cursor.month]} de {cursor.year}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </Pressable>

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

          // A trilha do intervalo não pode morrer antes das pontas: as células
          // do primeiro e do último dia recebem meia pintura, do lado de
          // dentro, para a faixa encostar no círculo em vez de deixar buraco.
          const spans = Boolean(value.start && value.end && value.end > value.start);
          const edge = spans ? (isStart ? styles.edgeRight : isEnd ? styles.edgeLeft : null) : null;

          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              accessibilityLabel={`${day} de ${MONTH_NAMES[cursor.month]}`}
              accessibilityState={{ selected: isStart || isEnd }}
              onPress={() => handlePress(day)}
              style={[styles.cell, inRange && styles.cellInRange]}>
              {edge ? <View style={[styles.edge, edge]} /> : null}
              <View
                style={[
                  styles.dayCircle,
                  iso === todayISO && styles.dayCircleToday,
                  (isStart || isEnd) && styles.dayCircleSelected,
                ]}>
                <Text style={[styles.day, (isStart || isEnd) && styles.daySelected]}>{day}</Text>
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
  monthLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  monthLabel: { ...typography.bodyStrong, color: colors.text },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthCell: {
    width: `${100 / 3}%`,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  monthCellSelected: { backgroundColor: colors.primarySoft },
  monthCellBlocked: { opacity: 0.35 },
  monthCellLabel: { ...typography.body, color: colors.text },
  monthCellLabelSelected: { color: colors.primary, fontWeight: '700' },
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
  edge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    backgroundColor: colors.primarySoft,
  },
  edgeLeft: { left: 0 },
  edgeRight: { right: 0 },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: { borderWidth: 1.5, borderColor: colors.primary },
  dayCircleSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  day: { ...typography.body, color: colors.text },
  daySelected: { color: colors.contrastText, fontWeight: '700' },
});
