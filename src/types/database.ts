/**
 * Tipos do banco de dados do Supabase.
 *
 * Este arquivo espelha o formato gerado por:
 *   npx supabase gen types typescript --linked > src/types/database.ts
 *
 * Ele é mantido à mão enquanto o schema é pequeno; ao regerar, o restante do
 * app continua funcionando porque só consome os aliases de `src/types/models.ts`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type RequirementPriority = 'required' | 'recommended' | 'informational';

export type RequirementCategory =
  | 'documents'
  | 'health'
  | 'money'
  | 'connectivity'
  | 'luggage';

export type RequirementScope = 'global' | 'each_country' | 'group' | 'country' | 'visa';

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export type TripKind = 'domestic' | 'international';

export type VisaRequirementType =
  | 'visa_free'
  | 'visa_required'
  | 'evisa'
  | 'eta'
  | 'visa_on_arrival'
  | 'conditional';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          locale: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          locale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          locale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      passports: {
        Row: {
          id: string;
          user_id: string;
          country_code: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          country_code: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          country_code?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'passports_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trips_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      trip_countries: {
        Row: {
          id: string;
          trip_id: string;
          country_code: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          country_code: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          country_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_countries_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      trip_cities: {
        Row: {
          id: string;
          trip_id: string;
          country_code: string;
          city_name: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          country_code: string;
          city_name: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          country_code?: string;
          city_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_cities_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trip_cities_trip_country_fkey';
            columns: ['trip_id', 'country_code'];
            isOneToOne: false;
            referencedRelation: 'trip_countries';
            referencedColumns: ['trip_id', 'country_code'];
          },
        ];
      };
      trip_requirements: {
        Row: {
          id: string;
          trip_id: string;
          country_code: string | null;
          title: string;
          description: string | null;
          priority: RequirementPriority;
          category: RequirementCategory;
          completed: boolean;
          template_id: string | null;
          group_id: string | null;
          visa_rule_id: string | null;
          source_name: string | null;
          source_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          country_code?: string | null;
          title: string;
          description?: string | null;
          priority: RequirementPriority;
          category: RequirementCategory;
          completed?: boolean;
          template_id?: string | null;
          group_id?: string | null;
          visa_rule_id?: string | null;
          source_name?: string | null;
          source_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          country_code?: string | null;
          title?: string;
          description?: string | null;
          priority?: RequirementPriority;
          category?: RequirementCategory;
          completed?: boolean;
          template_id?: string | null;
          group_id?: string | null;
          visa_rule_id?: string | null;
          source_name?: string | null;
          source_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_requirements_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trip_requirements_trip_country_fkey';
            columns: ['trip_id', 'country_code'];
            isOneToOne: false;
            referencedRelation: 'trip_countries';
            referencedColumns: ['trip_id', 'country_code'];
          },
          {
            foreignKeyName: 'trip_requirements_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'requirement_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trip_requirements_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'destination_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trip_requirements_visa_rule_id_fkey';
            columns: ['visa_rule_id'];
            isOneToOne: false;
            referencedRelation: 'visa_rules';
            referencedColumns: ['id'];
          },
        ];
      };
      visa_rules: {
        Row: {
          id: string;
          passport_country_code: string;
          destination_country_code: string;
          requirement_type: VisaRequirementType;
          source_name: string;
          source_url: string;
          verified_at: string;
          notes: string | null;
          valid_from: string | null;
          valid_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          passport_country_code: string;
          destination_country_code: string;
          requirement_type: VisaRequirementType;
          source_name: string;
          source_url: string;
          verified_at: string;
          notes?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          passport_country_code?: string;
          destination_country_code?: string;
          requirement_type?: VisaRequirementType;
          source_name?: string;
          source_url?: string;
          verified_at?: string;
          notes?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supported_passport_countries: {
        Row: {
          country_code: string;
          created_at: string;
        };
        Insert: {
          country_code: string;
          created_at?: string;
        };
        Update: {
          country_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      visa_rule_translations: {
        Row: {
          visa_rule_id: string;
          locale: string;
          notes: string | null;
          source_name: string | null;
        };
        Insert: {
          visa_rule_id: string;
          locale: string;
          notes?: string | null;
          source_name?: string | null;
        };
        Update: {
          visa_rule_id?: string;
          locale?: string;
          notes?: string | null;
          source_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'visa_rule_translations_visa_rule_id_fkey';
            columns: ['visa_rule_id'];
            isOneToOne: false;
            referencedRelation: 'visa_rules';
            referencedColumns: ['id'];
          },
        ];
      };
      destination_groups: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          source_name: string | null;
          source_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          source_name?: string | null;
          source_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          source_name?: string | null;
          source_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      destination_group_translations: {
        Row: {
          destination_group_id: string;
          locale: string;
          name: string;
          description: string | null;
        };
        Insert: {
          destination_group_id: string;
          locale: string;
          name: string;
          description?: string | null;
        };
        Update: {
          destination_group_id?: string;
          locale?: string;
          name?: string;
          description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'destination_group_translations_destination_group_id_fkey';
            columns: ['destination_group_id'];
            isOneToOne: false;
            referencedRelation: 'destination_groups';
            referencedColumns: ['id'];
          },
        ];
      };
      destination_group_members: {
        Row: {
          id: string;
          group_id: string;
          country_code: string;
          valid_from: string | null;
          valid_until: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          country_code: string;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          country_code?: string;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'destination_group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'destination_groups';
            referencedColumns: ['id'];
          },
        ];
      };
      requirement_templates: {
        Row: {
          id: string;
          code: string;
          title: string;
          description: string | null;
          priority: RequirementPriority;
          category: RequirementCategory;
          scope: RequirementScope;
          season: Season | null;
          passport_country_code: string | null;
          trip_kind: TripKind | null;
          visa_requirement_type: VisaRequirementType | null;
          source_name: string | null;
          source_url: string | null;
          valid_from: string | null;
          valid_until: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          description?: string | null;
          priority: RequirementPriority;
          category: RequirementCategory;
          scope: RequirementScope;
          season?: Season | null;
          passport_country_code?: string | null;
          trip_kind?: TripKind | null;
          visa_requirement_type?: VisaRequirementType | null;
          source_name?: string | null;
          source_url?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          title?: string;
          description?: string | null;
          priority?: RequirementPriority;
          category?: RequirementCategory;
          scope?: RequirementScope;
          season?: Season | null;
          passport_country_code?: string | null;
          trip_kind?: TripKind | null;
          visa_requirement_type?: VisaRequirementType | null;
          source_name?: string | null;
          source_url?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      requirement_template_translations: {
        Row: {
          requirement_template_id: string;
          locale: string;
          title: string;
          description: string | null;
        };
        Insert: {
          requirement_template_id: string;
          locale: string;
          title: string;
          description?: string | null;
        };
        Update: {
          requirement_template_id?: string;
          locale?: string;
          title?: string;
          description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'requirement_template_translations_requirement_template_id_fkey';
            columns: ['requirement_template_id'];
            isOneToOne: false;
            referencedRelation: 'requirement_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      requirement_template_groups: {
        Row: {
          requirement_template_id: string;
          group_id: string;
        };
        Insert: {
          requirement_template_id: string;
          group_id: string;
        };
        Update: {
          requirement_template_id?: string;
          group_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'requirement_template_groups_requirement_template_id_fkey';
            columns: ['requirement_template_id'];
            isOneToOne: false;
            referencedRelation: 'requirement_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'requirement_template_groups_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'destination_groups';
            referencedColumns: ['id'];
          },
        ];
      };
      requirement_template_countries: {
        Row: {
          requirement_template_id: string;
          country_code: string;
        };
        Insert: {
          requirement_template_id: string;
          country_code: string;
        };
        Update: {
          requirement_template_id?: string;
          country_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'requirement_template_countries_requirement_template_id_fkey';
            columns: ['requirement_template_id'];
            isOneToOne: false;
            referencedRelation: 'requirement_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      requirement_offers: {
        Row: {
          id: string;
          requirement_template_id: string;
          partner_code: string;
          name: string;
          description: string | null;
          url: string;
          icon: string | null;
          destination_country_code: string | null;
          passport_country_code: string | null;
          is_affiliate: boolean;
          position: number;
          active: boolean;
          valid_from: string | null;
          valid_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requirement_template_id: string;
          partner_code: string;
          name: string;
          description?: string | null;
          url: string;
          icon?: string | null;
          destination_country_code?: string | null;
          passport_country_code?: string | null;
          is_affiliate?: boolean;
          position?: number;
          active?: boolean;
          valid_from?: string | null;
          valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requirement_template_id?: string;
          partner_code?: string;
          name?: string;
          description?: string | null;
          url?: string;
          icon?: string | null;
          destination_country_code?: string | null;
          passport_country_code?: string | null;
          is_affiliate?: boolean;
          position?: number;
          active?: boolean;
          valid_from?: string | null;
          valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'requirement_offers_requirement_template_id_fkey';
            columns: ['requirement_template_id'];
            isOneToOne: false;
            referencedRelation: 'requirement_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      requirement_offer_translations: {
        Row: {
          requirement_offer_id: string;
          locale: string;
          name: string;
          description: string | null;
        };
        Insert: {
          requirement_offer_id: string;
          locale: string;
          name: string;
          description?: string | null;
        };
        Update: {
          requirement_offer_id?: string;
          locale?: string;
          name?: string;
          description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'requirement_offer_translations_requirement_offer_id_fkey';
            columns: ['requirement_offer_id'];
            isOneToOne: false;
            referencedRelation: 'requirement_offers';
            referencedColumns: ['id'];
          },
        ];
      };
      affiliate_clicks: {
        Row: {
          id: string;
          user_id: string | null;
          offer_id: string | null;
          partner_code: string;
          trip_id: string | null;
          clicked_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          offer_id?: string | null;
          partner_code: string;
          trip_id?: string | null;
          clicked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          offer_id?: string | null;
          partner_code?: string;
          trip_id?: string | null;
          clicked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'affiliate_clicks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_clicks_offer_id_fkey';
            columns: ['offer_id'];
            isOneToOne: false;
            referencedRelation: 'requirement_offers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_clicks_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      apply_requirement_diff: {
        Args: { p_remove_ids: string[]; p_inserts: Json };
        Returns: undefined;
      };
    };
    Enums: {
      requirement_priority: RequirementPriority;
      requirement_category: RequirementCategory;
      requirement_scope: RequirementScope;
      season: Season;
      trip_kind: TripKind;
      visa_requirement_type: VisaRequirementType;
    };
    CompositeTypes: Record<never, never>;
  };
};
