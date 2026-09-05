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
            foreignKeyName: 'trip_cities_trip_id_country_code_fkey';
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
            foreignKeyName: 'trip_requirements_trip_id_country_code_fkey';
            columns: ['trip_id', 'country_code'];
            isOneToOne: false;
            referencedRelation: 'trip_countries';
            referencedColumns: ['trip_id', 'country_code'];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      requirement_priority: RequirementPriority;
      requirement_category: RequirementCategory;
    };
    CompositeTypes: Record<never, never>;
  };
};
