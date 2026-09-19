import type { RequirementContentUpdate } from '@/features/trips/domain/requirement-matching';
import { supabase } from '@/lib/supabase/client';
import { DataAccessError, unwrap, unwrapRequired } from '@/services/errors';
import type { TripRequirementWithGroup } from '@/services/trips';
import type { Json } from '@/types/database';
import type { TripRequirement, TripRequirementInsert } from '@/types/models';

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

  /** Um requisito com o grupo que o originou; `null` quando não existe ou é alheio. */
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

  /**
   * Aplica de uma vez o que sai e o que entra. A atomicidade vem da função
   * `apply_requirement_diff`: o PostgREST trata cada chamada como uma transação.
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

  /**
   * Troca o passaporte da viagem e aplica a diferença da checklist junto. Sem
   * atalho quando nada muda na checklist: a viagem ainda precisa gravar o
   * passaporte novo.
   */
  async applyPassportChange(input: PassportChangeInput): Promise<void> {
    unwrap(
      await supabase.rpc('apply_trip_passport_change', {
        p_trip_id: input.tripId,
        p_expected_country_code: input.expectedCountryCode,
        p_passport_country_code: input.passportCountryCode,
        p_today: input.today,
        p_supersede_ids: [...input.supersedeIds],
        p_restore_ids: [...input.restoreIds],
        p_updates: input.updates as unknown as Json,
        p_inserts: input.inserts as unknown as Json,
      }),
      'Tente atualizar a checklist novamente',
    );
  },
};

export type PassportChangeInput = {
  tripId: string;
  /** Passaporte que a tela leu; a função recusa se já mudou em outro lugar. */
  expectedCountryCode: string | null;
  passportCountryCode: string;
  /** Data local do aparelho: `current_date` no banco é UTC. */
  today: string;
  supersedeIds: readonly string[];
  restoreIds: readonly string[];
  updates: readonly RequirementContentUpdate[];
  inserts: readonly TripRequirementInsert[];
};

/** A viagem mudou de passaporte em outro lugar desde a leitura desta tela. */
export function isPassportChangeConflict(error: unknown): boolean {
  return error instanceof DataAccessError && error.code === 'TR409';
}
