-- =============================================================================
-- TripReady — RLS das regras de visto
--
-- `visa_rules` tem a mesma natureza de `requirement_templates` e
-- `destination_groups`: dado de referência compartilhado, lido igual por todo
-- usuário autenticado e escrito apenas por migration, que roda pelo dono das
-- tabelas e não passa pelas policies.
--
-- Não há nada a esconder no conteúdo. "Brasileiros precisam de visto para a
-- China" é informação pública de governo, e a própria linha carrega a URL
-- oficial de onde ela veio. O que se protege aqui é a **integridade**: o
-- cliente não pode alterar uma regra de visto.
--
-- O `revoke` não é decorativo. A migration `20260905120200_table_grants.sql`
-- deixou um `alter default privileges` concedendo INSERT/UPDATE/DELETE a
-- `authenticated` em toda tabela nova do schema `public` — sem o revoke,
-- `visa_rules` nasceria gravável no nível de privilégio. A ausência de policy
-- de escrita já barraria, mas o catálogo não deve depender de uma única camada.
-- =============================================================================

alter table public.visa_rules enable row level security;

create policy "visa_rules_select_authenticated"
  on public.visa_rules for select to authenticated
  using (true);

revoke insert, update, delete on public.visa_rules from authenticated;

grant select on public.visa_rules to authenticated;

-- Nada para `anon`: o app não tem tela pública.
