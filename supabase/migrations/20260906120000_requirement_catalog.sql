-- =============================================================================
-- TripReady — catálogo de requisitos
--
-- Até aqui a checklist nascia de uma lista fixa em TypeScript
-- (`buildBaseChecklist`). Este catálogo tira essa lista do app: as regras
-- passam a ser linhas de banco, e `trip_requirements` continua sendo apenas o
-- snapshot da checklist de uma viagem.
--
-- Entidades:
--   destination_groups          — grupos de aplicabilidade (Schengen, MERCOSUL…)
--   destination_group_members   — países de cada grupo, com período de validade
--   requirement_templates       — as regras reutilizáveis
--   requirement_template_groups — regras que valem para um grupo
--   requirement_template_countries — regras que valem para um país
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------

-- Como a regra chega até a viagem. `each_country` existe para preservar o
-- comportamento atual do app: um item por país da viagem, com o nome do país no
-- título. Sem ele, o mesmo efeito exigiria uma linha de catálogo por país do
-- mundo.
create type public.requirement_scope as enum (
  'global',
  'each_country',
  'group',
  'country'
);

-- Estação do destino, não do calendário do viajante: a conversão de data para
-- estação depende do hemisfério e é feita fora do banco.
create type public.season as enum ('winter', 'spring', 'summer', 'autumn');

-- -----------------------------------------------------------------------------
-- destination_groups
-- -----------------------------------------------------------------------------
create table public.destination_groups (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_]+$'),
  name text not null check (length(btrim(name)) > 0),
  description text,
  source_name text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.destination_groups is
  'Grupos de aplicabilidade de regras — não são regiões geográficas. Pertencer '
  'ao grupo não cria requisito nenhum por si só; o grupo apenas dá endereço a '
  'regras que comprovadamente valem para todos os membros.';

comment on column public.destination_groups.code is
  'Identificador estável usado pelos seeds e pelo app (ex.: SCHENGEN).';

create trigger destination_groups_set_updated_at
before update on public.destination_groups
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- destination_group_members
--
-- Um país pode estar em vários grupos, e a composição muda com o tempo — daí o
-- período de validade em vez de uma lista fixa.
-- -----------------------------------------------------------------------------
create table public.destination_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.destination_groups (id) on delete cascade,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  valid_from date,
  valid_until date,
  constraint destination_group_members_unique unique (group_id, country_code),
  constraint destination_group_members_period_check check (
    valid_from is null or valid_until is null or valid_until >= valid_from
  )
);

comment on column public.destination_group_members.valid_from is
  'Entrada em vigor da participação. Nulo quando a data oficial não é conhecida '
  'com precisão — nunca preenchido por estimativa.';

comment on column public.destination_group_members.valid_until is
  'Saída ou suspensão. Nulo enquanto o país for membro.';

create index destination_group_members_group_id_idx
  on public.destination_group_members (group_id);
create index destination_group_members_country_code_idx
  on public.destination_group_members (country_code);

-- -----------------------------------------------------------------------------
-- requirement_templates
-- -----------------------------------------------------------------------------
create table public.requirement_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]+$'),
  title text not null check (length(btrim(title)) > 0),
  description text,
  priority public.requirement_priority not null,
  category public.requirement_category not null,
  scope public.requirement_scope not null,
  season public.season,
  passport_country_code text check (passport_country_code ~ '^[A-Z]{2}$'),
  source_name text,
  source_url text,
  valid_from date,
  valid_until date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint requirement_templates_period_check check (
    valid_from is null or valid_until is null or valid_until >= valid_from
  )
);

comment on table public.requirement_templates is
  'Catálogo de regras reutilizáveis, antes de virarem itens de uma viagem.';

comment on column public.requirement_templates.title is
  'Em regras de escopo `each_country`, aceita o marcador {country}, trocado '
  'pelo nome do país ao gerar a checklist.';

comment on column public.requirement_templates.season is
  'Condição opcional de estação. Nulo = vale o ano inteiro.';

comment on column public.requirement_templates.passport_country_code is
  'Condição opcional de nacionalidade do passaporte principal. Nulo = não '
  'restringe.';

create index requirement_templates_active_idx
  on public.requirement_templates (active)
  where active;

create trigger requirement_templates_set_updated_at
before update on public.requirement_templates
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Aplicabilidade
--
-- Ficam em tabelas próprias, e não em colunas de `requirement_templates`, para
-- que uma regra possa valer para mais de um grupo ou país sem mudar o schema.
-- -----------------------------------------------------------------------------
create table public.requirement_template_groups (
  requirement_template_id uuid not null
    references public.requirement_templates (id) on delete cascade,
  group_id uuid not null references public.destination_groups (id) on delete cascade,
  primary key (requirement_template_id, group_id)
);

create table public.requirement_template_countries (
  requirement_template_id uuid not null
    references public.requirement_templates (id) on delete cascade,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  primary key (requirement_template_id, country_code)
);

create index requirement_template_countries_country_code_idx
  on public.requirement_template_countries (country_code);

-- -----------------------------------------------------------------------------
-- trip_requirements — origem do item
--
-- `template_id` e `group_id` respondem "de onde veio este item": é o que evita
-- duplicar na edição da viagem e o que permite à tela agrupar por viagem
-- inteira, grupo ou país. Ambos ficam nulos nos itens criados à mão pelo
-- usuário, que continuam funcionando como antes.
-- -----------------------------------------------------------------------------
alter table public.trip_requirements
  add column template_id uuid references public.requirement_templates (id) on delete set null,
  add column group_id uuid references public.destination_groups (id) on delete set null;

comment on column public.trip_requirements.template_id is
  'Regra do catálogo que originou o item. Nulo em itens criados pelo usuário.';

comment on column public.trip_requirements.group_id is
  'Grupo que tornou a regra aplicável, quando o escopo foi de grupo.';

-- Uma regra do catálogo entra uma única vez por viagem, país e grupo. O índice
-- é parcial porque itens criados à mão (sem template) podem se repetir à
-- vontade — a restrição existe para a geração automática, não para o usuário.
create unique index trip_requirements_template_unique
  on public.trip_requirements (
    trip_id,
    template_id,
    coalesce(country_code, ''),
    coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where template_id is not null;

create index trip_requirements_template_id_idx
  on public.trip_requirements (template_id)
  where template_id is not null;
