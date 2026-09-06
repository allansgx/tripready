import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme/tokens';

/** Barra de progresso da preparação da viagem. */
export function ProgressBar({ percent, height = 6 }: { percent: number; height?: number }) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped}%`, height, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
    borderRadius: radius.pill,
  },
  fill: {
    backgroundColor: colors.primary,
  },
});
