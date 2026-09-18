-- =============================================================================
-- TripReady — tradução do catálogo (pt-BR · en · es)
--
-- Uma tabela de tradução por entidade, no lugar de colunas `title_en`/`title_es`
-- ou de um `jsonb` na própria linha — ver §8.2 do plano de i18n. Idioma novo é
-- INSERT, não migration de schema; a chave primária composta já é o índice do
-- acesso (`in (ids)` + `eq (locale)`), então nenhum índice extra é criado —
-- mesmo raciocínio já registrado em `visa_rules`.
--
-- As colunas originais das quatro tabelas continuam existindo: são a fonte
-- canônica pt-BR e o fallback final quando uma tradução não existe. A carga da
-- linha `pt-BR` de cada tabela de tradução é uma migration à parte
-- (`20260915140000_catalog_translations_seed_pt_br.sql`), para poder ser
-- revisada e revertida sem tocar neste schema.
-- =============================================================================

create table public.requirement_template_translations (
  requirement_template_id uuid not null
    references public.requirement_templates (id) on delete cascade,
  locale text not null check (locale in ('pt-BR', 'en', 'es')),
  title text not null check (length(btrim(title)) > 0),
  description text,
  primary key (requirement_template_id, locale)
);

comment on table public.requirement_template_translations is
  'Título e descrição de requirement_templates, por idioma. A coluna original '
  'da tabela é o fallback pt-BR quando a linha do idioma pedido não existe.';

comment on column public.requirement_template_translations.title is
  'Em regras de escopo `each_country`, aceita o marcador {country}, resolvido '
  'na leitura, no idioma ativo — não mais só na gravação do item da viagem.';

create table public.destination_group_translations (
  destination_group_id uuid not null
    references public.destination_groups (id) on delete cascade,
  locale text not null check (locale in ('pt-BR', 'en', 'es')),
  name text not null check (length(btrim(name)) > 0),
  description text,
  primary key (destination_group_id, locale)
);

comment on table public.destination_group_translations is
  'Nome e descrição de destination_groups, por idioma.';

create table public.visa_rule_translations (
  visa_rule_id uuid not null
    references public.visa_rules (id) on delete cascade,
  locale text not null check (locale in ('pt-BR', 'en', 'es')),
  notes text,
  source_name text,
  primary key (visa_rule_id, locale)
);

comment on table public.visa_rule_translations is
  'Observação e nome de fonte de visa_rules, por idioma. As duas colunas são '
  'nullable — nem toda regra tem observação, e source_name só ganha linha '
  'quando o órgão tem um descritivo a traduzir (§8.4 do plano de i18n).';

comment on column public.visa_rule_translations.source_name is
  'Só o descritivo, nunca o nome próprio do órgão. Nulo quando a fonte não tem '
  'descritivo a traduzir — o fallback mostra o nome canônico de visa_rules.';

create table public.requirement_offer_translations (
  requirement_offer_id uuid not null
    references public.requirement_offers (id) on delete cascade,
  locale text not null check (locale in ('pt-BR', 'en', 'es')),
  name text not null check (length(btrim(name)) > 0),
  description text,
  primary key (requirement_offer_id, locale)
);

comment on table public.requirement_offer_translations is
  'Nome e descrição de requirement_offers, por idioma.';

-- -----------------------------------------------------------------------------
-- RLS — mesma natureza das quatro tabelas de origem: dado de referência
-- compartilhado, lido igual por todo usuário autenticado e escrito apenas por
-- migration, que roda pelo dono das tabelas e não passa pelas policies.
--
-- O revoke não é decorativo: `20260905120200_table_grants.sql` concede
-- INSERT/UPDATE/DELETE a `authenticated` em toda tabela nova do schema public.
-- -----------------------------------------------------------------------------

alter table public.requirement_template_translations enable row level security;
alter table public.destination_group_translations enable row level security;
alter table public.visa_rule_translations enable row level security;
alter table public.requirement_offer_translations enable row level security;

create policy "requirement_template_translations_select_authenticated"
  on public.requirement_template_translations for select to authenticated
  using (true);

create policy "destination_group_translations_select_authenticated"
  on public.destination_group_translations for select to authenticated
  using (true);

create policy "visa_rule_translations_select_authenticated"
  on public.visa_rule_translations for select to authenticated
  using (true);

create policy "requirement_offer_translations_select_authenticated"
  on public.requirement_offer_translations for select to authenticated
  using (true);

revoke insert, update, delete on public.requirement_template_translations from authenticated;
revoke insert, update, delete on public.destination_group_translations from authenticated;
revoke insert, update, delete on public.visa_rule_translations from authenticated;
revoke insert, update, delete on public.requirement_offer_translations from authenticated;

grant select on public.requirement_template_translations to authenticated;
grant select on public.destination_group_translations to authenticated;
grant select on public.visa_rule_translations to authenticated;
grant select on public.requirement_offer_translations to authenticated;

-- Nada para `anon`: o app não tem tela pública.
