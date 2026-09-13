-- =============================================================================
-- TripReady — as lacunas do catálogo
--
-- Sete regras novas, nenhuma coluna nova. Todas cabem em
-- `requirement_templates` como ele já é: escopo, natureza da viagem e
-- prioridade bastam para expressar as sete.
--
-- Duas delas são desmembramento, não invenção: a lista de bagagem falava de
-- roupa por estação, adaptador de tomada e remédio de uso contínuo na mesma
-- frase. São três verificações com prazos e consequências diferentes, e uma
-- nem é bagagem. A migration anterior deixou a lista da mala sozinha; aqui
-- entram as outras duas com item próprio.
--
-- O que nenhuma delas faz: afirmar fato de país. Toda descrição manda conferir
-- na fonte oficial do destino, porque o app ainda não sabe a resposta. Quando
-- houver coleta com fonte — vacina exigida, tomada por país, seguro com valor
-- mínimo —, a resposta entra como regra de escopo `country`, e é aí que
-- `scope = 'country'` ganha o primeiro uso.
--
-- Nada de sazonal entra aqui, de propósito: ver a nota ao lado de
-- `destination-weather`.
-- =============================================================================

insert into public.requirement_templates (
  code, title, description, priority, category, scope, trip_kind
)
values
  -- ---------------------------------------------------------------------------
  -- O obrigatório que faltava em viagem doméstica
  --
  -- Depois do filtro de natureza da viagem, uma viagem inteiramente dentro do
  -- país do passaporte não recebia nenhum item `required`: passaporte,
  -- exigências de entrada, Schengen e todos os itens de visto são
  -- `international`. E a viagem só é declarada pronta quando existe pelo menos
  -- um obrigatório e todos estão verificados — sem obrigatório, ela nunca fica
  -- pronta. A pessoa marcava a checklist inteira e o app continuava calado.
  --
  -- A correção certa não é afrouxar o cálculo, é o catálogo ter um obrigatório
  -- doméstico. E este é o obrigatório real de um voo doméstico: sem documento
  -- aceito no embarque, não se viaja.
  --
  -- O texto manda conferir em vez de listar documentos porque a lista muda por
  -- país e por companhia — listar seria presumir passaporte brasileiro, que é
  -- exatamente o que a regra de negócio proíbe.
  (
    'domestic-photo-id',
    'Levar o documento de identificação',
    'Confira qual documento a companhia aceita no embarque e se ele está dentro da '
    'validade. A lista dos documentos aceitos está no site da companhia aérea ou do '
    'órgão de aviação civil do seu país — vale conferir antes de sair de casa.',
    'required', 'documents', 'global', 'domestic'
  ),

  -- ---------------------------------------------------------------------------
  -- Escala
  --
  -- O TripReady não modela voos nem escalas, e não deve passar a modelar por
  -- causa deste item. Por isso ele é lembrete de viagem inteira, e não regra de
  -- país: o app não sabe por onde a pessoa conecta. Se um dia houver rota, ele
  -- vira `country` e a conversa muda.
  (
    'transit-requirements',
    'Conferir as exigências da escala',
    'Se a sua viagem tem conexão em outro país, confira se ele exige visto ou '
    'autorização mesmo para quem só troca de avião. A regra é do país da escala, não '
    'do destino final, e pode mudar conforme o aeroporto e o tempo de conexão.',
    'recommended', 'documents', 'global', 'international'
  ),

  -- ---------------------------------------------------------------------------
  -- Nome na passagem
  (
    'ticket-name-match',
    'Conferir o nome na passagem',
    'Compare o nome impresso na passagem com o do passaporte, letra por letra, '
    'incluindo todos os sobrenomes e a ordem deles. Correções costumam ser possíveis, '
    'mas ficam mais caras perto da viagem — quanto antes você olhar, melhor.',
    'recommended', 'documents', 'global', 'international'
  ),

  -- ---------------------------------------------------------------------------
  -- Vacinas
  --
  -- Saúde era quase uma categoria vazia: dois itens, nenhum sobre vacina. A
  -- palavra aparecia de passagem na descrição de exigências de entrada, que a
  -- migration anterior reescreveu justamente para não duplicar este item.
  --
  -- `recommended`, e não `required`: sem regra coletada, o app não sabe se
  -- aquele destino exige alguma vacina. `required` afirmaria uma exigência que
  -- não foi apurada e, pior, deixaria a viagem não pronta por uma exigência que
  -- talvez não exista. Quando houver regra com fonte oficial, ela entra como
  -- template de escopo `country` e prioridade `required`.
  (
    'vaccination-requirements',
    'Conferir as vacinas — {country}',
    'Veja na página oficial de saúde ou de imigração do destino se alguma vacina é '
    'exigida na entrada e quais são recomendadas. Cheque cedo: algumas vacinas '
    'precisam de mais de uma dose ou de um tempo até fazer efeito, e o comprovante '
    'pode ser pedido na chegada.',
    'recommended', 'health', 'each_country', 'international'
  ),

  -- ---------------------------------------------------------------------------
  -- Medicamentos de uso contínuo
  --
  -- Nenhuma substância é nomeada e nenhum país é nomeado: "alguns países
  -- controlam" é verdadeiro e genérico, e o item manda conferir. O texto também
  -- evita de propósito a construção "remédio que você compra sem receita no
  -- Brasil", que presumiria a nacionalidade do viajante.
  (
    'medication-plan',
    'Separar os medicamentos de uso contínuo',
    'Leve a quantidade para toda a viagem, com folga, na bagagem de mão e na embalagem '
    'original. Leve também a receita ou um relatório do médico: alguns países controlam '
    'a entrada de determinadas substâncias, inclusive de remédios que você compra sem '
    'receita em casa. Se usa algum controlado, confira as regras do destino antes de '
    'embarcar.',
    'recommended', 'health', 'global', null
  ),

  -- ---------------------------------------------------------------------------
  -- Tomada e voltagem
  (
    'power-adapter',
    'Conferir tomada e voltagem do destino',
    'Veja qual é o padrão de tomada do destino e leve o adaptador certo. Confira também '
    'a voltagem: carregadores de celular e notebook costumam aceitar as duas, mas '
    'secador e barbeador nem sempre.',
    'recommended', 'luggage', 'global', 'international'
  ),

  -- ---------------------------------------------------------------------------
  -- Clima
  --
  -- Este item não usa `season`, e a razão precisa ficar escrita para ninguém
  -- tentar de novo: a coluna existe e o motor a avalia, mas a conversão de data
  -- em estação deriva só do hemisfério. Um template de escopo `winter`
  -- dispararia numa viagem ao Rio de Janeiro em julho e pediria casaco de
  -- inverno — errado, e errado com cara de certeza.
  --
  -- Enquanto não houver uma dimensão de clima por destino, que é dado novo e
  -- com fonte, o item de clima manda olhar a previsão em vez de afirmar
  -- temperatura. Ele vale o ano inteiro justamente por isso.
  (
    'destination-weather',
    'Conferir o clima para as datas da viagem',
    'Olhe a previsão e a média da época para cada destino antes de escolher as roupas. '
    'Em viagens que passam por mais de um país ou por mais de uma estação, a diferença '
    'pode ser grande dentro da mesma mala.',
    'recommended', 'luggage', 'global', null
  );

-- -----------------------------------------------------------------------------
-- Viagens que já existem
--
-- Regra geral: item novo nasce na próxima vez que a viagem é gerada ou editada.
-- Repetir aqui a resolução do catálogo — escopo, natureza da viagem, estação,
-- vigência — seria manter uma segunda cópia do motor em SQL, que envelhece
-- sozinha e cala quando divergir.
--
-- A exceção é `domestic-photo-id`, e ela não é sobre conveniência: sem esse
-- item, uma viagem doméstica já criada continua sem nenhum obrigatório, e
-- portanto nunca é declarada pronta por mais que a pessoa verifique. É o único
-- dos sete que muda a resposta da pergunta "estou pronto?" — os outros seis
-- acrescentam recomendações, e recomendação pode esperar a próxima edição.
--
-- O recorte é deliberado: só viagens que ainda não terminaram. Cobrar um
-- documento de embarque de quem já voltou seria derrubar o progresso de uma
-- checklist encerrada, sem nada a fazer com o aviso.
--
-- A condição de viagem doméstica é a mesma do motor: existe passaporte
-- principal, existe destino, e todo destino é o país do passaporte.
-- -----------------------------------------------------------------------------
insert into public.trip_requirements (
  trip_id, template_id, group_id, country_code,
  title, description, priority, category
)
select
  t.id, tpl.id, null, null,
  tpl.title, tpl.description, tpl.priority, tpl.category
from public.trips t
join public.passports p on p.user_id = t.user_id and p.is_primary
cross join public.requirement_templates tpl
where tpl.code = 'domestic-photo-id'
  and (t.end_date is null or t.end_date >= current_date)
  and exists (
    select 1 from public.trip_countries c where c.trip_id = t.id
  )
  and not exists (
    select 1
    from public.trip_countries c
    where c.trip_id = t.id
      and c.country_code <> p.country_code
  )
on conflict do nothing;
