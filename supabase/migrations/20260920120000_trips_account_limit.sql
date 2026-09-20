-- =============================================================================
-- Teto de viagens por conta
--
-- O mesmo número vive em `MAX_TRIPS_PER_USER`
-- (src/features/trips/domain/trip-limits.ts): a tela avisa antes de abrir o
-- fluxo, e aqui a escrita é recusada de todo jeito.
-- =============================================================================

-- `security definer` pelo mesmo motivo de `is_trip_owner`: uma subconsulta a
-- `public.trips` dentro de uma policy da própria `trips` entraria em recursão.
create or replace function public.can_create_trip()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select count(*) < 10
  from (
    select 1
    from public.trips t
    where t.user_id = (select auth.uid())
    limit 10
  ) capped;
$$;

revoke execute on function public.can_create_trip() from public, anon;
grant execute on function public.can_create_trip() to authenticated;

-- Só o insert ganha a condição: uma conta acima do teto precisa continuar
-- podendo corrigir e concluir o que já tem.
drop policy "trips_insert_own" on public.trips;

create policy "trips_insert_own"
  on public.trips for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.can_create_trip()
  );
