-- =============================================================================
-- TripReady — ampliação das regras de visto do passaporte brasileiro
--
-- O primeiro seed cobriu 45 destinos, escritos quando o app sugeria cidades para
-- 46 países. Hoje são 81, e a cobertura tinha caído para 56%. Estas 24 linhas
-- levam o passaporte brasileiro a 60 dos 80 destinos que contam — os 75% que o
-- critério de cobertura mínima exige — e fecham os três grupos de destino:
-- Espaço Schengen com 29 de 29, MERCOSUL com todos os membros vigentes e
-- Comunidade Andina com os quatro.
--
-- Cada linha nasce de fonte oficial aberta e lida por uma pessoa. A coleta, com
-- o que foi confirmado e o que ficou de fora, está em `tasks/coleta-vistos-br.md`.
--
-- `verified_at` é a data da conferência, e não a data desta migration — aqui as
-- duas coincidem porque a última rodada terminou hoje.
--
-- Três decisões que a leitura do arquivo não revela sozinha:
--
--   Liechtenstein não é da União Europeia, então o Anexo II não o alcança. Quem
--   responde pelos vistos do principado é a Suíça, e é a lista da SEM que vale.
--
--   O Quênia confirma por contraste: a página lista o Brasil entre os isentos
--   apenas para passaporte diplomático, oficial ou de serviço. O passaporte
--   comum, que é o escopo desta coleta, segue a regra geral e precisa de eTA.
--
--   A Venezuela fica fora por falta de fonte oficial. Não afeta grupo nenhum: a
--   filiação dela ao MERCOSUL está encerrada desde 2016-12-01 em
--   `destination_group_members`.
--
-- O `on conflict` mantém a carga idempotente, como no primeiro seed.
-- =============================================================================

insert into public.visa_rules (
  passport_country_code, destination_country_code, requirement_type,
  source_name, source_url, verified_at, notes
)
values
  -- ---------------------------------------------------------------------------
  -- União Europeia — Anexo II do Regulamento (UE) 2018/1806
  --
  -- O Brasil consta do Anexo II, e o regulamento vincula todos os Estados-Membros
  -- exceto Irlanda e Reino Unido. Por isso a mesma fonte resolve os oito
  -- Estados-Membros que faltavam do Espaço Schengen e também o Chipre, que é da
  -- União sem estar no Schengen.
  --
  -- ⚠️ ETIAS: quando entrar em operação, estes destinos passam a `eta`, como as
  -- 20 linhas do primeiro seed. A virada é `valid_until` nestas linhas e novas
  -- linhas com `valid_from` — o motor avalia a vigência contra a data da viagem.
  -- ---------------------------------------------------------------------------
  ('BR', 'BG', 'visa_free', 'Regulamento (UE) 2018/1806 — Anexo II', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018R1806', date '2026-09-17', 'Entrada sem visto para estadas de até 90 dias a cada 180.'),
  ('BR', 'CY', 'visa_free', 'Regulamento (UE) 2018/1806 — Anexo II', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018R1806', date '2026-09-17', 'Entrada sem visto para estadas de até 90 dias a cada 180.'),
  ('BR', 'EE', 'visa_free', 'Regulamento (UE) 2018/1806 — Anexo II', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018R1806', date '2026-09-17', 'Entrada sem visto para estadas de até 90 dias a cada 180.'),
  ('BR', 'LT', 'visa_free', 'Regulamento (UE) 2018/1806 — Anexo II', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018R1806', date '2026-09-17', 'Entrada sem visto para estadas de até 90 dias a cada 180.'),
  ('BR', 'LU', 'visa_free', 'Regulamento (UE) 2018/1806 — Anexo II', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018R1806', date '2026-09-17', 'Entrada sem visto para estadas de até 90 dias a cada 180.'),
  ('BR', 'LV', 'visa_free', 'Regulamento (UE) 2018/1806 — Anexo II', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018R1806', date '2026-09-17', 'Entrada sem visto para estadas de até 90 dias a cada 180.'),
  ('BR', 'MT', 'visa_free', 'Regulamento (UE) 2018/1806 — Anexo II', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018R1806', date '2026-09-17', 'Entrada sem visto para estadas de até 90 dias a cada 180.'),
  ('BR', 'SI', 'visa_free', 'Regulamento (UE) 2018/1806 — Anexo II', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018R1806', date '2026-09-17', 'Entrada sem visto para estadas de até 90 dias a cada 180.'),
  ('BR', 'SK', 'visa_free', 'Regulamento (UE) 2018/1806 — Anexo II', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018R1806', date '2026-09-17', 'Entrada sem visto para estadas de até 90 dias a cada 180.'),

  ('BR', 'LI', 'visa_free', 'SEM (Suíça) — Documentos e vistos por nacionalidade', 'https://www.sem.admin.ch/sem/en/home/publiservice/weisungen-kreisschreiben/visa/liste1_staatsangehoerigkeit/b.html', date '2026-09-17', 'Entrada sem visto para estadas de até 90 dias a cada 180.'),

  -- ---------------------------------------------------------------------------
  -- América do Sul e Caribe
  --
  -- Cada linha vem da autoridade do próprio destino ou de representação
  -- consular, nunca da filiação a bloco: o Paraguai foi confirmado na Dirección
  -- General de Migraciones, e a Bolívia — que uma fonte chegou a colocar entre
  -- os países sujeitos a visto — no consulado brasileiro em Santa Cruz.
  -- ---------------------------------------------------------------------------
  ('BR', 'PY', 'visa_free', 'Dirección General de Migraciones — Requerimientos migratorios', 'https://migraciones.gov.py/entrada-y-salida-del-pais/requerimientos-migratorios-de-ingreso-y-salida-del-paraguay/', date '2026-09-17', 'Entrada sem visto para turismo por até 90 dias. A carteira de identidade é aceita no lugar do passaporte.'),
  ('BR', 'BO', 'visa_free', 'MRE — Consulado-Geral em Santa Cruz de la Sierra', 'https://www.gov.br/mre/pt-br/consulado-santa-cruz-de-la-sierra/conselho-aos-viajante/requisitos-para-entrada-na-bolivia', date '2026-09-17', 'Entrada sem visto para turismo.'),
  ('BR', 'EC', 'visa_free', 'Cancillería del Ecuador — Países que necesitan visa', 'https://www.cancilleria.gob.ec/2020/06/30/lista-de-paises-que-deben-presentar-visa-al-ingresar-al-ecuador/', date '2026-09-17', 'Entrada sem visto para turismo.'),
  ('BR', 'DO', 'visa_free', 'Consulado-Geral da República Dominicana no Rio de Janeiro', 'https://bra.mirex.gob.do/consular/rio-de-janeiro/no-necesitas-visa-para-visitar-republica-dominicana/', date '2026-09-17', 'Entrada sem visto para turismo por até 60 dias.'),

  -- Cuba é `evisa` e não `visa_required`: a Tarjeta de Turista é solicitada
  -- online antes da viagem. A venda no balcão da companhia aérea é canal
  -- alternativo, e não emissão na fronteira, que seria `visa_on_arrival`.
  ('BR', 'CU', 'evisa', 'MRE — Embaixada em Havana', 'https://www.gov.br/mre/pt-br/embaixada-havana/consular-1/recomendacoes-a-turistas-e-visitantes-brasileiros', date '2026-09-17', 'Tarjeta de Turista solicitada online antes da viagem ou comprada no balcão da companhia aérea. Permite até 90 dias.'),

  -- ---------------------------------------------------------------------------
  -- Europa não comunitária, Cáucaso e Oriente Médio
  -- ---------------------------------------------------------------------------
  ('BR', 'RS', 'visa_free', 'Ministério das Relações Exteriores da Sérvia — Regime de vistos', 'https://www.mfa.gov.rs/en/citizens/travel-serbia/visa-regime/brazil', date '2026-09-17', 'Entrada sem visto para estadas de até 90 dias a cada 6 meses.'),
  ('BR', 'GE', 'visa_free', 'Legislative Herald of Georgia — Países isentos de visto', 'https://matsne.gov.ge/en/document/view/2867361', date '2026-09-17', 'Entrada sem visto por até um ano.'),
  ('BR', 'RU', 'visa_free', 'Ministério das Relações Exteriores da Rússia — Relações consulares com o Brasil', 'https://www.kdmid.ru/docs/brazil/regulatory-framework-for-bilateral-consular-relations/', date '2026-09-17', 'Entrada sem visto para estadas de até 90 dias a cada 180, em viagem de turismo ou de negócios.'),

  -- O Catar é a linha mais frágil desta leva: a fonte oficial confirma a
  -- isenção para brasileiros, mas não exibiu o prazo. Por isso o texto não
  -- promete número de dias.
  ('BR', 'QA', 'visa_free', 'Visit Qatar — Informações de visto', 'https://visitqatar.com/intl-en/plan-your-trip/visas/visa-details', date '2026-09-17', 'Entrada sem visto; o carimbo é dado na chegada.'),

  -- ---------------------------------------------------------------------------
  -- Ásia e África
  --
  -- O MDAC da Malásia e o seguro obrigatório de Cuba não entram aqui: valem
  -- independentemente de visto, então são requisito de destino e não regra de
  -- visto. Entram como `requirement_templates`, com fonte própria.
  -- ---------------------------------------------------------------------------
  ('BR', 'MY', 'visa_free', 'Embaixada da Malásia em Brasília — Informações consulares', 'https://www.kln.gov.my/web/bra_brasilia/post/other-consular-information-3-1', date '2026-09-17', 'Entrada sem visto para visita social ou de negócios, por até 90 dias.'),
  ('BR', 'PH', 'visa_free', 'MRE — Embaixada em Manila', 'https://www.gov.br/mre/pt-br/embaixada-manila/setor-consular/informacoes-a-viajantes-e-residentes-brasileiros/entrada-e-permanencia-nas-filipinas', date '2026-09-17', 'Entrada sem visto para turismo ou negócios por até 59 dias.'),
  ('BR', 'LK', 'eta', 'Sistema de Autorização Eletrônica de Viagem do Sri Lanka', 'https://www.eta.gov.lk/slvisa/', date '2026-09-17', 'Autorização eletrônica (ETA) aprovada antes do embarque.'),
  ('BR', 'MA', 'visa_free', 'MRE — Embaixada em Rabat', 'https://www.gov.br/mre/pt-br/embaixada-rabat/rabat-arquivos/informacoes-uteis', date '2026-09-17', 'Entrada sem visto para turismo por até 90 dias.'),
  ('BR', 'KE', 'eta', 'Kenya eTA — Citizenship and Immigration (Amendment) Rules, 2025', 'https://etakenya.go.ke/how-to-apply', date '2026-09-17', 'Autorização eletrônica (eTA) aprovada antes do embarque. O processamento leva cerca de três dias úteis.')
on conflict (passport_country_code, destination_country_code) do update
set requirement_type = excluded.requirement_type,
    source_name      = excluded.source_name,
    source_url       = excluded.source_url,
    verified_at      = excluded.verified_at,
    notes            = excluded.notes;

-- -----------------------------------------------------------------------------
-- Traduções
--
-- pt-BR é cópia do canônico, como nas demais tabelas de catálogo: a linha existe
-- para que a leitura encontre sempre um registro, mesmo no idioma de origem.
--
-- `source_name` só ganha tradução quando tem descritivo a traduzir. Nome próprio
-- de órgão fica nulo e cai no valor canônico de `visa_rules`.
-- -----------------------------------------------------------------------------

insert into public.visa_rule_translations (visa_rule_id, locale, notes)
select id, 'pt-BR', notes
from public.visa_rules
where passport_country_code = 'BR'
  and destination_country_code in (
    'BG', 'CY', 'EE', 'LT', 'LU', 'LV', 'MT', 'SI', 'SK', 'LI',
    'PY', 'BO', 'EC', 'DO', 'CU', 'RS', 'GE', 'RU', 'QA',
    'MY', 'PH', 'LK', 'MA', 'KE'
  )
on conflict do nothing;

insert into public.visa_rule_translations (visa_rule_id, locale, notes, source_name)
select r.id, 'en', v.notes, v.source_name
from (
  values
    ('BG', 'Visa-free entry for stays of up to 90 days in any 180-day period.', 'Regulation (EU) 2018/1806 — Annex II'),
    ('CY', 'Visa-free entry for stays of up to 90 days in any 180-day period.', 'Regulation (EU) 2018/1806 — Annex II'),
    ('EE', 'Visa-free entry for stays of up to 90 days in any 180-day period.', 'Regulation (EU) 2018/1806 — Annex II'),
    ('LT', 'Visa-free entry for stays of up to 90 days in any 180-day period.', 'Regulation (EU) 2018/1806 — Annex II'),
    ('LU', 'Visa-free entry for stays of up to 90 days in any 180-day period.', 'Regulation (EU) 2018/1806 — Annex II'),
    ('LV', 'Visa-free entry for stays of up to 90 days in any 180-day period.', 'Regulation (EU) 2018/1806 — Annex II'),
    ('MT', 'Visa-free entry for stays of up to 90 days in any 180-day period.', 'Regulation (EU) 2018/1806 — Annex II'),
    ('SI', 'Visa-free entry for stays of up to 90 days in any 180-day period.', 'Regulation (EU) 2018/1806 — Annex II'),
    ('SK', 'Visa-free entry for stays of up to 90 days in any 180-day period.', 'Regulation (EU) 2018/1806 — Annex II'),
    ('LI', 'Visa-free entry for stays of up to 90 days in any 180-day period.', 'SEM (Switzerland) — Travel documents and visas by nationality'),
    ('PY', 'Visa-free entry for tourism for up to 90 days. The ID card is accepted in place of the passport.', 'Directorate-General for Migration — Entry requirements'),
    ('BO', 'Visa-free entry for tourism.', 'Brazilian Ministry of Foreign Affairs — Consulate-General in Santa Cruz de la Sierra'),
    ('EC', 'Visa-free entry for tourism.', 'Ecuadorian Foreign Ministry — Countries that need a visa'),
    ('DO', 'Visa-free entry for tourism for up to 60 days.', 'Consulate-General of the Dominican Republic in Rio de Janeiro'),
    ('CU', 'Tourist Card requested online before the trip, or bought at the airline counter. Allows up to 90 days.', 'Brazilian Ministry of Foreign Affairs — Embassy in Havana'),
    ('RS', 'Visa-free entry for stays of up to 90 days within 6 months.', 'Ministry of Foreign Affairs of Serbia — Visa regime'),
    ('GE', 'Visa-free entry for up to one year.', 'Legislative Herald of Georgia — Visa-exempt countries'),
    ('RU', 'Visa-free entry for stays of up to 90 days in any 180-day period, for tourism or business.', 'Ministry of Foreign Affairs of Russia — Consular relations with Brazil'),
    ('QA', 'Visa-free entry; the stamp is given on arrival.', 'Visit Qatar — Visa details'),
    ('MY', 'Visa-free entry for social or business visits, for up to 90 days.', 'Embassy of Malaysia in Brasília — Consular information'),
    ('PH', 'Visa-free entry for tourism or business for up to 59 days.', 'Brazilian Ministry of Foreign Affairs — Embassy in Manila'),
    ('LK', 'Electronic travel authorization (ETA) approved before boarding.', 'Sri Lanka Electronic Travel Authorization System'),
    ('MA', 'Visa-free entry for tourism for up to 90 days.', 'Brazilian Ministry of Foreign Affairs — Embassy in Rabat'),
    ('KE', 'Electronic travel authorization (eTA) approved before boarding. Processing usually takes about three business days.', null)
) as v(destination_country_code, notes, source_name)
join public.visa_rules r
  on r.passport_country_code = 'BR' and r.destination_country_code = v.destination_country_code
on conflict do nothing;

insert into public.visa_rule_translations (visa_rule_id, locale, notes, source_name)
select r.id, 'es', v.notes, v.source_name
from (
  values
    ('BG', 'Entrada sin visa para estadías de hasta 90 días cada 180.', 'Reglamento (UE) 2018/1806 — Anexo II'),
    ('CY', 'Entrada sin visa para estadías de hasta 90 días cada 180.', 'Reglamento (UE) 2018/1806 — Anexo II'),
    ('EE', 'Entrada sin visa para estadías de hasta 90 días cada 180.', 'Reglamento (UE) 2018/1806 — Anexo II'),
    ('LT', 'Entrada sin visa para estadías de hasta 90 días cada 180.', 'Reglamento (UE) 2018/1806 — Anexo II'),
    ('LU', 'Entrada sin visa para estadías de hasta 90 días cada 180.', 'Reglamento (UE) 2018/1806 — Anexo II'),
    ('LV', 'Entrada sin visa para estadías de hasta 90 días cada 180.', 'Reglamento (UE) 2018/1806 — Anexo II'),
    ('MT', 'Entrada sin visa para estadías de hasta 90 días cada 180.', 'Reglamento (UE) 2018/1806 — Anexo II'),
    ('SI', 'Entrada sin visa para estadías de hasta 90 días cada 180.', 'Reglamento (UE) 2018/1806 — Anexo II'),
    ('SK', 'Entrada sin visa para estadías de hasta 90 días cada 180.', 'Reglamento (UE) 2018/1806 — Anexo II'),
    ('LI', 'Entrada sin visa para estadías de hasta 90 días cada 180.', 'SEM (Suiza) — Documentos y visas por nacionalidad'),
    ('PY', 'Entrada sin visa para turismo por hasta 90 días. Se acepta el documento de identidad en lugar del pasaporte.', null),
    ('BO', 'Entrada sin visa para turismo.', 'Cancillería de Brasil — Consulado General en Santa Cruz de la Sierra'),
    ('EC', 'Entrada sin visa para turismo.', null),
    ('DO', 'Entrada sin visa para turismo por hasta 60 días.', 'Consulado General de la República Dominicana en Río de Janeiro'),
    ('CU', 'Tarjeta de Turista solicitada en línea antes del viaje o comprada en el mostrador de la aerolínea. Permite hasta 90 días.', 'Cancillería de Brasil — Embajada en La Habana'),
    ('RS', 'Entrada sin visa para estadías de hasta 90 días en 6 meses.', 'Ministerio de Relaciones Exteriores de Serbia — Régimen de visas'),
    ('GE', 'Entrada sin visa por hasta un año.', 'Legislative Herald of Georgia — Países exentos de visa'),
    ('RU', 'Entrada sin visa para estadías de hasta 90 días cada 180, en viajes de turismo o de negocios.', 'Ministerio de Relaciones Exteriores de Rusia — Relaciones consulares con Brasil'),
    ('QA', 'Entrada sin visa; el sello se pone a la llegada.', 'Visit Qatar — Información de visas'),
    ('MY', 'Entrada sin visa para visitas sociales o de negocios, por hasta 90 días.', 'Embajada de Malasia en Brasilia — Información consular'),
    ('PH', 'Entrada sin visa para turismo o negocios por hasta 59 días.', 'Cancillería de Brasil — Embajada en Manila'),
    ('LK', 'Autorización electrónica (ETA) aprobada antes de embarcar.', 'Sistema de Autorización Electrónica de Viaje de Sri Lanka'),
    ('MA', 'Entrada sin visa para turismo por hasta 90 días.', 'Cancillería de Brasil — Embajada en Rabat'),
    ('KE', 'Autorización electrónica (eTA) aprobada antes de embarcar. El trámite suele tardar unos tres días hábiles.', null)
) as v(destination_country_code, notes, source_name)
join public.visa_rules r
  on r.passport_country_code = 'BR' and r.destination_country_code = v.destination_country_code
on conflict do nothing;
