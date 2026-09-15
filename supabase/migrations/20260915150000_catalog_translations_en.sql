-- =============================================================================
-- TripReady — catálogo em inglês
--
-- Conteúdo estático revisável (§17 do plano de i18n): tradução de uma pessoa
-- fluente em cima do texto canônico pt-BR, versionada aqui para poder ser
-- revista e revertida como qualquer outra mudança de schema — nunca gerada em
-- runtime.
--
-- A estrutura de tópicos de cada descrição (uma linha por `concat_ws(E'\n', …)`)
-- espelha exatamente `20260913120000_requirement_description_topics.sql`: a
-- primeira linha diz o que fazer, as seguintes são verificação — mudar o número
-- de linhas entre idiomas quebraria essa leitura na tela de detalhe.
--
-- `source_name` de `visa_rule_translations` fica de fora aqui de propósito —
-- entra na Fase 5 (§8.4), só quando o órgão tiver descritivo a traduzir.
-- =============================================================================

insert into public.requirement_template_translations (requirement_template_id, locale, title, description)
select t.id, 'en', v.title, v.description
from (
  values
    ('passport-validity', 'Check passport validity', concat_ws(E'\n',
      'Check how long your passport is valid and compare it with your return date.',
      'Some destinations require validity beyond the departure date, and the margin varies by country.',
      'The margin for each destination is in the entry requirements for your trip.',
      'Also check whether there are still blank pages left for stamps.'
    )),
    ('country-entry-requirements', 'Check entry requirements — {country}', concat_ws(E'\n',
      'Each country sets its own requirements for arrival, besides the visa.',
      'The most common ones are proof of accommodation, a return ticket, insurance and proof of funds.',
      'The official list is on the destination immigration website.',
      'Keep whatever is required ready, printed or on your phone, together with your documents.'
    )),
    ('document-copies', 'Keep copies of documents and bookings', concat_ws(E'\n',
      'Photograph or download your passport, visa, insurance, tickets and bookings.',
      'Keep them somewhere that opens without internet — files saved on your phone, not just the email link.',
      'Leave a copy with someone you trust as well.',
      'If a document goes missing along the way, the copy is what speeds up getting a replacement.'
    )),
    ('travel-insurance', 'Buy travel insurance', concat_ws(E'\n',
      'Compare policies before choosing one.',
      'Look at the medical coverage and the maximum amount per claim.',
      'Check whether the dates cover the whole trip, from departure to return.',
      'Some destinations require insurance with a minimum coverage amount at entry — check the country requirements.',
      'Once you have bought it, save the policy and the emergency phone number with your copies.'
    )),
    ('emergency-contacts', 'Write down emergency contacts', concat_ws(E'\n',
      'Write the contacts somewhere that opens without internet.',
      'The emergency phone number and policy number of your insurer.',
      'The consulate or embassy of your country at the destination.',
      'Someone you trust who can help remotely.',
      'It is also worth keeping a paper copy with your documents.'
    )),
    ('payment-methods', 'Sort out payment methods', concat_ws(E'\n',
      'Bring more than one way to pay.',
      'Cards from different issuers, kept in separate places.',
      'Some cash for the first few hours: transport from the airport and a meal.',
      'In your bank app, check the available limit and whether the card is enabled for use abroad.'
    )),
    ('budget-plan', 'Plan the trip budget', 'Accommodation, transport, food and some extra for a buffer.'),
    ('connectivity-plan', 'Sort out internet at the destination', concat_ws(E'\n',
      'Decide before boarding how you will stay connected.',
      'Compare eSIM, a local SIM card and the carrier international plan by price per day.',
      'If going with eSIM, make sure the phone supports it.',
      'Activate it before leaving, while there is still internet — it is harder once boarded.'
    )),
    ('luggage-list', 'Make the packing list', concat_ws(E'\n',
      'Make the list before packing.',
      'Count the days and think about what is already planned.',
      'Set aside what is used every day: chargers, glasses, toiletries.',
      'Flag what cannot be bought at the destination — that is what should not be forgotten.'
    )),
    ('airline-luggage-rules', 'Check airline luggage rules', concat_ws(E'\n',
      'The rules come from the airline and the fare, not the airport.',
      'On the airline website, check how many pieces, what weight and what dimensions the fare includes.',
      'Check whether carry-on luggage is included — some fares do not include it.',
      'If the trip has legs with different airlines, check each one.',
      'Also check the liquid limits and what cannot go in the carry-on.'
    )),
    ('schengen-short-stay', 'Check the 90-in-180-day limit in the Schengen Area', concat_ws(E'\n',
      'The limit applies to the whole Schengen Area, not each country.',
      'The days add up even when switching destinations within the region.',
      'The count looks at the 180 days before each entry, so recent trips count too.',
      'Add up the days before finalizing the dates.'
    )),
    ('visa-required', 'Apply for the entry visa — {country}', concat_ws(E'\n',
      'The visa is applied for before traveling, at the consulate or the destination official system.',
      'Start with this one: between scheduling, documents and issuance, it is usually the slowest item.',
      'Check the document list, the fee and the timeline on the official page.'
    )),
    ('visa-evisa', 'Apply for the electronic visa — {country}', concat_ws(E'\n',
      'The application is done online, on the destination official immigration website.',
      'Be wary of third-party sites that charge extra.',
      'Check the stated processing time and apply with some margin.',
      'Once approved, bring it printed and saved on the phone.'
    )),
    ('visa-eta', 'Apply for the electronic travel authorization — {country}', concat_ws(E'\n',
      'The authorization is applied for online and needs to be approved before boarding.',
      'Apply on the destination official website.',
      'Apply with some margin: it is usually fast, but not always instant.',
      'Keep the confirmation with the other copies.'
    )),
    ('visa-on-arrival', 'Prepare the visa on arrival — {country}', concat_ws(E'\n',
      'The visa is issued on arrival, but everything it asks for can be prepared in advance.',
      'Have a photo in the required format.',
      'Bring the fee in an accepted payment method.',
      'Have the proof of accommodation and return ticket on hand.',
      'Check the official page for whether it can be applied for online in advance — in some destinations, it can.'
    )),
    ('visa-free', 'Visa-free entry — {country}', concat_ws(E'\n',
      'For tourism, this destination does not require a visa with this passport.',
      'Check the maximum length of stay.',
      'See whether entry requires any online registration before arrival.'
    )),
    ('visa-conditional', 'Confirm entry conditions — {country}', concat_ws(E'\n',
      'The requirements change depending on the case.',
      'Visa history, mode of transport and the purpose of the trip can change the answer.',
      'Check the official source before buying the ticket.',
      'The difference between one condition and another can be an online authorization or a visa at the consulate.'
    )),
    ('domestic-photo-id', 'Bring a photo ID', concat_ws(E'\n',
      'Check which document the airline accepts for boarding.',
      'Make sure it is still valid.',
      'The list of accepted documents is on the airline website or the country civil aviation authority.'
    )),
    ('transit-requirements', 'Check the layover requirements', concat_ws(E'\n',
      'If the trip has a connection in another country, check what it requires from someone who is just changing planes.',
      'Some countries ask for a visa or authorization even in transit.',
      'The rule belongs to the layover country, not the final destination.',
      'It can change depending on the airport and the connection time.'
    )),
    ('ticket-name-match', 'Check the name on the ticket', concat_ws(E'\n',
      'Compare the name printed on the ticket with the one on the passport, letter by letter.',
      'Check all surnames and their order.',
      'Corrections are usually possible, but get more expensive closer to the trip.'
    )),
    ('vaccination-requirements', 'Check vaccine requirements — {country}', concat_ws(E'\n',
      'See what is required on the destination official health or immigration page.',
      'Check whether any vaccine is required for entry and which ones are recommended.',
      'Check early: some need more than one dose or take time to become effective.',
      'Proof may be requested on arrival.'
    )),
    ('medication-plan', 'Set aside regular medication', concat_ws(E'\n',
      'Set aside the medication taken daily before packing.',
      'Bring enough for the whole trip, with some extra.',
      'Prefer carry-on luggage and the original packaging.',
      'Also bring the prescription or a letter from a doctor.',
      'Some countries control the entry of certain substances — if a controlled medication is taken, check the destination rules.'
    )),
    ('power-adapter', 'Check the destination outlet and voltage', concat_ws(E'\n',
      'Check the destination outlet standard and bring the right adapter.',
      'Also check the voltage.',
      'Phone and laptop chargers usually accept both, but hair dryers and shavers do not always.'
    )),
    ('destination-weather', 'Check the weather for the travel dates', concat_ws(E'\n',
      'Look at the forecast and the season average for each destination before choosing what to pack.',
      'On trips through more than one country, the difference can be big within the same suitcase.',
      'The same goes for trips that cross more than one season.'
    ))
) as v(code, title, description)
join public.requirement_templates t on t.code = v.code
on conflict do nothing;

insert into public.destination_group_translations (destination_group_id, locale, name, description)
select g.id, 'en', v.name, v.description
from (
  values
    ('SCHENGEN', 'Schengen Area', 'Free-movement area with common rules for entry and short-stay permanence.'),
    ('MERCOSUL', 'MERCOSUR', 'Southern Common Market. Full member states; suspended members have their validity period closed.'),
    ('CAN', 'Andean Community', 'Andean Community of Nations (CAN), created by the Cartagena Agreement.'),
    ('CA4', 'CA-4', 'Free mobility agreement between Guatemala, El Salvador, Honduras and Nicaragua.'),
    ('ASEAN', 'ASEAN', 'Association of Southeast Asian Nations.'),
    ('EAC', 'East African Community', 'East African Community (EAC).'),
    ('ECOWAS', 'ECOWAS', 'Economic Community of West African States (ECOWAS).'),
    ('GCC', 'Gulf Cooperation Council', 'Gulf Cooperation Council (GCC).'),
    ('PACIFIC_ALLIANCE', 'Pacific Alliance', 'Integration bloc between Chile, Colombia, Mexico and Peru.'),
    ('CARICOM', 'CARICOM', 'Caribbean Community.')
) as v(code, name, description)
join public.destination_groups g on g.code = v.code
on conflict do nothing;

insert into public.visa_rule_translations (visa_rule_id, locale, notes)
select r.id, 'en', v.notes
from (
  values
    ('AT', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('BE', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('CH', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('CZ', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('DE', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('DK', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('ES', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('FI', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('FR', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('GR', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('HR', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('HU', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('IS', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('IT', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('NL', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('NO', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('PL', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('PT', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('RO', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('SE', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('GB', 'Electronic travel authorization (ETA) approved before boarding, for visits of up to 6 months.'),
    ('IE', 'Nationality not subject to an entry visa.'),
    ('US', 'Brazil does not take part in the Visa Waiver Program: a visitor visa (B-2) is required.'),
    ('CA', 'The electronic authorization applies to those who have held a Canadian visa in the last 10 years or hold a valid U.S. visa, and arrive by air. In other cases, a visitor visa is required.'),
    ('MX', 'Electronic authorization (SAE) for arrival by air with an electronic passport. By land or sea, a visa is required.'),
    ('AR', 'Visa-free entry for tourism.'),
    ('CL', 'Visa-free entry for tourism. The ID card is accepted in place of the passport.'),
    ('CO', 'Visa-free entry for tourism for up to 90 days, extendable under the applicable regulation.'),
    ('PE', 'Visa-free entry for tourism. The ID card is accepted in place of the passport.'),
    ('UY', 'Visa-free entry for tourism. The ID card is accepted in place of the passport.'),
    ('JP', 'Exemption valid for ICAO-standard electronic passports, for stays of up to 90 days.'),
    ('CN', 'Visa-free entry for up to 30 days, under the policy in effect until 12/31/2026.'),
    ('KR', 'Electronic authorization (K-ETA) approved before boarding, for stays of up to 90 days.'),
    ('IL', 'Electronic authorization (ETA-IL) requested up to 72 hours before arrival.'),
    ('IN', 'Electronic visa requested at least 4 days in advance.'),
    ('ID', 'Visa issued on arrival, for up to 30 days. It can be paid online before the trip (e-VOA).'),
    ('VN', 'Electronic visa for up to 90 days, presented printed on arrival.'),
    ('TH', 'Visa-free entry for tourism for up to 60 days.'),
    ('SG', 'Visa-free entry for up to 30 days. The SG Arrival Card must be submitted before arrival.'),
    ('AU', 'The eVisitor is restricted to European passports: a visitor visa is required, applied for online.'),
    ('NZ', 'Electronic authorization (NZeTA) obtained before the trip.'),
    ('AE', 'Visa-free entry for up to 90 days in any 12-month period; the stamp is given on arrival.'),
    ('TR', 'Visa-free entry for stays of up to 90 days in any 180-day period.'),
    ('EG', 'Electronic visa requested before the trip.'),
    ('ZA', 'Visa-free entry for up to 90 days.')
) as v(destination_country_code, notes)
join public.visa_rules r
  on r.passport_country_code = 'BR' and r.destination_country_code = v.destination_country_code
on conflict do nothing;
