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

export type RequirementScope = 'global' | 'each_country' | 'group' | 'country';

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
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
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      requirement_priority: RequirementPriority;
      requirement_category: RequirementCategory;
      requirement_scope: RequirementScope;
      season: Season;
    };
    CompositeTypes: Record<never, never>;
  };
};
