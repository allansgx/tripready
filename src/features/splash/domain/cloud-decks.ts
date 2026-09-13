export type CloudDeck = {
  id: string;
  /** Topo do desenho, em fração da altura da tela: mais alto parece mais longe. */
  top: number;
  /** Tamanho relativo ao banco de base. Menor é mais longe. */
  scale: number;
  opacity: number;
  /** Deslocamento horizontal; nas cristas geradas é a semente do sorteio. */
  x: number;
  at: number;
  duration: number;
  /** De onde a camada entra, em pixels: a de base sobe, as de cima descem. */
  from: number;
};

/** Da camada mais distante para a mais próxima — é também a ordem de desenho. */
export const CLOUD_DECKS: readonly CloudDeck[] = [
  { id: 'far', top: 0.48, scale: 0.36, opacity: 0.58, x: 58, at: 520, duration: 480, from: -38 },
  { id: 'mid', top: 0.55, scale: 0.55, opacity: 0.82, x: -68, at: 360, duration: 520, from: -46 },
  { id: 'base', top: 0.58, scale: 1, opacity: 1, x: 0, at: 0, duration: 520, from: 28 },
];

/** O banco que já está na cena antes de o avião sair do lugar. */
export const BASE_DECK_ID = 'base';

/** Altura do banco de base; é dela que sai a escala de todas as camadas. */
export const BASE_DECK_HEIGHT = 0.42;

// Camada distante tem nuvem menor, não banco mais estreito: a crista é gerada na
// largura da tela mais esta folga dos dois lados.
export const DECK_SIDE_MARGIN = 90;

/** Raio de referência das nuvens do banco de base, em unidades do desenho. */
export const BASE_PUFF = 44;

// As camadas entram deslocadas: sem a folga, a borda reta apareceria no rodapé.
export const DECK_OVERSHOOT = 80;

// Igual à do grupo de nuvens da frente: valores diferentes fariam uma linha
// aparecer na emenda, na borda de baixo do SVG.
export const DECK_FILL_OPACITY = 0.95;
