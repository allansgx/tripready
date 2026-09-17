/**
 * O carimbo da marca, em coordenadas puras e com a inclinação já embutida —
 * não há transformação a aplicar depois. Lido pelo splash e por
 * `scripts/build-brand-assets.mjs`, que gera os PNGs a partir dos mesmos
 * traços; por isso o arquivo não importa nada: o gerador roda no Node.
 */

/** Lado do `viewBox` quadrado em que o carimbo foi desenhado. */
export const MARK_VIEWBOX = 100;

/**
 * `ink` é a moldura e o avião, na cor única do carimbo; `check` é o traço da
 * cauda, que muda de cor conforme o fundo.
 */
export type MarkPartRole = 'ink' | 'check';

export type MarkPart = {
  d: string;
  role: MarkPartRole;
};

/**
 * A moldura é um anel: o contorno de fora e o de dentro percorrido ao
 * contrário, que é o que abre o vazado. O check são dois segmentos de ponta
 * redonda que se sobrepõem no vértice.
 */
export const MARK_PARTS: readonly MarkPart[] = [
  {
    role: 'ink',
    d: 'M 25.08 13.7 L 65.4 8.75 C 75.68 7.49, 85.03 14.8, 86.3 25.08 L 91.25 65.4 C 92.51 75.68, 85.2 85.03, 74.92 86.3 L 34.6 91.25 C 24.32 92.51, 14.97 85.2, 13.7 74.92 L 8.75 34.6 C 7.49 24.32, 14.8 14.97, 25.08 13.7 Z M 25.51 17.19 C 17.16 18.22, 11.22 25.82, 12.24 34.17 L 17.19 74.49 C 18.22 82.84, 25.82 88.78, 34.17 87.76 L 74.49 82.81 C 82.84 81.78, 88.78 74.18, 87.76 65.83 L 82.81 25.51 C 81.78 17.16, 74.18 11.22, 65.83 12.24 L 25.51 17.19 Z',
  },
  {
    role: 'ink',
    d: 'M 23.14 42.7 L 55.8 40.99 L 45.65 53.67 L 23.68 47.04 Z',
  },
  {
    role: 'ink',
    d: 'M 66.21 28.87 C 69.78 26.5, 73.46 28.39, 73.69 31.39 L 49.74 70.84 L 47.03 71.17 L 44.79 52.98 L 54.95 40.31 Z',
  },
  {
    role: 'check',
    d: 'M 27.38 67.51 L 36.32 73.03 C 37.8 73.94, 39.74 73.48, 40.65 72 C 41.56 70.52, 41.1 68.59, 39.62 67.68 L 30.68 62.16 C 29.2 61.25, 27.27 61.71, 26.35 63.19 C 25.44 64.67, 25.9 66.6, 27.38 67.51 Z M 40.76 71.82 L 45.56 62.69 C 46.37 61.15, 45.78 59.25, 44.24 58.44 C 42.7 57.63, 40.8 58.22, 39.99 59.76 L 35.19 68.89 C 34.38 70.43, 34.97 72.33, 36.51 73.13 C 38.05 73.94, 39.95 73.35, 40.76 71.82 Z',
  },
];

/** Aqui, e não em `theme/tokens.ts`, porque aquele arquivo importa `react-native`. */
export const SPLASH_COLORS = {
  /** Céu claro, usado nos assets de marca sobre fundo claro. */
  sky: '#CEE2F8',
  /** Roxo da marca — espelho de `colors.primary`. Fundo do splash. */
  brand: '#6C4EE3',
  /** Texto discreto sobre o roxo, na espera longa. */
  note: '#D6CCFA',
  mark: {
    /** Carimbo sobre o céu claro. */
    onSky: { ink: '#6C4EE3', check: '#4FA3F7' },
    /** Carimbo sobre o roxo, no ícone do app. */
    onBrand: { ink: '#FFFFFF', check: '#A9C9FB' },
  },
} as const;

/** Largura da marca no splash nativo: o mesmo número do `imageWidth` do `app.json`. */
export const MARK_SIZE = 92;

/**
 * Fração do PNG de ícone ocupada pelo carimbo. A máscara adaptativa do Android
 * pode ser um círculo: a diagonal do carimbo inteiro precisa caber nos 66%
 * centrais. Quem desenha esse PNG em outro lugar divide por isto para chegar ao
 * tamanho visível da marca.
 */
export const ICON_MARK_SCALE = 0.55;
