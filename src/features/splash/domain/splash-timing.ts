/** Cada etapa: quando começa e quanto dura, em milissegundos. */
export type Beat = { at: number; duration: number };

/** O ritmo da abertura. Os tempos são contados do primeiro quadro. */
export const SPLASH_BEATS = {
  /** O recuo antes da subida — é ele que dá peso à decolagem. */
  crouch: { at: 220, duration: 100 },
  /** A subida, até sair pelo topo. */
  takeoff: { at: 320, duration: 660 },
  /** O céu ganhando altitude, terminando antes do ponto de absorção. */
  climb: { at: 300, duration: 700 },
} as const satisfies Record<string, Beat>;

/** Quando a barra de status troca para clara: o alto da tela já está roxo. */
export const STATUS_BAR_FLIP_AT = 620;

/** O respiro entre o avião sumir pelo topo e a Home começar a entrar. */
export const SETTLE_MS = 60;

/** A Home entrando: o overlay se abre e se apaga sobre ela. */
export const SPLASH_EXIT_MS = 420;

/** Sem movimento não há voo: o avião fica onde o splash nativo o deixou. */
export const REDUCED_HOLD_MS = 600;

/** Sem movimento, o céu ainda muda de cor — trocar de cor não é movimento. */
export const REDUCED_CLIMB_MS = 320;

// Conta do ponto de absorção, e não do início, para a mensagem nunca aparecer
// em uma abertura que correu bem.
export const WAITING_NOTE_AFTER_HOLD_MS = 2000;

const end = (beat: Beat) => beat.at + beat.duration;

/** O ponto de absorção: quando dá para entregar a tela sem cortar gesto nenhum. */
export function splashSchedule(reduceMotion: boolean): { holdAt: number } {
  if (reduceMotion) return { holdAt: REDUCED_HOLD_MS };

  return { holdAt: end(SPLASH_BEATS.takeoff) + SETTLE_MS };
}

/** Sair exige a animação no ponto de absorção e o app com o que mostrar. */
export function canLeaveSplash({
  holdReached,
  isAppReady,
}: {
  holdReached: boolean;
  isAppReady: boolean;
}): boolean {
  return holdReached && isAppReady;
}
