-- =============================================================================
-- TripReady — o item que deixou de valer
--
-- Trocar o passaporte de uma viagem muda quais exigências se aplicam. Até aqui
-- havia só duas saídas para o item que deixava de valer, e as duas mentem: se
-- não estivesse verificado, era apagado e sumia sem explicação; se estivesse,
-- ficava na checklist indistinguível de um item vigente — um "solicitar o
-- visto" que a pessoa já resolveu com o passaporte antigo continuava ali,
-- parecendo exigência de hoje.
--
-- `superseded_at` é o terceiro caminho: o item sai do progresso e do próximo
-- passo, mas continua visível, agrupado e explicado. É um eixo independente de
-- `completed` — as quatro combinações têm sentido, e a marcação anterior fica
-- guardada para o caso de a pessoa voltar ao passaporte de antes.
--
-- O índice único precisa mudar junto. Ele existe para uma regra do catálogo não
-- entrar duas vezes na mesma viagem; sem o recorte por `superseded_at`, o item
-- superado ocuparia a vaga do substituto e a troca de passaporte falharia por
-- duplicata. Com o recorte, superado e vigente convivem, e dois superados da
-- mesma origem também — são história, e quem escolhe qual restaurar é
-- `diffForPassportChange`, pelo mais recente.
--
-- Rollback: recriar o índice antigo falha enquanto existirem linhas superadas
-- convivendo com as vigentes. Apagar as linhas com `superseded_at not null`
-- antes de voltar o predicado.
-- =============================================================================

alter table public.trip_requirements
  add column superseded_at timestamptz;

comment on column public.trip_requirements.superseded_at is
  'Quando o item deixou de se aplicar, por troca do passaporte-base da viagem. '
  'Nulo enquanto vale. Item superado não entra em progresso, próximo passo nem '
  'lembrete, e nunca é apagado: a pessoa precisa conseguir ver o que mudou.';

drop index public.trip_requirements_template_unique;

create unique index trip_requirements_template_unique
  on public.trip_requirements (
    trip_id,
    template_id,
    coalesce(country_code, ''),
    coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where template_id is not null and superseded_at is null;

comment on index public.trip_requirements_template_unique is
  'Uma regra do catálogo entra uma única vez por viagem, país e grupo — entre '
  'os itens vigentes. Superados ficam de fora do índice para não disputarem a '
  'vaga com o substituto.';
