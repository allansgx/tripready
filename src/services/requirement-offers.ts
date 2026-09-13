import { supabase } from '@/lib/supabase/client';
import { unwrapRequired } from '@/services/errors';
import type { RequirementOffer } from '@/types/models';

/** Onde resolver um requisito da checklist. Sem oferta, a tela não mostra o bloco. */

export type OfferContext = {
  /** Países da viagem; uma oferta restrita a outro destino não entra. */
  destinationCountryCodes: readonly string[];
  /** Passaporte principal do viajante; nulo não restringe nada por si só. */
  passportCountryCode: string | null;
  /** Data de referência em `YYYY-MM-DD`, para a vigência da campanha. */
  today: string;
};

/** Uma data está dentro de um período aberto nas duas pontas. */
function isWithinPeriod(date: string, from: string | null, until: string | null): boolean {
  if (from && date < from) return false;
  if (until && date > until) return false;
  return true;
}

/**
 * Restrição nula é ausência de restrição. Oferta restrita a um passaporte não
 * aparece sem passaporte principal: melhor não indicar do que indicar errado.
 */
function applies(offer: RequirementOffer, context: OfferContext): boolean {
  if (!isWithinPeriod(context.today, offer.valid_from, offer.valid_until)) return false;

  if (
    offer.destination_country_code &&
    !context.destinationCountryCodes.includes(offer.destination_country_code.toUpperCase())
  ) {
    return false;
  }

  if (
    offer.passport_country_code &&
    offer.passport_country_code.toUpperCase() !== context.passportCountryCode?.toUpperCase()
  ) {
    return false;
  }

  return true;
}

export const requirementOffersService = {
  /** Ofertas de um requisito, já na ordem de exibição. */
  async listForTemplate(
    requirementTemplateId: string,
    context: OfferContext,
  ): Promise<RequirementOffer[]> {
    const rows = unwrapRequired(
      await supabase
        .from('requirement_offers')
        .select('*')
        .eq('requirement_template_id', requirementTemplateId)
        .eq('active', true)
        .order('position', { ascending: true })
        .order('name', { ascending: true }),
      'Falha ao carregar as sugestões do item',
    );

    const codes = context.destinationCountryCodes.map((code) => code.toUpperCase());
    return rows.filter((offer) => applies(offer, { ...context, destinationCountryCodes: codes }));
  },
};
