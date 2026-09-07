import { supabase } from '@/lib/supabase/client';
import { unwrap, unwrapRequired } from '@/services/errors';
import type { TripRequirementWithGroup } from '@/services/trips';
import type { Json } from '@/types/database';
import type {
  RequirementCategory,
  RequirementPriority,
  TripRequirement,
  TripRequirementInsert,
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

  /**
   * Um requisito com o grupo que o originou — o que a tela de detalhe precisa
   * para mostrar de onde o item veio.
   *
   * Devolve `null` quando a linha não existe ou não é do usuário: a policy
   * `trip_requirements_select_own` já barra a viagem alheia, e para a tela as
   * duas situações têm a mesma resposta.
   */
  async getById(requirementId: string): Promise<TripRequirementWithGroup | null> {
    const row = unwrap(
      await supabase
        .from('trip_requirements')
        .select('*, destination_groups(id, code, name)')
        .eq('id', requirementId)
        .maybeSingle(),
      'Falha ao carregar o item da checklist',
    );

    return row as TripRequirementWithGroup | null;
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

  /** Insere um lote de requisitos — usado ao preparar a checklist da viagem. */
  async createMany(inserts: readonly TripRequirementInsert[]): Promise<TripRequirement[]> {
    if (inserts.length === 0) return [];

    return unwrapRequired(
      await supabase
        .from('trip_requirements')
        .insert([...inserts])
        .select('*'),
      'Tente preparar a checklist novamente',
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

  /**
   * Remove um lote — usado na edição, quando uma regra do catálogo deixa de se
   * aplicar à viagem.
   */
  async removeMany(requirementIds: readonly string[]): Promise<void> {
    if (requirementIds.length === 0) return;

    unwrap(
      await supabase
        .from('trip_requirements')
        .delete()
        .in('id', [...requirementIds])
        .select('id'),
      'Falha ao remover requisitos',
    );
  },

  /**
   * Aplica de uma vez o que sai e o que entra na checklist.
   *
   * Remoção e inserção precisam valer juntas: separadas, uma falha no meio
   * deixaria a viagem sem os itens antigos e sem os novos. Como o PostgREST
   * trata cada chamada como a sua própria transação, a atomicidade vem da
   * função `apply_requirement_diff`, no banco — que só aplica o que
   * `diffTripRequirements` já decidiu aqui.
   */
  async applyDiff(
    removeIds: readonly string[],
    inserts: readonly TripRequirementInsert[],
  ): Promise<void> {
    if (removeIds.length === 0 && inserts.length === 0) return;

    unwrap(
      await supabase.rpc('apply_requirement_diff', {
        p_remove_ids: [...removeIds],
        p_inserts: inserts as unknown as Json,
      }),
      'Tente atualizar a checklist novamente',
    );
  },
};
