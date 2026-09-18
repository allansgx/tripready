-- =============================================================================
-- TripReady — passaportes com cobertura de regras
--
-- A tabela responde uma pergunta só: para quais passaportes o app já tem regras
-- de entrada suficientes para dizer que dá suporte.
--
-- Ela **não filtra** quem entra no app. Qualquer pessoa escolhe o passaporte
-- dela na lista completa de países, porque guardar o país real é o que mantém a
-- viagem doméstica correta e o que permite melhorar a checklist quando as regras
-- daquele país chegarem. O que esta tabela governa é o que o app **diz**: sem
-- linha aqui, a interface avisa que as regras ainda estão em preparação.
--
-- Por que uma tabela curada em vez de `select distinct passport_country_code
-- from visa_rules`: a primeira regra coletada de um país não é promessa de
-- suporte. Um passaporte só entra aqui quando passa no critério de cobertura do
-- AGENTS.md: grupos de destino inteiros e pelo menos 75% dos destinos com
-- sugestão de cidade.
-- =============================================================================

create table public.supported_passport_countries (
  country_code text primary key check (country_code ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now()
);

comment on table public.supported_passport_countries is
  'Passaportes cujas regras de entrada já cobrem o critério mínimo. Governa o '
  'que a interface informa, nunca quem pode usar o app.';

comment on column public.supported_passport_countries.country_code is
  'ISO 3166-1 alpha-2 em maiúsculas, casado com `passports.country_code`.';

-- Mesma natureza de `visa_rules`: catálogo compartilhado, lido igual por todo
-- usuário autenticado e escrito só por migration. O `revoke` não é decorativo —
-- `20260905120200_table_grants.sql` concede escrita a `authenticated` em toda
-- tabela nova do schema public.
alter table public.supported_passport_countries enable row level security;

create policy "supported_passport_countries_select_authenticated"
  on public.supported_passport_countries for select to authenticated
  using (true);

revoke insert, update, delete on public.supported_passport_countries from authenticated;

grant select on public.supported_passport_countries to authenticated;

-- Nada para `anon`: o app não tem tela pública.

-- O Brasil entra porque a coleta de `tasks/coleta-vistos-br.md` fechou o
-- critério: 60 dos 80 destinos com cidade sugerida, Espaço Schengen completo,
-- MERCOSUL e Comunidade Andina com todos os membros vigentes.
insert into public.supported_passport_countries (country_code)
values ('BR')
on conflict (country_code) do nothing;
