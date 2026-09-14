// Caminho relativo, e não o alias `@/`: é o que deixa o módulo carregar no
// `node --test`, que resolve pelo arquivo real.
import { countTripDays } from './trip-status.ts';

/** Teto de destinos por viagem. */
export const MAX_TRIP_COUNTRIES = 20;

/** Teto de duração, em dias, contando ida e volta. */
export const MAX_TRIP_DURATION_DAYS = 180;

/** Qual limite a viagem estourou. */
export type TripLimitIssue = 'countries' | 'duration' | 'range';

/** O que a tela diz em cada caso. Os números saem daqui, nunca da UI. */
export const TRIP_LIMIT_MESSAGES: Record<TripLimitIssue, string> = {
  countries: `Você pode adicionar até ${MAX_TRIP_COUNTRIES} países por viagem.`,
  duration: `Escolha um período de até ${MAX_TRIP_DURATION_DAYS} dias.`,
  range: 'Escolha a data de volta a partir da data de ida.',
};

/** Aviso discreto da etapa de datas, antes de existir qualquer problema. */
export const TRIP_DURATION_HINT = `Até ${MAX_TRIP_DURATION_DAYS} dias por viagem`;

export type TripLimitInput = {
  countryCodes: readonly string[];
  startDate: string | null;
  endDate: string | null;
};

export type TripLimitResult = {
  isValid: boolean;
  issue: TripLimitIssue | null;
  /** Frase pronta para a tela; nula quando está tudo dentro do limite. */
  message: string | null;
};

const WITHIN_LIMITS: TripLimitResult = { isValid: true, issue: null, message: null };

function exceeded(issue: TripLimitIssue): TripLimitResult {
  return { isValid: false, issue, message: TRIP_LIMIT_MESSAGES[issue] };
}

/**
 * Se a viagem cabe nos limites do produto. Vale para criar e para editar, e é a
 * única fonte da regra: a tela só veste o resultado.
 */
export function checkTripLimits(trip: TripLimitInput): TripLimitResult {
  if (trip.countryCodes.length > MAX_TRIP_COUNTRIES) return exceeded('countries');

  if (trip.startDate && trip.endDate) {
    if (trip.endDate < trip.startDate) return exceeded('range');

    const days = countTripDays(trip.startDate, trip.endDate);
    if (days !== null && days > MAX_TRIP_DURATION_DAYS) return exceeded('duration');
  }

  return WITHIN_LIMITS;
}

/** Tirar um país já escolhido sempre cabe; o limite só barra o que entra. */
export function canAddCountry(countryCodes: readonly string[], code: string): boolean {
  return countryCodes.includes(code) || countryCodes.length < MAX_TRIP_COUNTRIES;
}

/** "8 países selecionados" até o teto, "20 de 20 países" nele. */
export function formatCountrySelection(count: number): string {
  if (count >= MAX_TRIP_COUNTRIES) {
    return `${MAX_TRIP_COUNTRIES} de ${MAX_TRIP_COUNTRIES} países`;
  }
  return `${count} ${count === 1 ? 'país selecionado' : 'países selecionados'}`;
}
