-- =============================================================================
-- TripReady — identidade do parceiro na oferta
--
-- `requirement_offers` identifica o parceiro pelo `name`, que é texto de
-- exibição: muda com a campanha, varia entre linhas ("Seguradora X" e
-- "Seguradora X — anual") e é o que menos serve para agrupar. A mesma empresa
-- pode aparecer em mais de um requisito, cada vez como uma linha própria, então
-- contar cliques por `name` contaria uma coisa diferente a cada reescrita de
-- copy.
--
-- `partner_code` é o identificador estável: um slug por parceiro comercial,
-- repetido em todas as ofertas dele. É o que responde "qual parceiro recebeu
-- mais cliques" sem depender de como a linha está escrita.
--
-- Não é uma tabela `partners` porque não há metadado de parceiro que o app
-- precise hoje — contrato e portal do programa vivem fora do produto. Se um dia
-- precisarem entrar, esta coluna vira a chave estrangeira e nenhuma métrica já
-- coletada precisa ser reescrita.
--
-- A coluna nasce nulável porque a tabela já tinha linhas. O `check` inline
-- convive com isso: restrição sobre valor nulo devolve nulo, que o Postgres
-- aceita. O `set not null` vem depois do backfill, quando não há mais nulo.
-- =============================================================================

alter table public.requirement_offers
  add column partner_code text check (partner_code ~ '^[a-z0-9-]+$');

comment on column public.requirement_offers.partner_code is
  'Identificador estável do parceiro comercial, repetido em todas as ofertas '
  'dele. É por ele que os cliques são agrupados, e não pelo nome exibido.';

-- Backfill por id, e não por `name`: derivar o slug do texto exibido daria dois
-- códigos para uma empresa que aparecesse com dois nomes, que é exatamente o
-- que esta coluna existe para evitar.
--
-- As duas ofertas são do mesmo requisito (`travel-insurance`) e de empresas
-- diferentes — uma vende apólice própria, a outra compara preços —, então cada
-- uma tem o seu código.

update public.requirement_offers
set partner_code = 'safetywing'
where id = '547d4490-8a65-499e-a1c0-e9c7a15850ca';

update public.requirement_offers
set partner_code = 'seguros-promo'
where id = 'b2f3af12-b60e-4127-b325-c8b996b80166';

alter table public.requirement_offers
  alter column partner_code set not null;

-- O app nunca filtra oferta por parceiro — quem consulta por `partner_code` é
-- o relatório, e do lado de `affiliate_clicks`. Índice aqui seria peso sem uso.
