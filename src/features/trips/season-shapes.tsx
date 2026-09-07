import Svg, { Circle, Path } from 'react-native-svg';

/**
 * As silhuetas das partículas de estação, em vetor.
 *
 * São desenhos, não emojis nem imagens: escalam para qualquer tamanho sem
 * perder borda e aceitam a cor da estação como parâmetro. Cada forma cabe em
 * uma viewBox de 24×24 para os tamanhos serem intercambiáveis.
 */

export type SeasonShapeKind = 'flake' | 'leaf' | 'petal' | 'mote';

/** A nervura e o brilho são o mesmo branco translúcido em cima da cor cheia. */
const HIGHLIGHT = '#FFFFFF';

export function SeasonShape({
  kind,
  size,
  color,
}: {
  kind: SeasonShapeKind;
  size: number;
  color: string;
}) {
  switch (kind) {
    // Folha ovalada com ponta e nervura central.
    case 'leaf':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 1.5C5.8 6.6 3.4 13.2 12 22.5C20.6 13.2 18.2 6.6 12 1.5Z" fill={color} />
          <Path
            d="M12 4.5V20.5"
            stroke={HIGHLIGHT}
            strokeOpacity={0.45}
            strokeWidth={0.9}
            strokeLinecap="round"
          />
          <Path
            d="M12 9.5L8.6 7.2M12 9.5L15.4 7.2M12 14.5L8.2 11.8M12 14.5L15.8 11.8"
            stroke={HIGHLIGHT}
            strokeOpacity={0.28}
            strokeWidth={0.7}
            strokeLinecap="round"
          />
        </Svg>
      );

    // Pétala: mais larga e arredondada que a folha, com a base afunilada.
    case 'petal':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 2.5C19.2 7.4 19.6 16 12 21.5C4.4 16 4.8 7.4 12 2.5Z" fill={color} />
          <Path
            d="M12 6C15.4 9 15.6 14 12 17.5"
            stroke={HIGHLIGHT}
            strokeOpacity={0.35}
            strokeWidth={0.8}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      );

    // Floco de seis braços, com as farpas que dão a leitura de cristal.
    case 'flake':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 2.5V21.5M3.8 7.2L20.2 16.8M20.2 7.2L3.8 16.8"
            stroke={color}
            strokeWidth={1.7}
            strokeLinecap="round"
          />
          <Path
            d="M12 6.4L9.6 4.4M12 6.4L14.4 4.4M12 17.6L9.6 19.6M12 17.6L14.4 19.6M7.1 9.3L6.6 6.4M16.9 14.7L17.4 17.6M16.9 9.3L17.4 6.4M7.1 14.7L6.6 17.6"
            stroke={color}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        </Svg>
      );

    // Partícula de luz: um núcleo com halo, o pó suspenso no sol.
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={10} fill={color} fillOpacity={0.25} />
          <Circle cx={12} cy={12} r={5} fill={color} />
        </Svg>
      );
  }
}
