import Svg, { Path } from 'react-native-svg';

import {
  PLANE_PARTS,
  PLANE_VIEWBOX,
  SPLASH_COLORS,
  type PlanePartRole,
} from '@/features/splash/domain/plane-art';

/**
 * O avião da marca em SVG.
 *
 * No tamanho `PLANE_MARK_SIZE` e centralizado, este é exatamente o desenho que
 * o `splash-icon.png` mostra — os dois saem do mesmo `plane-art.ts`. É o que
 * permite trocar o splash nativo por esta tela sem piscar.
 */
export function PlaneMark({
  size,
  palette = 'onSky',
}: {
  size: number;
  palette?: keyof typeof SPLASH_COLORS.plane;
}) {
  const fills: Record<PlanePartRole, string> = SPLASH_COLORS.plane[palette];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${PLANE_VIEWBOX} ${PLANE_VIEWBOX}`}>
      {PLANE_PARTS.map((part) => (
        <Path key={part.d} d={part.d} fill={fills[part.role]} />
      ))}
    </Svg>
  );
}
