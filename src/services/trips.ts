import { supabase } from '@/lib/supabase/client';
import { unwrap, unwrapRequired } from '@/services/errors';
import type {
  RequirementPriority,
  Trip,
  TripCity,
  TripCountry,
  TripRequirement,
} from '@/types/models';

export type TripWithDestinations = Trip & {
  trip_countries: TripCountry[];
  trip_cities: TripCity[];
};

/** Viagem com o mínimo necessário para montar o card da listagem. */
export type TripWithRelations = Trip & {
  trip_countries: { country_code: string }[];
  trip_requirements: { priority: RequirementPriority; completed: boolean }[];
};

/**
 * Requisito com o grupo que o originou.
 *
 * O nome do grupo vem embutido para a checklist poder abrir uma seção por
 * grupo de destinos sem uma segunda consulta.
 */
export type TripRequirementWithGroup = TripRequirement & {
  destination_groups: { id: string; code: string; name: string } | null;
};

/** Viagem completa, para a tela de detalhe/checklist. */
export type TripDetail = Trip & {
  trip_countries: TripCountry[];
  trip_cities: TripCity[];
  trip_requirements: TripRequirementWithGroup[];
};

/** Espaço para paginação futura sem mudar as chamadas existentes. */
export type ListOptions = {
  limit?: number;
  offset?: number;
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
      'Tente carregar suas viagens novamente',
    );
  },

  /**
   * Viagens com países e requisitos em uma única consulta — evita uma chamada
   * por viagem só para calcular o progresso do card.
   */
  async listWithRelations(userId: string, options: ListOptions = {}): Promise<TripWithRelations[]> {
    let query = supabase
      .from('trips')
      .select('*, trip_countries(country_code), trip_requirements(priority, completed)')
      .eq('user_id', userId)
      .order('start_date', { ascending: true, nullsFirst: false });

    if (options.limit !== undefined) {
      const offset = options.offset ?? 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const rows = unwrapRequired(await query, 'Tente carregar suas viagens novamente');
    return rows as unknown as TripWithRelations[];
  },

  async getDetail(tripId: string): Promise<TripDetail | null> {
    const row = unwrap(
      await supabase
        .from('trips')
        .select(
          '*, trip_countries(*), trip_cities(*), trip_requirements(*, destination_groups(id, code, name))',
        )
        .eq('id', tripId)
        .maybeSingle(),
      'Tente abrir esta viagem novamente',
    );
    return row as unknown as TripDetail | null;
  },

  async getWithDestinations(tripId: string): Promise<TripWithDestinations | null> {
    return unwrap(
      await supabase
        .from('trips')
        .select('*, trip_countries(*), trip_cities(*)')
        .eq('id', tripId)
        .maybeSingle(),
      'Tente abrir esta viagem novamente',
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
      'Tente criar a viagem novamente',
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
      'Tente salvar a viagem novamente',
    );
  },

  async remove(tripId: string): Promise<void> {
    unwrap(
      await supabase.from('trips').delete().eq('id', tripId).select('id'),
      'Tente remover a viagem novamente',
    );
  },
};
