-- =============================================================================
-- TripReady — regras de visto por passaporte
--
-- A pergunta que esta tabela responde é sempre sobre um par: não "a China exige
-- visto?", mas "a China exige visto de quem viaja com passaporte brasileiro?".
-- Uma tabela indexada só pelo destino não teria como crescer para outros
-- passaportes sem virar outra coisa.
--
-- A separação central da feature é entre o **fato** e a **apresentação**:
--
--   visa_rules             — o que o órgão oficial determina, com fonte e data
--   requirement_templates  — como isso vira um item de checklist (texto,
--                            prioridade, categoria)
--
-- As duas se encontram por `requirement_type`, sem chave estrangeira entre
-- elas. É intencional: a regra descreve o mundo e a apresentação descreve o
-- app. Mudar a prioridade de um tipo de visto passa a ser editar uma linha de
-- template, sem tocar em nenhuma regra.
--
-- Consequência prática: acrescentar Portugal é inserir linhas com
-- `passport_country_code = 'PT'`. Nenhum template novo, nenhuma lógica nova.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos
--
-- Os seis valores entram agora, mesmo que nem todos gerem item de checklist no
-- primeiro momento. Ter o vocabulário fechado antes da coleta evita que a
-- pesquisa de fontes invente categorias intermediárias — quem preencher os
-- dados classifica no que existe ou marca `conditional` e escreve a condição.
-- -----------------------------------------------------------------------------
create type public.visa_requirement_type as enum (
  'visa_free',
  'visa_required',
  'evisa',
  'eta',
  'visa_on_arrival',
  'conditional'
);

comment on type public.visa_requirement_type is
  'Resultado da consulta de visto para um par (passaporte, destino).';

-- -----------------------------------------------------------------------------
-- visa_rules
-- -----------------------------------------------------------------------------
create table public.visa_rules (
  id uuid primary key default gen_random_uuid(),
  passport_country_code text not null check (passport_country_code ~ '^[A-Z]{2}$'),
  destination_country_code text not null check (destination_country_code ~ '^[A-Z]{2}$'),
  requirement_type public.visa_requirement_type not null,
  source_name text not null check (length(btrim(source_name)) > 0),
  source_url text not null check (source_url ~ '^https://'),
  verified_at date not null,
  notes text,
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visa_rules_pair_unique
    unique (passport_country_code, destination_country_code),
  constraint visa_rules_period_check check (
    valid_from is null or valid_until is null or valid_until >= valid_from
  ),
  constraint visa_rules_not_self check (
    passport_country_code <> destination_country_code
  ),
  constraint visa_rules_conditional_needs_notes check (
    requirement_type <> 'conditional' or length(btrim(coalesce(notes, ''))) > 0
  )
);

comment on table public.visa_rules is
  'Exigência de visto por par (passaporte, destino). Dado de referência: toda '
  'linha nasce de fonte oficial conferida por uma pessoa, nunca de estimativa.';

comment on column public.visa_rules.passport_country_code is
  'ISO 3166-1 alpha-2 do passaporte do viajante, em maiúsculas. Casado com o '
  'passaporte principal em `passports`.';

comment on column public.visa_rules.destination_country_code is
  'ISO 3166-1 alpha-2 do destino, em maiúsculas. Casado com '
  '`trip_countries.country_code`.';

-- `source_name`, `source_url` e `verified_at` são obrigatórios: é a regra "não
-- inventar dados" escrita no schema. As tabelas do catálogo aceitam fonte nula
-- porque itens como "montar a lista de bagagem" não têm órgão a citar; uma
-- exigência de visto sempre tem, e sem ela a linha não deve existir.
comment on column public.visa_rules.source_name is
  'Órgão oficial que determina a regra — imigração ou chancelaria do destino.';

comment on column public.visa_rules.source_url is
  'URL da página oficial de requisitos de entrada. Nunca a home do órgão, '
  'nunca blog ou agência de viagem.';

comment on column public.visa_rules.verified_at is
  'Data em que uma pessoa conferiu a fonte. Diferente de `updated_at`, que só '
  'registra alteração da linha: é esta coluna que diz o quanto o dado é '
  'recente.';

comment on column public.visa_rules.notes is
  'Condição ou observação oficial, em uma frase. Pode chegar ao usuário como '
  'descrição do item da checklist. Obrigatório quando o tipo é `conditional`, '
  'que sem a condição escrita não informa nada.';

comment on column public.visa_rules.valid_from is
  'Entrada em vigor, quando a fonte declara a data. Nulo quando não consta — '
  'nunca preenchido por estimativa, como em `destination_group_members`.';

comment on column public.visa_rules.valid_until is
  'Fim da vigência, quando aplicável. Nulo enquanto a regra valer.';

-- Uma regra vigente por par. Guardar histórico exigiria versionamento, que a
-- feature não precisa: a checklist é um retrato do momento em que foi gerada, e
-- `verified_at` já responde há quanto tempo o dado foi conferido.
comment on constraint visa_rules_pair_unique on public.visa_rules is
  'Uma única regra vigente por par (passaporte, destino).';

-- Não há índice adicional aqui de propósito. A consulta da checklist é sempre
-- "dado o passaporte principal, as regras dos países desta viagem" — ou seja,
-- igualdade no passaporte e `in` no destino —, e o índice que a constraint
-- única acima já cria cobre exatamente esse acesso, nessa ordem de colunas. Um
-- `create index` sobre o mesmo par seria um segundo índice idêntico, pago em
-- toda escrita e nunca escolhido pelo planejador.

create trigger visa_rules_set_updated_at
before update on public.visa_rules
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- trip_requirements — fonte oficial do item
--
-- A checklist já é um snapshot: o título de um item de país nasce com o nome do
-- país resolvido, e não com o marcador. A fonte segue a mesma ideia e é copiada
-- na geração, em vez de consultada a cada abertura da tela — o que também evita
-- que a viagem já concluída mude de fonte quando a regra for atualizada.
--
-- Nulas na esmagadora maioria dos itens: só as regras de visto têm órgão a
-- citar. A tela mostra o link apenas quando a coluna está preenchida.
-- -----------------------------------------------------------------------------
alter table public.trip_requirements
  add column source_name text,
  add column source_url text;

comment on column public.trip_requirements.source_name is
  'Órgão oficial que embasa o item, copiado da regra de visto que o gerou. '
  'Nulo nos demais itens.';

comment on column public.trip_requirements.source_url is
  'URL oficial correspondente, exibida como link na checklist. Nulo nos demais '
  'itens.';
