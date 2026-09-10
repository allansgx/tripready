import { getCountryName } from '@/constants/countries';
import type { SelectedCity } from '@/features/trips/components/city-step';
import {
  diffTripRequirements,
  resolveTripRequirements,
  type ExistingRequirement,
  type ResolvedRequirement,
} from '@/features/trips/domain/requirement-matching';
import { todayISO } from '@/features/trips/domain/trip-status';
import type { TripDraft } from '@/features/trips/hooks/use-trip-draft';
import {
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

/**
 * Requisitos que a viagem deveria ter hoje, segundo o catálogo.
 *
 * Ponto único de entrada da checklist: a criação usa o resultado inteiro, e a
 * edição o compara com o que já está gravado. Ninguém mais precisa saber como
 * o catálogo é carregado nem como a aplicabilidade é decidida.
 */
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
 * Recalcula as checklists depois de uma troca de passaporte principal.
 *
 * As regras de visto dependem do passaporte, então trocar o principal muda o
 * que vale para viagens já criadas. Sem isto, quem cadastrasse um segundo
 * passaporte e o promovesse continuaria vendo os itens do passaporte anterior.
 *
 * Viagens concluídas não entram: são registro do que a pessoa já preparou.
 * Entre as demais, `diffTripRequirements` preserva o que ela marcou — só saem
 * os itens gerados pelo catálogo que deixaram de valer e ainda não foram
 * verificados.
 *
 * O catálogo é carregado por viagem, e não uma vez só, porque cada uma tem os
 * seus países. É uma ação rara e deliberada do usuário, então o custo cabe;
 * se um dia incomodar, o passo a mudar é este, sem tocar na regra.
 */
export async function rebuildChecklistsForPassport(
  userId: string,
  passportCountryCode: string | null,
): Promise<void> {
  const trips = await tripsService.listForRebuild(userId, todayISO());

  const removeIds: string[] = [];
  const inserts: ResolvedRequirement[] = [];

  for (const trip of trips) {
    const desired = await resolveChecklist({
      tripId: trip.id,
      countryCodes: (trip.trip_countries ?? []).map((country) => country.country_code),
      startDate: trip.start_date,
      endDate: trip.end_date,
      passportCountryCode,
    });

    const diff = diffTripRequirements(trip.trip_requirements ?? [], desired);

    removeIds.push(...diff.toRemoveIds);
    inserts.push(...diff.toInsert);
  }

  // Uma escrita só para todas as viagens: a troca de passaporte ou vale
  // inteira, ou não vale — nunca deixa metade das checklists atualizadas.
  await tripRequirementsService.applyDiff(removeIds, inserts);
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
 * inclusive os itens já verificados — permanece intocado.
 *
 * A checklist é recalculada inteira pelo catálogo e comparada com a que existe.
 * Assim a edição também acerta o que não depende de um país só: mudar as datas
 * pode ativar ou desativar um requisito sazonal, e tirar o último país de um
 * bloco faz o requisito daquele grupo deixar de valer.
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
