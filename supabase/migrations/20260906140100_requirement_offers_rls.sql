-- =============================================================================
-- TripReady — RLS das sugestões de contratação
--
-- `requirement_offers` tem a mesma natureza de `requirement_templates` e
-- `visa_rules`: dado de referência compartilhado, lido igual por todo usuário
-- autenticado e escrito apenas por migration, que roda pelo dono das tabelas e
-- não passa pelas policies.
--
-- O que se protege aqui é a integridade, e neste caso ela vale dinheiro: uma
-- oferta gravável pelo cliente seria um link de afiliado trocável por qualquer
-- pessoa, para qualquer destino, dentro do app.
--
-- O `revoke` não é decorativo. A migration `20260905120200_table_grants.sql`
-- deixou um `alter default privileges` concedendo INSERT/UPDATE/DELETE a
-- `authenticated` em toda tabela nova do schema `public`.
-- =============================================================================

alter table public.requirement_offers enable row level security;

create policy "requirement_offers_select_authenticated"
  on public.requirement_offers for select to authenticated
  using (true);

revoke insert, update, delete on public.requirement_offers from authenticated;

grant select on public.requirement_offers to authenticated;

-- Nada para `anon`: o app não tem tela pública.
