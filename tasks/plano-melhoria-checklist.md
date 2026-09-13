# Plano — Auditoria e melhoria do checklist

Status: **fases 1 e 2 implementadas**, em
`20260912130000_requirement_copy_rewrite.sql` e
`20260912130100_requirement_catalog_gaps.sql`. A fase 3 teve a pesquisa feita e
está registrada em [coleta-fase-3.md](coleta-fase-3.md) — a coleta contraria o
schema proposto na §9.2, então **nenhuma migration de fase 3 foi escrita**. A
fase 4 continua aberta.

Escopo: os 17 templates hoje em `requirement_templates`, a copy que chega ao
usuário, a divisão de prioridade e categoria, e o que falta no catálogo.

O diagnóstico abaixo saiu de leitura do código e das migrations, não de
suposição. Onde uma sugestão depende de fato do mundo, ela está marcada como
**pendente de fonte oficial** e não vira texto de item antes disso.

---

## 1. Resumo dos principais problemas

### 1.1 As descrições foram escritas para um espaço que não existe

Este é o achado que muda mais coisa. As descrições atuais têm uma linha porque
foram escritas como se aparecessem embaixo do título, na lista. Não aparecem.

- Na lista da viagem, [\[id\].tsx:485](src/app/(app)/trips/[id].tsx#L485) mostra
  **só o título**, em no máximo duas linhas. A descrição não é renderizada.
- A descrição só aparece no detalhe,
  [\[requirementId\].tsx:214](src/app/(app)/trips/item/[requirementId].tsx#L214),
  dentro de um `ScrollView`, **sem `numberOfLines`, sem corte**.

Ou seja: o usuário abriu o item, tocou nele de propósito, está numa tela que
rola — e recebe sete palavras. Há espaço para duas ou três frases úteis em todo
item, sem mudar uma linha de layout.

Consequência prática para todo o resto deste plano: **o título carrega a ação, a
descrição carrega o como**. Título curto e verbal; descrição com o que conferir,
onde conferir e o que muda conforme o caso.

### 1.2 Mudar a copy não alcança as viagens que já existem

`trip_requirements` guarda `title`, `description`, `priority` e `category` como
cópia própria ([init_schema.sql:154](supabase/migrations/20260905120000_init_schema.sql#L154)),
e `diffTripRequirements` compara apenas a origem do item — `template_id`,
`group_id`, `country_code` —, nunca o conteúdo
([requirement-matching.ts](src/features/trips/domain/requirement-matching.ts)).

Reescrever um template melhora só as viagens criadas **depois**. Toda migration
de copy deste plano precisa levar junto um `update ... from requirement_templates`
para as linhas já gravadas. Sem isso, duas pessoas com a mesma viagem veem
textos diferentes, e ninguém entende por quê.

### 1.3 Viagem doméstica nunca fica pronta

Depois do filtro de `trip_kind`, uma viagem inteiramente dentro do país do
passaporte não recebe **nenhum** item `required`: passaporte, exigências de
entrada, Schengen e todos os itens de visto são `international`.

E `computeTripProgress` decide assim
([trip-progress.ts](src/features/trips/domain/trip-progress.ts)):

```ts
isReady: required.length > 0 && requiredDone === required.length,
```

Sem obrigatório, `isReady` é `false` para sempre. A pessoa marca tudo o que
existe na checklist e o app continua sem dizer que ela está pronta. É um beco
sem saída de produto, não um detalhe de cálculo — e a correção certa não é mexer
no cálculo, é o catálogo ter um obrigatório doméstico (§3.1).

### 1.4 Um item está fora do escopo do produto

`budget-plan` — "Planejar o orçamento da viagem: hospedagem, transporte,
alimentação e um extra de reserva" — é planejamento de viagem, exatamente o que
o AGENTS.md diz para o MVP não virar. Não é algo a verificar antes de viajar; é
uma planilha. Sai (§4).

### 1.5 O catálogo ainda presume passaporte brasileiro em um ponto

`emergency-contacts` está preso a `passport_country_code = 'BR'` porque o texto
diz "um contato no Brasil". A própria migration registra que isso foi uma
decisão de migração, não de produto: *"reescrever não é migrar"*. Agora é a hora
de reescrever — e com isso o item volta a valer para qualquer passaporte, como
manda a regra de negócio.

### 1.6 Saúde é quase uma categoria vazia

Dois itens, um deles mal encaixado. Nada sobre vacinas, nada sobre medicamento
de uso contínuo. É a maior lacuna real do catálogo, e as duas coisas são
verificações antes de viajar — dentro do escopo, não fora.

### 1.7 Um item empacota três assuntos diferentes

`luggage-list` fala de roupa por estação, adaptador de tomada e remédio de uso
na mesma frase. São três verificações com prazos e consequências diferentes, e
uma delas (remédio) nem é bagagem, é saúde. Dividir (§2.9).

### 1.8 Os itens de visto afirmam mais do que o dado sustenta

`visa_rules` foi coletada para **turismo** — a coleta inteira
([coleta-vistos-br.md](tasks/coleta-vistos-br.md)) trata de entrada turística —,
mas nada na tela diz isso. "Você não precisa de visto para este destino" é uma
afirmação absoluta entregue a quem talvez vá trabalhar ou estudar. Não custa
nada corrigir: acrescentar "para turismo" à copy dos templates de visto. Sem
mudança de schema, sem nova coleta.

### 1.9 Duas capacidades da arquitetura estão construídas e paradas

- `requirement_templates.season`: **nenhum** template preenche.
- `scope = 'country'`: **nenhum** template usa; só o valor do enum existe.

Não é desperdício por si — mas as duas aparecem naturalmente como resposta a
lacunas deste plano, e uma delas (estação) tem um problema que precisa ser dito
antes de alguém usá-la (§6.5).

---

## 2. Itens atuais — análise um a um

Formato de cada bloco, conforme pedido: problema, novo título, nova descrição,
prioridade, categoria, escopo, decisão, necessidade de fonte, dependências.

### 2.1 `passport-validity`

| | |
| --- | --- |
| **Atual** | "Passaporte válido para toda a viagem" — *Confira a data de validade e se ainda há páginas em branco.* |
| **Problema** | "Válido para toda a viagem" está **errado como orientação**: vários destinos pedem validade além da data de saída, então um passaporte que cobre a viagem inteira ainda pode barrar a entrada. O item induz a conferir a coisa errada. |
| **Novo título** | Conferir a validade do passaporte |
| **Nova descrição** | Veja até quando seu passaporte vale e compare com a data de volta. Alguns destinos exigem validade além da data de saída, e o prazo varia conforme o país — confira nas exigências de entrada de cada destino da sua viagem. Aproveite para ver se ainda há páginas em branco para os carimbos. |
| **Prioridade** | `required` → `required` |
| **Categoria** | `documents` → `documents` |
| **Escopo** | `global` (mantém), `trip_kind = international` |
| **Decisão** | **Alterar** |
| **Fonte oficial** | Não para esta copy — ela só diz que o prazo varia e manda conferir. **Sim** se virar número por destino (§7.1). |
| **Dependências** | O número de meses por destino é a evolução natural, e é mudança de schema (§9.2). A copy acima já é útil sem ele. |

### 2.2 `country-entry-requirements`

| | |
| --- | --- |
| **Atual** | "Conferir as exigências de entrada — {country}" — *Vacinas, comprovante de hospedagem e passagem de volta pedidos na chegada.* |
| **Problema** | É uma lista de substantivos, não uma instrução: não diz onde conferir nem o que fazer com o que encontrar. E vai passar a duplicar o item de vacinas (§3.3). |
| **Novo título** | Conferir as exigências de entrada — {country} |
| **Nova descrição** | Além do visto, cada país define o que pede na chegada: comprovante de hospedagem, passagem de volta, seguro ou comprovação de recursos. Confira a lista na página oficial de imigração do destino e deixe separado o que for pedido, impresso ou no celular, junto dos seus documentos. |
| **Prioridade** | `required` → `required` |
| **Categoria** | `documents` → `documents` |
| **Escopo** | `each_country` (mantém), `international` |
| **Decisão** | **Alterar** (tirar "vacinas", que passa a ter item próprio; entrar "comprovação de recursos") |
| **Fonte oficial** | Não — o item é justamente o pedido de consulta à fonte. |
| **Dependências** | É a rede de segurança de todo destino sem regra cadastrada. Quanto mais regra específica entrar, mais este texto precisa parar de listar e começar a apontar caminho. |

### 2.3 `document-copies`

| | |
| --- | --- |
| **Atual** | "Guardar cópias digitais dos documentos" — *Deixe passaporte e reservas acessíveis mesmo sem internet.* |
| **Problema** | Não diz **o que** copiar nem **onde** deixar, e não explica por que isso importa — que é o momento em que o documento sumiu. |
| **Novo título** | Guardar cópias dos documentos e reservas |
| **Nova descrição** | Fotografe ou baixe passaporte, visto, seguro, passagens e reservas, e guarde em um lugar que abra sem internet — os arquivos baixados no celular, não só o link do e-mail. Deixe uma cópia também com alguém de confiança. Se algum documento sumir no caminho, é a cópia que acelera a segunda via. |
| **Prioridade** | `recommended` → `recommended` |
| **Categoria** | `documents` → `documents` |
| **Escopo** | `global` (mantém), sem `trip_kind` |
| **Decisão** | **Alterar** — e este item passa a ser o dono do "acesso offline", que hoje disputa espaço com conectividade (§2.8). |
| **Fonte oficial** | Não. |

### 2.4 `travel-insurance`

| | |
| --- | --- |
| **Atual** | "Contratar seguro viagem" — *Compare a cobertura médica e o período da apólice.* |
| **Problema** | Não diz o que olhar na comparação, e não menciona que em alguns destinos o seguro deixa de ser recomendação e vira exigência de entrada. |
| **Novo título** | Contratar o seguro viagem |
| **Nova descrição** | Compare a cobertura médica, o valor máximo por atendimento e se as datas da apólice cobrem a viagem inteira, do embarque à volta. Alguns destinos pedem seguro com valor mínimo na entrada — confira nas exigências do país antes de fechar. Depois de contratar, salve a apólice e o telefone de emergência junto das suas cópias. |
| **Prioridade** | `recommended` → `recommended` |
| **Categoria** | `health` → `health` |
| **Escopo** | `global` (mantém) |
| **Decisão** | **Alterar** |
| **Fonte oficial** | Não para a copy. **Sim** para transformar em `required` em destinos que exigem (§7.3) — aí vira regra de país, não texto. |

### 2.5 `emergency-contacts`

| | |
| --- | --- |
| **Atual** | "Anotar contatos de emergência" — *Consulado, seguradora e um contato no Brasil.* — `passport_country_code = 'BR'` |
| **Problema** | Presume passaporte brasileiro, o que contraria a regra de negócio do produto, e por causa disso **some** da checklist de quem tem outro passaporte. O texto também não diz onde anotar, que é o detalhe que faz o item funcionar. |
| **Novo título** | Anotar os contatos de emergência |
| **Nova descrição** | Anote em um lugar que abra sem internet: o telefone de emergência da seguradora e o número da apólice, o contato do consulado ou embaixada do seu país no destino, e uma pessoa de confiança que possa ajudar de longe. Vale deixar também no papel, junto dos documentos. |
| **Prioridade** | `informational` → `recommended` |
| **Categoria** | `health` → `health` (manter) |
| **Escopo** | `global`, **`passport_country_code` → `null`** |
| **Decisão** | **Alterar** |
| **Fonte oficial** | Não. |
| **Dependências** | Subir para `recommended` aumenta o denominador do progresso: é uma ação a fazer antes de viajar, não conteúdo de consulta. Sobre a categoria: `documents` seria defensável (consulado), mas o item continua ancorado na seguradora — e mover custa churn sem ganho claro. Fica em `health`. |

### 2.6 `payment-methods`

| | |
| --- | --- |
| **Atual** | "Organizar meios de pagamento" — *Leve mais de uma opção e avise o banco sobre a viagem.* |
| **Problema** | "Avise o banco" virou conselho datado — hoje a maioria dos bancos resolve isso no aplicativo, por habilitação de uso internacional. E não cobre dinheiro em espécie para a chegada, que é o furo mais comum. |
| **Novo título** | Organizar os meios de pagamento |
| **Nova descrição** | Leve mais de uma forma de pagar: cartões de emissores diferentes, guardados em lugares separados, e alguma quantia em dinheiro para as primeiras horas — transporte do aeroporto e uma refeição. No aplicativo do banco, confira o limite disponível e se o cartão está habilitado para uso no exterior. |
| **Prioridade** | `recommended` → `recommended` |
| **Categoria** | `money` → `money` |
| **Escopo** | `global` (mantém) |
| **Decisão** | **Alterar** — absorve o "dinheiro local", que não precisa de item próprio. |
| **Fonte oficial** | Não. Nenhuma afirmação sobre aceitação de cartão em país específico entra aqui: isso varia e não tem fonte oficial. |

### 2.7 `budget-plan`

Ver §4. **Remover.**

### 2.8 `connectivity-plan`

| | |
| --- | --- |
| **Atual** | "Resolver internet no destino" — *Plano internacional, eSIM ou chip local.* |
| **Problema** | Lista as três opções e para aí. Não diz o que decide entre elas, e não avisa do único passo que dá errado de verdade: descobrir no aeroporto que o aparelho não aceita eSIM, ou tentar ativar sem internet. |
| **Novo título** | Resolver a internet no destino |
| **Nova descrição** | Escolha antes de embarcar entre eSIM, chip local ou o plano internacional da sua operadora, comparando o preço por dia de viagem. Se for de eSIM, confirme que o seu aparelho aceita e faça a ativação ainda em casa, com internet — depois de embarcar fica mais difícil. |
| **Prioridade** | `recommended` → `recommended` |
| **Categoria** | `connectivity` → `connectivity` |
| **Escopo** | `global` (mantém) |
| **Decisão** | **Alterar** — e deixar o acesso offline inteiramente com `document-copies`, para os dois itens pararem de se sobrepor. |
| **Fonte oficial** | Não. |

### 2.9 `luggage-list`

| | |
| --- | --- |
| **Atual** | "Montar a lista de bagagem" — *Roupas conforme a estação, adaptador de tomada e remédios de uso.* |
| **Problema** | Três assuntos em uma frase, com prazos e riscos diferentes. Remédio de uso contínuo pode exigir receita e barrar na alfândega; adaptador é um fato do destino; roupa depende do clima. Empacotados assim, os três viram "arrumar a mala" e nenhum recebe atenção. |
| **Novo título** | Montar a lista da mala |
| **Nova descrição** | Monte a lista antes de abrir a mala: conte os dias, pense no que você já sabe que vai fazer e separe o que usa todos os dias — carregadores, óculos, itens de higiene. Marque o que não dá para comprar no destino: é o que você não pode esquecer. |
| **Prioridade** | `recommended` → `recommended` |
| **Categoria** | `luggage` → `luggage` |
| **Escopo** | `global` (mantém) |
| **Decisão** | **Dividir** — remédio sai para `health` (§3.4), adaptador vira item próprio (§3.5), clima vira item próprio (§3.6). |
| **Fonte oficial** | Não. |

### 2.10 `airline-luggage-rules`

| | |
| --- | --- |
| **Atual** | "Conferir as regras de bagagem da companhia" — *Peso, dimensões e itens que não podem ir na mão.* — `informational` |
| **Problema** | Está como `informational`, mas é uma verificação com consequência concreta e prazo: descobrir no balcão custa dinheiro. `informational` não entra no progresso, então o item fica de fora justamente da conta que mede preparo. E a descrição não menciona o caso que mais pega: trechos com companhias diferentes, regras diferentes. |
| **Novo título** | Conferir as regras de bagagem da companhia |
| **Nova descrição** | No site da companhia, veja quantas peças, qual peso e quais dimensões a sua tarifa inclui, e se a bagagem de mão está inclusa — algumas tarifas não incluem. Se a viagem tem trechos em companhias diferentes, confira cada uma: as regras não são as mesmas. Confira também os limites de líquidos e o que não pode ir na mão. |
| **Prioridade** | `informational` → **`recommended`** |
| **Categoria** | `luggage` → `luggage` |
| **Escopo** | `global` (mantém) |
| **Decisão** | **Alterar** |
| **Fonte oficial** | Não — o texto manda conferir na companhia, não afirma limite nenhum. |
| **Dependências** | Mexe em `formatReferenceLabel`, cujo comentário cita "quatro informativos". Com esta mudança e a saída de `budget-plan`, sobram dois. Atualizar o comentário. |

### 2.11 `schengen-short-stay`

| | |
| --- | --- |
| **Atual** | "Conferir o limite de 90 dias a cada 180 no Espaço Schengen" — *A permanência de curta duração soma os dias passados em todos os países do Espaço Schengen.* |
| **Problema** | Pequeno. A descrição explica a regra mas não diz o que fazer com ela. Falta a parte prática: a conta olha para trás, não só para esta viagem. |
| **Novo título** | *mantém* |
| **Nova descrição** | O limite vale para o Espaço Schengen inteiro, não para cada país: os dias somam mesmo que você troque de destino. A conta olha os 180 dias anteriores a cada entrada, então viagens recentes à região também entram. Some antes de fechar as datas. |
| **Prioridade** | `required` → `required` |
| **Categoria** | `documents` → `documents` |
| **Escopo** | `group` SCHENGEN, `international` (mantém) |
| **Decisão** | **Alterar** (só descrição) |
| **Fonte oficial** | Já tem, e é boa. **Verificar** se a descrição reescrita continua fiel à fonte antes de subir (§7.2). |

### 2.12–2.17 Os seis templates de visto

Todos `documents`, escopo `visa`, `international`. Os textos abaixo são
**reserva**: quando a regra traz `notes`, é a observação oficial que vira a
descrição do item. Ainda assim eles aparecem em todo destino sem `notes`, e
precisam se sustentar sozinhos.

**Problema comum:** nenhum diz que a resposta foi apurada para **turismo**. A
coleta inteira é turística, e o app entrega a conclusão sem a condição. Todo
texto abaixo carrega essa qualificação.

| Código | Prio. | Novo título | Nova descrição |
| --- | --- | --- | --- |
| `visa-required` | `required` | Solicitar o visto de entrada — {country} | O visto é pedido antes de viajar, no consulado ou no sistema oficial do destino. Comece por aqui: entre agendamento, documentos e emissão, costuma ser o item mais demorado da checklist. Confira a lista de documentos, a taxa e o prazo na página oficial. |
| `visa-evisa` | `required` | Solicitar o visto eletrônico — {country} | O pedido é feito online, no site oficial de imigração do destino — desconfie de sites intermediários que cobram a mais. Confira o prazo de processamento informado e peça com folga. Com o visto aprovado, leve-o impresso e salvo no celular. |
| `visa-eta` | `required` | Solicitar a autorização eletrônica — {country} | A autorização é pedida online e precisa estar aprovada antes do embarque. Peça no site oficial do destino e com alguma folga: costuma sair rápido, mas nem sempre sai na hora. Guarde o comprovante junto das suas cópias. |
| `visa-on-arrival` | `recommended` | Preparar o visto na chegada — {country} | O visto é emitido na chegada, mas dá para adiantar tudo o que ele pede: foto no formato exigido, a taxa na forma de pagamento aceita e os comprovantes de hospedagem e de volta. Confira na página oficial se o pedido pode ser adiantado online — em alguns destinos, pode. |
| `visa-free` | `informational` | Entrada sem visto — {country} | Para turismo, este destino não pede visto com o seu passaporte. Confira o tempo máximo de permanência e se a entrada exige algum cadastro online antes da chegada. |
| `visa-conditional` | `required` | Confirmar as condições de entrada — {country} | As exigências mudam conforme o seu caso: histórico de vistos, meio de transporte ou motivo da viagem. Confira na fonte oficial antes de comprar a passagem — a diferença entre uma condição e outra pode ser uma autorização online ou um visto no consulado. |

**Decisão:** alterar os seis (só copy). **Prioridades e categorias, mantidas** —
a justificativa de `visa-on-arrival` como `recommended` e de `visa-free` como
`informational` está escrita nas migrations e continua correta.

**Fonte oficial:** não para a copy genérica. A frase "desconfie de sites
intermediários" é orientação, não regra — e vale para qualquer destino com
pedido online.

---

## 3. Novos itens recomendados

Ordenados por valor. Nenhum exige schema novo — todos cabem em
`requirement_templates` como está hoje.

### 3.1 Documento de identificação em viagem doméstica — **prioridade máxima**

Resolve o beco sem saída do §1.3.

| | |
| --- | --- |
| **Código** | `domestic-photo-id` |
| **Título** | Levar o documento de identificação |
| **Descrição** | Confira qual documento a companhia aceita no embarque e se ele está dentro da validade. A lista dos documentos aceitos está no site da companhia aérea ou do órgão de aviação civil do seu país — vale conferir antes de sair de casa. |
| **Prioridade** | `required` |
| **Categoria** | `documents` |
| **Escopo** | `global`, **`trip_kind = domestic`** |
| **Fonte** | Não para esta copy. Ela **manda conferir** em vez de listar documentos, justamente porque a lista muda por país e por companhia. Listar seria inventar. |

### 3.2 Visto de trânsito na conexão

| | |
| --- | --- |
| **Código** | `transit-requirements` |
| **Título** | Conferir as exigências da escala |
| **Descrição** | Se a sua viagem tem conexão em outro país, confira se ele exige visto ou autorização mesmo para quem só troca de avião. A regra é do país da escala, não do destino final, e pode mudar conforme o aeroporto e o tempo de conexão. |
| **Prioridade** | `recommended` |
| **Categoria** | `documents` |
| **Escopo** | `global`, `trip_kind = international` |
| **Fonte** | Não — é um pedido de verificação. |
| **Dependência** | O TripReady **não modela voos nem escalas**, e não deve passar a modelar. Por isso este item só pode ser um lembrete global, nunca uma regra por país. Se um dia houver rota, ele vira `country`. |

### 3.3 Vacinas por destino

| | |
| --- | --- |
| **Código** | `vaccination-requirements` |
| **Título** | Conferir as vacinas — {country} |
| **Descrição** | Veja na página oficial de saúde ou de imigração do destino se alguma vacina é exigida na entrada e quais são recomendadas. Cheque cedo: algumas vacinas precisam de mais de uma dose ou de um tempo até fazer efeito, e o comprovante pode ser pedido na chegada. |
| **Prioridade** | `recommended` |
| **Categoria** | `health` |
| **Escopo** | `each_country`, `trip_kind = international` |
| **Fonte** | Não para esta copy. **Sim** para virar `required` em destino específico (§7.4). |
| **Dependência** | Sai "vacinas" de `country-entry-requirements` (§2.2) na mesma migration, senão duplica. |

Por que `recommended` e não `required`: sem regra coletada, o app não sabe se
aquele destino exige alguma. `required` afirmaria uma exigência que não foi
apurada — e, pior, deixaria a viagem "não pronta" por uma exigência que talvez
não exista. Quando houver regra com fonte, ela entra como `country` + `required`.

### 3.4 Medicamentos de uso contínuo

| | |
| --- | --- |
| **Código** | `medication-plan` |
| **Título** | Separar os medicamentos de uso contínuo |
| **Descrição** | Leve a quantidade para toda a viagem, com folga, na bagagem de mão e na embalagem original. Leve também a receita ou um relatório do médico: alguns países controlam a entrada de determinadas substâncias, inclusive de remédios que você compra sem receita em casa. Se usa algum controlado, confira as regras do destino antes de embarcar. |
| **Prioridade** | `recommended` |
| **Categoria** | `health` |
| **Escopo** | `global` |
| **Fonte** | Não — nenhuma substância é nomeada, nenhum país é nomeado. A frase "alguns países controlam" é verdadeira e genérica; o item manda conferir. |
| **Observação** | O texto evita de propósito citar "sem receita no Brasil": presumiria passaporte brasileiro. |

### 3.5 Tomada e voltagem

| | |
| --- | --- |
| **Código** | `power-adapter` |
| **Título** | Conferir tomada e voltagem do destino |
| **Descrição** | Veja qual é o padrão de tomada do destino e leve o adaptador certo. Confira também a voltagem: carregadores de celular e notebook costumam aceitar as duas, mas secador e barbeador nem sempre. |
| **Prioridade** | `recommended` |
| **Categoria** | `luggage` |
| **Escopo** | `global`, `trip_kind = international` |
| **Fonte** | Não para esta copy. **Sim** se um dia disser o tipo de tomada de cada país (§7.5) — e aí é `country`. |

### 3.6 Clima nas datas da viagem

| | |
| --- | --- |
| **Código** | `destination-weather` |
| **Título** | Conferir o clima para as datas da viagem |
| **Descrição** | Olhe a previsão e a média da época para cada destino antes de escolher as roupas. Em viagens que passam por mais de um país ou por mais de uma estação, a diferença pode ser grande dentro da mesma mala. |
| **Prioridade** | `recommended` |
| **Categoria** | `luggage` |
| **Escopo** | `global` |
| **Fonte** | Não. |
| **Observação** | Deliberadamente **não** usa `season` — ver §6.5. |

### 3.7 Nome na passagem

| | |
| --- | --- |
| **Código** | `ticket-name-match` |
| **Título** | Conferir o nome na passagem |
| **Descrição** | Compare o nome impresso na passagem com o do passaporte, letra por letra, incluindo todos os sobrenomes e a ordem deles. Correções costumam ser possíveis, mas ficam mais caras perto da viagem — quanto antes você olhar, melhor. |
| **Prioridade** | `recommended` |
| **Categoria** | `documents` |
| **Escopo** | `global`, `trip_kind = international` |
| **Fonte** | Não. |

### 3.8 Avaliados e **não** recomendados agora

| Ideia | Por que fica de fora |
| --- | --- |
| Comprovação de recursos financeiros | Quando é exigência, é exigência **de entrada**: pertence a `country-entry-requirements` (já citada na nova copy) e, com fonte, vira regra de país. Item próprio duplicaria. |
| Dinheiro local / câmbio | Absorvido por `payment-methods`. Item próprio não acrescenta ação. |
| Autorização de viagem de menor | Importante e real, mas o TripReady não modela **quem** viaja — só para onde. Sem essa dimensão, o item apareceria para todo mundo e seria ruído para a maioria. Fica registrado como dependência de produto. |
| Mapas offline | Fronteira do escopo. Baixar mapa é dica de viajante, e o produto não deve virar guia. Se entrar algum dia, entra como uma linha dentro de conectividade, nunca como item. |
| Mala de mão com uma troca de roupa | Dica de viajante clássica, mas é dica. Não vira obrigação nem item. |

---

## 4. Itens a remover ou consolidar

### 4.1 Remover: `budget-plan`

Fora do escopo declarado do produto (§1.4). É `informational`, então sair não
mexe em progresso de ninguém.

**Como remover, sem apagar histórico:** `active = false` no template, não
`delete`. As viagens que já existem mantêm a linha gravada (é snapshot), o item
para de nascer em viagem nova, e a próxima edição de uma viagem existente o
remove sozinho — `diffTripRequirements` só descarta itens de catálogo **não
verificados**, então ninguém perde trabalho já feito.

### 4.2 Consolidações

| Sai de | Entra em |
| --- | --- |
| "acesso offline" em `connectivity-plan` | `document-copies` (§2.3) |
| "dinheiro local" (não existia como item) | `payment-methods` (§2.6) |
| "vacinas" em `country-entry-requirements` | `vaccination-requirements` (§3.3) |
| "adaptador" e "remédios" em `luggage-list` | `power-adapter` e `medication-plan` |

### 4.3 Nada mais sai

Os demais 16 itens têm função. O catálogo é pequeno e enxuto; o problema dele
nunca foi excesso, foi profundidade.

---

## 5. Catálogo proposto — visão final

23 linhas, 22 ativas: 17 atuais + 7 novos, com `budget-plan` inativado.

| # | Código | Categoria | Prioridade | Escopo | `trip_kind` | Situação |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `passport-validity` | documents | required | global | international | copy |
| 2 | `country-entry-requirements` | documents | required | each_country | international | copy |
| 3 | `visa-required` | documents | required | visa | international | copy |
| 4 | `visa-evisa` | documents | required | visa | international | copy |
| 5 | `visa-eta` | documents | required | visa | international | copy |
| 6 | `visa-conditional` | documents | required | visa | international | copy |
| 7 | `visa-on-arrival` | documents | recommended | visa | international | copy |
| 8 | `visa-free` | documents | informational | visa | international | copy |
| 9 | `schengen-short-stay` | documents | required | group | international | copy |
| 10 | `domestic-photo-id` | documents | **required** | global | **domestic** | **novo** |
| 11 | `document-copies` | documents | recommended | global | — | copy |
| 12 | `transit-requirements` | documents | recommended | global | international | **novo** |
| 13 | `ticket-name-match` | documents | recommended | global | international | **novo** |
| 14 | `travel-insurance` | health | recommended | global | — | copy |
| 15 | `vaccination-requirements` | health | recommended | each_country | international | **novo** |
| 16 | `medication-plan` | health | recommended | global | — | **novo** |
| 17 | `emergency-contacts` | health | **recommended** | global | — | copy + tira BR |
| 18 | `payment-methods` | money | recommended | global | — | copy |
| 19 | `connectivity-plan` | connectivity | recommended | global | — | copy |
| 20 | `luggage-list` | luggage | recommended | global | — | copy |
| 21 | `airline-luggage-rules` | luggage | **recommended** | global | — | copy + prioridade |
| 22 | `power-adapter` | luggage | recommended | global | international | **novo** |
| 23 | `destination-weather` | luggage | recommended | global | — | **novo** |
| — | ~~`budget-plan`~~ | money | — | — | — | **inativado** |

**Efeito no tamanho da checklist.** Viagem internacional para um país: hoje
cerca de 12 itens, depois cerca de 17. Dentro do razoável, e a tela já agrupa
por categoria e por origem — nada vira parede de texto.

**Efeito na categoria `money`:** fica com um item só. É honesto: dinheiro tem
pouca coisa a **verificar antes de viajar** que não seja planejamento. Melhor
uma categoria enxuta do que inflada com itens de planner.

---

## 6. Lacunas por categoria — auditoria

### 6.1 Documentos — a mais completa, com dois furos

| Ponto pedido na auditoria | Situação |
| --- | --- |
| Passaporte / identidade | Coberto internacional; **faltava doméstico** → §3.1 |
| Validade | Coberto, mas com orientação errada → §2.1 |
| Visto / autorização eletrônica | Bem coberto, 6 tipos, com fonte por par |
| Comprovantes | Dentro de `country-entry-requirements` |
| Cópias | Coberto → §2.3 |
| Requisitos específicos de entrada | Coberto como rede de segurança |
| **Trânsito / conexões** | **Faltava** → §3.2 |
| Nome na passagem | **Faltava** → §3.7 |

### 6.2 Saúde — a mais fraca

| Ponto | Situação |
| --- | --- |
| Seguro viagem | Coberto, copy fraca → §2.4 |
| **Vacinas** | **Ausente** → §3.3 |
| **Medicamentos** | Uma palavra dentro de bagagem → §3.4 |
| **Receitas / documentação** | **Ausente**, entra em §3.4 |
| Requisitos sanitários | Cabe em vacinas + exigências de entrada. Item próprio só com fonte e evento concreto. |

### 6.3 Dinheiro — pequena por natureza

Formas de pagamento e cartão reserva: cobertos (§2.6). Dinheiro local e câmbio:
absorvidos. Taxas e comprovação de recursos: pertencem a exigências de entrada,
com fonte. Orçamento: **fora do escopo** (§4.1).

### 6.4 Conectividade — completa depois da divisão

eSIM/roaming em §2.8; documentos offline em §2.3. Não falta nada.

### 6.5 Bagagem — e o problema da estação

Franquia (§2.10), itens restritos (§2.10), adaptador (§3.5), bagagem de mão
(§2.10), medicamento (movido para saúde), clima (§3.6).

**Sobre `season`, e por que ele continua parado.** A coluna existe e o motor
avalia, mas `seasonAt` deriva a estação **só do hemisfério** — o próprio código
admite: *"em clima tropical a estação diz pouco"*. Um item de escopo `winter`
dispararia para uma viagem ao Rio de Janeiro em julho e pediria casaco de
inverno. Errado, e errado com cara de certeza.

Enquanto não houver uma dimensão de clima por destino — e isso é dado novo, com
fonte —, o item de clima deve ser o de §3.6: manda olhar a previsão, não afirma
temperatura. **Recomendação: não criar template sazonal nenhum agora**, e deixar
essa razão escrita na migration para ninguém tentar de novo.

---

## 7. O que precisa de pesquisa e verificação oficial

Nada em §2 e §3 depende disso — toda a copy proposta manda conferir em vez de
afirmar. O que segue é o caminho para **transformar orientação em regra**, e só
deve ser feito com o mesmo rigor da coleta de vistos: fonte oficial do destino,
`verified_at` de quando uma pessoa abriu a página, e na dúvida não cadastra.

| # | Fato a apurar | Por quê | Vira o quê |
| --- | --- | --- | --- |
| 7.1 | Meses de validade de passaporte exigidos por destino, e se contam da entrada ou da saída | É a dúvida nº 1 de quem viaja, e hoje o app só sabe dizer "varia" | Coluna em `visa_rules` (§9.2) |
| 7.2 | Revisão da descrição reescrita do Schengen contra a fonte já citada | A copy nova diz mais que a antiga; precisa continuar fiel | Nada novo, só conferência |
| 7.3 | Destinos que exigem seguro viagem com valor mínimo na entrada | Transforma recomendação em obrigação onde de fato é | Template `country` + `required` |
| 7.4 | Vacinas exigidas na entrada, com atenção a febre amarela — que depende **também dos países visitados antes** | É exigência de entrada com comprovante, não recomendação | Template `country` + `required`, com fonte |
| 7.5 | Tipo de tomada e voltagem por país | Fato estável, fácil de citar | Template `country`, ou tabela de referência |
| 7.6 | **ETIAS** — data de entrada em operação | Vira 20 destinos de `visa_free` para `eta` de uma vez | `valid_until` nas linhas atuais + linhas novas com `valid_from`. O mecanismo **já existe**. |
| 7.7 | China: a isenção tem `valid_until = 2026-12-31` | Vence em menos de quatro meses | Reconferir a fonte perto da data |
| 7.8 | Marrocos, deixado de fora da coleta original | Único destino do MVP sem regra | Linha em `visa_rules` |
| 7.9 | Revalidação geral: `verified_at` de todas as linhas é `2026-09-06` | Dado de visto envelhece | Rotina de reconferência (§10, fase 4) |

**A regra que não muda:** destino sem regra cadastrada **não** gera item de
visto, e o silêncio nunca vira "não precisa de visto". Continua coberto pelo
requisito genérico de exigências de entrada.

---

## 8. Fontes oficiais sugeridas

Mesma hierarquia da coleta de vistos: **primária é o órgão do país de destino**;
o resto corrobora, nunca fundamenta.

**Entrada e vistos**
- Órgão de imigração ou chancelaria do destino — primária, obrigatória.
- Comissão Europeia, política de vistos e Espaço Schengen — para os 20 destinos Schengen e para o ETIAS.
- Portal Consular do Ministério das Relações Exteriores (gov.br/mre) — corroborativa, para detectar divergência.

**Validade de passaporte (7.1)**
- A mesma página oficial de requisitos de entrada do destino. Não existe lista global oficial; agregadores de companhia aérea **não servem** como fonte.

**Saúde (7.4)**
- Organização Mundial da Saúde — Regulamento Sanitário Internacional e a lista de países com exigência de certificado de febre amarela.
- Autoridade sanitária do destino.
- Anvisa — para o Certificado Internacional de Vacinação e Profilaxia emitido no Brasil, quando o viajante parte daqui.

**Medicamentos (§3.4)**
- Junta Internacional de Fiscalização de Entorpecentes (INCB) — orientação sobre substâncias controladas em viagem.
- Autoridade sanitária ou aduaneira do destino, para substância específica.

**Bagagem e aviação**
- Site da companhia aérea — a franquia é contratual, não regulatória.
- ANAC, para documento de embarque em voo doméstico no Brasil; órgão equivalente nos demais países.

**Tomada e voltagem (7.5)**
- IEC World Plugs.

**O que não é fonte:** blog de viagem, agência, comparador, fórum, e qualquer
página que não seja do órgão que define a regra.

---

## 9. Impacto na arquitetura

### 9.1 Fases 1 e 2 — impacto zero no schema

Toda a §2 e toda a §3 são `insert` e `update` em `requirement_templates`. Sem
tabela nova, sem coluna nova, sem RLS nova, sem mudança no motor de resolução,
sem mudança de tela.

**O que a migration de copy precisa levar junto** (§1.2): um `update` em
`trip_requirements` casando por `template_id`, para as viagens que já existem
receberem o texto novo. Sugestão de recorte:

- `title`, `description` e `category`: atualizar **sempre**.
- `priority`: atualizar **sempre** — o progresso é recalculado na leitura, e
  deixar dois regimes de prioridade convivendo é pior que a mudança.
- Itens de visto com `source_name` preenchido: **não** sobrescrever
  `description`, porque ali vale a observação oficial da regra, não o texto do
  template.

### 9.2 Fase 3 — a única mudança de schema, e é pequena

Para 7.1 (validade de passaporte por destino):

```sql
alter table public.visa_rules
  add column passport_validity_months integer,
  add column passport_validity_basis  text;  -- 'entry' | 'exit'
```

Por que em `visa_rules` e não em tabela nova: a chave já é exatamente o par
(passaporte, destino), que é a chave do fato; a fonte, a data de conferência e a
vigência já são obrigatórias ali; e o motor já carrega essas linhas. Tabela nova
seria uma segunda cópia da mesma chave, com a mesma RLS, para guardar dois
campos.

Custo a aceitar: a tabela deixa de responder só "precisa de visto?" e passa a
responder "o que este destino exige deste passaporte". Vale dizer isso no
`comment on table` em vez de fingir que não mudou.

Consequência no motor: `resolveTripRequirements` passaria a poder montar a
descrição do item de passaporte com o número do destino. É a primeira vez que um
item `global` precisaria de dado por país — e é o ponto a pensar com calma antes
de escrever. Alternativa mais simples e provavelmente melhor: manter o item
global genérico e deixar o número aparecer no item de entrada **daquele país**,
que já é por país.

**Se em algum momento uma tabela nova for criada** — vacinas, por exemplo —,
vale a checklist de RLS do AGENTS.md: `enable row level security` no mesmo
arquivo, policies por operação `to authenticated`, `grant` só de `select` para
tabela de catálogo, nada para `anon`, e o `diff` de conferência antes do
`db push`.

### 9.3 O que continua parado, de propósito

- `requirement_templates.season` — §6.5.
- `scope = 'country'` — ganha o primeiro uso na fase 3, e não antes.

### 9.4 Pontos de código a tocar

| Arquivo | Por quê |
| --- | --- |
| [trip-progress.ts](src/features/trips/domain/trip-progress.ts) | Comentário de `formatReferenceLabel` cita "quatro informativos"; passam a ser dois. Só comentário — a função conta sozinha. |
| [requirement-matching.ts](src/features/trips/domain/requirement-matching.ts) | Nada nas fases 1 e 2. |
| Telas | Nada. A descrição já renderiza inteira. |
| Testes | `requirement-matching.test.ts` — acrescentar caso de viagem doméstica recebendo o obrigatório novo. |

---

## 10. Ordem recomendada de implementação

Cada fase é entregável sozinha e não depende da seguinte.

### Fase 1 — Copy e correções (uma migration, sem schema)

A de maior retorno e menor risco.

1. Reescrever título e descrição dos 17 templates (§2).
2. `emergency-contacts`: `passport_country_code = null` e texto sem país fixo.
3. `airline-luggage-rules`: `informational` → `recommended`.
4. `emergency-contacts`: `informational` → `recommended`.
5. `budget-plan`: `active = false`.
6. Backfill de `trip_requirements` (§9.1).
7. Atualizar o comentário de `formatReferenceLabel`.
8. `npm check`.

### Fase 2 — Itens novos sem dado novo (uma migration)

9. `domestic-photo-id` — **é o que fecha o buraco de "viagem doméstica nunca
   fica pronta"**; se algo desta fase for adiantado para a fase 1, é este.
10. `vaccination-requirements` + retirar "vacinas" de `country-entry-requirements`.
11. `medication-plan`, `transit-requirements`, `ticket-name-match`,
    `power-adapter`, `destination-weather`.
12. Teste de resolução para viagem doméstica e para viagem internacional,
    conferindo contagem e prioridades.

### Fase 3 — Pesquisa e regras por país

Aqui entra trabalho humano de coleta, no molde de
[coleta-vistos-br.md](tasks/coleta-vistos-br.md). Ordem por valor:

13. Validade de passaporte por destino (7.1) — maior impacto percebido.
14. Vacinas exigidas na entrada (7.4) — maior impacto em segurança.
15. Marrocos (7.8), fechando o escopo do MVP.
16. Seguro exigido (7.3) e tomada/voltagem (7.5), se houver fôlego.

### Fase 4 — Manutenção, que é permanente

17. Rotina de reconferência de `verified_at`.
18. Vigiar o ETIAS (7.6) e o vencimento da isenção chinesa (7.7) — o mecanismo
    de vigência já existe, falta a data.

---

## 11. Fora de escopo, registrado

Levantado na auditoria e deliberadamente não proposto: roteiro, restaurantes,
atrações, reservas, mapas como funcionalidade, orçamento, feed, chat e conteúdo
turístico. O checklist continua respondendo uma pergunta só:

> Você diz para onde vai. O TripReady mostra o que precisa verificar antes de viajar.
