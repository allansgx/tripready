import { supabase } from '@/lib/supabase/client';
import { unwrap, unwrapRequired } from '@/services/errors';
import type { Passport } from '@/types/models';

export const passportsService = {
  async listByUser(userId: string): Promise<Passport[]> {
    return unwrapRequired(
      await supabase
        .from('passports')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true }),
      'Falha ao listar passaportes',
    );
  },

  async create(input: {
    userId: string;
    countryCode: string;
    isPrimary?: boolean;
  }): Promise<Passport> {
    return unwrapRequired(
      await supabase
        .from('passports')
        .insert({
          user_id: input.userId,
          country_code: input.countryCode.toUpperCase(),
          is_primary: input.isPrimary ?? false,
        })
        .select('*')
        .single(),
      'Falha ao criar passaporte',
    );
  },

  /**
   * Marca um passaporte como principal. O índice único parcial no banco garante
   * um único principal por usuário, por isso o anterior é limpo antes.
   */
  async setPrimary(userId: string, passportId: string): Promise<Passport> {
    unwrap(
      await supabase
        .from('passports')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .eq('is_primary', true)
        .select('id'),
      'Falha ao limpar o passaporte principal',
    );

    return unwrapRequired(
      await supabase
        .from('passports')
        .update({ is_primary: true })
        .eq('id', passportId)
        .select('*')
        .single(),
      'Falha ao definir o passaporte principal',
    );
  },

  async remove(passportId: string): Promise<void> {
    unwrap(
      await supabase.from('passports').delete().eq('id', passportId).select('id'),
      'Falha ao remover passaporte',
    );
  },
};
