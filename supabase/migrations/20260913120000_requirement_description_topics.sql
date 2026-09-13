-- =============================================================================
-- TripReady — a descrição do item vira lista
--
-- As duas migrations anteriores deram fôlego às descrições, mas entregaram cada
-- uma como um parágrafo único de três a cinco frases. Na tela de detalhe isso
-- vira um bloco denso, e é justamente ali que a pessoa está procurando o
-- próximo passo: a ação fica escondida no meio da explicação.
--
-- A forma que este arquivo adota, para os 24 itens do catálogo:
--
--   * a primeira linha diz o que fazer;
--   * cada linha seguinte é uma verificação.
--
-- A tela renderiza a primeira como parágrafo e as seguintes como tópicos com
-- marcador, então a quebra de linha no texto do catálogo é o que define a
-- estrutura visual. Por isso `concat_ws(E'\n', ...)`: uma linha de SQL por
-- linha exibida, fácil de reler e de editar depois.
--
-- Uma observação oficial vinda de `visa_rules.notes` chega em uma frase só e
-- continua saindo como parágrafo simples, sem marcador — não é lista, e
-- transformá-la em uma seria inventar estrutura que a fonte não tem.
--
-- Nenhum título, prioridade, categoria ou escopo muda aqui. Só descrição.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Documentos
-- -----------------------------------------------------------------------------
update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Veja até quando o seu passaporte vale e compare com a data de volta.',
      'Alguns destinos exigem validade além da data de saída, e o prazo varia conforme o país.',
      'O prazo de cada destino está nas exigências de entrada da sua viagem.',
      'Veja também se ainda há páginas em branco para os carimbos.'
    )
where code = 'passport-validity';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Cada país define o que pede na chegada, além do visto.',
      'Os pedidos mais comuns são comprovante de hospedagem, passagem de volta, seguro e comprovação de recursos.',
      'A lista oficial está na página de imigração do destino.',
      'Deixe separado o que for pedido, impresso ou no celular, junto dos seus documentos.'
    )
where code = 'country-entry-requirements';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Guarde uma cópia de tudo que pode ser pedido na viagem.',
      'Fotografe ou baixe passaporte, visto, seguro, passagens e reservas.',
      'Deixe em um lugar que abra sem internet: o arquivo salvo no celular, não só o link do e-mail.',
      'Deixe uma cópia também com alguém de confiança.',
      'Se algum documento sumir no caminho, é a cópia que acelera a segunda via.'
    )
where code = 'document-copies';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'O limite vale para o Espaço Schengen inteiro, não para cada país.',
      'Os dias somam mesmo que você troque de destino dentro da região.',
      'A conta olha os 180 dias anteriores a cada entrada, então viagens recentes também entram.',
      'Some os dias antes de fechar as datas.'
    )
where code = 'schengen-short-stay';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Confira qual documento a companhia aceita no embarque.',
      'Veja se ele está dentro da validade.',
      'A lista dos aceitos está no site da companhia aérea ou do órgão de aviação civil do seu país.'
    )
where code = 'domestic-photo-id';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Se a sua viagem tem conexão em outro país, confira o que ele exige de quem só troca de avião.',
      'Alguns países pedem visto ou autorização mesmo em trânsito.',
      'A regra é do país da escala, não do destino final.',
      'Ela pode mudar conforme o aeroporto e o tempo de conexão.'
    )
where code = 'transit-requirements';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Compare o nome impresso na passagem com o do passaporte, letra por letra.',
      'Confira todos os sobrenomes e a ordem deles.',
      'Correções costumam ser possíveis, mas ficam mais caras perto da viagem.'
    )
where code = 'ticket-name-match';

-- -----------------------------------------------------------------------------
-- Vistos
-- -----------------------------------------------------------------------------
update public.requirement_templates
set description = concat_ws(
      E'\n',
      'O visto é pedido antes de viajar, no consulado ou no sistema oficial do destino.',
      'Comece por aqui: entre agendamento, documentos e emissão, costuma ser o item mais demorado.',
      'Confira a lista de documentos, a taxa e o prazo na página oficial.'
    )
where code = 'visa-required';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'O pedido é feito online, no site oficial de imigração do destino.',
      'Desconfie de sites intermediários que cobram a mais.',
      'Confira o prazo de processamento informado e peça com folga.',
      'Com o visto aprovado, leve-o impresso e salvo no celular.'
    )
where code = 'visa-evisa';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'A autorização é pedida online e precisa estar aprovada antes do embarque.',
      'Peça no site oficial do destino.',
      'Peça com alguma folga: costuma sair rápido, mas nem sempre sai na hora.',
      'Guarde o comprovante junto das suas cópias.'
    )
where code = 'visa-eta';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'O visto é emitido na chegada, mas dá para adiantar tudo o que ele pede.',
      'Separe a foto no formato exigido.',
      'Leve a taxa na forma de pagamento aceita.',
      'Tenha à mão os comprovantes de hospedagem e de volta.',
      'Confira na página oficial se o pedido pode ser adiantado online — em alguns destinos, pode.'
    )
where code = 'visa-on-arrival';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Para turismo, este destino não pede visto com o seu passaporte.',
      'Confira o tempo máximo de permanência.',
      'Veja se a entrada exige algum cadastro online antes da chegada.'
    )
where code = 'visa-free';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'As exigências mudam conforme o seu caso.',
      'Histórico de vistos, meio de transporte e motivo da viagem podem mudar a resposta.',
      'Confira na fonte oficial antes de comprar a passagem.',
      'A diferença entre uma condição e outra pode ser uma autorização online ou um visto no consulado.'
    )
where code = 'visa-conditional';

-- -----------------------------------------------------------------------------
-- Saúde
-- -----------------------------------------------------------------------------
update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Compare as apólices antes de fechar.',
      'Olhe a cobertura médica e o valor máximo por atendimento.',
      'Confira se as datas cobrem a viagem inteira, do embarque à volta.',
      'Alguns destinos pedem seguro com valor mínimo na entrada — confira nas exigências do país.',
      'Depois de contratar, salve a apólice e o telefone de emergência junto das suas cópias.'
    )
where code = 'travel-insurance';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Anote os contatos em um lugar que abra sem internet.',
      'Telefone de emergência da seguradora e número da apólice.',
      'Consulado ou embaixada do seu país no destino.',
      'Uma pessoa de confiança que possa ajudar de longe.',
      'Vale deixar também no papel, junto dos documentos.'
    )
where code = 'emergency-contacts';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Veja na página oficial de saúde ou de imigração do destino o que é pedido.',
      'Confira se alguma vacina é exigida na entrada e quais são recomendadas.',
      'Cheque cedo: algumas precisam de mais de uma dose ou de um tempo até fazer efeito.',
      'O comprovante pode ser pedido na chegada.'
    )
where code = 'vaccination-requirements';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Separe os remédios que você usa todo dia antes de fechar a mala.',
      'Leve a quantidade para toda a viagem, com folga.',
      'Prefira a bagagem de mão e a embalagem original.',
      'Leve também a receita ou um relatório do médico.',
      'Alguns países controlam a entrada de certas substâncias — se usa algum controlado, confira as regras do destino.'
    )
where code = 'medication-plan';

-- -----------------------------------------------------------------------------
-- Dinheiro e conectividade
-- -----------------------------------------------------------------------------
update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Leve mais de uma forma de pagar.',
      'Cartões de emissores diferentes, guardados em lugares separados.',
      'Alguma quantia em dinheiro para as primeiras horas: transporte do aeroporto e uma refeição.',
      'No aplicativo do banco, confira o limite disponível e se o cartão está habilitado para o exterior.'
    )
where code = 'payment-methods';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Escolha antes de embarcar como você vai ficar conectado.',
      'Compare eSIM, chip local e o plano internacional da sua operadora pelo preço por dia.',
      'Se for de eSIM, confirme que o seu aparelho aceita.',
      'Faça a ativação ainda em casa, com internet — depois de embarcar fica mais difícil.'
    )
where code = 'connectivity-plan';

-- -----------------------------------------------------------------------------
-- Bagagem
-- -----------------------------------------------------------------------------
update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Monte a lista antes de abrir a mala.',
      'Conte os dias e pense no que você já sabe que vai fazer.',
      'Separe o que usa todos os dias: carregadores, óculos, itens de higiene.',
      'Marque o que não dá para comprar no destino — é o que você não pode esquecer.'
    )
where code = 'luggage-list';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'As regras são da companhia e da sua tarifa, não do aeroporto.',
      'No site da companhia, veja quantas peças, qual peso e quais dimensões a sua tarifa inclui.',
      'Confira se a bagagem de mão está inclusa — algumas tarifas não incluem.',
      'Se a viagem tem trechos em companhias diferentes, confira cada uma.',
      'Veja também os limites de líquidos e o que não pode ir na mão.'
    )
where code = 'airline-luggage-rules';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Veja qual é o padrão de tomada do destino e leve o adaptador certo.',
      'Confira também a voltagem.',
      'Carregadores de celular e notebook costumam aceitar as duas, mas secador e barbeador nem sempre.'
    )
where code = 'power-adapter';

update public.requirement_templates
set description = concat_ws(
      E'\n',
      'Olhe a previsão e a média da época para cada destino antes de escolher as roupas.',
      'Em viagens por mais de um país, a diferença pode ser grande dentro da mesma mala.',
      'O mesmo vale para viagens que atravessam mais de uma estação.'
    )
where code = 'destination-weather';

-- -----------------------------------------------------------------------------
-- Viagens que já existem
--
-- Mesmo retrofit da migration de copy, e pelo mesmo motivo: `trip_requirements`
-- guarda a descrição como cópia própria, e a reconciliação compara só a origem
-- do item. Sem este `update`, as checklists já criadas ficariam com o parágrafo
-- antigo para sempre.
--
-- A descrição não é sobrescrita onde há fonte oficial: ali vale a observação da
-- regra de visto, que é uma frase e não uma lista.
-- -----------------------------------------------------------------------------
update public.trip_requirements r
set description = t.description
from public.requirement_templates t
where r.template_id = t.id
  and r.source_name is null;
