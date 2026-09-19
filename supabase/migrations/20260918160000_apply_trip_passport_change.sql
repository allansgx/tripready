-- =============================================================================
-- TripReady — troca do passaporte-base da viagem, em uma transação
--
-- Trocar o passaporte é sempre um conjunto de escritas que só faz sentido
-- junto: gravar o passaporte novo, superar o que deixou de valer, restaurar o
-- que voltou, refrescar a regra de visto dos que ficam e inserir os que
-- entraram. Pelo PostgREST cada chamada é a sua própria transação, então
-- separadas elas deixariam a viagem com o passaporte novo e a checklist do
-- antigo se qualquer uma falhasse no meio.
--
-- A regra de negócio continua fora do banco. Quem decide o que entra em cada
-- balde é `diffForPassportChange`, em TypeScript, onde é testável sem Supabase;
-- esta função só aplica uma decisão já tomada.
--
-- `security invoker` é essencial: as escritas passam pelas policies de `trips` e
-- de `trip_requirements`, e o `where trip_id = p_trip_id` repetido em cada uma
-- é a segunda camada — um payload forjado não alcança a viagem de outra pessoa
-- nem outra viagem da mesma pessoa.
--
-- `p_today` vem do cliente de propósito. `current_date` é UTC, e o app trabalha
-- com a data local do aparelho (`todayISO`): uma viagem terminando hoje seria
-- concluída para o banco e em andamento para quem está viajando. O cliente pode
-- forjar essa data, e o pior que consegue é reescrever a checklist da própria
-- viagem concluída — integridade do próprio histórico, não escalada.
--
-- Os códigos de erro são para o cliente traduzir, nunca frases prontas:
--   TR404  viagem não encontrada (ou de outra pessoa — o RLS não distingue)
--   TR403  viagem concluída, que não muda de passaporte
--   TR409  o passaporte mudou em outro lugar desde a leitura
-- =============================================================================

create or replace function public.apply_trip_passport_change(
  p_trip_id uuid,
  p_expected_country_code text,
  p_passport_country_code text,
  p_today date,
  p_supersede_ids uuid[],
  p_restore_ids uuid[],
  p_updates jsonb,
  p_inserts jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_current text;
  v_end_date date;
begin
  -- Trava a viagem: duas trocas simultâneas viram uma fila, e a segunda vai
  -- encontrar o passaporte já mudado na conferência abaixo.
  select t.passport_country_code, t.end_date
    into v_current, v_end_date
  from public.trips t
  where t.id = p_trip_id
  for update;

  if not found then
    raise exception 'viagem inacessível' using errcode = 'TR404';
  end if;

  if v_end_date is not null and v_end_date < p_today then
    raise exception 'viagem concluída' using errcode = 'TR403';
  end if;

  if v_current is distinct from p_expected_country_code then
    raise exception 'passaporte alterado em outro lugar' using errcode = 'TR409';
  end if;

  update public.trips
  set passport_country_code = p_passport_country_code,
      passport_selected_at = now()
  where id = p_trip_id;

  -- `superseded_at is null` deixa a chamada idempotente: repetir depois de um
  -- timeout de rede não reescreve a data de quem já saiu.
  update public.trip_requirements
  set superseded_at = now()
  where trip_id = p_trip_id
    and id = any(coalesce(p_supersede_ids, array[]::uuid[]))
    and superseded_at is null;

  -- Restaurar antes de inserir mantém o índice único coerente: o item que volta
  -- reocupa a vaga da sua origem, e nenhum insert disputa com ele.
  update public.trip_requirements
  set superseded_at = null
  where trip_id = p_trip_id
    and id = any(coalesce(p_restore_ids, array[]::uuid[]))
    and superseded_at is not null;

  -- Sem `title`: ele vem do mesmo template e só mudaria pelo idioma em que o
  -- nome do país foi resolvido. O que muda com o passaporte é a regra.
  update public.trip_requirements r
  set visa_rule_id = (item->>'visa_rule_id')::uuid,
      description = item->>'description',
      source_name = item->>'source_name',
      source_url = item->>'source_url'
  from jsonb_array_elements(coalesce(p_updates, '[]'::jsonb)) as item
  where r.id = (item->>'id')::uuid
    and r.trip_id = p_trip_id;

  -- `trip_id` sai do parâmetro, nunca do payload: o que vier escrito no JSON
  -- não tem como apontar para outra viagem.
  insert into public.trip_requirements (
    trip_id, template_id, group_id, visa_rule_id, country_code, title,
    description, priority, category, source_name, source_url
  )
  select
    p_trip_id,
    (item->>'template_id')::uuid,
    (item->>'group_id')::uuid,
    (item->>'visa_rule_id')::uuid,
    item->>'country_code',
    item->>'title',
    item->>'description',
    (item->>'priority')::public.requirement_priority,
    (item->>'category')::public.requirement_category,
    item->>'source_name',
    item->>'source_url'
  from jsonb_array_elements(coalesce(p_inserts, '[]'::jsonb)) as item
  on conflict do nothing;
end;
$$;

comment on function public.apply_trip_passport_change(
  uuid, text, text, date, uuid[], uuid[], jsonb, jsonb
) is
  'Troca o passaporte-base da viagem e aplica a diferença da checklist em uma '
  'única transação. Recusa viagem concluída e troca concorrente. As linhas '
  'passam pelas policies, como qualquer escrita do app.';

revoke execute on function public.apply_trip_passport_change(
  uuid, text, text, date, uuid[], uuid[], jsonb, jsonb
) from public, anon;

grant execute on function public.apply_trip_passport_change(
  uuid, text, text, date, uuid[], uuid[], jsonb, jsonb
) to authenticated;
