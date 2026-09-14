import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { SeasonField, type FieldPointer } from '@/features/trips/components/season-field';
import { colors, seasonBackdropColors } from '@/theme/tokens';
import type { Season } from '@/types/models';

/**
 * O ambiente da Home: base neutra, halo da estação e partículas, tudo atrás do
 * conteúdo e sem receber toque. O halo é um gradiente estático, sem custo por
 * quadro.
 */

/** Opacidade no centro do halo da estação. */
const TINT_CORE = 0.13;
/** Opacidade no meio do halo, antes de ele se dissolver na base. */
const TINT_MID = 0.05;

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
  // A partir de duas estações o halo mentiria: a viagem não pertence a nenhuma
  // delas, e o fundo ficaria dizendo que pertence.
  const tint = seasons.length === 1 ? seasonBackdropColors[seasons[0]] : null;

  return (
    // Sem estação a Home volta a ser uma tela comum, no cinza das demais.
    <View
      style={[styles.backdrop, seasons.length > 0 ? styles.seasonal : styles.plain]}
      pointerEvents="none">
      {tint ? (
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            {/* Elipse ancorada no topo, como um clarão de céu. */}
            <RadialGradient id="topTint" cx="50%" cy="0%" rx="90%" ry="55%">
              <Stop offset="0" stopColor={tint} stopOpacity={TINT_CORE} />
              <Stop offset="0.55" stopColor={tint} stopOpacity={TINT_MID} />
              <Stop offset="1" stopColor={tint} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          <Rect x="0" y="0" width="100%" height="100%" fill="url(#topTint)" />
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
