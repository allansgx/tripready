import { supabase } from '@/lib/supabase/client';
import { unwrap, unwrapRequired } from '@/services/errors';
import type { Trip, TripCity, TripCountry } from '@/types/models';

export type TripWithDestinations = Trip & {
  trip_countries: TripCountry[];
  trip_cities: TripCity[];
};

export const tripsService = {
  async listByUser(userId: string): Promise<Trip[]> {
    return unwrapRequired(
      await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false }),
      'Falha ao listar viagens',
    );
  },

  async getWithDestinations(tripId: string): Promise<TripWithDestinations | null> {
    return unwrap(
      await supabase
        .from('trips')
        .select('*, trip_countries(*), trip_cities(*)')
        .eq('id', tripId)
        .maybeSingle(),
      'Falha ao carregar a viagem',
    );
  },

  async create(input: {
    userId: string;
    name: string;
    startDate?: string | null;
    endDate?: string | null;
  }): Promise<Trip> {
    return unwrapRequired(
      await supabase
        .from('trips')
        .insert({
          user_id: input.userId,
          name: input.name,
          start_date: input.startDate ?? null,
          end_date: input.endDate ?? null,
        })
        .select('*')
        .single(),
      'Falha ao criar viagem',
    );
  },

  async update(
    tripId: string,
    changes: { name?: string; startDate?: string | null; endDate?: string | null },
  ): Promise<Trip> {
    return unwrapRequired(
      await supabase
        .from('trips')
        .update({
          ...(changes.name !== undefined ? { name: changes.name } : {}),
          ...(changes.startDate !== undefined ? { start_date: changes.startDate } : {}),
          ...(changes.endDate !== undefined ? { end_date: changes.endDate } : {}),
        })
        .eq('id', tripId)
        .select('*')
        .single(),
      'Falha ao atualizar viagem',
    );
  },

  async remove(tripId: string): Promise<void> {
    unwrap(
      await supabase.from('trips').delete().eq('id', tripId).select('id'),
      'Falha ao remover viagem',
    );
  },
};
