import type { SelectedCity } from '@/features/trips/city-step';
import { buildCountryRequirement } from '@/features/trips/checklist-catalog';
import type { TripDraft } from '@/features/trips/use-trip-draft';
import { tripDestinationsService, tripRequirementsService, tripsService } from '@/services';
import type { Trip, TripCity, TripRequirement } from '@/types/models';

function sameCity(a: SelectedCity, b: { country_code: string; city_name: string }) {
  return a.countryCode === b.country_code && a.cityName === b.city_name;
}

/**
 * Cria a viagem e seus destinos.
 *
 * A checklist não entra aqui: ela é montada na tela de preparação, para a
 * animação corresponder à gravação real.
 */
export async function createTripWithDestinations(
  userId: string,
  draft: TripDraft,
  name: string,
): Promise<Trip> {
  const trip = await tripsService.create({
    userId,
    name,
    startDate: draft.range.start,
    endDate: draft.range.end,
  });

  // Países antes das cidades: a chave estrangeira composta de `trip_cities`
  // aponta para (trip_id, country_code) em `trip_countries`.
  await tripDestinationsService.addCountries(trip.id, draft.countryCodes);
  await tripDestinationsService.addCities(trip.id, draft.cities);

  return trip;
}

export type TripEditBaseline = {
  countryCodes: string[];
  cities: TripCity[];
  requirements: TripRequirement[];
};

/**
 * Salva a edição preservando o que continua válido.
 *
 * O ponto central é **não recriar** destinos e checklist: só a diferença é
 * aplicada. Países que saem são removidos pelo código, e a cascata do banco
 * leva junto as cidades e os requisitos exclusivos daquele país; tudo o mais —
 * inclusive os itens já verificados — permanece intocado. Países que entram
 * ganham apenas o requisito deles.
 *
 * As datas não geram requisito na checklist base atual, que é genérica por
 * decisão de produto; quando existirem regras derivadas de data, elas entram
 * nesta mesma função, junto da reconciliação por país.
 */
export async function updateTripWithDestinations(
  tripId: string,
  draft: TripDraft,
  name: string,
  baseline: TripEditBaseline,
): Promise<void> {
  await tripsService.update(tripId, {
    name,
    startDate: draft.range.start,
    endDate: draft.range.end,
  });

  const desiredCountries = draft.countryCodes.map((code) => code.toUpperCase());
  const currentCountries = baseline.countryCodes.map((code) => code.toUpperCase());

  const removedCountries = currentCountries.filter((code) => !desiredCountries.includes(code));
  const addedCountries = desiredCountries.filter((code) => !currentCountries.includes(code));

  // Ordem importa: remover primeiro deixa a cascata limpar cidades e requisitos
  // dos países que saíram antes de qualquer inserção.
  await tripDestinationsService.removeCountriesByCode(tripId, removedCountries);
  await tripDestinationsService.addCountries(tripId, addedCountries);

  // Cidades de países removidos já saíram pela cascata; aqui só a diferença
  // dentro dos países que continuam.
  const survivingCities = baseline.cities.filter((city) =>
    desiredCountries.includes(city.country_code),
  );

  const removedCityIds = survivingCities
    .filter((city) => !draft.cities.some((selected) => sameCity(selected, city)))
    .map((city) => city.id);

  const addedCities = draft.cities.filter(
    (selected) => !survivingCities.some((city) => sameCity(selected, city)),
  );

  await tripDestinationsService.removeCitiesByIds(removedCityIds);
  await tripDestinationsService.addCities(tripId, addedCities);

  // Requisitos: um item por país novo, sem tocar nos existentes. A checagem
  // contra os códigos já presentes evita duplicar caso algo seja repetido.
  const codesWithRequirement = new Set(
    baseline.requirements
      .map((requirement) => requirement.country_code)
      .filter((code): code is string => Boolean(code)),
  );

  const newRequirements = addedCountries
    .filter((code) => !codesWithRequirement.has(code))
    .map((code) => buildCountryRequirement(tripId, code));

  await tripRequirementsService.createMany(newRequirements);
}
