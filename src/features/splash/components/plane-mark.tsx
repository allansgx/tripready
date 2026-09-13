import Svg, { Path } from 'react-native-svg';

import {
  PLANE_PARTS,
  PLANE_VIEWBOX,
  SPLASH_COLORS,
  type PlanePartRole,
} from '@/features/splash/domain/plane-art';

/**
 * O avião da marca em SVG. Em `PLANE_MARK_SIZE` é o mesmo desenho do
 * `splash-icon.png`, o que permite trocar o splash nativo sem piscar.
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
