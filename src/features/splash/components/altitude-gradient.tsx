import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { SPLASH_COLORS } from '@/features/splash/domain/plane-art';

/**
 * O céu ganhando altitude: o alto escurece no roxo da marca conforme o avião
 * sobe. Entra por opacidade, a partir do zero, para o primeiro quadro continuar
 * sendo a cor chapada do splash nativo.
 */

const STOPS = [
  { offset: 0, color: '#3A2AA4' },
  { offset: 0.3, color: SPLASH_COLORS.brand },
  { offset: 0.64, color: '#9AA6E6' },
  { offset: 1, color: SPLASH_COLORS.sky },
] as const;

export function AltitudeGradient({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="altitude" x1="0" y1="0" x2="0" y2="1">
          {STOPS.map((stop) => (
            <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#altitude)" />
    </Svg>
  );
}
