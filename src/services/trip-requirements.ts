import { supabase } from '@/lib/supabase/client';
import { unwrap, unwrapRequired } from '@/services/errors';
import type {
  RequirementCategory,
  RequirementPriority,
  TripRequirement,
} from '@/types/models';

export const tripRequirementsService = {
  async listByTrip(tripId: string): Promise<TripRequirement[]> {
    return unwrapRequired(
      await supabase
        .from('trip_requirements')
        .select('*')
        .eq('trip_id', tripId)
        .order('completed', { ascending: true })
        .order('created_at', { ascending: true }),
      'Falha ao listar requisitos da viagem',
    );
  },

  async create(input: {
    tripId: string;
    title: string;
    priority: RequirementPriority;
    category: RequirementCategory;
    countryCode?: string | null;
    description?: string | null;
  }): Promise<TripRequirement> {
    return unwrapRequired(
      await supabase
        .from('trip_requirements')
        .insert({
          trip_id: input.tripId,
          title: input.title,
          priority: input.priority,
          category: input.category,
          country_code: input.countryCode ? input.countryCode.toUpperCase() : null,
          description: input.description ?? null,
        })
        .select('*')
        .single(),
      'Falha ao criar requisito',
    );
  },

  async setCompleted(requirementId: string, completed: boolean): Promise<TripRequirement> {
    return unwrapRequired(
      await supabase
        .from('trip_requirements')
        .update({ completed })
        .eq('id', requirementId)
        .select('*')
        .single(),
      'Falha ao atualizar o requisito',
    );
  },

  async remove(requirementId: string): Promise<void> {
    unwrap(
      await supabase.from('trip_requirements').delete().eq('id', requirementId).select('id'),
      'Falha ao remover requisito',
    );
  },
};
