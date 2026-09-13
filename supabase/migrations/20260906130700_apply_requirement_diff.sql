-- =============================================================================
-- TripReady — aplicação atômica da diferença da checklist
--
-- Recalcular uma checklist é sempre um par: apagar os itens que deixaram de
-- valer e inserir os que passaram a valer. Feitas em chamadas separadas, existe
-- uma janela entre as duas em que a viagem fica sem os itens antigos e sem os
-- novos — e se a segunda chamada falhar, a pessoa perde itens da checklist sem
-- ganhar os substitutos.
--
-- Pelo PostgREST não há como evitar isso do lado do app: cada `insert`,
-- `update` ou `delete` é a sua própria transação. Daí esta função — o corpo
-- inteiro roda em uma transação só, então ou as duas escritas valem, ou
-- nenhuma.
--
-- A regra de negócio não desce para o banco. Quem decide o que entra e o que
-- sai continua sendo `resolveTripRequirements` e `diffTripRequirements`, em
-- TypeScript, onde é testável sem Supabase; esta função apenas aplica uma
-- decisão já tomada.
--
-- `security invoker` é essencial: assim o DELETE e o INSERT passam pelas
-- policies de `trip_requirements`, e um payload forjado não alcança a viagem de
-- outra pessoa. Com `security definer` a função contornaria o RLS.
-- =============================================================================

create or replace function public.apply_requirement_diff(
  p_remove_ids uuid[],
  p_inserts jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Remover antes de inserir preserva o índice único parcial que impede a mesma
  -- regra entrar duas vezes na mesma viagem: um item que sai e volta no mesmo
  -- recálculo não colide consigo mesmo.
  delete from public.trip_requirements
  where id = any(coalesce(p_remove_ids, array[]::uuid[]));

  insert into public.trip_requirements (
    trip_id, template_id, group_id, country_code, title, description,
    priority, category, source_name, source_url
  )
  select
    (item->>'trip_id')::uuid,
    (item->>'template_id')::uuid,
    (item->>'group_id')::uuid,
    item->>'country_code',
    item->>'title',
    item->>'description',
    (item->>'priority')::public.requirement_priority,
    (item->>'category')::public.requirement_category,
    item->>'source_name',
    item->>'source_url'
  from jsonb_array_elements(coalesce(p_inserts, '[]'::jsonb)) as item;
end;
$$;

comment on function public.apply_requirement_diff(uuid[], jsonb) is
  'Aplica remoções e inserções da checklist em uma única transação. As linhas '
  'passam pelas policies de `trip_requirements`, como qualquer escrita do app.';

revoke execute on function public.apply_requirement_diff(uuid[], jsonb) from public, anon;
grant execute on function public.apply_requirement_diff(uuid[], jsonb) to authenticated;
