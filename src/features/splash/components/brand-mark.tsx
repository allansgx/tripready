import Svg, { Path } from 'react-native-svg';

import {
  MARK_PARTS,
  MARK_VIEWBOX,
  SPLASH_COLORS,
  type MarkPartRole,
} from '@/features/splash/domain/brand-art';

/**
 * O carimbo da marca em SVG. Em `MARK_SIZE` é o mesmo desenho do
 * `splash-icon.png`, o que permite trocar o splash nativo sem piscar.
 */
export function BrandMark({
  size,
  palette = 'onSky',
}: {
  size: number;
  palette?: keyof typeof SPLASH_COLORS.mark;
}) {
  const fills: Record<MarkPartRole, string> = SPLASH_COLORS.mark[palette];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}>
      {MARK_PARTS.map((part) => (
        <Path key={part.d} d={part.d} fill={fills[part.role]} />
      ))}
    </Svg>
  );
}
