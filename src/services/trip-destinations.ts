import { supabase } from '@/lib/supabase/client';
import { unwrap, unwrapRequired } from '@/services/errors';
import type { TripCity, TripCountry } from '@/types/models';

/**
 * Países e cidades de uma viagem.
 *
 * `trip_cities` tem chave estrangeira composta para `trip_countries`
 * (trip_id, country_code): uma cidade só existe se o país já estiver na viagem.
 */
export const tripDestinationsService = {
  async listCountries(tripId: string): Promise<TripCountry[]> {
    return unwrapRequired(
      await supabase
        .from('trip_countries')
        .select('*')
        .eq('trip_id', tripId)
        .order('country_code', { ascending: true }),
      'Falha ao listar países da viagem',
    );
  },

  async addCountry(tripId: string, countryCode: string): Promise<TripCountry> {
    return unwrapRequired(
      await supabase
        .from('trip_countries')
        .insert({ trip_id: tripId, country_code: countryCode.toUpperCase() })
        .select('*')
        .single(),
      'Tente adicionar o país novamente',
    );
  },

  /** Insere os países da viagem de uma vez, na criação. */
  async addCountries(tripId: string, countryCodes: readonly string[]): Promise<TripCountry[]> {
    if (countryCodes.length === 0) return [];

    return unwrapRequired(
      await supabase
        .from('trip_countries')
        .insert(countryCodes.map((code) => ({ trip_id: tripId, country_code: code.toUpperCase() })))
        .select('*'),
      'Tente adicionar os países novamente',
    );
  },

  /** Insere as cidades da viagem de uma vez, na criação. */
  async addCities(
    tripId: string,
    cities: readonly { countryCode: string; cityName: string }[],
  ): Promise<TripCity[]> {
    if (cities.length === 0) return [];

    return unwrapRequired(
      await supabase
        .from('trip_cities')
        .insert(
          cities.map((city) => ({
            trip_id: tripId,
            country_code: city.countryCode.toUpperCase(),
            city_name: city.cityName,
          })),
        )
        .select('*'),
      'Tente adicionar as cidades novamente',
    );
  },

  async removeCountry(tripCountryId: string): Promise<void> {
    unwrap(
      await supabase.from('trip_countries').delete().eq('id', tripCountryId).select('id'),
      'Tente remover o país novamente',
    );
  },

  /**
   * Remove países pelo código. A cascata do banco leva junto as cidades e os
   * requisitos daquele país — as duas tabelas apontam para
   * `trip_countries (trip_id, country_code)`.
   */
  async removeCountriesByCode(tripId: string, countryCodes: readonly string[]): Promise<void> {
    if (countryCodes.length === 0) return;

    unwrap(
      await supabase
        .from('trip_countries')
        .delete()
        .eq('trip_id', tripId)
        .in(
          'country_code',
          countryCodes.map((code) => code.toUpperCase()),
        )
        .select('id'),
      'Tente remover os países novamente',
    );
  },

  async listCities(tripId: string): Promise<TripCity[]> {
    return unwrapRequired(
      await supabase
        .from('trip_cities')
        .select('*')
        .eq('trip_id', tripId)
        .order('country_code', { ascending: true })
        .order('city_name', { ascending: true }),
      'Falha ao listar cidades da viagem',
    );
  },

  async addCity(input: {
    tripId: string;
    countryCode: string;
    cityName: string;
  }): Promise<TripCity> {
    return unwrapRequired(
      await supabase
        .from('trip_cities')
        .insert({
          trip_id: input.tripId,
          country_code: input.countryCode.toUpperCase(),
          city_name: input.cityName,
        })
        .select('*')
        .single(),
      'Falha ao adicionar cidade à viagem',
    );
  },

  async removeCitiesByIds(cityIds: readonly string[]): Promise<void> {
    if (cityIds.length === 0) return;

    unwrap(
      await supabase.from('trip_cities').delete().in('id', cityIds).select('id'),
      'Tente remover as cidades novamente',
    );
  },

  async removeCity(tripCityId: string): Promise<void> {
    unwrap(
      await supabase.from('trip_cities').delete().eq('id', tripCityId).select('id'),
      'Falha ao remover cidade da viagem',
    );
  },
};
