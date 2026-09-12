import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Rect } from 'react-native-svg';

import {
  BASE_DECK_HEIGHT,
  BASE_DECK_ID,
  BASE_PUFF,
  CLOUD_DECKS,
  DECK_FILL_OPACITY,
  DECK_OVERSHOOT,
  DECK_SIDE_MARGIN,
  type CloudDeck,
} from '@/features/splash/domain/cloud-decks';
import { SPLASH_COLORS } from '@/features/splash/domain/plane-art';

/**
 * Os bancos de nuvem da abertura.
 *
 * Nenhum deles está no primeiro quadro: o splash nativo é uma cor chapada e um
 * avião, e qualquer nuvem já desenhada ali apareceria do nada na troca. O
 * primeiro sobe para o lugar enquanto o avião ainda espera.
 *
 * Os de cima entram depois, **descendo**, conforme o avião sobe. É a mesma
 * ideia do céu que muda de cor: quem ganha altitude vê as camadas ficarem para
 * trás, e ver camada ficando para trás é o que diz que se está subindo.
 * Sozinho, um avião transladando para cima sobe parado.
 */

const VIEWBOX = { width: 400, height: 150 };

export function CloudDecks({
  width,
  height,
  reduceMotion,
}: {
  width: number;
  height: number;
  reduceMotion: boolean;
}) {
  return (
    <>
      {CLOUD_DECKS.map((deck) => (
        <Deck
          key={deck.id}
          deck={deck}
          screenWidth={width}
          screenHeight={height}
          reduceMotion={reduceMotion}
        />
      ))}
    </>
  );
}

function Deck({
  deck,
  screenWidth,
  screenHeight,
  reduceMotion,
}: {
  deck: CloudDeck;
  screenWidth: number;
  screenHeight: number;
  reduceMotion: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Sem movimento, só o banco de base existe, e entra sem deslocamento.
    if (reduceMotion) {
      if (deck.id === BASE_DECK_ID) progress.value = withTiming(1, { duration: 220 });
      return;
    }

    progress.value = withDelay(
      deck.at,
      withTiming(1, { duration: deck.duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [deck, progress, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value * deck.opacity,
    transform: [{ translateY: (1 - progress.value) * deck.from }],
  }));

  /**
   * O tamanho da nuvem vem da escala da camada; a largura, não.
   *
   * Amarrar as duas coisas ao mesmo número é o que fazia a camada distante ser
   * um banco mais estreito que a tela, com a lateral aparecendo como um corte
   * reto no meio do céu. Camada distante tem nuvem menor e continua cobrindo a
   * tela inteira — a crista é gerada na largura que for preciso.
   */
  const puff = BASE_PUFF * ((BASE_DECK_HEIGHT * screenHeight) / VIEWBOX.height) * deck.scale;
  const isBase = deck.id === BASE_DECK_ID;

  /**
   * O banco de base é o desenho fixo, que não mudou: ele é mais largo que a
   * tela e o que se vê dele é o miolo. Só as camadas de cima são geradas.
   */
  const designScale = ((BASE_DECK_HEIGHT * screenHeight) / VIEWBOX.height) * deck.scale;
  const boxWidth = isBase ? VIEWBOX.width * designScale : screenWidth + DECK_SIDE_MARGIN * 2;
  const boxLeft = isBase ? (screenWidth - boxWidth) / 2 + deck.x : -DECK_SIDE_MARGIN;

  return (
    <Animated.View
      style={[styles.deck, { width: boxWidth, top: deck.top * screenHeight, left: boxLeft }, style]}
      pointerEvents="none">
      {isBase ? (
        <SkyClouds width={boxWidth} height={VIEWBOX.height * designScale} />
      ) : (
        <CloudRidge width={boxWidth} puff={puff} seed={deck.x} />
      )}
      {/* A continuação do banco, que desce até sair da tela. Encosta na borda
          de baixo do desenho e leva a mesma opacidade do grupo da frente, para
          a emenda entre as duas não existir. */}
      <View style={styles.fill} />
    </Animated.View>
  );
}

/** Sorteio estável: a mesma camada desenha a mesma crista toda vez. */
function jitter(index: number, seed: number) {
  const value = Math.sin(index * 12.9898 + seed * 4.1414) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Uma crista de nuvens da largura que for pedida.
 *
 * São círculos encostados em fila, de raios sorteados, em duas fileiras: a de
 * trás menor e mais alta, dando espessura ao banco, e a da frente. Eles se
 * sobrepõem sempre — separados, deixariam de ser uma nuvem e virariam bolhas.
 *
 * As fileiras vão além das duas pontas de propósito, e a parte de baixo dos
 * círculos sai pela borda inferior, onde a faixa cheia continua. Assim a crista
 * não tem começo, meio nem fim visíveis: só o contorno de cima.
 */
function CloudRidge({ width, puff, seed }: { width: number; puff: number; seed: number }) {
  const height = puff * 2.6;
  const rows = [
    { opacity: 0.5, size: puff * 0.72, top: height - puff * 1.25, phase: 0.5 },
    { opacity: DECK_FILL_OPACITY, size: puff, top: height - puff * 0.3, phase: 0 },
  ];

  return (
    <Svg width={width} height={height}>
      {rows.map((row) => {
        // Passo curto: mesmo o menor par de círculos vizinhos precisa se
        // sobrepor, senão abre um vão e a crista vira uma fila de bolhas.
        const step = row.size * 0.85;
        const count = Math.ceil(width / step) + 2;

        return (
          <G key={row.opacity} opacity={row.opacity} fill={SPLASH_COLORS.cloud}>
            {Array.from({ length: count }, (_, index) => {
              /**
               * Duas frequências, e é a lenta que faz a nuvem.
               *
               * Só com sorteio por círculo a crista sai uniforme: bolhas de
               * tamanho parecido em fila, que lê como barra ondulada. A onda
               * lenta junta os círculos em massas com vales entre elas, que é a
               * forma de uma nuvem; o sorteio por círculo só tira a regularidade
               * de dentro de cada massa.
               */
              const wave = 0.5 + 0.5 * Math.sin(index * 0.85 + seed * 0.7);
              const size = row.size * (0.52 + 0.62 * wave + 0.3 * jitter(index, seed + row.phase));

              return (
                <Circle
                  key={index}
                  cx={(index + row.phase - 1) * step}
                  // A massa maior sobe; o vale entre elas fica para trás.
                  cy={row.top + row.size * 0.34 * (1 - wave)}
                  r={size}
                />
              );
            })}
          </G>
        );
      })}
    </Svg>
  );
}

/**
 * Um banco: três nuvens em profundidades diferentes.
 *
 * Cada nuvem é um grupo com opacidade própria — assim os círculos se somam em
 * uma silhueta só, em vez de mostrarem as emendas onde se cruzam.
 */
export function SkyClouds({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}>
      {/* Fundo: menores e mais diluídas, para dar profundidade ao banco. */}
      <G opacity={0.5} fill={SPLASH_COLORS.cloud}>
        <Circle cx={58} cy={62} r={30} />
        <Circle cx={96} cy={48} r={25} />
        <Circle cx={130} cy={64} r={27} />
        <Rect x={58} y={62} width={72} height={90} />
      </G>

      <G opacity={0.55} fill={SPLASH_COLORS.cloud}>
        <Circle cx={262} cy={56} r={34} />
        <Circle cx={308} cy={42} r={27} />
        <Circle cx={348} cy={60} r={29} />
        <Rect x={262} y={56} width={86} height={96} />
      </G>

      {/* Frente: a camada cheia, de onde o avião parece sair. */}
      <G opacity={DECK_FILL_OPACITY} fill={SPLASH_COLORS.cloud}>
        <Circle cx={18} cy={108} r={40} />
        <Circle cx={84} cy={92} r={48} />
        <Circle cx={162} cy={104} r={42} />
        <Circle cx={238} cy={96} r={46} />
        <Circle cx={318} cy={106} r={40} />
        <Circle cx={386} cy={98} r={44} />
        <Rect x={0} y={100} width={VIEWBOX.width} height={52} />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  deck: {
    position: 'absolute',
    bottom: -DECK_OVERSHOOT,
  },
  fill: {
    flex: 1,
    backgroundColor: SPLASH_COLORS.cloud,
    opacity: DECK_FILL_OPACITY,
  },
});
