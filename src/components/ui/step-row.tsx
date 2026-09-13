import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ComponentProps } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { USE_NATIVE_DRIVER } from '@/lib/animation';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type StepRowProps = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  done: boolean;
};

/** Etapa das telas de processamento: o rótulo já aparece apagado quando pendente. */
export function StepRow({ label, icon, done }: StepRowProps) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!done) return;
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: USE_NATIVE_DRIVER,
      speed: 14,
      bounciness: 10,
    }).start();
  }, [done, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  return (
    <Animated.View style={[styles.row, { opacity }]}>
      <View style={[styles.rowIcon, done && styles.rowIconDone]}>
        <Ionicons name={icon} size={18} color={done ? colors.contrastText : colors.textSecondary} />
      </View>

      <Text style={[styles.rowLabel, done && styles.rowLabelDone]}>{label}</Text>

      <Animated.View style={{ transform: [{ scale }] }}>
        {done ? (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        ) : (
          <View style={styles.pendingDot} />
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.progressTrack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDone: { backgroundColor: colors.primary },
  rowLabel: { ...typography.body, color: colors.textSecondary, flex: 1 },
  rowLabelDone: { color: colors.text, fontWeight: '600' },
  pendingDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.progressTrack,
  },
});
