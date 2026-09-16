-- =============================================================================
-- TripReady — tradução do descritivo de fonte (item 22, §8.4 do plano de i18n)
--
-- Só o Espaço Schengen entra aqui: é o único source_name do catálogo com um
-- descritivo em pt-BR a traduzir ("Política de vistos") em cima de um nome
-- próprio que a própria Comissão Europeia já publica em inglês e espanhol —
-- "European Commission" e "Comisión Europea" não são invenção, são o nome
-- oficial que o órgão usa nesses idiomas. A citação do regulamento
-- ("(EU) 2018/1806") é a mesma numeração nas três línguas, só "Regulamento"
-- muda.
--
-- Os demais `source_name` do catálogo já são o nome em inglês do órgão (ex.:
-- "GOV.UK — Electronic travel authorisation", "U.S. Department of State —
-- Visitor Visa") ou misturam sigla com um pedaço de português que eu não
-- tenho como verificar contra o nome oficial em outro idioma sem inventar
-- ("MOFA Japão", "UAE MOFA — Embaixada em Brasília, vistos") — ficam de fora
-- por ora, e podem entrar depois, um a um, quando o nome oficial for
-- confirmado na fonte.
--
-- `update`, não `insert`: as linhas de `visa_rule_translations` já existem
-- desde as migrations de conteúdo da Fase 4, com `notes` preenchido e
-- `source_name` nulo.
-- =============================================================================

update public.visa_rule_translations t
set source_name = v.source_name
from (
  values
    ('AT', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('BE', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('CH', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('CZ', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('DE', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('DK', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('ES', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('FI', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('FR', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('GR', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('HR', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('HU', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('IS', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('IT', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('NL', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('NO', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('PL', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('PT', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('RO', 'European Commission — Visa policy (Regulation (EU) 2018/1806)'),
    ('SE', 'European Commission — Visa policy (Regulation (EU) 2018/1806)')
) as v(destination_country_code, source_name)
join public.visa_rules r
  on r.passport_country_code = 'BR' and r.destination_country_code = v.destination_country_code
where t.visa_rule_id = r.id and t.locale = 'en';

update public.visa_rule_translations t
set source_name = v.source_name
from (
  values
    ('AT', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('BE', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('CH', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('CZ', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('DE', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('DK', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('ES', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('FI', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('FR', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('GR', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('HR', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('HU', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('IS', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('IT', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('NL', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('NO', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('PL', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('PT', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('RO', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)'),
    ('SE', 'Comisión Europea — Política de visados (Reglamento (UE) 2018/1806)')
) as v(destination_country_code, source_name)
join public.visa_rules r
  on r.passport_country_code = 'BR' and r.destination_country_code = v.destination_country_code
where t.visa_rule_id = r.id and t.locale = 'es';
