/**
 * Identidade do responsável. Os valores entre chaves duplas ainda não foram
 * definidos, e nenhum pode ir para a loja com o marcador.
 */
export const LEGAL_IDENTITY = {
  companyName: '{{RAZAO_SOCIAL}}',
  cnpj: '{{CNPJ}}',
  contactEmail: '{{EMAIL_CONTATO}}',
  website: '{{DOMINIO}}',
  jurisdiction: '{{FORO}}',
  effectiveDate: '{{DATA_VIGENCIA}}',
} as const;

/** Trechos entre `**` saem em negrito. */
export type LegalBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'subheading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: readonly string[] };

export type LegalDocument = {
  title: string;
  version: string;
  effectiveDate: string;
  blocks: readonly LegalBlock[];
};

export const privacyPolicy: LegalDocument = {
  title: 'Política de Privacidade',
  version: '1.0',
  effectiveDate: LEGAL_IDENTITY.effectiveDate,
  blocks: [
    {
      kind: 'paragraph',
      text: 'O TripReady ajuda você a organizar o que precisa preparar antes de viajar. Para montar uma checklist que faça sentido para a sua viagem, o aplicativo precisa saber pouca coisa sobre você — e esta política explica exatamente o quê, por quê e o que você pode fazer a respeito.',
    },

    { kind: 'heading', text: '1. Quem é responsável pelos seus dados' },
    {
      kind: 'paragraph',
      text: `O TripReady é oferecido por **${LEGAL_IDENTITY.companyName}**, inscrita no CNPJ sob o número ${LEGAL_IDENTITY.cnpj}, que atua como controladora dos dados pessoais tratados no aplicativo.`,
    },
    {
      kind: 'paragraph',
      text: `Para qualquer assunto relacionado a privacidade, incluindo o exercício dos seus direitos, o canal é **${LEGAL_IDENTITY.contactEmail}**.`,
    },

    { kind: 'heading', text: '2. Quais dados o TripReady trata' },
    { kind: 'subheading', text: 'Dados da sua conta' },
    {
      kind: 'list',
      items: [
        '**Nome de exibição**, usado para personalizar o aplicativo.',
        '**Endereço de e-mail**, que identifica a sua conta.',
        '**Foto de perfil**, quando você entra com o Google e ele a disponibiliza. Se você entra com a Apple, não há foto e o aplicativo mostra um avatar padrão.',
        '**Senha**, apenas se você criar a conta com e-mail e senha. Ela é guardada de forma cifrada pelo serviço de autenticação e não é legível por nós.',
        'Um **identificador interno** que liga as suas informações à sua conta.',
      ],
    },
    { kind: 'subheading', text: 'Dados que você cadastra para montar a checklist' },
    {
      kind: 'list',
      items: [
        '**O país do passaporte** que você usa para viajar, e qual deles é o principal quando você cadastra mais de um.',
        '**As suas viagens**: o nome que você dá a cada uma, as datas, os países e as cidades escolhidas.',
        '**A sua checklist**: os itens gerados para a viagem, os itens que você mesmo criar e quais deles você marcou como verificados.',
      ],
    },
    { kind: 'subheading', text: 'Dados guardados no seu aparelho' },
    {
      kind: 'paragraph',
      text: 'Para você não precisar entrar de novo a cada vez que abre o aplicativo, o TripReady mantém as credenciais da sua sessão no próprio aparelho. Elas não são enviadas a ninguém e desaparecem quando você sai da conta.',
    },
    { kind: 'subheading', text: 'O que o TripReady não coleta' },
    {
      kind: 'paragraph',
      text: 'Vale dizer com todas as letras, porque é uma escolha de produto e não um esquecimento. O aplicativo **não coleta**:',
    },
    {
      kind: 'list',
      items: [
        'número do passaporte;',
        'validade do passaporte;',
        'foto ou cópia do passaporte;',
        'dados biométricos;',
        'informações de saúde;',
        'religião;',
        'opinião política;',
        'orientação sexual;',
        'quaisquer outros dados pessoais sensíveis;',
        'a sua localização;',
        'identificadores de publicidade.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'O TripReady **não usa ferramentas de análise de uso, rastreamento ou publicidade** e não acompanha o seu comportamento dentro ou fora do aplicativo. Se isso mudar algum dia, esta política será atualizada **antes** de a mudança entrar no ar.',
    },
    {
      kind: 'paragraph',
      text: 'Sobre o país do passaporte: ele indica qual documento você usa para viajar e é o que permite saber quais regras de entrada se aplicam a você. É tratado como dado pessoal comum.',
    },

    { kind: 'heading', text: '3. Como o TripReady obtém esses dados' },
    {
      kind: 'list',
      items: [
        '**Quando você entra com Google ou Apple.** A autenticação acontece no navegador do seu aparelho ou na tela do próprio sistema, e o TripReady nunca tem acesso à sua senha desses serviços. Recebemos apenas o nome, o endereço de e-mail e, no caso do Google, a foto. Se você optar por ocultar seu e-mail ao entrar com a Apple, receberemos o endereço de redirecionamento que a Apple cria para você.',
        '**Quando você cria uma conta com e-mail e senha.** Nesse caso enviamos uma mensagem para o endereço informado, com um link de confirmação, para termos certeza de que o e-mail é mesmo seu. A conta é ativada quando você confirma.',
        '**Quando você usa o aplicativo.** É você quem escolhe o país do passaporte, cria as viagens e marca os itens da checklist.',
        '**Quando o aplicativo monta a sua checklist.** Os itens são gerados a partir do passaporte principal, dos destinos e do período da viagem.',
      ],
    },

    { kind: 'heading', text: '4. Para que os dados são usados' },
    {
      kind: 'list',
      items: [
        '**E-mail e senha** — identificar a sua conta, permitir a entrada e recuperar o acesso.',
        '**Nome e foto** — personalizar o aplicativo para você.',
        '**País do passaporte** — determinar quais regras de entrada se aplicam a você em cada destino.',
        '**Viagens, datas e destinos** — montar a checklist certa e mostrar em que etapa cada viagem está.',
        '**Itens da checklist** — guardar o que já foi verificado e calcular o progresso da viagem.',
        '**Sessão no aparelho** — manter você conectado entre uma abertura e outra.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Esses tratamentos são necessários para prestar o serviço que você pediu ao criar a conta. **O TripReady não usa seus dados para publicidade, para criar perfis de comportamento nem para qualquer finalidade diferente das descritas aqui.**',
    },

    { kind: 'heading', text: '5. Por quanto tempo os dados ficam guardados' },
    {
      kind: 'paragraph',
      text: 'Enquanto a sua conta existir, as suas viagens e a sua checklist continuam disponíveis para você — inclusive as viagens já concluídas, que seguem no histórico até que você as apague.',
    },
    {
      kind: 'paragraph',
      text: 'Quando você exclui a conta, os dados são **apagados de forma permanente no momento da exclusão**. Não há cópia de segurança de onde eles possam ser recuperados depois.',
    },
    {
      kind: 'paragraph',
      text: 'Se você criar uma conta e nunca confirmar o e-mail, o cadastro permanece registrado, sem dados de viagem, até que você o conclua ou solicite a remoção pelo canal de contato.',
    },
    {
      kind: 'paragraph',
      text: 'Registros técnicos de operação e segurança mantidos pela infraestrutura que hospeda o serviço seguem as políticas do provedor descrito na seção 7.',
    },

    { kind: 'heading', text: '6. Onde os dados ficam armazenados' },
    {
      kind: 'paragraph',
      text: 'As informações da sua conta e das suas viagens ficam em servidores operados pelo **Supabase**, localizados nos **Estados Unidos**. Isso significa que há transferência internacional dos seus dados pessoais.',
    },
    {
      kind: 'paragraph',
      text: 'A empresa responsável pelo TripReady continua sendo a controladora dessas informações e responde por elas, independentemente de onde estejam armazenadas.',
    },

    { kind: 'heading', text: '7. Com quem os dados são compartilhados' },
    {
      kind: 'paragraph',
      text: '**O TripReady não vende os seus dados pessoais e não os compartilha com parceiros comerciais.**',
    },
    {
      kind: 'paragraph',
      text: 'Existem apenas os seguintes envolvidos, cada um com uma função específica:',
    },
    {
      kind: 'list',
      items: [
        '**Supabase** — armazena as informações e cuida da autenticação, atuando como operador em nome do TripReady. É também o serviço que envia as mensagens de confirmação de cadastro e de redefinição de senha.',
        '**Google** e **Apple** — apenas quando você escolhe entrar por eles. Nesse caso, o provedor sabe que você autenticou no TripReady porque foi você quem autorizou. Quando o aplicativo exibe a sua foto do Google, ela é carregada diretamente dos servidores do Google.',
        '**App Store e Google Play** — distribuem o aplicativo, segundo as políticas de cada loja.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Também poderemos compartilhar informações quando houver obrigação legal ou ordem de autoridade competente, no limite do que for exigido.',
    },

    { kind: 'heading', text: '8. Links para outros sites' },
    {
      kind: 'paragraph',
      text: 'Alguns itens da checklist trazem links, e eles são de dois tipos:',
    },
    {
      kind: 'list',
      items: [
        '**Fontes oficiais** — a página do órgão de imigração ou da chancelaria que determina a exigência.',
        '**Sugestões de onde resolver o item** — por exemplo, empresas de seguro viagem ou de eSIM.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Parte dessas sugestões é de **links de afiliado**, o que significa que o TripReady pode receber uma comissão se você contratar por ali, **sem nenhum custo adicional para você**. Essa comissão não influencia o que a checklist diz que você precisa verificar: a exigência vem da fonte oficial, e a sugestão é apenas onde resolvê-la.',
    },
    {
      kind: 'paragraph',
      text: 'Em todos os casos, o link abre no navegador do seu aparelho e **o TripReady não envia nenhum dado seu para esses sites**. O que eles enxergam é o que qualquer visita a uma página revela, como o seu endereço de IP. A partir do momento em que você sai do aplicativo, valem as políticas de privacidade de cada site.',
    },
    {
      kind: 'paragraph',
      text: 'Se um dia passarmos a enviar alguma informação sua a um parceiro — por exemplo, para uma cotação feita dentro do aplicativo —, esta política será atualizada antes.',
    },

    { kind: 'heading', text: '9. Segurança' },
    {
      kind: 'paragraph',
      text: 'O TripReady trata a proteção dos seus dados como parte do produto, não como detalhe de implementação:',
    },
    {
      kind: 'list',
      items: [
        'cada pessoa só acessa as próprias informações, e essa regra é aplicada no banco de dados, e não apenas nas telas;',
        'o aplicativo não carrega nenhuma chave capaz de acessar dados de terceiros;',
        'a autenticação usa os fluxos seguros oferecidos pelo Google, pela Apple e pelo serviço de autenticação, e a sua senha nunca trafega para dentro do aplicativo;',
        'a exclusão de conta só pode atingir a conta de quem a solicitou.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Nenhum serviço pode prometer segurança absoluta, mas mantemos as medidas adequadas ao tipo de informação tratada e revisamos essas medidas conforme o produto evolui.',
    },

    { kind: 'heading', text: '10. Como excluir a sua conta e os seus dados' },
    { kind: 'paragraph', text: 'Você pode apagar tudo sem precisar falar com ninguém:' },
    {
      kind: 'paragraph',
      text: '**Perfil → Excluir conta.** O aplicativo pede que você digite uma palavra de confirmação e, ao concluir, remove de forma permanente o seu perfil, os seus passaportes, as suas viagens, os destinos e as checklists. A ação é **irreversível** e não deixa cópia.',
    },
    {
      kind: 'paragraph',
      text: 'Você também pode apagar apenas uma viagem, pela tela dela. Nesse caso os destinos e a checklist daquela viagem são apagados junto, e o restante da sua conta continua como está.',
    },

    { kind: 'heading', text: '11. Os seus direitos' },
    {
      kind: 'paragraph',
      text: 'A Lei Geral de Proteção de Dados garante a você, entre outros, o direito de:',
    },
    {
      kind: 'list',
      items: [
        'confirmar se tratamos dados seus e acessá-los;',
        'corrigir dados incompletos, inexatos ou desatualizados;',
        'solicitar a anonimização, o bloqueio ou a eliminação de dados desnecessários ou tratados em desconformidade com a lei;',
        'solicitar a portabilidade dos seus dados;',
        'ser informado sobre com quem compartilhamos seus dados;',
        'revogar consentimento, quando o tratamento se basear nele.',
      ],
    },
    {
      kind: 'paragraph',
      text: `**A exclusão da sua conta você faz sozinho, direto no aplicativo**, como descrito na seção 10. Para os demais pedidos, escreva para **${LEGAL_IDENTITY.contactEmail}**: confirmamos o recebimento, verificamos que o pedido parte do titular da conta e respondemos no prazo previsto na legislação.`,
    },

    { kind: 'heading', text: '12. Uso por menores de idade' },
    {
      kind: 'paragraph',
      text: 'O TripReady é destinado a pessoas com **16 anos ou mais** e não é direcionado a crianças. Não coletamos intencionalmente dados de quem esteja abaixo dessa idade. Se identificarmos um cadastro nessas condições, ou se um responsável nos avisar pelo canal de contato, a conta e os dados associados serão removidos.',
    },

    { kind: 'heading', text: '13. Mudanças nesta política' },
    {
      kind: 'paragraph',
      text: `O TripReady continua evoluindo, e esta política acompanha essa evolução. Quando houver alteração, a data no topo do documento é atualizada e a versão vigente fica sempre disponível em ${LEGAL_IDENTITY.website} e aqui mesmo, em **Perfil → Legal → Política de Privacidade**.`,
    },
    {
      kind: 'paragraph',
      text: 'Mudanças relevantes na forma como tratamos seus dados serão comunicadas antes de entrar em vigor.',
    },

    { kind: 'heading', text: '14. Fale com a gente' },
    {
      kind: 'paragraph',
      text: `Dúvidas, pedidos relacionados aos seus direitos ou qualquer assunto sobre privacidade: **${LEGAL_IDENTITY.contactEmail}**.`,
    },
    {
      kind: 'paragraph',
      text: 'Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).',
    },
  ],
};

export const termsOfUse: LegalDocument = {
  title: 'Termos de Uso',
  version: '1.0',
  effectiveDate: LEGAL_IDENTITY.effectiveDate,
  blocks: [
    {
      kind: 'paragraph',
      text: 'Estes termos explicam o que o TripReady faz, o que ele não faz e o que se espera de cada lado. Ao criar uma conta e usar o aplicativo, você concorda com o que está aqui.',
    },

    { kind: 'heading', text: '1. O que é o TripReady' },
    {
      kind: 'paragraph',
      text: 'O TripReady é um aplicativo de organização de viagens. Ele reúne, em uma checklist, o que você precisa verificar antes de viajar, considerando o passaporte que você cadastrou, os destinos escolhidos e o período da viagem — e mostra, sempre que existir, o link para a fonte oficial de cada exigência.',
    },
    {
      kind: 'paragraph',
      text: '**O que o TripReady não é**, e isso é importante que fique claro:',
    },
    {
      kind: 'list',
      items: [
        'não é autoridade governamental, consulado nem órgão de imigração;',
        'não é companhia aérea, agência de viagens ou despachante;',
        'não presta consultoria jurídica;',
        'não emite, solicita nem intermedeia vistos ou documentos;',
        '**não garante a sua entrada em nenhum país.**',
      ],
    },
    {
      kind: 'paragraph',
      text: 'As informações do aplicativo são uma **orientação para ajudar você a se preparar**. A palavra final é sempre da fonte oficial e da autoridade do país de destino.',
    },

    { kind: 'heading', text: '2. Como a checklist funciona' },
    {
      kind: 'paragraph',
      text: 'Os itens da sua checklist são montados a partir de um catálogo de regras, cruzando o passaporte principal que você cadastrou, os países da viagem, o período e, em alguns casos, o fato de o destino pertencer a um grupo de países com regras comuns.',
    },
    { kind: 'paragraph', text: 'Cada item tem uma prioridade:' },
    {
      kind: 'list',
      items: [
        '**Obrigatório** — conta para dizer se a viagem está pronta;',
        '**Recomendado** — contribui para o seu progresso;',
        '**Informativo** — aparece para você saber, sem afetar o progresso.',
      ],
    },
    { kind: 'paragraph', text: 'Dois pontos que valem entendimento:' },
    {
      kind: 'list',
      items: [
        '**A checklist é um retrato do momento em que foi criada.** Se uma regra mudar depois, os itens já gerados para a sua viagem não se reescrevem sozinhos.',
        '**Você pode criar os seus próprios itens**, que não vêm do catálogo e são de responsabilidade exclusivamente sua.',
      ],
    },

    { kind: 'heading', text: '3. A sua responsabilidade' },
    { kind: 'paragraph', text: 'Ao usar o TripReady, você se compromete a:' },
    {
      kind: 'list',
      items: [
        '**conferir os requisitos oficiais aplicáveis à sua viagem** antes de viajar, usando os canais oficiais de cada país;',
        'manter corretos os dados que alimentam a checklist, especialmente **o passaporte principal** — é ele que determina quais regras de entrada são aplicadas;',
        'considerar que existem situações pessoais que o aplicativo não conhece e que podem mudar completamente o que é exigido de você: dupla nacionalidade, país de residência, vistos ou recusas anteriores, motivo e duração da viagem, entre outras.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Marcar todos os itens como verificados significa que **você** os verificou. Não é uma aprovação do TripReady nem uma garantia de que nada mais será exigido.',
    },

    { kind: 'heading', text: '4. Atualidade das informações' },
    {
      kind: 'paragraph',
      text: 'As regras de entrada do catálogo são registradas a partir de fontes oficiais e guardam a data em que foram conferidas. Ainda assim, **regras de imigração mudam sem aviso prévio**, e pode haver intervalo entre uma mudança e a atualização do aplicativo.',
    },
    {
      kind: 'paragraph',
      text: 'O TripReady não promete que todo o conteúdo esteja atualizado em tempo real, e por isso insiste, em cada item, para que você confirme nos canais oficiais.',
    },

    { kind: 'heading', text: '5. Requisitos de viagem e imigração' },
    {
      kind: 'paragraph',
      text: 'A decisão sobre a sua entrada em um país é sempre da autoridade de imigração daquele país. Cumprir integralmente a checklist **não cria direito de entrada** e não impede que documentos adicionais sejam exigidos na fronteira.',
    },
    {
      kind: 'paragraph',
      text: 'A cobertura do catálogo também tem limites: a depender do passaporte cadastrado, o aplicativo pode ainda não ter regras específicas de visto para todos os destinos. Quando não houver item de visto na sua checklist, isso **não significa** que o visto seja dispensado — significa que você precisa verificar diretamente na fonte oficial.',
    },

    { kind: 'heading', text: '6. Fontes oficiais' },
    {
      kind: 'paragraph',
      text: 'Sempre que uma exigência tem um órgão responsável, o aplicativo mostra o link para a página oficial correspondente.',
    },
    {
      kind: 'paragraph',
      text: '**Havendo qualquer divergência entre o que o TripReady apresenta e o que diz a fonte oficial, prevalece a fonte oficial.**',
    },

    { kind: 'heading', text: '7. Links e serviços de terceiros' },
    {
      kind: 'paragraph',
      text: 'O aplicativo traz links para sites de terceiros, que abrem no navegador do seu aparelho. Esses serviços não são operados pelo TripReady.',
    },
    {
      kind: 'paragraph',
      text: 'Contratação, pagamento, cobertura, atendimento, cancelamento e qualquer obrigação decorrente são relação direta entre você e a empresa escolhida, sob os termos dela. O TripReady não controla a disponibilidade, o conteúdo ou o preço desses sites.',
    },

    { kind: 'heading', text: '8. Sugestões comerciais e links de afiliado' },
    {
      kind: 'paragraph',
      text: 'Alguns itens da checklist trazem sugestões de onde resolver aquela exigência, como seguro viagem ou eSIM. Parte desses links é de afiliado: **o TripReady pode receber uma comissão caso você contrate por ali, sem custo adicional para você.** É assim que o aplicativo se sustenta, e o aviso aparece na própria tela sempre que houver uma indicação desse tipo.',
    },
    { kind: 'paragraph', text: 'Três compromissos sobre isso:' },
    {
      kind: 'list',
      items: [
        '**A comissão não influencia o que a checklist exige de você.** A exigência vem da regra oficial; a sugestão é apenas onde resolvê-la. Uma coisa não altera a outra.',
        '**Estar entre as sugestões não é recomendação técnica** nem garantia de que aquele serviço atende às exigências do seu destino. Conferir isso continua sendo parte da sua verificação.',
        '**Nenhum dado pessoal seu é enviado a esses parceiros.** O aplicativo apenas abre o link.',
      ],
    },

    { kind: 'heading', text: '9. A sua conta' },
    {
      kind: 'paragraph',
      text: 'Para usar o TripReady você precisa criar uma conta, e ao fazê-lo você concorda em:',
    },
    {
      kind: 'list',
      items: [
        'ter **16 anos ou mais**;',
        'fornecer informações verdadeiras;',
        'manter a segurança do seu acesso, incluindo a conta do Google ou da Apple usada para entrar e o próprio aparelho;',
        'usar a conta para você — ela é pessoal.',
      ],
    },

    { kind: 'heading', text: '10. Limitação de responsabilidade' },
    {
      kind: 'paragraph',
      text: `O TripReady é oferecido como ferramenta de apoio à organização de viagens, e não como garantia de resultado. Na máxima extensão permitida pela legislação aplicável, **${LEGAL_IDENTITY.companyName} não se responsabiliza por**:`,
    },
    {
      kind: 'list',
      items: [
        'viagem impedida, embarque negado ou entrada recusada em qualquer país;',
        'visto negado, atrasado ou exigido de forma diferente da apresentada;',
        'prejuízos decorrentes de informação desatualizada, incompleta ou incorreta no catálogo;',
        'serviços contratados com terceiros por meio dos links do aplicativo;',
        'indisponibilidade temporária do serviço.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Nada nestes termos afasta direitos que a legislação consumerista brasileira assegure a você de forma irrenunciável.',
    },

    { kind: 'heading', text: '11. Exclusão da conta' },
    {
      kind: 'paragraph',
      text: 'Você pode encerrar a sua conta a qualquer momento, em **Perfil → Excluir conta**. A exclusão é **permanente e irreversível**: o perfil, os passaportes, as viagens, os destinos e as checklists são apagados, sem cópia de recuperação.',
    },
    {
      kind: 'paragraph',
      text: 'Também podemos encerrar ou suspender uma conta que descumpra estes termos, em especial a seção 12, comunicando o motivo pelo canal de contato quando possível.',
    },

    { kind: 'heading', text: '12. Uso aceitável' },
    { kind: 'paragraph', text: 'Ao usar o TripReady, você concorda em não:' },
    {
      kind: 'list',
      items: [
        'extrair automaticamente, copiar ou redistribuir o conteúdo do catálogo de regras, no todo ou em parte;',
        'apresentar as informações do aplicativo como se fossem informação oficial ou emitidas por autoridade;',
        'tentar acessar dados de outras pessoas ou burlar as proteções do serviço;',
        'fazer engenharia reversa do aplicativo, salvo no que a lei permitir;',
        'inserir conteúdo ilícito, ofensivo ou de terceiros nos campos livres, como o nome das viagens e os itens que você cria.',
      ],
    },

    { kind: 'heading', text: '13. Propriedade intelectual' },
    {
      kind: 'paragraph',
      text: `A marca TripReady, a interface, os textos dos itens, a organização do catálogo e o software são de titularidade de **${LEGAL_IDENTITY.companyName}**. O conteúdo das fontes oficiais pertence a quem o publica.`,
    },
    {
      kind: 'paragraph',
      text: 'O que você cria dentro do aplicativo — o nome das suas viagens e os itens que você adiciona — continua sendo seu. Nós apenas armazenamos esse conteúdo para prestar o serviço.',
    },

    { kind: 'heading', text: '14. Privacidade' },
    {
      kind: 'paragraph',
      text: `O tratamento dos seus dados pessoais está descrito na **Política de Privacidade**, disponível em ${LEGAL_IDENTITY.website} e aqui no aplicativo, em **Perfil → Legal → Política de Privacidade**, que integra estes termos.`,
    },

    { kind: 'heading', text: '15. Mudanças nestes termos' },
    {
      kind: 'paragraph',
      text: `Estes termos podem ser atualizados para acompanhar a evolução do aplicativo. Quando isso acontecer, a data no topo é atualizada e a versão vigente fica sempre disponível em ${LEGAL_IDENTITY.website} e dentro do aplicativo. Alterações relevantes serão comunicadas antes de entrar em vigor, e continuar usando o TripReady depois disso significa concordar com a nova versão.`,
    },

    { kind: 'heading', text: '16. Lei aplicável e foro' },
    {
      kind: 'paragraph',
      text: `Estes termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de **${LEGAL_IDENTITY.jurisdiction}** para dirimir questões deles decorrentes, ressalvado o direito do consumidor de demandar no foro de seu domicílio.`,
    },

    { kind: 'heading', text: '17. Fale com a gente' },
    {
      kind: 'paragraph',
      text: `Dúvidas, sugestões ou problemas: **${LEGAL_IDENTITY.contactEmail}**.`,
    },
    {
      kind: 'paragraph',
      text: `Serviço oferecido por **${LEGAL_IDENTITY.companyName}**, CNPJ ${LEGAL_IDENTITY.cnpj}.`,
    },
  ],
};
