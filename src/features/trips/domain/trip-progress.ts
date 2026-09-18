import type { RequirementPriority } from '@/types/models';

/** O mínimo que o cálculo precisa saber sobre um requisito. */
export type ProgressItem = {
  priority: RequirementPriority;
  completed: boolean;
};

export type TripProgress = {
  /** Itens que contam para a porcentagem (obrigatórios + recomendados). */
  total: number;
  done: number;
  /** 0–100, já arredondado. */
  percent: number;
  requiredTotal: number;
  requiredDone: number;
  /** Obrigatórios que ainda faltam verificar. */
  requiredPending: number;
  /** Todos os obrigatórios verificados — a viagem está pronta. */
  isReady: boolean;
  informationalTotal: number;
  informationalDone: number;
};

/**
 * Regra de progresso da viagem: obrigatórios e recomendados entram na
 * porcentagem, informativos ficam de fora, e "pronta" só olha os obrigatórios.
 *
 * Só números — nenhuma frase. Quem escreve "8 de 11 itens verificados" é a
 * tela, com `t()`, para não duplicar plural e idioma aqui.
 */
export function computeTripProgress(items: readonly ProgressItem[]): TripProgress {
  const scored = items.filter((item) => item.priority !== 'informational');
  const required = items.filter((item) => item.priority === 'required');
  const informational = items.filter((item) => item.priority === 'informational');

  const total = scored.length;
  const done = scored.filter((item) => item.completed).length;
  const requiredDone = required.filter((item) => item.completed).length;

  return {
    total,
    done,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    requiredTotal: required.length,
    requiredDone,
    requiredPending: required.length - requiredDone,
    // Sem obrigatórios não há o que declarar pronto.
    isReady: required.length > 0 && requiredDone === required.length,
    informationalTotal: informational.length,
    informationalDone: informational.filter((item) => item.completed).length,
  };
}
