/** O ritmo da abertura. Os tempos são contados do primeiro quadro. */

/** O tempo mínimo em quadro: sem ele, uma abertura rápida faria a marca piscar. */
export const SPLASH_HOLD_MS = 460;

/** A saída: a marca cresce enquanto o céu se apaga sobre a tela que já está atrás. */
export const SPLASH_EXIT_MS = 420;

/** Quanto a marca cresce ao sair. Pouco de propósito: é um respiro, não um salto. */
export const SPLASH_EXIT_SCALE = 1.08;

/** Sem movimento a marca não cresce, e a espera encurta: não há o que assistir. */
export const REDUCED_HOLD_MS = 320;
export const REDUCED_EXIT_MS = 240;

// Conta do ponto de absorção, e não do início, para a mensagem nunca aparecer
// em uma abertura que correu bem.
export const WAITING_NOTE_AFTER_HOLD_MS = 2000;

/** O ponto de absorção e a duração da saída, que mudam juntos com o movimento. */
export function splashSchedule(reduceMotion: boolean): { holdAt: number; exitMs: number } {
  if (reduceMotion) return { holdAt: REDUCED_HOLD_MS, exitMs: REDUCED_EXIT_MS };

  return { holdAt: SPLASH_HOLD_MS, exitMs: SPLASH_EXIT_MS };
}

/** Sair exige a marca já vista e o app com o que mostrar. */
export function canLeaveSplash({
  holdReached,
  isAppReady,
}: {
  holdReached: boolean;
  isAppReady: boolean;
}): boolean {
  return holdReached && isAppReady;
}
