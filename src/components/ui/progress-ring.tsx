import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, typography } from '@/theme/tokens';

/**
 * Fração mínima desenhada do arco.
 *
 * Em 0% o anel continua mostrando uma marca no topo: um anel completamente
 * vazio parece um desenho quebrado, e o ponto diz por onde o progresso começa.
 * O valor lido pelo leitor de tela continua sendo o real.
 */
const MIN_ARC = 0.015;

/**
 * Progresso em anel, para quando o número é o protagonista do bloco.
 *
 * Irmão do `ProgressBar`, que continua servindo aos lugares onde o progresso é
 * uma linha fina ao lado de outro conteúdo — a Home e o cabeçalho de cada
 * categoria da checklist.
 */
export function ProgressRing({
  percent,
  size = 56,
  strokeWidth = 5,
  label,
  color = colors.primary,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  /** Texto do centro. Padrão: o próprio percentual; `null` deixa o anel sem texto. */
  label?: string | null;
  /** Cor do arco, para o anel acompanhar o tom do bloco em que está. */
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  // O traço é desenhado sobre a linha central do círculo, então o raio desconta
  // metade da espessura para o anel caber inteiro dentro de `size`.
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const drawn = Math.max(clamped / 100, MIN_ARC);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={[styles.container, { width: size, height: size }]}>
      {/* Rotação de -90° para o preenchimento começar no topo, e não à direita. */}
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.progressTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - drawn)}
          fill="none"
        />
      </Svg>

      {label === null ? null : (
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.label} numberOfLines={1}>
            {label ?? `${clamped}%`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
  },
});
