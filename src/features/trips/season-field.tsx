import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { SeasonShape, type SeasonShapeKind } from '@/features/trips/season-shapes';
import { useReduceMotion } from '@/lib/animation';
import { seasonColors } from '@/theme/tokens';
import type { Season } from '@/types/models';

/**
 * O clima da viagem ocupando a tela inteira, atrás do conteúdo.
 *
 * Cada partícula é um corpo com gravidade, arrasto do ar e balanço: cai a tela
 * toda, sai por baixo e volta pelo topo, sem fim. Não há chão nem acúmulo — é
 * paisagem, e o campo continua sem receber toque nenhum: ele apenas *lê* onde o
 * dedo está, por um ponteiro que a tela alimenta. Nenhum botão, rolagem ou
 * gesto de navegação é disputado por causa disso.
 *
 * A simulação roda inteira na UI thread, em worklets: a thread de JS não
 * participa de nenhum quadro. Fora de foco, o laço para.
 */

/** Quantas estações o campo representa ao mesmo tempo. */
const MAX_SEASONS = 2;
/** Divisão das partículas quando a viagem atravessa duas estações. */
const FIRST_SEASON_SHARE = 0.6;

/**
 * Teto de partículas na tela.
 *
 * O limite é de custo por quadro (um `useAnimatedStyle` por partícula), mas
 * também de composição: acima disso a Home vira uma tela de neve, e o texto
 * passa a competir com o fundo.
 */
const MAX_PARTICLES = 26;

/** Área de referência do sorteio de contagem — um celular comum, em pontos. */
const AREA_BASE = 390 * 844;
const MIN_AREA_SCALE = 0.7;
const MAX_AREA_SCALE = 1.15;

/** Até quanto acima do topo uma partícula reaparece, em telas. */
const RESPAWN_RISE = 0.6;
/** Quanto ela pode passar da borda de baixo antes de ser reciclada. */
const RECYCLE_MARGIN = 2;

const WALL_RETENTION = 0.4;
/** Arrasto do ar, aplicado ao movimento horizontal a cada quadro. */
const AIR_DRAG = 0.99;
/** Achatamento mínimo no giro em profundidade — `scaleX: 0` é um quadro perdido. */
const MIN_FLATTEN = 0.08;

/**
 * A profundidade é deliberadamente discreta.
 *
 * O que ela precisa entregar é paralaxe — o fundo andando mais devagar que a
 * frente —, não uma tela com partículas de tamanhos muito diferentes. Por isso
 * os fatores partem de 0,7 e não de zero: nada encolhe ou apaga a ponto de
 * parecer uma segunda camada de enfeite.
 */
const DEPTH_SIZE_FLOOR = 0.7;
const DEPTH_OPACITY_FLOOR = 0.6;
const DEPTH_FALL_FLOOR = 0.75;

/** Abaixo disto a partícula é desenhada sem detalhe interno. */
const SOFT_DEPTH = 0.45;

/**
 * O alcance do sopro do dedo, em pontos de tela.
 *
 * Precisa ser bem maior do que a intuição sugere. Vinte e poucas partículas
 * espalhadas por uma tela de celular ficam, em média, a mais de cem pontos uma
 * da outra: um raio pequeno faz a maioria dos toques não encontrar partícula
 * nenhuma, e o efeito simplesmente não acontece. O raio é o que garante que
 * passar o dedo pela tela sempre pegue alguma coisa.
 */
const POINTER_RADIUS = 220;
/** Aceleração que o dedo aplica no limite máximo, em pontos/s². */
const POINTER_FORCE = 2600;
/** O dedo espalha mais do que levanta. */
const POINTER_LIFT_SHARE = 0.6;
/**
 * Quanto a profundidade reduz o sopro.
 *
 * Ao contrário do tamanho e da opacidade, aqui o piso é alto: quem está ao
 * fundo reage com 60% da força, não com 20%. Como a maioria das partículas está
 * ao fundo, um piso baixo faria o efeito quase não existir — e profundidade
 * deve mudar a *intensidade* da reação, nunca a existência dela.
 */
const POINTER_DEPTH_FLOOR = 0.6;
/** Teto da velocidade empurrada, em múltiplos da velocidade terminal. */
const PUSH_SPEED_LIMIT = 6;

/** Onde o dedo está, em coordenadas da tela. Escrito pela Home, lido no worklet. */
export type FieldPointer = { x: number; y: number; active: boolean };

type SeasonPhysics = {
  kind: SeasonShapeKind;
  count: number;
  size: [number, number];
  opacity: [number, number];
  /** Aceleração da queda, em px/s². */
  gravity: [number, number];
  /** Velocidade máxima de queda, em px/s. */
  terminal: [number, number];
  /** Força do bamboleio lateral, em px/s². */
  sway: [number, number];
  /** Giro no plano da tela, em graus/s. */
  spin: [number, number];
  /** Rotação em profundidade, em rad/s — é o que faz a folha virar de lado. */
  tumble: [number, number];
  /** Achata a forma no eixo X ao girar em profundidade. */
  flattens: boolean;
};

/**
 * O peso de cada estação.
 *
 * Folha grande cai mais rápido e balança mais que floco pequeno, e o giro em
 * profundidade só existe em folha e pétala — floco e partícula de luz não têm
 * lado. A luz do verão desce quase parada, como poeira suspensa no sol.
 */
const SEASON_PHYSICS: Record<Season, SeasonPhysics> = {
  winter: {
    kind: 'flake',
    count: 24,
    size: [20, 60],
    opacity: [0.28, 0.46],
    gravity: [26, 42],
    terminal: [40, 70],
    sway: [10, 24],
    spin: [4, 16],
    tumble: [0.4, 1],
    flattens: false,
  },
  autumn: {
    kind: 'leaf',
    count: 16,
    size: [20, 60],
    opacity: [0.22, 0.38],
    gravity: [55, 85],
    terminal: [70, 120],
    sway: [26, 50],
    spin: [16, 42],
    tumble: [1.4, 2.6],
    flattens: true,
  },
  spring: {
    kind: 'petal',
    count: 18,
    size: [20, 60],
    opacity: [0.22, 0.38],
    gravity: [40, 65],
    terminal: [55, 90],
    sway: [30, 54],
    spin: [12, 32],
    tumble: [1.2, 2.2],
    flattens: true,
  },
  summer: {
    kind: 'mote',
    count: 20,
    size: [20, 60],
    opacity: [0.25, 0.45],
    gravity: [10, 18],
    terminal: [16, 28],
    sway: [14, 28],
    spin: [0, 6],
    tumble: [0.3, 0.8],
    flattens: false,
  },
};

/** O que cada partícula é — sorteado uma vez e nunca mais alterado. */
type Descriptor = {
  key: string;
  color: string;
  kind: SeasonShapeKind;
  size: number;
  opacity: number;
  gravity: number;
  terminal: number;
  sway: number;
  spin: number;
  tumble: number;
  flattens: boolean;
  /** 0,2 ao fundo, 1 à frente. */
  depth: number;
  /** Posição horizontal inicial, como fração da largura. */
  xFraction: number;
  /** Altura inicial acima do topo, em múltiplos da altura da tela. */
  riseFraction: number;
};

/** O que muda a cada quadro. */
type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  tumble: number;
};

/**
 * Todo o estado mutável em um valor compartilhado só.
 *
 * É a forma que o Reanimated aceita mutar de dentro de um worklet — via
 * `modify` — e a que o React Compiler não trata como imutável. Cada `modify` é
 * também o aviso que redesenha as partículas.
 */
type FieldState = {
  bodies: Body[];
  /** As posições iniciais já foram distribuídas na tela medida. */
  placed: boolean;
};

/** Sorteio determinístico: a mesma viagem devolve sempre o mesmo campo. */
function createRandom(seed: string): () => number {
  let state = 0x9e3779b9;
  for (let index = 0; index < seed.length; index++) {
    state = Math.imul(state ^ seed.charCodeAt(index), 0x85ebca6b);
  }

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A camada em que a partícula cai: 55% ao fundo, 30% no meio, 15% à frente.
 *
 * A maioria fica atrás de propósito — é o que mantém o campo discreto por trás
 * do texto, e é de onde vem a sensação de distância.
 */
function pickDepth(random: () => number): number {
  const layer = random();
  if (layer < 0.55) return 0.2 + random() * 0.25;
  if (layer < 0.85) return 0.45 + random() * 0.25;
  return 0.7 + random() * 0.3;
}

function createDescriptors(
  seasons: readonly Season[],
  seed: string,
  screenArea: number,
): Descriptor[] {
  const chosen = seasons.slice(0, MAX_SEASONS);
  if (chosen.length === 0) return [];

  const planned = chosen.reduce((total, season) => total + SEASON_PHYSICS[season].count, 0);
  // Tela maior comporta mais partículas, e o teto vale sempre: em um tablet a
  // contagem cresce um pouco, em um aparelho pequeno ela encolhe.
  const areaScale = Math.min(
    MAX_AREA_SCALE,
    Math.max(MIN_AREA_SCALE, screenArea / AREA_BASE),
    MAX_PARTICLES / planned,
  );

  const random = createRandom(seed);
  const between = ([min, max]: [number, number]) => min + random() * (max - min);
  const sign = () => (random() > 0.5 ? 1 : -1);

  const descriptors = chosen.flatMap((season, seasonIndex) => {
    const physics = SEASON_PHYSICS[season];
    const share =
      chosen.length === 1 ? 1 : seasonIndex === 0 ? FIRST_SEASON_SHARE : 1 - FIRST_SEASON_SHARE;
    const count = Math.max(3, Math.round(physics.count * share * areaScale));

    return Array.from({ length: count }, (_, index): Descriptor => {
      const depth = pickDepth(random);

      return {
        key: `${season}-${index}`,
        color: seasonColors[season],
        kind: physics.kind,
        size: between(physics.size) * (DEPTH_SIZE_FLOOR + (1 - DEPTH_SIZE_FLOOR) * depth),
        opacity:
          between(physics.opacity) * (DEPTH_OPACITY_FLOOR + (1 - DEPTH_OPACITY_FLOOR) * depth),
        gravity: between(physics.gravity) * (DEPTH_FALL_FLOOR + (1 - DEPTH_FALL_FLOOR) * depth),
        terminal: between(physics.terminal) * (DEPTH_FALL_FLOOR + (1 - DEPTH_FALL_FLOOR) * depth),
        sway: between(physics.sway),
        spin: between(physics.spin) * sign(),
        tumble: between(physics.tumble) * sign(),
        flattens: physics.flattens,
        depth,
        xFraction: random(),
        // Cada uma começa a uma altura diferente acima da tela: a chuva nasce
        // espalhada, sem agendamento nenhum — só pela distância a percorrer.
        riseFraction: 0.1 + random() * 2.4,
      };
    });
  });

  // Ordenado uma vez, na criação: a ordem do array é a ordem de pintura, então
  // quem está ao fundo fica atrás de quem está à frente para sempre. Ordenar
  // por quadro seria pagar um sort a 60fps por um resultado que nunca muda.
  return descriptors.sort((a, b) => a.depth - b.depth);
}

function createState(count: number): FieldState {
  return {
    bodies: Array.from({ length: count }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      spin: 0,
      tumble: 0,
    })),
    placed: false,
  };
}

export function SeasonField({
  seasons,
  seed,
  pointer,
}: {
  seasons: readonly Season[];
  seed: string;
  /** Onde o dedo está. O campo só lê: quem captura o toque é a tela. */
  pointer: SharedValue<FieldPointer>;
}) {
  const reduceMotion = useReduceMotion();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  // Sorteado uma vez. Quem troca a viagem ou as estações dela troca a `key` do
  // componente, e o campo inteiro nasce de novo.
  const [descriptors] = useState(() =>
    createDescriptors(seasons, seed, screenWidth * screenHeight),
  );

  const state = useSharedValue<FieldState>(createState(descriptors.length));

  const simulation = useFrameCallback((frame) => {
    'worklet';
    if (!box || !state.value.placed) return;

    // Passo limitado: depois de uma pausa longa, um `dt` gigante teleportaria
    // todo mundo para fora da tela em um único quadro.
    const dt = Math.min((frame.timeSincePreviousFrame ?? 16) / 1000, 0.05);
    const finger = pointer.value;

    state.modify((field) => {
      'worklet';
      for (let index = 0; index < field.bodies.length; index++) {
        const body = field.bodies[index];
        const particle = descriptors[index];

        body.tumble += particle.tumble * dt;
        body.spin += particle.spin * dt;

        body.vy = Math.min(body.vy + particle.gravity * dt, particle.terminal);
        // O bamboleio acompanha o giro em profundidade: a folha ganha empuxo
        // lateral quando está de lado, como no ar de verdade.
        body.vx = (body.vx + Math.sin(body.tumble) * particle.sway * dt) * AIR_DRAG;

        // O dedo é um sopro, não uma mão: empurra para longe com força maior
        // quanto mais perto, e quem está à frente sente de mais longe.
        if (finger.active) {
          const dx = body.x + particle.size / 2 - finger.x;
          const dy = body.y + particle.size / 2 - finger.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const radius = POINTER_RADIUS * (0.8 + 0.3 * particle.depth);

          if (distance > 0 && distance < radius) {
            // Aceleração, e não velocidade: é assim que a força do protótipo
            // Web, escrita por quadro, vira força por segundo aqui.
            const reach = POINTER_DEPTH_FLOOR + (1 - POINTER_DEPTH_FLOOR) * particle.depth;
            const push = (1 - distance / radius) * POINTER_FORCE * reach * dt;
            body.vx += (dx / distance) * push;
            body.vy += (dy / distance) * push * POINTER_LIFT_SHARE;
          }
        }

        // Teto do empurrão: o dedo desloca, não arremessa. Solto o dedo, o
        // arrasto do ar e a gravidade devolvem a queda natural sozinhos — a
        // velocidade natural é o atrator do sistema, não um valor guardado.
        const limit = particle.terminal * PUSH_SPEED_LIMIT;
        body.vx = Math.max(-limit, Math.min(limit, body.vx));
        body.vy = Math.max(-limit, Math.min(limit, body.vy));

        body.x += body.vx * dt;
        body.y += body.vy * dt;

        const maxX = box.width - particle.size;
        if (body.x < 0) {
          body.x = 0;
          body.vx = -body.vx * WALL_RETENTION;
        } else if (body.x > maxX) {
          body.x = maxX;
          body.vx = -body.vx * WALL_RETENTION;
        }

        // Saiu por baixo: volta pelo topo, em outro ponto e do repouso, para a
        // chuva não repetir o mesmo desenho a cada volta.
        if (body.y > box.height + particle.size * RECYCLE_MARGIN) {
          body.x = Math.random() * Math.max(1, maxX);
          body.y = -particle.size - Math.random() * box.height * RESPAWN_RISE;
          body.vx = 0;
          body.vy = 0;
        }
      }

      return field;
    });
  }, false);

  /**
   * A queda só roda com a Home em foco. Ao voltar, as partículas continuam
   * exatamente de onde pararam — o campo não recomeça a cada visita.
   */
  useFocusEffect(
    useCallback(() => {
      if (reduceMotion || !box || descriptors.length === 0) return;

      simulation.setActive(true);
      return () => simulation.setActive(false);
    }, [reduceMotion, box, descriptors, simulation]),
  );

  /**
   * As posições iniciais dependem do tamanho da tela, então nascem aqui, na
   * primeira medição. Uma remedição posterior só atualiza a caixa: reposicionar
   * tudo faria a chuva saltar.
   */
  function measure(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;

    if (box) {
      if (box.width !== width || box.height !== height) setBox({ width, height });
      return;
    }

    state.modify((field) => {
      'worklet';
      for (let index = 0; index < field.bodies.length; index++) {
        const particle = descriptors[index];
        field.bodies[index].x = particle.xFraction * Math.max(1, width - particle.size);
        field.bodies[index].y = -particle.riseFraction * height - particle.size;
      }
      field.placed = true;
      return field;
    });

    setBox({ width, height });
  }

  if (seasons.length === 0 || reduceMotion) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={measure}>
      {box
        ? descriptors.map((descriptor, index) => (
            <Particle key={descriptor.key} descriptor={descriptor} index={index} state={state} />
          ))
        : null}
    </View>
  );
}

function Particle({
  descriptor,
  index,
  state,
}: {
  descriptor: Descriptor;
  index: number;
  state: SharedValue<FieldState>;
}) {
  const style = useAnimatedStyle(() => {
    const body = state.value.bodies[index];

    // Girar em profundidade é achatar no eixo X: a folha quase some ao passar
    // de perfil, que é exatamente o que ela faz caindo.
    const flatten = Math.cos(body.tumble);
    const scaleX = descriptor.flattens
      ? Math.sign(flatten || 1) * Math.max(MIN_FLATTEN, Math.abs(flatten))
      : 1;

    return {
      transform: [
        { translateX: body.x },
        { translateY: body.y },
        { rotate: `${body.spin}deg` },
        { scaleX },
      ],
    };
  });

  return (
    <Animated.View style={[styles.particle, { opacity: descriptor.opacity }, style]}>
      <SeasonShape
        kind={descriptor.kind}
        size={descriptor.size}
        color={descriptor.color}
        soft={descriptor.depth < SOFT_DEPTH}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
