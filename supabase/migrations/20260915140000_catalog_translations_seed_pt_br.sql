-- =============================================================================
-- TripReady — carga da linha pt-BR nas tabelas de tradução
--
-- As colunas originais continuam sendo a fonte canônica pt-BR (§8.2 do plano de
-- i18n): esta migration só copia o que já existe para a tabela de tradução, sem
-- inventar texto novo. `en`/`es` entram em migrations próprias, na Fase 4.
--
-- `on conflict do nothing` torna a carga idempotente: reexecutar não duplica, e
-- uma linha nova em `requirement_templates`/`destination_groups`/`visa_rules`/
-- `requirement_offers` cadastrada depois desta migration ainda não tem tradução
-- pt-BR até rodar de novo — o fallback para a coluna original cobre esse vão.
-- =============================================================================

insert into public.requirement_template_translations
  (requirement_template_id, locale, title, description)
select id, 'pt-BR', title, description
from public.requirement_templates
on conflict do nothing;

insert into public.destination_group_translations
  (destination_group_id, locale, name, description)
select id, 'pt-BR', name, description
from public.destination_groups
on conflict do nothing;

-- `source_name` fica de fora aqui de propósito: a linha pt-BR já tem o nome
-- canônico na própria coluna de `visa_rules`, e só ganha entrada na tabela de
-- tradução quando existir de fato um descritivo a traduzir (§8.4 — Fase 5).
insert into public.visa_rule_translations (visa_rule_id, locale, notes)
select id, 'pt-BR', notes
from public.visa_rules
on conflict do nothing;

insert into public.requirement_offer_translations
  (requirement_offer_id, locale, name, description)
select id, 'pt-BR', name, description
from public.requirement_offers
on conflict do nothing;
