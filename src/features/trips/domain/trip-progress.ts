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
 * Regra de progresso da viagem, em um lugar só.
 *
 * - Obrigatórios e recomendados entram na porcentagem.
 * - Informativos ficam de fora: são conteúdo de consulta e não podem derrubar
 *   o progresso de quem já fez o que precisava.
 * - "Pronta" depende exclusivamente dos obrigatórios.
 *
 * Exemplo do produto: 5/5 obrigatórios + 3/6 recomendados + 1/4 informativos
 * resulta em 8/11 = 73%, com a viagem já pronta.
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

/**
 * Quantos itens ainda esperam verificação, no mesmo recorte da porcentagem.
 *
 * É o que a Home mostra no dia do embarque, no lugar do percentual: naquele dia
 * a pergunta deixa de ser "quanto eu preparei" e passa a ser "o que ainda dá
 * para fazer agora", e uma contagem responde isso melhor que uma nota.
 */
export function formatPendingLabel(progress: TripProgress): string {
  if (progress.total === 0) return 'Checklist em preparação';

  const pending = progress.total - progress.done;
  if (pending === 0) return 'Tudo verificado';
  return `${pending} ${pending === 1 ? 'item pendente' : 'itens pendentes'}`;
}

/**
 * O que a checklist oferece a quem já embarcou.
 *
 * Conta os itens de prioridade `informational`: os que não pedem ação e, por
 * isso, ficam fora do progresso. Hoje o catálogo traz quatro — contatos de
 * emergência, regras de bagagem da companhia, orçamento da viagem e a
 * confirmação de entrada sem visto. Nem todos nasceram para a viagem em si, e é
 * por isso que a frase convida a consultar em vez de prometer conteúdo de
 * destino: ela envelhece bem se o catálogo ganhar itens de uso no local.
 */
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
