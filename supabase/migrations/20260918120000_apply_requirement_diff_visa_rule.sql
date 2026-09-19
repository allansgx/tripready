-- =============================================================================
-- TripReady — a diferença da checklist volta a gravar a regra de visto
--
-- `20260906130700_apply_requirement_diff.sql` foi escrita antes de
-- `trip_requirements.visa_rule_id` existir (`20260915120000`), e a coluna nunca
-- entrou na lista do insert. O payload chega completo do app — quem o monta é
-- `resolveTripRequirements`, que já resolve a regra de cada destino — e a
-- função simplesmente descarta o campo.
--
-- O item de visto criado pela **edição** de uma viagem nasce, então, sem a regra
-- que o originou. Duas consequências, as duas visíveis para quem usa:
--
--   1. `destinationsWithoutVerifiedRule` reconhece a cobertura de um destino
--      justamente por `visa_rule_id`. Sem ele, a viagem passa a avisar que falta
--      regra conferida onde a regra existe e foi aplicada.
--   2. A leitura traduzida não encontra `visa_rule_translations.notes` e cai no
--      texto gravado em `trip_requirements`, que é sempre pt-BR.
--
-- Os itens criados na preparação da viagem não passam por aqui — vão por insert
-- direto — e sempre tiveram a coluna preenchida. Por isso o sintoma é
-- intermitente e depende do histórico de edições de cada viagem.
--
-- Só a lista de colunas muda. Assinatura, transação única, `security invoker` e
-- a divisão de responsabilidade com o TypeScript continuam exatamente como
-- estavam.
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
    trip_id, template_id, group_id, visa_rule_id, country_code, title,
    description, priority, category, source_name, source_url
  )
  select
    (item->>'trip_id')::uuid,
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
  from jsonb_array_elements(coalesce(p_inserts, '[]'::jsonb)) as item;
end;
$$;

comment on function public.apply_requirement_diff(uuid[], jsonb) is
  'Aplica remoções e inserções da checklist em uma única transação. As linhas '
  'passam pelas policies de `trip_requirements`, como qualquer escrita do app.';

-- `create or replace` preserva os privilégios existentes, então as duas linhas
-- abaixo não mudam nada hoje. Ficam para o arquivo responder sozinho quem pode
-- executar a função.
revoke execute on function public.apply_requirement_diff(uuid[], jsonb) from public, anon;
grant execute on function public.apply_requirement_diff(uuid[], jsonb) to authenticated;
