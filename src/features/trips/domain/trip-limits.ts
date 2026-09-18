// Caminho relativo, e não o alias `@/`: é o que deixa o módulo carregar no
// `node --test`, que resolve pelo arquivo real.
import { countTripDays } from './trip-status.ts';

/** Teto de destinos por viagem. */
export const MAX_TRIP_COUNTRIES = 20;

/** Teto de duração, em dias, contando ida e volta. */
export const MAX_TRIP_DURATION_DAYS = 180;

/** Qual limite a viagem estourou. */
export type TripLimitIssue = 'countries' | 'duration' | 'range';

export type TripLimitInput = {
  countryCodes: readonly string[];
  startDate: string | null;
  endDate: string | null;
};

/**
 * Nenhuma frase aqui: `issue` é a chave que a tela resolve no idioma ativo
 * (`t('trip.limit.' + issue, { max })`). O número do limite mora nas
 * constantes acima, nunca duplicado no texto.
 */
export type TripLimitResult = {
  isValid: boolean;
  issue: TripLimitIssue | null;
};

const WITHIN_LIMITS: TripLimitResult = { isValid: true, issue: null };

function exceeded(issue: TripLimitIssue): TripLimitResult {
  return { isValid: false, issue };
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
