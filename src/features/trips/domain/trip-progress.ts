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

/** Texto do progresso, sempre no formato "8 de 11 itens verificados". */
export function formatProgressLabel(progress: TripProgress): string {
  if (progress.total === 0) {
    return 'Checklist em preparação';
  }
  return `${progress.done} de ${progress.total} ${
    progress.total === 1 ? 'item verificado' : 'itens verificados'
  }`;
}

/** A mesma contagem em versão curta, para o rodapé do card: "1/8 itens". */
export function formatProgressFraction(progress: TripProgress): string {
  if (progress.total === 0) return 'Checklist em preparação';
  return `${progress.done}/${progress.total} ${progress.total === 1 ? 'item' : 'itens'}`;
}

/** Itens pendentes, no mesmo recorte da porcentagem: é o que a Home mostra no embarque. */
export function formatPendingLabel(progress: TripProgress): string {
  if (progress.total === 0) return 'Checklist em preparação';

  const pending = progress.total - progress.done;
  if (pending === 0) return 'Tudo verificado';
  return `${pending} ${pending === 1 ? 'item pendente' : 'itens pendentes'}`;
}

/** O que a checklist oferece a quem já embarcou: os itens `informational`. */
export function formatReferenceLabel(progress: TripProgress): string {
  if (progress.informationalTotal === 0) return 'Sua checklist continua à mão.';
  return progress.informationalTotal === 1
    ? '1 informação para consultar quando precisar.'
    : `${progress.informationalTotal} informações para consultar quando precisar.`;
}

/** Etiqueta dos obrigatórios pendentes; `null` quando não há nenhum. */
export function formatPendingRequiredLabel(progress: TripProgress): string | null {
  if (progress.requiredPending === 0) return null;
  return progress.requiredPending === 1
    ? '1 obrigatório'
    : `${progress.requiredPending} obrigatórios`;
}
