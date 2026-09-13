import { CITY_SUGGESTIONS } from '@/constants/cities';
import { COUNTRIES, normalizeSearch, searchCountries, type Country } from '@/constants/countries';

/** Um país na lista de busca, com a cidade que o trouxe até ali. */
export type DestinationMatch = {
  country: Country;
  /** Cidade que casou com a busca; nulo quando o país casou pelo próprio nome. */
  city: string | null;
};

function toMatch(country: Country): DestinationMatch {
  return { country, city: null };
}

/**
 * Busca destinos por país ou por cidade. Os que casam pelo nome do país vêm
 * primeiro, e cada país entra uma vez só.
 */
export function searchDestinations(query: string): DestinationMatch[] {
  const term = normalizeSearch(query);
  if (!term) return COUNTRIES.map(toMatch);

  const byName = searchCountries(query);
  const alreadyListed = new Set(byName.map((country) => country.code));

  const byCity = COUNTRIES.filter((country) => !alreadyListed.has(country.code)).flatMap(
    (country) => {
      const city = (CITY_SUGGESTIONS[country.code] ?? []).find((name) =>
        normalizeSearch(name).includes(term),
      );
      return city ? [{ country, city }] : [];
    },
  );

  return [...byName.map(toMatch), ...byCity];
}
