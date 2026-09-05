-- =============================================================================
-- TripReady — privilégios de tabela
--
-- RLS e GRANT são camadas diferentes: a policy decide *quais linhas* o usuário
-- enxerga, mas o Postgres só chega a avaliá-la se o role tiver privilégio na
-- tabela. Sem estes GRANTs o PostgREST responde 42501
-- ("permission denied for table"), que chega no app como 403 mesmo com o
-- usuário logado.
--
-- Nada é concedido ao role `anon`: o app não tem dados públicos, e todas as
-- policies são `to authenticated`.
-- =============================================================================

grant usage on schema public to authenticated;

-- O perfil é criado por trigger e nunca apagado pelo app (some junto com o
-- usuário, em cascata), por isso não há DELETE aqui.
grant select, insert, update on public.profiles to authenticated;

grant select, insert, update, delete on public.passports to authenticated;
grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.trip_countries to authenticated;
grant select, insert, update, delete on public.trip_cities to authenticated;
grant select, insert, update, delete on public.trip_requirements to authenticated;

-- Evita que a próxima tabela criada por migration esbarre no mesmo 403.
-- Vale para objetos criados pelo role que executa as migrations (`postgres`).
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
