-- =============================================================================
-- TripReady — cliques em links de afiliado
--
-- Um evento por toque no CTA de uma recomendação de parceiro, para medir o
-- desempenho dos links. É a única coisa que o app registra sobre uso, e o
-- escopo é deliberadamente estreito: sem IP, sem aparelho, sem localização,
-- sem identificador de publicidade. O que não está aqui é porque não foi
-- coletado, não porque ficou para depois.
--
-- Não há `unique`: três toques em momentos diferentes são três eventos
-- legítimos. Rajada de toque acidental é problema de intenção, e intenção só
-- o cliente conhece — quem trata é a trava da tela, não uma constraint que
-- teria de adivinhar pelo relógio.
--
-- Sem `updated_at`: evento não é editado.
-- =============================================================================

create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid()
    references public.profiles (id) on delete set null,
  offer_id uuid references public.requirement_offers (id) on delete set null,
  partner_code text not null check (partner_code ~ '^[a-z0-9-]+$'),
  trip_id uuid references public.trips (id) on delete set null,
  clicked_at timestamptz not null default now()
);

comment on table public.affiliate_clicks is
  'Toques em recomendações de parceiro. Log de eventos: linha nasce e não '
  'muda mais.';

comment on column public.affiliate_clicks.user_id is
  'Preenchido pelo default a partir de `auth.uid()`, então o app não envia o '
  'campo e não tem como errá-lo. Nulo cobre o clique não autenticado, que '
  'ainda não existe no produto.';

comment on column public.affiliate_clicks.partner_code is
  'Cópia do `partner_code` da oferta no momento do clique. Repetição '
  'deliberada: o evento guarda o estado daquele instante, então trocar a '
  'campanha ou remover a oferta não reescreve a atribuição já registrada.';

comment on column public.affiliate_clicks.clicked_at is
  'Relógio do banco. O horário do aparelho não é confiável e nada no produto '
  'depende dele.';

-- As três FKs anonimizam em vez de apagar. Excluir conta ou viagem tira o
-- vínculo com a pessoa; o que resta é uma contagem sem dono, que o relatório
-- continua somando e que deixa de ser dado pessoal.

create index affiliate_clicks_partner_idx
  on public.affiliate_clicks (partner_code, clicked_at desc);

create index affiliate_clicks_offer_idx
  on public.affiliate_clicks (offer_id, clicked_at desc);

create index affiliate_clicks_clicked_at_idx
  on public.affiliate_clicks (clicked_at desc);

-- Serve ao `count(distinct user_id)` e à manutenção da FK: sem ele, cada
-- exclusão de conta varre a tabela inteira para anular as linhas.
create index affiliate_clicks_user_idx
  on public.affiliate_clicks (user_id)
  where user_id is not null;

-- `trip_id` não tem índice de propósito: nenhuma métrica consulta por viagem,
-- e a varredura na exclusão é irrelevante no volume atual.

-- -----------------------------------------------------------------------------
-- RLS
--
-- O app só escreve, e só sobre si mesmo. Não existe policy de SELECT: nem os
-- próprios cliques são legíveis pelo cliente, porque nenhuma tela precisa
-- deles e dado de métrica exposto vira dado de métrica adulterável. A leitura
-- agregada acontece fora do app, por quem tem acesso ao banco.
--
-- Consequência no código: o insert não pode encadear `.select()`. Sem ele o
-- supabase-js manda `Prefer: return=minimal` e dispensa privilégio de leitura;
-- com ele, o PostgREST responde 403.
-- -----------------------------------------------------------------------------

alter table public.affiliate_clicks enable row level security;

create policy "affiliate_clicks_insert_own"
  on public.affiliate_clicks for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (trip_id is null or public.is_trip_owner(trip_id))
  );

revoke select, update, delete on public.affiliate_clicks from authenticated;

grant insert on public.affiliate_clicks to authenticated;

-- Nada para `anon`: o app não tem tela pública.
