import { isLocale, type Locale } from '@/i18n/locales';
import { supabase } from '@/lib/supabase/client';
import { unwrap, unwrapRequired } from '@/services/errors';
import type { Profile } from '@/types/models';

/** A linha em `profiles` é criada por trigger; aqui só se lê e se ajusta. */
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

  /**
   * O idioma que a pessoa escolheu, para acompanhar a conta em outro aparelho.
   * Nulo significa que ela nunca escolheu e segue o idioma do aparelho — e um
   * valor fora da lista é tratado como nulo, não como erro.
   */
  async getLocale(userId: string): Promise<Locale | null> {
    const row = unwrap(
      await supabase.from('profiles').select('locale').eq('id', userId).maybeSingle(),
      'Falha ao carregar o idioma do perfil',
    );

    const locale = row?.locale ?? null;
    return isLocale(locale) ? locale : null;
  },

  /** Nulo volta a seguir o aparelho. */
  async setLocale(userId: string, locale: Locale | null): Promise<void> {
    unwrap(
      await supabase.from('profiles').update({ locale }).eq('id', userId).select('id'),
      'Falha ao salvar o idioma do perfil',
    );
  },
};
