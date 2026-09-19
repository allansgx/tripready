-- =============================================================================
-- TripReady — o passaporte-base da viagem
--
-- Até aqui a viagem não sabia com que passaporte a checklist dela foi montada:
-- o motor recebia o passaporte principal do perfil no instante em que a tela
-- rodava. A mesma viagem podia ser lida com um passaporte hoje e outro amanhã,
-- e promover outro principal reescrevia a checklist de todas elas.
--
-- Não há chave estrangeira aqui, e isso é a decisão central desta migration.
--
-- A regra do produto é que excluir um passaporte do perfil **não pode alterar
-- viagem concluída**. Com chave estrangeira não existe como cumprir isso:
-- apagar a linha referenciada obriga o Postgres a escrever em todas as linhas
-- que a referenciam, e nenhum `on delete` sabe poupar parte delas.
--
-- Guardando o país em vez do id, a exclusão de um passaporte passa a fazer zero
-- escritas em `trips`. Funciona porque `passports` tem `unique (user_id,
-- country_code)`: para um usuário, o país **é** a chave natural do passaporte,
-- sem ambiguidade a resolver. A mesma coluna é, ao mesmo tempo, o vínculo vivo
-- e o registro histórico — a viagem concluída continua sabendo dizer com que
-- passaporte foi preparada, mesmo depois de o cadastro sumir.
--
-- Em troca, o banco não recusa um código que o usuário não possui. A validação
-- mora nos caminhos de escrita, que só oferecem passaportes reais, e a leitura
-- se corrige sozinha: um código sem passaporte correspondente aparece como
-- viagem a revisar, que é o que a interface já sabe pedir. Uma policy não
-- serviria — um `with check` desses impediria renomear justamente a viagem que
-- o app está pedindo para a pessoa corrigir.
--
-- Anulável de propósito: hoje o produto exige a escolha, mas o dia em que ele
-- deixar de exigir é mudança de validação de tela, não de schema.
-- =============================================================================

alter table public.trips
  add column passport_country_code text check (passport_country_code ~ '^[A-Z]{2}$'),
  add column passport_selected_at timestamptz;

comment on column public.trips.passport_country_code is
  'ISO 3166-1 alpha-2 do passaporte-base desta viagem, em maiúsculas. Casa com '
  '`passports.country_code` do mesmo usuário, sem chave estrangeira: é o que '
  'permite excluir um passaporte sem escrever em `trips`. Nulo apenas em dado '
  'anterior a esta migration.';

comment on column public.trips.passport_selected_at is
  'Quando esta viagem passou a usar este passaporte. Diferente de '
  '`updated_at`, que não distingue a escolha de qualquer outra edição. Nulo '
  'no dado preenchido por backfill: não se inventa data.';

-- Serve à contagem de viagens por passaporte, que a confirmação de exclusão
-- mostra antes de perguntar. Parcial porque toda viagem anterior ao backfill
-- entra com nulo.
create index trips_user_passport_idx
  on public.trips (user_id, passport_country_code)
  where passport_country_code is not null;
