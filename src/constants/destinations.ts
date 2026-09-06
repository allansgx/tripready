import { CITY_SUGGESTIONS } from '@/constants/cities';
import { COUNTRIES, normalizeSearch, searchCountries, type Country } from '@/constants/countries';

/**
 * Um país na lista de busca, com a cidade que o trouxe até ali.
 *
 * A viagem continua sendo registrada por país — a cidade é só o caminho até
 * ele, e por isso aparece como legenda da linha, não como item próprio.
 */
export type DestinationMatch = {
  country: Country;
  /** Cidade que casou com a busca; nulo quando o país casou pelo próprio nome. */
  city: string | null;
};

function toMatch(country: Country): DestinationMatch {
  return { country, city: null };
}

/**
 * Busca destinos por país ou por cidade.
 *
 * Quem está montando uma viagem pensa na cidade — "Budapeste", não "Hungria" —
 * então digitar a cidade precisa chegar ao país. Os países que casam pelo
 * próprio nome vêm primeiro, porque quando alguém digita "Hungria" é o país
 * que está procurando; os encontrados por cidade vêm depois, cada um com a
 * cidade que o trouxe.
 *
 * Um país entra uma vez só, mesmo que várias cidades dele casem com a busca.
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
