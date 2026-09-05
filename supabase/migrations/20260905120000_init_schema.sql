-- =============================================================================
-- TripReady — schema inicial
-- Entidades: profiles, passports, trips, trip_countries, trip_cities,
--            trip_requirements
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.requirement_priority as enum ('required', 'recommended', 'informational');

create type public.requirement_category as enum (
  'documents',
  'health',
  'money',
  'connectivity',
  'luggage'
);

-- -----------------------------------------------------------------------------
-- Funções auxiliares
-- -----------------------------------------------------------------------------

-- Mantém `updated_at` sempre coerente, independentemente do cliente.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles — 1:1 com auth.users
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil do usuário; a chave primária é o id de auth.users.';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Cria o perfil automaticamente quando um usuário se cadastra (Google/Apple).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Perfis para usuários que já existiam antes desta migration.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- passports
-- -----------------------------------------------------------------------------
create table public.passports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint passports_user_country_unique unique (user_id, country_code)
);

comment on column public.passports.country_code is 'ISO 3166-1 alpha-2, em maiúsculas.';

create index passports_user_id_idx on public.passports (user_id);

-- No máximo um passaporte principal por usuário.
create unique index passports_single_primary_idx
  on public.passports (user_id)
  where is_primary;

-- -----------------------------------------------------------------------------
-- trips
-- -----------------------------------------------------------------------------
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_date_range_check check (
    start_date is null or end_date is null or end_date >= start_date
  )
);

create index trips_user_id_idx on public.trips (user_id);

create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- trip_countries — países visitados na viagem
-- -----------------------------------------------------------------------------
create table public.trip_countries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  constraint trip_countries_trip_country_unique unique (trip_id, country_code)
);

create index trip_countries_trip_id_idx on public.trip_countries (trip_id);

-- -----------------------------------------------------------------------------
-- trip_cities — cidades dentro de um país já incluído na viagem
-- A FK composta garante que a cidade nunca aponte para um país que não faz
-- parte da viagem.
-- -----------------------------------------------------------------------------
create table public.trip_cities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  city_name text not null check (length(btrim(city_name)) > 0),
  constraint trip_cities_trip_country_fkey
    foreign key (trip_id, country_code)
    references public.trip_countries (trip_id, country_code)
    on delete cascade,
  constraint trip_cities_unique unique (trip_id, country_code, city_name)
);

create index trip_cities_trip_id_idx on public.trip_cities (trip_id);

-- -----------------------------------------------------------------------------
-- trip_requirements — checklist da viagem
-- `country_code` nulo = requisito da viagem inteira. Quando preenchido, a FK
-- composta (MATCH SIMPLE) exige que o país esteja na viagem.
-- -----------------------------------------------------------------------------
create table public.trip_requirements (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  country_code text check (country_code ~ '^[A-Z]{2}$'),
  title text not null check (length(btrim(title)) > 0),
  description text,
  priority public.requirement_priority not null,
  category public.requirement_category not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_requirements_trip_country_fkey
    foreign key (trip_id, country_code)
    references public.trip_countries (trip_id, country_code)
    on delete cascade
);

create index trip_requirements_trip_id_idx on public.trip_requirements (trip_id);
create index trip_requirements_trip_completed_idx
  on public.trip_requirements (trip_id, completed);

create trigger trip_requirements_set_updated_at
before update on public.trip_requirements
for each row execute function public.set_updated_at();
