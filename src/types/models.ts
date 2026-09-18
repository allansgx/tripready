/**
 * Aliases das entidades do banco. As telas e serviços importam daqui, e não de
 * `database.ts`, então regenerar os tipos não quebra os imports do app.
 */

import type {
  Database,
  RequirementCategory,
  RequirementPriority,
  RequirementScope,
  Season,
  TripKind,
  VisaRequirementType,
} from '@/types/database';

type Tables = Database['public']['Tables'];

export type Profile = Tables['profiles']['Row'];

export type Passport = Tables['passports']['Row'];

export type Trip = Tables['trips']['Row'];

export type TripCountry = Tables['trip_countries']['Row'];

export type TripCity = Tables['trip_cities']['Row'];

export type TripRequirement = Tables['trip_requirements']['Row'];
export type TripRequirementInsert = Tables['trip_requirements']['Insert'];

export type RequirementOffer = Tables['requirement_offers']['Row'];

/** Só o Insert: o app registra o clique e nunca lê de volta. */
export type AffiliateClickInsert = Tables['affiliate_clicks']['Insert'];

export type {
  RequirementCategory,
  RequirementPriority,
  RequirementScope,
  Season,
  TripKind,
  VisaRequirementType,
};
