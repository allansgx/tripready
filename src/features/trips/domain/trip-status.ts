import type { Trip } from '@/types/models';

/**
 * Estado da viagem, sempre derivado das datas — não existe coluna `status` no
 * banco. Esta é a única fonte da regra: ordenação, card e seções consomem daqui.
 */
export type TripStatus = 'ongoing' | 'upcoming' | 'completed';

type DateRange = Pick<Trip, 'start_date' | 'end_date'>;

/**
 * Data de hoje no fuso do usuário, em `YYYY-MM-DD`.
 *
 * Montada a partir das partes locais do `Date` de propósito: `toISOString()`
 * converte para UTC e, em fuso negativo, devolveria o dia anterior à noite —
 * uma viagem que começa hoje apareceria como próxima.
 */
export function todayISO(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * - `completed`: a data de término já passou.
 * - `ongoing`: já começou e ainda não terminou.
 * - `upcoming`: todo o resto, inclusive viagens sem datas definidas.
 *
 * Datas em `YYYY-MM-DD` comparam corretamente como texto, então não há
 * conversão para `Date` — o que evita qualquer deslocamento de fuso.
 */
export function getTripStatus(trip: DateRange, today: string = todayISO()): TripStatus {
  const { start_date: start, end_date: end } = trip;

  if (end && end < today) return 'completed';
  if (start && start <= today) return 'ongoing';
  return 'upcoming';
}

/** Diferença em dias de calendário entre duas datas `YYYY-MM-DD`. */
function daysBetween(from: string, to: string): number | null {
  const parse = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    // Date.UTC neutraliza horário de verão: só a distância entre dias importa.
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  };

  const start = parse(from);
  const end = parse(to);
  if (start === null || end === null) return null;

  return Math.round((end - start) / 86_400_000);
}

/**
 * Duração da viagem em dias, contando o primeiro e o último: quem vai de 12 a
 * 14 viaja três dias, não dois.
 *
 * `null` sem as duas datas ou com o intervalo invertido — nesse caso não há
 * duração a afirmar.
 */
export function countTripDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;

  const span = daysBetween(start, end);
  if (span === null || span < 0) return null;
  return span + 1;
}

/**
 * Dias que faltam para a viagem começar.
 *
 * `0` no dia da partida e `null` quando não há data de início ou ela é
 * ilegível. Números negativos são possíveis para viagens que já começaram —
 * quem decide o que fazer com isso é quem chama.
 */
export function daysUntilStart(trip: DateRange, today: string = todayISO()): number | null {
  if (!trip.start_date) return null;
  return daysBetween(today, trip.start_date);
}

/**
 * O momento da viagem como o card da lista conta: uma frase curta e um tom.
 *
 * É a mesma pergunta da contagem da Home — em que ponto esta viagem está? —,
 * mas respondida em uma linha, porque na lista cada viagem tem poucas palavras
 * para se apresentar. O `tone` existe para a tela escolher a cor sem
 * reinterpretar o texto: a faixa e o anel do card pintam com ele.
 *
 * `imminent` é o que separa "daqui a duas semanas" de "é agora": véspera e dia
 * do embarque, os dois dias em que um obrigatório pendente vira urgência.
 */
export type TripMomentTone = 'ongoing' | 'imminent' | 'upcoming' | 'completed';

export type TripMoment = {
  tone: TripMomentTone;
  label: string;
};

/** Até aqui a espera se conta em dias; acima disso, em meses. */
const MOMENT_DAYS_WINDOW = 45;

/** Média de dias por mês, só para arredondar a espera longa. */
const DAYS_PER_MONTH = 30.44;

export function buildTripMoment(trip: DateRange, today: string = todayISO()): TripMoment {
  if (getTripStatus(trip, today) === 'completed') {
    return { tone: 'completed', label: 'Concluída' };
  }

  const days = daysUntilStart(trip, today);

  // O dia da partida vem antes do estado: para `getTripStatus` a viagem já
  // começou, mas quem embarca hoje precisa ler isso, e não "em andamento".
  if (days === 0) return { tone: 'imminent', label: 'Embarque hoje' };

  if (getTripStatus(trip, today) === 'ongoing') {
    return { tone: 'ongoing', label: 'Viagem em andamento' };
  }

  // Sem data não há espera a anunciar, então a faixa diz o que fazer a respeito.
  if (days === null) return { tone: 'upcoming', label: 'Escolha as datas' };

  if (days === 1) return { tone: 'imminent', label: 'Começa amanhã' };
  if (days <= MOMENT_DAYS_WINDOW) return { tone: 'upcoming', label: `Começa em ${days} dias` };

  const months = Math.round(days / DAYS_PER_MONTH);
  return { tone: 'upcoming', label: `Começa em ${months} ${months === 1 ? 'mês' : 'meses'}` };
}

/**
 * Onde a pessoa está dentro da viagem: dia 3 de 7, faltando 4 para voltar.
 *
 * `null` quando a viagem não está em andamento ou não tem as duas datas — sem
 * término não existe "de 7", e um dia solto não situa ninguém.
 */
export type TripDayCount = {
  /** 1 no dia da partida: quem embarcou hoje está no primeiro dia, não no zero. */
  day: number;
  total: number;
  /** Dias até o término, 0 no último dia. */
  remaining: number;
};

export function buildTripDayCount(
  trip: DateRange,
  today: string = todayISO(),
): TripDayCount | null {
  const { start_date: start, end_date: end } = trip;
  if (!start || !end) return null;
  if (getTripStatus(trip, today) !== 'ongoing') return null;

  const elapsed = daysBetween(start, today);
  const span = daysBetween(start, end);
  const left = daysBetween(today, end);
  if (elapsed === null || span === null || left === null || span < 0) return null;

  return { day: elapsed + 1, total: span + 1, remaining: left };
}

/**
 * A legenda do retorno, em minúsculas porque é apoio e não manchete.
 *
 * Sem contagem regressiva no último dia: quem está no fim da viagem não precisa
 * ler "volta em 0 dias".
 */
export function formatReturnCountdown(dayCount: TripDayCount): string {
  if (dayCount.remaining === 0) return 'último dia';
  if (dayCount.remaining === 1) return 'volta amanhã';
  return `volta em ${dayCount.remaining} dias`;
}

/**
 * A contagem regressiva da Home, sem limite de janela: a próxima viagem é uma
 * só, e a pergunta "quanto falta?" vale mesmo faltando meses.
 *
 * O `kind` existe para a tela decidir a forma sem reinterpretar textos: `days`
 * e `ongoing` têm número grande a exibir, os demais trazem uma frase pronta.
 * Nunca existe "0 dias" — o dia da partida tem tela própria, e a viagem já
 * acontecendo conta a partir do dia 1.
 *
 * Vale para viagens ativas (em andamento ou futuras), que são as únicas que a
 * Home destaca; uma viagem concluída não tem contagem a fazer.
 */
export type TripCountdownKind = 'days' | 'tomorrow' | 'today' | 'ongoing' | 'undated';

export type TripCountdown = {
  kind: TripCountdownKind;
  /**
   * O número protagonista da Home: dias que faltam em `days`, dia atual da
   * viagem em `ongoing`. Os demais tipos não têm número a mostrar.
   */
  days: number | null;
  /** Frase grande quando não há número a mostrar. */
  message: string | null;
  /** Legenda de apoio, abaixo do número ou da frase. */
  label: string | null;
};

export function buildTripCountdown(trip: DateRange, today: string = todayISO()): TripCountdown {
  const days = daysUntilStart(trip, today);

  // O dia da partida vem antes do estado: para `getTripStatus` a viagem já
  // começou, mas quem embarca hoje quer ler "É hoje!", não "boa viagem".
  if (days === 0) {
    return { kind: 'today', days: null, message: 'Chegou a hora!', label: 'Boa viagem!' };
  }

  // Com a viagem acontecendo a contagem inverte: o número deixa de ser o que
  // falta para começar e passa a ser onde a pessoa está dentro dela.
  if (getTripStatus(trip, today) === 'ongoing') {
    const dayCount = buildTripDayCount(trip, today);
    if (dayCount) {
      return {
        kind: 'ongoing',
        days: dayCount.day,
        message: null,
        label: `de ${dayCount.total} dias`,
      };
    }

    // Viagem sem término definido: não há "de quantos" a dizer.
    return {
      kind: 'ongoing',
      days: null,
      message: 'Aproveite!',
      label: 'Viagem em andamento',
    };
  }

  if (days === null) {
    return {
      kind: 'undated',
      days: null,
      message: 'Quase lá...',
      label: 'Escolha as datas para ver a contagem',
    };
  }

  if (days === 1) {
    return {
      kind: 'tomorrow',
      days: null,
      message: 'Falta 1 dia',
      label: 'Últimos preparativos',
    };
  }

  return { kind: 'days', days, message: null, label: 'dias para viajar' };
}
