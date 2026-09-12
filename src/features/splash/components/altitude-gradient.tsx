import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { SPLASH_COLORS } from '@/features/splash/domain/plane-art';

/**
 * O céu ganhando altitude.
 *
 * É o que faz o avião parecer estar indo a algum lugar em vez de subir parado:
 * conforme ele sobe, o alto do céu escurece no roxo da marca, como quem sai da
 * camada baixa. O azul de partida continua embaixo, então a tela nunca deixa de
 * ser o mesmo céu — ela só muda de altura.
 *
 * Entra por opacidade, a partir do zero. O primeiro quadro precisa continuar
 * sendo a cor chapada do splash nativo, ou a costura com ele aparece.
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
