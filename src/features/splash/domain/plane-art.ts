/**
 * O avião da marca, em coordenadas puras. Lido pelo splash e por
 * `scripts/build-brand-assets.mjs`, que gera os PNGs a partir dos mesmos
 * traços — por isso o arquivo não importa nada: o gerador roda no Node.
 */

/** Lado do `viewBox` quadrado em que o avião foi desenhado. */
export const PLANE_VIEWBOX = 100;

/**
 * `body` é a fuselagem e as asas; `accent` são as pontas, que mudam de cor
 * conforme o fundo — roxo sobre o céu, lilás claro sobre o roxo da marca.
 */
export type PlanePartRole = 'body' | 'accent';

export type PlanePart = {
  d: string;
  role: PlanePartRole;
};

/** Nariz para o topo, simétrico em x = 50. As pontas são pintadas por cima das asas. */
export const PLANE_PARTS: readonly PlanePart[] = [
  {
    role: 'body',
    d: 'M 50 6 C 54.6 14.5, 57 25, 57 38 L 57 64 C 57 74, 54.3 82, 50 88 C 45.7 82, 43 74, 43 64 L 43 38 C 43 25, 45.4 14.5, 50 6 Z',
  },
  {
    role: 'body',
    d: 'M 57 33 C 68 39.5, 82.5 49, 92.8 56 C 95.3 57.8, 95.9 62.5, 93.5 63.6 L 57 55.5 Z',
  },
  {
    role: 'body',
    d: 'M 43 33 C 32 39.5, 17.5 49, 7.2 56 C 4.7 57.8, 4.1 62.5, 6.5 63.6 L 43 55.5 Z',
  },
  {
    role: 'body',
    d: 'M 56 67 C 62 71, 69 76, 74.3 80 C 76 81.3, 75.6 84.6, 73.4 84.4 L 56 80.5 Z',
  },
  {
    role: 'body',
    d: 'M 44 67 C 38 71, 31 76, 25.7 80 C 24 81.3, 24.4 84.6, 26.6 84.4 L 44 80.5 Z',
  },
  {
    role: 'accent',
    d: 'M 86 52.5 C 88.8 54.3, 91 55.5, 92.8 56 C 95.3 57.8, 95.9 62.5, 93.5 63.6 L 86.1 61.9 Z',
  },
  {
    role: 'accent',
    d: 'M 14 52.5 C 11.2 54.3, 9 55.5, 7.2 56 C 4.7 57.8, 4.1 62.5, 6.5 63.6 L 13.9 61.9 Z',
  },
  {
    role: 'accent',
    d: 'M 50 17 C 52.3 21.5, 53.3 26.5, 53.5 31 L 46.5 31 C 46.7 26.5, 47.7 21.5, 50 17 Z',
  },
];

/** Aqui, e não em `theme/tokens.ts`, porque aquele arquivo importa `react-native`. */
export const SPLASH_COLORS = {
  /** Céu do primeiro quadro. É também o fundo do splash nativo no `app.json`. */
  sky: '#CEE2F8',
  /** Nuvens e rastro. */
  cloud: '#FFFFFF',
  /** Roxo da marca — espelho de `colors.primary`. Usado nos ícones do app. */
  brand: '#6C4EE3',
  /** Texto discreto sobre o céu, na espera longa. */
  note: '#5C6B80',
  plane: {
    /** Avião sobre o céu. */
    onSky: { body: '#FFFFFF', accent: '#6C4EE3' },
    /** Avião sobre o roxo, no ícone do app. */
    onBrand: { body: '#FFFFFF', accent: '#C6B7F5' },
  },
} as const;

/** Largura do avião no splash nativo: o mesmo número do `imageWidth` do `app.json`. */
export const PLANE_MARK_SIZE = 92;
