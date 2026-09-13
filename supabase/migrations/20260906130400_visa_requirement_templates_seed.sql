-- =============================================================================
-- TripReady — como cada resultado de visto aparece na checklist
--
-- Um template por resultado, e não um por par de países: é o que sustenta a
-- promessa de que acrescentar um passaporte novo é só acrescentar regras em
-- `visa_rules`.
--
-- Por isso `passport_country_code` fica nulo em todos: o texto "solicitar o
-- visto de entrada" serve a qualquer nacionalidade, e quem sabe se a regra vale
-- para o viajante é `visa_rules`, não o template.
--
-- `source_name` e `source_url` também ficam nulos aqui. A fonte oficial é
-- propriedade da regra, que varia por destino, e é copiada para o item da
-- checklist na geração — um texto genérico não tem órgão a citar.
--
-- As descrições abaixo são reserva: quando a regra traz observação oficial
-- (`visa_rules.notes`), é ela que vira a descrição do item, por ser mais
-- específica que qualquer texto escrito aqui.
-- =============================================================================

insert into public.requirement_templates (
  code, title, description, priority, category, scope, visa_requirement_type
)
values
  (
    'visa-required',
    'Solicitar o visto de entrada — {country}',
    'Comece cedo: o prazo de emissão varia conforme o consulado.',
    'required', 'documents', 'visa', 'visa_required'
  ),
  (
    'visa-evisa',
    'Solicitar o visto eletrônico (e-Visa) — {country}',
    'O pedido é feito online, no site oficial de imigração do destino.',
    'required', 'documents', 'visa', 'evisa'
  ),
  (
    'visa-eta',
    'Solicitar a autorização eletrônica de viagem — {country}',
    'Autorização pedida online e aprovada antes do embarque.',
    'required', 'documents', 'visa', 'eta'
  ),
  -- `recommended`, e não `required`: o visto é emitido no balcão da chegada e
  -- não há como concluí-lo antes de viajar. Como `required` decide se a viagem
  -- está pronta, marcá-lo assim deixaria esses destinos permanentemente "não
  -- prontos". O que dá para fazer antes — foto, taxa e comprovantes — é
  -- justamente o que a descrição pede.
  (
    'visa-on-arrival',
    'Preparar o visto na chegada — {country}',
    'O visto é emitido na chegada. Leve foto, taxa e os comprovantes pedidos.',
    'recommended', 'documents', 'visa', 'visa_on_arrival'
  ),
  -- `informational` não entra no cálculo de progresso, então confirmar uma boa
  -- notícia não infla a barra nem cobra ação de quem não tem nada a fazer.
  -- Ainda assim o item existe: sem ele, a pessoa abriria a checklist e não
  -- encontraria resposta sobre visto.
  (
    'visa-free',
    'Entrada sem visto — {country}',
    'Você não precisa de visto para este destino.',
    'informational', 'documents', 'visa', 'visa_free'
  );

-- `conditional` fica de fora por enquanto. O tipo existe em `visa_rules` e o
-- template é uma linha a mais quando for a hora, mas um item "confirmar as
-- condições" só ajuda se a observação da regra estiver bem escrita — e isso
-- depende da qualidade da coleta de dados, que ainda não aconteceu.

-- -----------------------------------------------------------------------------
-- O requisito genérico de entrada continua, com o texto ajustado
--
-- Ele não é substituído pelos itens de visto: cobre o que a regra de visto não
-- cobre — vacina, comprovante de hospedagem, passagem de volta — e é a rede de
-- segurança dos destinos que ainda não têm regra cadastrada.
--
-- A descrição citava "vistos", o que agora duplicaria o item ao lado. Passa a
-- nomear o resto das exigências, deixando o visto para quem trata dele.
-- -----------------------------------------------------------------------------
update public.requirement_templates
set description = 'Vacinas, comprovante de hospedagem e passagem de volta pedidos na chegada.'
where code = 'country-entry-requirements';
