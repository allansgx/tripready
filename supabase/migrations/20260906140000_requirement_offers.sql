-- =============================================================================
-- TripReady — sugestões de contratação por tipo de requisito
--
-- A tela de detalhe de um item da checklist mostra, além do que verificar, onde
-- resolver aquilo: seguradoras para o seguro viagem, operadoras de eSIM para a
-- conectividade, e assim por diante. Parte desses links é de afiliado.
--
-- A oferta é ligada a `requirement_templates`, e não à categoria nem ao item de
-- uma viagem:
--
--   * categoria seria grosso demais — "Documentos" cobre passaporte, visto e
--     seguro, que não se contratam no mesmo lugar;
--   * `trip_requirements.id` seria por viagem, e a oferta é do catálogo: vale
--     para todo mundo que tiver aquele item.
--
-- `trip_requirements.template_id` já carrega essa origem desde
-- `20260906120000_requirement_catalog.sql`, então o app chega à oferta sem
-- consulta extra. Item criado à mão pelo usuário (`template_id` nulo)
-- simplesmente não tem oferta — o que é o comportamento correto, e não uma
-- limitação.
--
-- A tabela nasce vazia. Nenhum link de afiliado é inventado por migration: as
-- linhas são cadastradas por quem tem os programas, e cada uma é uma indicação
-- que o app faz em seu próprio nome.
-- =============================================================================

create table public.requirement_offers (
  id uuid primary key default gen_random_uuid(),
  requirement_template_id uuid not null
    references public.requirement_templates (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  description text,
  url text not null check (url ~ '^https://'),
  icon text,
  destination_country_code text check (destination_country_code ~ '^[A-Z]{2}$'),
  passport_country_code text check (passport_country_code ~ '^[A-Z]{2}$'),
  is_affiliate boolean not null default true,
  position integer not null default 0,
  active boolean not null default true,
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint requirement_offers_period_check check (
    valid_from is null or valid_until is null or valid_until >= valid_from
  )
);

comment on table public.requirement_offers is
  'Onde resolver um requisito da checklist. Dado de referência do catálogo, '
  'lido por todo usuário autenticado e escrito apenas por migration.';

comment on column public.requirement_offers.url is
  'Destino do toque, com o parâmetro de afiliado quando houver. Só https: o '
  'app abre o link no navegador do sistema.';

comment on column public.requirement_offers.icon is
  'Emoji ou nome de ícone do Ionicons. Nulo cai no ícone da categoria do '
  'requisito, então nenhuma linha fica sem marca visual.';

comment on column public.requirement_offers.destination_country_code is
  'Restringe a oferta a um destino da viagem. Nulo vale para qualquer destino.';

comment on column public.requirement_offers.passport_country_code is
  'Restringe a oferta ao passaporte principal do viajante — um seguro vendido '
  'só no Brasil não serve a quem viaja com outro passaporte. Nulo não '
  'restringe.';

comment on column public.requirement_offers.is_affiliate is
  'Se o link rende comissão. É o que decide a exibição do aviso de '
  'transparência na tela: indicação paga precisa estar declarada.';

comment on column public.requirement_offers.position is
  'Ordem de exibição dentro do requisito. Empate desempata pelo nome, para a '
  'lista não trocar de ordem entre uma abertura e outra.';

comment on column public.requirement_offers.valid_until is
  'Fim da campanha. Expirar uma oferta não deve exigir apagá-la — o histórico '
  'de quem já foi indicado continua legível.';

-- O app sempre consulta por template e só quer as ativas.
create index requirement_offers_template_idx
  on public.requirement_offers (requirement_template_id)
  where active;

create trigger requirement_offers_set_updated_at
before update on public.requirement_offers
for each row execute function public.set_updated_at();
