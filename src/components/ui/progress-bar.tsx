import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme/tokens';

/** Barra de progresso da preparação da viagem. */
export function ProgressBar({
  percent,
  height = 6,
  color = colors.primary,
}: {
  percent: number;
  height?: number;
  /** Cor do preenchimento, para quando a barra precisa pesar menos na tela. */
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped}%`, height, borderRadius: height / 2, backgroundColor: color },
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
