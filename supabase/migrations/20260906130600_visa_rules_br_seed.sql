-- =============================================================================
-- TripReady — regras de visto para o passaporte brasileiro
--
-- 45 dos 46 destinos do escopo do MVP (os que já têm sugestão de cidade no
-- app). O Marrocos ficou de fora: a lista oficial de dispensa de visto não pôde
-- ser aberta, e nenhuma fonte aceitável a substituiu. Destino sem regra não
-- gera item de visto e continua coberto pelo requisito genérico de exigências
-- de entrada — o silêncio nunca vira "não precisa de visto".
--
-- A coleta e as fontes de cada linha estão em `tasks/coleta-vistos-br.md`.
--
-- `verified_at` é a data em que as fontes foram conferidas, e não a data desta
-- migration. É essa coluna que responde o quanto o dado é recente.
--
-- O `on conflict` torna a carga idempotente: reexecutar não duplica, e
-- atualizar uma regra passa a ser reeditar a linha e rodar de novo.
-- =============================================================================

insert into public.visa_rules (
  passport_country_code, destination_country_code, requirement_type,
  source_name, source_url, verified_at, notes, valid_until
)
values
  -- ---------------------------------------------------------------------------
  -- Espaço Schengen — 20 destinos, uma fonte só
  --
  -- A isenção é competência da União, não de cada país: o Brasil consta do
  -- Anexo II do Regulamento (UE) 2018/1806.
  --
  -- ⚠️ O ETIAS entra em operação no último trimestre de 2026 e transforma estes
  -- 20 destinos em `eta`. Quando a data for anunciada, preencher `valid_until`
  -- destas linhas e inserir as novas com `valid_from` — o motor avalia a
  -- vigência contra a data da viagem e faz a virada sozinho.
  -- ---------------------------------------------------------------------------
  ('BR', 'AT', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'BE', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'CH', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'CZ', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'DE', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'DK', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'ES', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'FI', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'FR', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'GR', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'HR', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'HU', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'IS', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'IT', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'NL', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'NO', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'PL', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'PT', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'RO', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'SE', 'visa_free', 'Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806)', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),

  -- ---------------------------------------------------------------------------
  -- Europa fora do Espaço Schengen
  -- ---------------------------------------------------------------------------
  ('BR', 'GB', 'eta', 'GOV.UK — Electronic travel authorisation', 'https://www.gov.uk/guidance/check-when-you-can-get-an-electronic-travel-authorisation-eta', date '2026-09-06', 'Autorização eletrônica (ETA) aprovada antes do embarque, para visitas de até 6 meses.', null),
  ('BR', 'IE', 'visa_free', 'Irish Immigration Service — Visa and non-visa required nationalities', 'https://www.irishimmigration.ie/visa-non-visa-required-nationalities/', date '2026-09-06', 'Nacionalidade não sujeita a visto de entrada.', null),

  -- ---------------------------------------------------------------------------
  -- Américas
  --
  -- Chile, Peru e Uruguai aceitam a carteira de identidade no lugar do
  -- passaporte, por acordo do MERCOSUL — informação útil ao viajante, por isso
  -- está em `notes`. A dispensa de visto de cada um foi confirmada na
  -- autoridade migratória do próprio destino, não deduzida do bloco.
  -- ---------------------------------------------------------------------------
  ('BR', 'US', 'visa_required', 'U.S. Department of State — Visitor Visa', 'https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html', date '2026-09-06', 'O Brasil não participa do Visa Waiver Program: é preciso visto de visitante (B-2).', null),
  ('BR', 'CA', 'conditional', 'IRCC — eTA: citizens from some visa-required countries', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta/eligibility/eta-x.html', date '2026-09-06', 'A autorização eletrônica vale para quem já teve visto canadense nos últimos 10 anos ou tem visto americano válido, e chega de avião. Nos demais casos, é preciso visto de visitante.', null),
  ('BR', 'MX', 'eta', 'Instituto Nacional de Migración — Autorización electrónica', 'https://www.inm.gob.mx/sae/publico/en/solicitud.html', date '2026-09-06', 'Autorização eletrônica (SAE) para chegada por via aérea com passaporte eletrônico. Por terra ou mar, é preciso visto.', null),
  ('BR', 'AR', 'visa_free', 'Dirección Nacional de Migraciones — Régimen de visas', 'https://www.migraciones.gob.ar/accesible/indexdnm.php?visas=', date '2026-09-06', 'Entrada sem visto para turismo.', null),
  ('BR', 'CL', 'visa_free', 'Servicio Nacional de Migraciones — Documentos de viaje', 'https://serviciomigraciones.cl/guia/documentos-viaje/', date '2026-09-06', 'Entrada sem visto para turismo. O documento de identidade é aceito no lugar do passaporte.', null),
  ('BR', 'CO', 'visa_free', 'Cancillería de Colombia — Necesito una visa', 'https://www.cancilleria.gov.co/tramites_servicios/visa/requisitos', date '2026-09-06', 'Entrada sem visto para turismo por até 90 dias, prorrogáveis conforme a regulamentação.', null),
  ('BR', 'PE', 'visa_free', 'Superintendencia Nacional de Migraciones — Viajar con DNI', 'https://www.gob.pe/158-viajar-con-dni', date '2026-09-06', 'Entrada sem visto para turismo. O documento de identidade é aceito no lugar do passaporte.', null),
  ('BR', 'UY', 'visa_free', 'Ministerio del Interior — Régimen de visas de admisión', 'https://www.gub.uy/ministerio-interior/comunicacion/publicaciones/regimen-visas-admision', date '2026-09-06', 'Entrada sem visto para turismo. O documento de identidade é aceito no lugar do passaporte.', null),

  -- ---------------------------------------------------------------------------
  -- Ásia e Oceania
  --
  -- A China é a única linha com prazo: a política de isenção vigora até
  -- 31/12/2026. Depois disso o motor deixa de aplicá-la e o destino volta ao
  -- requisito genérico — o comportamento correto para uma política que pode
  -- não ser renovada.
  -- ---------------------------------------------------------------------------
  ('BR', 'JP', 'visa_free', 'MOFA Japão — Visa Waiver Measure for nationals of Brazil', 'https://www.mofa.go.jp/press/release/press4e_003290.html', date '2026-09-06', 'Isenção válida para passaporte eletrônico no padrão ICAO, em estadas de até 90 dias.', null),
  ('BR', 'CN', 'visa_free', 'Embaixada da China no Brasil — Vistos', 'https://br.china-embassy.gov.cn/por/lqfw/lqfw2/', date '2026-09-06', 'Entrada sem visto por até 30 dias, pela política em vigor até 31/12/2026.', date '2026-12-31'),
  ('BR', 'KR', 'eta', 'Korea Immigration Service — K-ETA', 'https://www.k-eta.go.kr/', date '2026-09-06', 'Autorização eletrônica (K-ETA) aprovada antes do embarque, para estadas de até 90 dias.', null),
  ('BR', 'IL', 'eta', 'Israel PIBA — ETA-IL', 'https://israel-entry.piba.gov.il/learn-about', date '2026-09-06', 'Autorização eletrônica (ETA-IL) solicitada até 72 horas antes da chegada.', null),
  ('BR', 'IN', 'evisa', 'Government of India — e-Visa', 'https://indianvisaonline.gov.in/evisa/tvoa.html', date '2026-09-06', 'Visto eletrônico solicitado com pelo menos 4 dias de antecedência.', null),
  ('BR', 'ID', 'visa_on_arrival', 'Direktorat Jenderal Imigrasi — e-VOA', 'https://evisa.imigrasi.go.id/front/info/evoa', date '2026-09-06', 'Visto emitido na chegada, para até 30 dias. Pode ser pago online antes da viagem (e-VOA).', null),
  ('BR', 'VN', 'evisa', 'Vietnam National Electronic Visa system', 'https://evisa.gov.vn/', date '2026-09-06', 'Visto eletrônico de até 90 dias, apresentado impresso na chegada.', null),
  ('BR', 'TH', 'visa_free', 'MFA Tailândia — Tourist visa exemption', 'https://image.mfa.go.th/mfa/0/YLjhuT4Hho/Consular_Service/Tourist_Visa_Exempt_60_days.pdf', date '2026-09-06', 'Entrada sem visto para turismo por até 60 dias.', null),
  ('BR', 'SG', 'visa_free', 'Embaixada de Singapura em Brasília — Visa-free entry for Brazilians', 'https://brasilia.mfa.gov.sg/important-information/visa-free-entry-for-brazilians/', date '2026-09-06', 'Entrada sem visto por até 30 dias. É preciso enviar o SG Arrival Card antes da chegada.', null),
  ('BR', 'AU', 'visa_required', 'Department of Home Affairs — Visitor visa (subclass 600)', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600', date '2026-09-06', 'O eVisitor é restrito a passaportes europeus: é preciso visto de visitante, solicitado online.', null),
  ('BR', 'NZ', 'eta', 'Immigration New Zealand — Visa waiver countries and territories', 'https://www.immigration.govt.nz/visit/what-you-need-to-visit-new-zealand/visa-waiver-countries-and-territories/', date '2026-09-06', 'Autorização eletrônica (NZeTA) obtida antes da viagem.', null),

  -- ---------------------------------------------------------------------------
  -- África e Oriente Médio
  -- ---------------------------------------------------------------------------
  ('BR', 'AE', 'visa_free', 'UAE MOFA — Embaixada em Brasília, vistos', 'https://www.mofa.gov.ae/en/missions/brasilia/services/visas', date '2026-09-06', 'Entrada sem visto por até 90 dias a cada 12 meses; o carimbo é dado na chegada.', null),
  ('BR', 'TR', 'visa_free', 'Türkiye MFA — Visa information for foreigners', 'https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa', date '2026-09-06', 'Entrada sem visto para estadas de até 90 dias a cada 180.', null),
  ('BR', 'EG', 'evisa', 'Egypt e-Visa Portal', 'https://visa2egypt.gov.eg/eVisa/FAQ', date '2026-09-06', 'Visto eletrônico solicitado antes da viagem.', null),
  ('BR', 'ZA', 'visa_free', 'DIRCO — Passport holders exempt from South African visas', 'https://dirco.gov.za/uk/visa-countries-waivers/', date '2026-09-06', 'Entrada sem visto por até 90 dias.', null)

on conflict (passport_country_code, destination_country_code) do update
set requirement_type = excluded.requirement_type,
    source_name      = excluded.source_name,
    source_url       = excluded.source_url,
    verified_at      = excluded.verified_at,
    notes            = excluded.notes,
    valid_from       = excluded.valid_from,
    valid_until      = excluded.valid_until;
