import { supabase } from '@/lib/supabase/client';
import type { AffiliateClickInsert } from '@/types/models';

/** Métrica de desempenho dos links de parceiro. Não tem leitura: o app só escreve. */

export const affiliateClicksService = {
  /**
   * Único serviço que não usa `unwrap`: falhar aqui não pode chegar à tela nem
   * segurar a abertura do link. Sem `.select()` encadeado — a tabela não
   * concede leitura a `authenticated`, e pedir o retorno viraria 403.
   */
  async record(click: AffiliateClickInsert): Promise<void> {
    const { error } = await supabase.from('affiliate_clicks').insert(click);

    if (error && __DEV__) {
      console.warn(`[affiliate] clique não registrado: ${error.message}`);
    }
  },
};
