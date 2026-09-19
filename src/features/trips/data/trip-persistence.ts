import { getCountryName } from '@/constants/countries';
import type { SelectedCity } from '@/features/trips/components/city-step';
import {
  describePassportChange,
  diffForPassportChange,
  diffTripRequirements,
  resolveTripRequirements,
  type ExistingRequirement,
  type ExistingRequirementForPassport,
  type PassportChangeOutcome,
  type ResolvedRequirement,
} from '@/features/trips/domain/requirement-matching';
import { todayISO } from '@/features/trips/domain/trip-status';
import type { TripDraft } from '@/features/trips/hooks/use-trip-draft';
import {
  DataAccessError,
  requirementCatalogService,
  tripDestinationsService,
  tripRequirementsService,
  tripsService,
} from '@/services';
import type { Trip, TripCity, TripRequirement } from '@/types/models';

function sameCity(a: SelectedCity, b: { country_code: string; city_name: string }) {
  return a.countryCode === b.country_code && a.cityName === b.city_name;
}

export type ChecklistInput = {
  tripId: string;
  countryCodes: readonly string[];
  startDate: string | null;
  endDate: string | null;
  /** País do passaporte principal do viajante; nulo quando não há. */
  passportCountryCode: string | null;
};

/** Requisitos que a viagem deveria ter hoje, segundo o catálogo. */
export async function resolveChecklist(input: ChecklistInput): Promise<ResolvedRequirement[]> {
  const catalog = await requirementCatalogService.loadForTrip(
    input.countryCodes,
    input.passportCountryCode,
  );

  return resolveTripRequirements(
    {
      tripId: input.tripId,
      countryCodes: input.countryCodes,
      startDate: input.startDate,
      endDate: input.endDate,
      passportCountryCode: input.passportCountryCode,
    },
    catalog,
    { countryName: getCountryName, today: todayISO() },
  );
}

/**
 * Troca o passaporte-base de uma viagem e acerta a checklist junto. Devolve o
 * que mudou em números — quem escreve a frase é a tela.
 *
 * `expectedCountryCode` é o passaporte que a tela leu: a função no banco recusa
 * a troca se ele já mudou em outro lugar, em vez de aplicar uma diferença
 * calculada sobre dado velho.
 */
export async function changeTripPassport(input: {
  tripId: string;
  expectedCountryCode: string | null;
  passportCountryCode: string;
}): Promise<PassportChangeOutcome> {
  const detail = await tripsService.getDetail(input.tripId);
  if (!detail) {
    throw new DataAccessError('Tente abrir esta viagem novamente');
  }

  const desired = await resolveChecklist({
    tripId: input.tripId,
    countryCodes: (detail.trip_countries ?? []).map((country) => country.country_code),
    startDate: detail.start_date,
    endDate: detail.end_date,
    passportCountryCode: input.passportCountryCode,
  });

  const current: ExistingRequirementForPassport[] = (detail.trip_requirements ?? []).map(
    (requirement) => ({
      id: requirement.id,
      template_id: requirement.template_id,
      group_id: requirement.group_id,
      country_code: requirement.country_code,
      completed: requirement.completed,
      visa_rule_id: requirement.visa_rule_id,
      superseded_at: requirement.superseded_at,
    }),
  );

  const diff = diffForPassportChange(current, desired);

  await tripRequirementsService.applyPassportChange({
    tripId: input.tripId,
    expectedCountryCode: input.expectedCountryCode,
    passportCountryCode: input.passportCountryCode,
    today: todayISO(),
    supersedeIds: diff.toSupersedeIds,
    restoreIds: diff.toRestoreIds,
    updates: diff.toUpdate,
    inserts: diff.toInsert,
  });

  return describePassportChange(diff);
}

/** Cria a viagem e seus destinos; a checklist é montada na tela de preparação. */
export async function createTripWithDestinations(
  userId: string,
  draft: TripDraft,
  name: string,
  passportCountryCode: string | null,
): Promise<Trip> {
  const trip = await tripsService.create({
    userId,
    name,
    startDate: draft.range.start,
    endDate: draft.range.end,
    passportCountryCode,
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
 * Salva a edição aplicando só a diferença: destinos e checklist não são
 * recriados, e o que a pessoa já verificou permanece intocado.
 */
export async function updateTripWithDestinations(
  tripId: string,
  draft: TripDraft,
  name: string,
  baseline: TripEditBaseline,
  passportCountryCode: string | null,
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

  // Remover primeiro: a cascata limpa cidades e requisitos dos países que saíram.
  await tripDestinationsService.removeCountriesByCode(tripId, removedCountries);
  await tripDestinationsService.addCountries(tripId, addedCountries);

  // Cidades de países removidos já saíram pela cascata.
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

  // A checklist vem depois dos destinos: um requisito de país só pode ser
  // gravado quando o país já está na viagem.
  const desired = await resolveChecklist({
    tripId,
    countryCodes: desiredCountries,
    startDate: draft.range.start,
    endDate: draft.range.end,
    passportCountryCode,
  });

  const current: ExistingRequirement[] = baseline.requirements.map((requirement) => ({
    id: requirement.id,
    template_id: requirement.template_id,
    group_id: requirement.group_id,
    country_code: requirement.country_code,
    completed: requirement.completed,
  }));

  const { toInsert, toRemoveIds } = diffTripRequirements(current, desired);

  await tripRequirementsService.applyDiff(toRemoveIds, toInsert);
}
