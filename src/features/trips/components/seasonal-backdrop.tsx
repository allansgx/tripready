import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { SeasonField, type FieldPointer } from '@/features/trips/components/season-field';
import { colors, seasonBackdropColors } from '@/theme/tokens';
import type { Season } from '@/types/models';

/**
 * O ambiente da Home: a base quente, o halo da estação e as partículas caindo,
 * tudo atrás do conteúdo e sem receber toque nenhum.
 *
 * O halo é um gradiente radial estático — pintado uma vez, sem custo por
 * quadro. As opacidades são propositalmente baixas: o que dá a estação é a
 * partícula, e o fundo só a acompanha. Uma viagem sem datas não tem estação a
 * afirmar e fica só com a base.
 */

/** Opacidade no centro do halo da estação principal. */
const TINT_CORE = 0.13;
/** Opacidade no meio do halo, antes de ele se dissolver na base. */
const TINT_MID = 0.05;

/**
 * A segunda estação entra por baixo, mais fraca: uma viagem que atravessa duas
 * estações muda de tom do começo para o fim, sem que a tela vire duas telas.
 */
const SECOND_TINT_CORE = 0.07;
const SECOND_TINT_MID = 0.03;

export function SeasonalBackdrop({
  seasons,
  seed,
  pointer,
}: {
  seasons: readonly Season[];
  /** Semente do sorteio das partículas — a viagem, para o campo ser estável. */
  seed: string;
  pointer: SharedValue<FieldPointer>;
}) {
  const [first, second] = seasons;

  return (
    // Sem estação não há ambiente a montar: a Home volta a ser uma tela comum,
    // no mesmo cinza das demais. O bege é a base do clima, e afirmar clima em
    // uma tela sem viagem — ou em uma viagem ainda sem datas — seria inventar
    // um outono que não existe.
    <View style={[styles.backdrop, first ? styles.seasonal : styles.plain]} pointerEvents="none">
      {first ? (
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            {/* Elipse ancorada no topo, como um clarão de céu. */}
            <RadialGradient id="topTint" cx="50%" cy="0%" rx="90%" ry="55%">
              <Stop offset="0" stopColor={seasonBackdropColors[first]} stopOpacity={TINT_CORE} />
              <Stop offset="0.55" stopColor={seasonBackdropColors[first]} stopOpacity={TINT_MID} />
              <Stop offset="1" stopColor={seasonBackdropColors[first]} stopOpacity={0} />
            </RadialGradient>

            {second ? (
              <RadialGradient id="bottomTint" cx="50%" cy="100%" rx="90%" ry="45%">
                <Stop
                  offset="0"
                  stopColor={seasonBackdropColors[second]}
                  stopOpacity={SECOND_TINT_CORE}
                />
                <Stop
                  offset="0.55"
                  stopColor={seasonBackdropColors[second]}
                  stopOpacity={SECOND_TINT_MID}
                />
                <Stop offset="1" stopColor={seasonBackdropColors[second]} stopOpacity={0} />
              </RadialGradient>
            ) : null}
          </Defs>

          <Rect x="0" y="0" width="100%" height="100%" fill="url(#topTint)" />
          {second ? <Rect x="0" y="0" width="100%" height="100%" fill="url(#bottomTint)" /> : null}
        </Svg>
      ) : null}

      <SeasonField seasons={seasons} seed={seed} pointer={pointer} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  seasonal: {
    backgroundColor: seasonBackdropColors.base,
  },
  plain: {
    backgroundColor: colors.background,
  },
});
