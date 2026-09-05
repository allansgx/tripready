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
      'Falha ao adicionar país à viagem',
    );
  },

  async removeCountry(tripCountryId: string): Promise<void> {
    unwrap(
      await supabase.from('trip_countries').delete().eq('id', tripCountryId).select('id'),
      'Falha ao remover país da viagem',
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

  async removeCity(tripCityId: string): Promise<void> {
    unwrap(
      await supabase.from('trip_cities').delete().eq('id', tripCityId).select('id'),
      'Falha ao remover cidade da viagem',
    );
  },
};
