-- =============================================================================
-- TripReady — RLS do catálogo de requisitos
--
-- O catálogo é dado de referência compartilhado: todo usuário autenticado lê as
-- mesmas linhas, e ninguém escreve pelo app. A escrita acontece por migration,
-- executada pelo dono das tabelas, que não passa pelas policies.
--
-- A migration de privilégios anterior deixou um `alter default privileges`
-- concedendo INSERT/UPDATE/DELETE a `authenticated` em toda tabela nova do
-- schema. Sem policy de escrita o RLS já barraria, mas o privilégio é revogado
-- mesmo assim: o catálogo não deve depender de uma segunda camada para não ser
-- alterado pelo cliente.
-- =============================================================================

alter table public.destination_groups enable row level security;
alter table public.destination_group_members enable row level security;
alter table public.requirement_templates enable row level security;
alter table public.requirement_template_groups enable row level security;
alter table public.requirement_template_countries enable row level security;

create policy "destination_groups_select_authenticated"
  on public.destination_groups for select to authenticated
  using (true);

create policy "destination_group_members_select_authenticated"
  on public.destination_group_members for select to authenticated
  using (true);

create policy "requirement_templates_select_authenticated"
  on public.requirement_templates for select to authenticated
  using (true);

create policy "requirement_template_groups_select_authenticated"
  on public.requirement_template_groups for select to authenticated
  using (true);

create policy "requirement_template_countries_select_authenticated"
  on public.requirement_template_countries for select to authenticated
  using (true);

revoke insert, update, delete on public.destination_groups from authenticated;
revoke insert, update, delete on public.destination_group_members from authenticated;
revoke insert, update, delete on public.requirement_templates from authenticated;
revoke insert, update, delete on public.requirement_template_groups from authenticated;
revoke insert, update, delete on public.requirement_template_countries from authenticated;

grant select on public.destination_groups to authenticated;
grant select on public.destination_group_members to authenticated;
grant select on public.requirement_templates to authenticated;
grant select on public.requirement_template_groups to authenticated;
grant select on public.requirement_template_countries to authenticated;

-- Nada para `anon`: o app não tem tela pública.
