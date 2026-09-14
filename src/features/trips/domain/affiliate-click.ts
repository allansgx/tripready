import type { AffiliateClickInsert, RequirementOffer } from '@/types/models';

/**
 * Monta o evento de clique em uma recomendação de parceiro.
 *
 * `user_id` e `clicked_at` ficam de fora de propósito: os dois são preenchidos
 * pelo banco, um por `auth.uid()` e outro pelo relógio do servidor.
 */
export function buildAffiliateClick(
  offer: RequirementOffer,
  tripId: string | null,
): AffiliateClickInsert {
  return {
    offer_id: offer.id,
    partner_code: offer.partner_code,
    trip_id: tripId,
  };
}
