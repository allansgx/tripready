-- =============================================================================
-- TripReady — Row Level Security
--
-- Regra geral: o usuário autenticado só enxerga e modifica as próprias linhas.
-- Tabelas filhas de `trips` herdam a permissão do dono da viagem.
--
-- `(select auth.uid())` é usado no lugar de `auth.uid()` para que o Postgres
-- avalie a função uma única vez por consulta (recomendação de performance do
-- Supabase).
-- =============================================================================

-- Verifica se a viagem pertence ao usuário autenticado.
-- SECURITY DEFINER evita reavaliar as policies de `trips` dentro de cada policy
-- das tabelas filhas.
create or replace function public.is_trip_owner(p_trip_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.trips t
    where t.id = p_trip_id
      and t.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_trip_owner(uuid) from public, anon;
grant execute on function public.is_trip_owner(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.passports enable row level security;
alter table public.trips enable row level security;
alter table public.trip_countries enable row level security;
alter table public.trip_cities enable row level security;
alter table public.trip_requirements enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Sem policy de DELETE: o perfil é removido em cascata com o usuário.

-- -----------------------------------------------------------------------------
-- passports
-- -----------------------------------------------------------------------------
create policy "passports_select_own"
  on public.passports for select to authenticated
  using (user_id = (select auth.uid()));

create policy "passports_insert_own"
  on public.passports for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "passports_update_own"
  on public.passports for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "passports_delete_own"
  on public.passports for delete to authenticated
  using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- trips
-- -----------------------------------------------------------------------------
create policy "trips_select_own"
  on public.trips for select to authenticated
  using (user_id = (select auth.uid()));

create policy "trips_insert_own"
  on public.trips for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "trips_update_own"
  on public.trips for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "trips_delete_own"
  on public.trips for delete to authenticated
  using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- trip_countries
-- -----------------------------------------------------------------------------
create policy "trip_countries_select_own"
  on public.trip_countries for select to authenticated
  using (public.is_trip_owner(trip_id));

create policy "trip_countries_insert_own"
  on public.trip_countries for insert to authenticated
  with check (public.is_trip_owner(trip_id));

create policy "trip_countries_update_own"
  on public.trip_countries for update to authenticated
  using (public.is_trip_owner(trip_id))
  with check (public.is_trip_owner(trip_id));

create policy "trip_countries_delete_own"
  on public.trip_countries for delete to authenticated
  using (public.is_trip_owner(trip_id));

-- -----------------------------------------------------------------------------
-- trip_cities
-- -----------------------------------------------------------------------------
create policy "trip_cities_select_own"
  on public.trip_cities for select to authenticated
  using (public.is_trip_owner(trip_id));

create policy "trip_cities_insert_own"
  on public.trip_cities for insert to authenticated
  with check (public.is_trip_owner(trip_id));

create policy "trip_cities_update_own"
  on public.trip_cities for update to authenticated
  using (public.is_trip_owner(trip_id))
  with check (public.is_trip_owner(trip_id));

create policy "trip_cities_delete_own"
  on public.trip_cities for delete to authenticated
  using (public.is_trip_owner(trip_id));

-- -----------------------------------------------------------------------------
-- trip_requirements
-- -----------------------------------------------------------------------------
create policy "trip_requirements_select_own"
  on public.trip_requirements for select to authenticated
  using (public.is_trip_owner(trip_id));

create policy "trip_requirements_insert_own"
  on public.trip_requirements for insert to authenticated
  with check (public.is_trip_owner(trip_id));

create policy "trip_requirements_update_own"
  on public.trip_requirements for update to authenticated
  using (public.is_trip_owner(trip_id))
  with check (public.is_trip_owner(trip_id));

create policy "trip_requirements_delete_own"
  on public.trip_requirements for delete to authenticated
  using (public.is_trip_owner(trip_id));
