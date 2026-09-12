/**
 * O ritmo da abertura, em um lugar só.
 *
 * Ajustar a animação é mexer nestes números — nunca caçar durações espalhadas
 * pelo componente. Os tempos são o início de cada gesto, contados do primeiro
 * quadro; a duração vem junto porque quase todos se sobrepõem de propósito.
 *
 * A abertura é curta de propósito: um avião que decola e a Home entrando. Não
 * há tela de marca com texto — ela custava segundos de toda abertura para dizer
 * o que o ícone do app já disse.
 *
 * A exceção são as camadas de nuvem: os tempos delas ficam em `cloud-decks.ts`,
 * ao lado da geometria que animam, porque separar as duas coisas espalharia
 * três linhas de dados por dois arquivos sem ninguém ganhar nada.
 */

/** Cada etapa: quando começa e quanto dura, em milissegundos. */
export type Beat = { at: number; duration: number };

export const SPLASH_BEATS = {
  /** O recuo antes da subida — é ele que dá peso à decolagem. */
  crouch: { at: 220, duration: 100 },
  /** A subida, até sair pelo topo. */
  takeoff: { at: 320, duration: 660 },
  /**
   * O céu ganhando altitude: o roxo desce sobre o azul enquanto o avião sobe.
   * Termina antes do ponto de absorção, para a cena ser entregue assentada.
   */
  climb: { at: 300, duration: 700 },
} as const satisfies Record<string, Beat>;

/**
 * Quando a barra de status troca para clara. O alto da tela já está roxo a essa
 * altura, e ícone escuro sobre roxo some.
 */
export const STATUS_BAR_FLIP_AT = 620;

/**
 * O respiro entre o avião sumir pelo topo e a Home começar a entrar.
 *
 * Curto: o suficiente para o rastro ficar sozinho por um instante, sem virar
 * pausa. É o ponto de absorção — a cena está inteira e nada mais se move, então
 * esperar pelo app aqui não parece espera.
 */
export const SETTLE_MS = 60;

/** A Home entrando: o overlay se abre e se apaga sobre ela. */
export const SPLASH_EXIT_MS = 420;

/**
 * Sem movimento não há voo: o avião fica onde o splash nativo o deixou e a Home
 * entra logo em seguida. A tela continua existindo, só não se move.
 */
export const REDUCED_HOLD_MS = 600;

/** Sem movimento, o céu ainda muda de cor — trocar de cor não é movimento. */
export const REDUCED_CLIMB_MS = 320;

/**
 * Se a espera passar disso **depois** do ponto de absorção, ela deixou de ser
 * abertura e virou espera: uma linha discreta aparece dizendo o que está
 * acontecendo. Conta a partir do ponto de absorção, e não do início, para a
 * mensagem nunca aparecer em uma abertura que correu bem.
 */
export const WAITING_NOTE_AFTER_HOLD_MS = 2000;

const end = (beat: Beat) => beat.at + beat.duration;

/**
 * O ponto de absorção: o primeiro instante em que dá para entregar a tela ao
 * app sem cortar gesto nenhum. É logo depois de o avião sair pelo topo.
 */
export function splashSchedule(reduceMotion: boolean): { holdAt: number } {
  if (reduceMotion) return { holdAt: REDUCED_HOLD_MS };

  return { holdAt: end(SPLASH_BEATS.takeoff) + SETTLE_MS };
}

/**
 * Sair exige as duas coisas: a animação chegou ao ponto de absorção e o app tem
 * o que mostrar. Faltando qualquer uma, o overlay fica — cortar a animação no
 * meio é pior que não tê-la, e sair antes do app traz o indicador de carga de
 * volta, que é justamente o que esta tela existe para eliminar.
 */
export function canLeaveSplash({
  holdReached,
  isAppReady,
}: {
  holdReached: boolean;
  isAppReady: boolean;
}): boolean {
  return holdReached && isAppReady;
}
