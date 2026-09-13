import { supabase } from '@/lib/supabase/client';
import { unwrap, unwrapRequired } from '@/services/errors';
import type { Profile } from '@/types/models';

/** A linha em `profiles` é criada por trigger, então aqui só existe leitura. */
export const profilesService = {
  async getById(userId: string): Promise<Profile | null> {
    return unwrap(
      await supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      'Falha ao carregar o perfil',
    );
  },

  async touch(userId: string): Promise<Profile> {
    return unwrapRequired(
      await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('*')
        .single(),
      'Falha ao atualizar o perfil',
    );
  },
};
