/**
 * Aliases das entidades do banco.
 *
 * As telas e serviços importam daqui (e não de `database.ts`), então regenerar
 * os tipos do Supabase não quebra os imports espalhados pelo app.
 */

import type { Database, RequirementCategory, RequirementPriority } from '@/types/database';

type Tables = Database['public']['Tables'];

export type Profile = Tables['profiles']['Row'];
export type ProfileInsert = Tables['profiles']['Insert'];
export type ProfileUpdate = Tables['profiles']['Update'];

export type Passport = Tables['passports']['Row'];
export type PassportInsert = Tables['passports']['Insert'];
export type PassportUpdate = Tables['passports']['Update'];

export type Trip = Tables['trips']['Row'];
export type TripInsert = Tables['trips']['Insert'];
export type TripUpdate = Tables['trips']['Update'];

export type TripCountry = Tables['trip_countries']['Row'];
export type TripCountryInsert = Tables['trip_countries']['Insert'];
export type TripCountryUpdate = Tables['trip_countries']['Update'];

export type TripCity = Tables['trip_cities']['Row'];
export type TripCityInsert = Tables['trip_cities']['Insert'];
export type TripCityUpdate = Tables['trip_cities']['Update'];

export type TripRequirement = Tables['trip_requirements']['Row'];
export type TripRequirementInsert = Tables['trip_requirements']['Insert'];
export type TripRequirementUpdate = Tables['trip_requirements']['Update'];

export type { RequirementCategory, RequirementPriority };

export const REQUIREMENT_PRIORITIES: readonly RequirementPriority[] = [
  'required',
  'recommended',
  'informational',
] as const;

export const REQUIREMENT_CATEGORIES: readonly RequirementCategory[] = [
  'documents',
  'health',
  'money',
  'connectivity',
  'luggage',
] as const;
