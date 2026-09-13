-- =============================================================================
-- TripReady — reescrita da copy do catálogo de requisitos
--
-- Os textos atuais foram migrados do app com uma linha de descrição cada,
-- porque nasceram para aparecer embaixo do título, na lista. Não aparecem: a
-- lista da viagem mostra só o título, e a descrição só existe na tela de
-- detalhe, dentro de um ScrollView sem corte. Ou seja, há espaço para dizer o
-- que conferir e onde conferir, e o catálogo estava usando sete palavras.
--
-- A divisão que esta migration adota: o título carrega a ação, a descrição
-- carrega o como. Título curto e verbal; descrição com o que olhar, onde olhar
-- e o que muda conforme o caso.
--
-- Nenhum texto aqui afirma fato do mundo que não esteja em fonte oficial. Onde
-- a regra varia por destino — meses de validade de passaporte, valor mínimo de
-- seguro, vacina exigida —, o texto manda conferir em vez de responder. Virar
-- resposta é trabalho de coleta, não de redação.
--
-- Três correções de comportamento vêm junto, porque dependem dos mesmos textos:
--
--   1. `emergency-contacts` deixa de exigir passaporte brasileiro. Estava preso
--      a 'BR' porque o texto dizia "um contato no Brasil" — decisão de
--      migração, registrada na época como "reescrever não é migrar". Agora é a
--      hora de reescrever, e com o texto genérico o item volta a valer para
--      qualquer passaporte, como manda a regra de negócio do produto.
--   2. `emergency-contacts` e `airline-luggage-rules` sobem de `informational`
--      para `recommended`. Os dois pedem ação antes de viajar e têm
--      consequência concreta; `informational` os mantinha fora da conta que
--      mede preparo.
--   3. `budget-plan` é desativado. Planejar orçamento é planejamento de viagem,
--      não verificação antes de viajar.
--
-- E, no fim, o retrofit: `trip_requirements` guarda título, descrição,
-- prioridade e categoria como cópia própria, e a reconciliação compara só a
-- origem do item, nunca o conteúdo. Sem o `update` da última seção, o texto
-- novo alcançaria apenas as viagens criadas depois desta migration.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Documentos
-- -----------------------------------------------------------------------------

-- "Válido para toda a viagem" mandava conferir a coisa errada: vários destinos
-- exigem validade além da data de saída, então um passaporte que cobre a viagem
-- inteira ainda pode barrar a entrada. O texto novo diz que o prazo varia e
-- aponta onde ele está.
update public.requirement_templates
set title = 'Conferir a validade do passaporte',
    description = 'Veja até quando seu passaporte vale e compare com a data de volta. '
                  'Alguns destinos exigem validade além da data de saída, e o prazo varia '
                  'conforme o país — confira nas exigências de entrada de cada destino da '
                  'sua viagem. Aproveite para ver se ainda há páginas em branco para os '
                  'carimbos.'
where code = 'passport-validity';

-- A descrição era uma lista de substantivos: dizia o que pode ser pedido, não
-- onde conferir nem o que fazer com o que encontrar.
update public.requirement_templates
set description = 'Além do visto, cada país define o que pede na chegada: comprovante de '
                  'hospedagem, passagem de volta, seguro ou comprovação de recursos. '
                  'Confira a lista na página oficial de imigração do destino e deixe '
                  'separado o que for pedido, impresso ou no celular, junto dos seus '
                  'documentos.'
where code = 'country-entry-requirements';

-- O item passa a ser o dono do acesso offline, que até aqui disputava espaço
-- com o item de conectividade.
update public.requirement_templates
set title = 'Guardar cópias dos documentos e reservas',
    description = 'Fotografe ou baixe passaporte, visto, seguro, passagens e reservas, e '
                  'guarde em um lugar que abra sem internet — os arquivos baixados no '
                  'celular, não só o link do e-mail. Deixe uma cópia também com alguém de '
                  'confiança. Se algum documento sumir no caminho, é a cópia que acelera a '
                  'segunda via.'
where code = 'document-copies';

-- A regra continua a mesma; o que faltava era a parte prática: a conta olha
-- para trás, e não só para esta viagem.
update public.requirement_templates
set description = 'O limite vale para o Espaço Schengen inteiro, não para cada país: os '
                  'dias somam mesmo que você troque de destino. A conta olha os 180 dias '
                  'anteriores a cada entrada, então viagens recentes à região também '
                  'entram. Some antes de fechar as datas.'
where code = 'schengen-short-stay';

-- -----------------------------------------------------------------------------
-- Vistos
--
-- Estes seis textos são reserva: quando a regra de `visa_rules` traz observação
-- oficial, é ela que vira a descrição do item. Aparecem em todo destino sem
-- observação, então precisam se sustentar sozinhos.
--
-- A correção comum aos seis: `visa_rules` foi coletada para turismo — a coleta
-- inteira trata de entrada turística —, e nada na tela dizia isso. "Você não
-- precisa de visto para este destino" é uma afirmação absoluta entregue a quem
-- talvez vá trabalhar ou estudar. Os textos abaixo carregam a qualificação.
-- -----------------------------------------------------------------------------
update public.requirement_templates
set description = 'O visto é pedido antes de viajar, no consulado ou no sistema oficial do '
                  'destino. Comece por aqui: entre agendamento, documentos e emissão, '
                  'costuma ser o item mais demorado da checklist. Confira a lista de '
                  'documentos, a taxa e o prazo na página oficial.'
where code = 'visa-required';

update public.requirement_templates
set title = 'Solicitar o visto eletrônico — {country}',
    description = 'O pedido é feito online, no site oficial de imigração do destino — '
                  'desconfie de sites intermediários que cobram a mais. Confira o prazo de '
                  'processamento informado e peça com folga. Com o visto aprovado, leve-o '
                  'impresso e salvo no celular.'
where code = 'visa-evisa';

update public.requirement_templates
set title = 'Solicitar a autorização eletrônica — {country}',
    description = 'A autorização é pedida online e precisa estar aprovada antes do '
                  'embarque. Peça no site oficial do destino e com alguma folga: costuma '
                  'sair rápido, mas nem sempre sai na hora. Guarde o comprovante junto das '
                  'suas cópias.'
where code = 'visa-eta';

update public.requirement_templates
set description = 'O visto é emitido na chegada, mas dá para adiantar tudo o que ele pede: '
                  'foto no formato exigido, a taxa na forma de pagamento aceita e os '
                  'comprovantes de hospedagem e de volta. Confira na página oficial se o '
                  'pedido pode ser adiantado online — em alguns destinos, pode.'
where code = 'visa-on-arrival';

update public.requirement_templates
set description = 'Para turismo, este destino não pede visto com o seu passaporte. Confira '
                  'o tempo máximo de permanência e se a entrada exige algum cadastro '
                  'online antes da chegada.'
where code = 'visa-free';

update public.requirement_templates
set description = 'As exigências mudam conforme o seu caso: histórico de vistos, meio de '
                  'transporte ou motivo da viagem. Confira na fonte oficial antes de '
                  'comprar a passagem — a diferença entre uma condição e outra pode ser '
                  'uma autorização online ou um visto no consulado.'
where code = 'visa-conditional';

-- -----------------------------------------------------------------------------
-- Saúde
-- -----------------------------------------------------------------------------

-- Faltava dizer o que olhar na comparação, e que em alguns destinos o seguro
-- deixa de ser recomendação e vira exigência de entrada.
update public.requirement_templates
set title = 'Contratar o seguro viagem',
    description = 'Compare a cobertura médica, o valor máximo por atendimento e se as '
                  'datas da apólice cobrem a viagem inteira, do embarque à volta. Alguns '
                  'destinos pedem seguro com valor mínimo na entrada — confira nas '
                  'exigências do país antes de fechar. Depois de contratar, salve a '
                  'apólice e o telefone de emergência junto das suas cópias.'
where code = 'travel-insurance';

-- Some o país fixo, entra o "onde anotar" — que é o detalhe que faz o item
-- funcionar — e a prioridade sobe: anotar contato é ação antes de viajar, não
-- conteúdo de consulta.
--
-- A categoria fica em `health`. `documents` seria defensável pelo consulado,
-- mas o item continua ancorado na seguradora, e mover custaria churn sem ganho.
update public.requirement_templates
set title = 'Anotar os contatos de emergência',
    description = 'Anote em um lugar que abra sem internet: o telefone de emergência da '
                  'seguradora e o número da apólice, o contato do consulado ou embaixada '
                  'do seu país no destino, e uma pessoa de confiança que possa ajudar de '
                  'longe. Vale deixar também no papel, junto dos documentos.',
    priority = 'recommended',
    passport_country_code = null
where code = 'emergency-contacts';

-- -----------------------------------------------------------------------------
-- Dinheiro
-- -----------------------------------------------------------------------------

-- "Avise o banco" virou conselho datado: hoje a habilitação para uso no
-- exterior costuma estar no aplicativo. E faltava o furo mais comum, que é
-- chegar sem dinheiro para as primeiras horas. O item absorve o "dinheiro
-- local", que não precisa de linha própria.
update public.requirement_templates
set title = 'Organizar os meios de pagamento',
    description = 'Leve mais de uma forma de pagar: cartões de emissores diferentes, '
                  'guardados em lugares separados, e alguma quantia em dinheiro para as '
                  'primeiras horas — transporte do aeroporto e uma refeição. No aplicativo '
                  'do banco, confira o limite disponível e se o cartão está habilitado '
                  'para uso no exterior.'
where code = 'payment-methods';

-- Planejar orçamento é planejar a viagem, e o produto responde outra pergunta:
-- o que verificar antes de viajar. `active = false` em vez de `delete` — as
-- viagens que já existem mantêm a linha gravada, porque a checklist é snapshot,
-- e a próxima edição remove o item sozinho se ninguém o tiver verificado.
update public.requirement_templates
set active = false
where code = 'budget-plan';

-- -----------------------------------------------------------------------------
-- Conectividade
-- -----------------------------------------------------------------------------

-- A descrição listava as três opções e parava aí. Falta dizer o que decide
-- entre elas e avisar do passo que dá errado de verdade: descobrir no aeroporto
-- que o aparelho não aceita eSIM, ou tentar ativar sem internet.
update public.requirement_templates
set title = 'Resolver a internet no destino',
    description = 'Escolha antes de embarcar entre eSIM, chip local ou o plano '
                  'internacional da sua operadora, comparando o preço por dia de viagem. '
                  'Se for de eSIM, confirme que o seu aparelho aceita e faça a ativação '
                  'ainda em casa, com internet — depois de embarcar fica mais difícil.'
where code = 'connectivity-plan';

-- -----------------------------------------------------------------------------
-- Bagagem
-- -----------------------------------------------------------------------------

-- O texto antigo empacotava roupa por estação, adaptador de tomada e remédio de
-- uso contínuo na mesma frase — três verificações com prazos e consequências
-- diferentes, e uma delas nem é bagagem, é saúde. Aqui fica só a lista da mala;
-- os outros dois ganham item próprio na migration seguinte.
update public.requirement_templates
set title = 'Montar a lista da mala',
    description = 'Monte a lista antes de abrir a mala: conte os dias, pense no que você '
                  'já sabe que vai fazer e separe o que usa todos os dias — carregadores, '
                  'óculos, itens de higiene. Marque o que não dá para comprar no destino: '
                  'é o que você não pode esquecer.'
where code = 'luggage-list';

-- Sobe para `recommended`: é verificação com prazo e custo — descobrir no
-- balcão custa dinheiro —, e como `informational` ficava fora justamente da
-- conta que mede preparo. A descrição passa a citar o caso que mais pega:
-- trechos em companhias diferentes, regras diferentes.
update public.requirement_templates
set description = 'No site da companhia, veja quantas peças, qual peso e quais dimensões a '
                  'sua tarifa inclui, e se a bagagem de mão está inclusa — algumas tarifas '
                  'não incluem. Se a viagem tem trechos em companhias diferentes, confira '
                  'cada uma: as regras não são as mesmas. Confira também os limites de '
                  'líquidos e o que não pode ir na mão.',
    priority = 'recommended'
where code = 'airline-luggage-rules';

-- -----------------------------------------------------------------------------
-- Viagens que já existem
--
-- A checklist de uma viagem é snapshot: `trip_requirements` guarda título,
-- descrição, prioridade e categoria como cópia própria, e a reconciliação
-- compara apenas a origem do item — template, grupo e país. Sem o retrofit
-- abaixo, duas pessoas com a mesma viagem veriam textos diferentes conforme a
-- data em que criaram a viagem, e ninguém entenderia por quê.
--
-- A prioridade entra junto de propósito: o progresso é recalculado a cada
-- leitura, e deixar dois regimes de prioridade convivendo é pior que a mudança.
-- -----------------------------------------------------------------------------

-- Descrição, prioridade e categoria.
--
-- A descrição não é sobrescrita quando o item tem fonte oficial: ali vale a
-- observação da regra de visto — "permanência de até 90 dias para turismo" diz
-- mais do que qualquer texto genérico —, e foi ela que gerou o item.
update public.trip_requirements r
set description = case when r.source_name is null then t.description else r.description end,
    priority    = t.priority,
    category    = t.category
from public.requirement_templates t
where r.template_id = t.id;

-- Título dos itens de viagem inteira e de grupo.
--
-- Onde o template usa o marcador `{country}`, o nome do país já foi resolvido
-- na geração e não está no banco — o app é quem sabe traduzir o código. Por
-- isso estes itens ficam de fora aqui e são tratados um a um logo abaixo.
update public.trip_requirements r
set title = t.title
from public.requirement_templates t
where r.template_id = t.id
  and t.title not like '%{country}%';

-- Título dos itens por país.
--
-- Dos sete templates com marcador, só dois mudaram de título, e os dois
-- mudaram apenas o trecho anterior ao travessão. Trocar o prefixo preserva o
-- nome do país já gravado sem precisar traduzir código nenhum no banco.
update public.trip_requirements r
set title = replace(
      r.title,
      'Solicitar o visto eletrônico (e-Visa) — ',
      'Solicitar o visto eletrônico — '
    )
from public.requirement_templates t
where r.template_id = t.id
  and t.code = 'visa-evisa'
  and r.title like 'Solicitar o visto eletrônico (e-Visa) — %';

update public.trip_requirements r
set title = replace(
      r.title,
      'Solicitar a autorização eletrônica de viagem — ',
      'Solicitar a autorização eletrônica — '
    )
from public.requirement_templates t
where r.template_id = t.id
  and t.code = 'visa-eta'
  and r.title like 'Solicitar a autorização eletrônica de viagem — %';
