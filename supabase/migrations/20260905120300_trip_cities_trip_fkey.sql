-- =============================================================================
-- trip_cities: chave estrangeira direta para trips
--
-- A tabela nasceu apenas com a FK composta (trip_id, country_code) ->
-- trip_countries, que garante que a cidade pertença a um país da viagem. Só que
-- o PostgREST monta os embeds a partir das chaves estrangeiras, e sem um
-- caminho direto `trips -> trip_cities` uma consulta como
--
--   select=*,trip_countries(*),trip_cities(*)
--
-- falha com 400 "Could not find a relationship between 'trips' and
-- 'trip_cities' in the schema cache".
--
-- A FK direta resolve isso e deixa a tabela consistente com
-- `trip_requirements`, que já tem as duas: a direta para `trips` e a composta
-- para `trip_countries`. As duas convivem — a composta continua impedindo
-- cidade em país que não faz parte da viagem.
-- =============================================================================

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'trip_cities_trip_id_fkey'
  ) then
    alter table public.trip_cities
      add constraint trip_cities_trip_id_fkey
      foreign key (trip_id) references public.trips (id) on delete cascade;
  end if;
end
$$;

-- Faz o PostgREST reler o schema sem esperar o recarregamento automático.
notify pgrst, 'reload schema';
