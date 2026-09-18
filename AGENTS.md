# TripReady — Development Guidelines

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Stack

React Native · Expo · Expo Router · TypeScript · Supabase (PostgreSQL) · npm

Estrutura atual em `src/`: `app/` (rotas), `features/` (domínios: auth, trips, passports), `components/ui/`, `services/` (acesso a dados), `lib/`, `theme/`, `constants/`, `types/`.

## Código

- Usar TypeScript corretamente e evitar `any`.
- Preferir componentes simples e reutilizáveis.
- Evitar duplicação de lógica.
- Não criar abstrações ou camadas desnecessárias para o MVP.
- Manter a lógica de negócio separada da UI quando isso melhorar a reutilização/testabilidade.
- Respeitar a estrutura existente antes de criar novas pastas ou padrões.
- Preferir componentes nativos da plataforma (ex.: `@expo/ui`) a reimplementações customizadas em JS.
- Não faça comentários no código, exceto se for extremamente necessário, e comentário curtos se precisar.

### Comentários

O limite prático é **três linhas**. Acima disso, o comentário virou texto e
precisa ser cortado ou movido para `tasks/`.

Um comentário só se justifica quando explica **por que** o código é daquele
jeito e a resposta não está no próprio código — uma armadilha de plataforma, uma
decisão que parece errada até ser explicada, um valor que veio de fora.

Nunca comentar:

- o que o nome da função, do tipo ou da constante já diz;
- justificativa de produto ou de design que não muda a leitura do código;
- histórico ("antes era assim", "isto substituiu aquilo") — quem guarda isso é
  o git;
- banners de seção (`// ===== Catálogo =====`) — se o arquivo precisa de
  divisórias, ele precisa é de ser dividido.

Comentário e código envelhecem juntos: ao alterar um trecho, conferir se o que
está escrito acima dele ainda é verdade.

## Antes de implementar

1. Verificar se já existe componente, função ou serviço reutilizável.
2. Reutilizar o que existe em vez de duplicar.
3. Fazer a menor alteração necessária para resolver o problema.
4. Não alterar funcionalidades existentes sem necessidade.
5. Se a alteração acrescenta texto visível, conferir a seção "Idiomas".

## Qualidade

Antes de considerar uma implementação concluída, executar:

```
npm check
```

Verifica ESLint, TypeScript e Prettier.

Não esconder erros com `any`, `@ts-ignore` ou `@ts-nocheck`.

## Supabase

- Nunca expor secrets no app mobile.
- No cliente, usar apenas variáveis públicas `EXPO_PUBLIC_*`.
- Nunca usar `service_role` ou `SUPABASE_SECRET_KEY` no app.
- Respeitar RLS.
- Não alterar o schema do banco sem necessidade.

### Migrations

O app fala direto com o banco. Quem protege os dados é a policy, não o código do
cliente — uma tabela sem RLS fica aberta para qualquer usuário logado, sem erro e
sem aviso.

Toda migration que cria tabela precisa, no mesmo arquivo:

1. `enable row level security` — sem isso a tabela nasce legível e gravável,
   porque `20260905120200_table_grants.sql` deixou um `alter default privileges`
   concedendo tudo a `authenticated` em cada tabela nova do schema.
2. Policies explícitas por operação, sempre `to authenticated`, filtrando pelo
   dono (`auth.uid()` ou `is_trip_owner`).
3. `grant` só do que a tabela precisa e `revoke` do que ela não deve aceitar —
   tabela de catálogo é somente leitura para o cliente.
4. Nada para `anon`: o app não tem dado público.
5. Se a tabela guarda texto que o usuário lê, a tradução entra no mesmo
   arquivo — para os três idiomas.

`using (true)` só vale em SELECT de tabela de catálogo. Nunca em dado de usuário.

Funções: `security invoker` por padrão. `security definer` apenas quando a
operação exigir privilégio que o usuário não tem e, nesse caso, sempre com
`set search_path = ''` e `revoke execute ... from public, anon`.

Antes de `db push`, conferir que as duas listas batem:

```bash
diff \
  <(grep -h "^create table public\." supabase/migrations/*.sql | sed 's/create table public\.//;s/ (//' | sort) \
  <(grep -h "^alter table public\..*enable row level security" supabase/migrations/*.sql | sed 's/alter table public\.//;s/ enable row level security;//' | sort)
```

Os padrões são ancorados em `^` de propósito: sem isso, a mesma frase escrita no
comentário de uma migration entra na contagem e o resultado mente.

## Regras de negócio

### Viagens

Status derivado das datas, nunca armazenado no banco: `upcoming`, `in_progress`, `completed`.

Ordenação:

1. Em andamento
2. Próximas, pela data de início
3. Concluídas, pela data de término mais recente

Nunca assumir que o passaporte do usuário é brasileiro. O passaporte usado deve ser determinado pelo passaporte principal cadastrado pelo usuário. Atualmente o catálogo de regras de visto possui dados para BR, mas a arquitetura deve suportar outros países.

### Passaportes

Qualquer pessoa escolhe o país do passaporte dela na lista completa. **A lista
nunca é filtrada pela cobertura de regras** — guardar o país real é o que mantém
a viagem doméstica correta, e é o que deixa a checklist melhorar sozinha quando
as regras daquele país chegarem.

Sem passaporte principal o motor não tem como decidir nada: a viagem deixa de ser
doméstica, o próprio país do viajante passa a receber item de fronteira e nenhum
item de visto é gerado. Por isso o app exige um passaporte antes de entrar, e por
isso não existe "seguir sem informar".

O que a cobertura governa é **o que o app diz**, nunca quem entra.
`supported_passport_countries` lista os passaportes que já passaram no critério
abaixo; para os demais, a interface avisa que as regras estão em preparação — no
onboarding, na linha do Perfil e no diálogo que promove um passaporte a
principal. O aviso falha em silêncio: se a consulta não responder, não se afirma
nada.

Um passaporte só entra em `supported_passport_countries` quando cumpre as quatro
condições:

1. **Viagem doméstica coberta** — existe requisito aplicável dentro do próprio
   país. Não vem de `visa_rules`, que proíbe par com origem e destino iguais.
2. **Grupos de destino inteiros** — todo membro vigente de `destination_groups`
   precisa de regra. Grupo pela metade faz dois vizinhos com a mesma regra real
   aparecerem diferentes na checklist.
3. **Trinta destinos mais comuns** daquele passaporte, cobertos por inteiro. A
   lista mora no documento de coleta do país, com data.
4. **Piso de 75%** dos países com sugestão de cidade em
   `src/constants/cities.ts`, descontado o próprio país do passaporte.

Nada disso se deduz de `select distinct passport_country_code from visa_rules`: a
primeira regra coletada de um país não é promessa de suporte.

### Checklist

Prioridades: `required`, `recommended`, `informational`.

- `required` determina se a viagem está pronta — pronta quando todos os `required` estiverem verificados.
- `recommended` contribui para o progresso.
- `informational` não contribui para o progresso.

Manter essa lógica centralizada e reutilizável.

## Idiomas

O app fala pt-BR, inglês e espanhol. **pt-BR é o idioma canônico e o fallback
oficial**: é nele que o texto é escrito primeiro e é para ele que qualquer
ausência cai.

Todo texto que o usuário lê vem de `t()`. Nenhuma string de interface é escrita
dentro de um componente — nem rótulo, nem placeholder, nem `accessibilityLabel`,
nem título de diálogo. Uma tela ou componente novo só está pronto quando as três
traduções existem; uma chave sem `en` e `es` quebra o `npm check`.

Texto com número, data ou nome variável usa interpolação e as formas de plural
do dicionário. Nunca concatenar: `"Você tem " + n + " itens"` erra em pelo menos
um dos três idiomas. Caixa alta é escrita no dicionário, nunca produzida por
`toUpperCase()` ou `textTransform`.

A camada de domínio não produz texto. Ela devolve o que aconteceu — um `kind`,
um `issue`, um `tone`, uma contagem — e a apresentação decide como dizer. É o
que garante que o idioma nunca altere a regra de negócio: nenhuma decisão pode
depender de uma string traduzida, e nenhuma comparação, validação ou consulta
pode usar texto de interface como chave.

Dado estrutural não se traduz: `country_code`, `priority`, `category`, `scope`,
`visa_requirement_type`, datas, ids e códigos continuam como estão, em qualquer
idioma. Conteúdo criado pelo usuário também não: o nome que alguém deu à viagem
é dele, e trocar o idioma da interface não reescreve nada que a pessoa digitou.
O mesmo vale para o que ela escolheu de uma lista e ficou gravado como texto —
a cidade de uma viagem foi gravada no idioma em que a escolha aconteceu e
continua assim; quem é localizada é a lista de sugestões, não a linha já salva.

O texto do catálogo mora no banco, em tabelas `*_translations`, e é lido em
lote — uma requisição trazendo o idioma ativo e o pt-BR juntos, com cache local.
Nunca uma consulta por item, por componente ou por render, e nunca tradução em
tempo de execução por serviço externo. Toda migration que insere linha de
catálogo insere as três traduções no mesmo arquivo.

O servidor devolve código, o cliente traduz: uma Edge Function responde
`{ error: 'invalid_session' }`, nunca uma frase pronta. Por isso o idioma só
precisa viajar para o servidor onde ele produz texto — hoje, a consulta do
catálogo, e lá ele é valor de filtro. Idioma não é claim de token: o token é
identidade, dura uma hora e não acompanha a troca instantânea que a pessoa faz
no Perfil.

A preferência de idioma fica em dois lugares com papéis diferentes: o valor
local manda no que a tela desenha, e `profiles.locale` acompanha a conta.
`null` nessa coluna significa "segue o aparelho" e não deve ser preenchido por
detecção — só por escolha da pessoa.

## UX

O TripReady é simples, claro, mobile-first, orientado à ação e positivo.

- Evitar mensagens negativas ou técnicas para o usuário.
- Toda mensagem deve indicar claramente o próximo passo.
- Não transformar o MVP em um planejador de viagens completo.
- Evitar funcionalidades fora do escopo atual sem necessidade.

## Commits

- Não faça commit automatico após uma alteração, mas quando for solicitado para fazer um commit, utilize o convetional commits, em português.
- Sempre claro, objetivo e curto, mas não deixe faltar informação.
- Pode usar tópicos se necessário.

## Documentos de trabalho

`tasks/` guarda só o que ainda está em aberto: plano em execução, avaliação sem
decisão tomada, coleta de dados em andamento. Plano concluído sai da pasta —
o que ele decidiu já está no código e nas migrations, e o histórico está no git.

Não existe pasta `docs/`. Um documento que continua útil depois de a feature
ficar pronta é ou uma coleta de dados com fonte e data de conferência, que
permanece em `tasks/` porque será retomada, ou uma regra de como o projeto
trabalha, que pertence a este arquivo.

Ao concluir ou abandonar um documento, conferir se alguém aponta para ele:
link quebrado dentro de `tasks/` é o sintoma mais comum de plano removido pela
metade.

## Feature organization

Organize feature code by responsibility when the feature has enough files to justify it:

- `components/` — UI específica da feature
- `domain/` — regras de negócio puras
- `data/` — acesso, persistência e normalização de dados
- `hooks/` — hooks específicos da feature
- `tests/` — testes da feature

Do not create additional layers such as services, repositories, use-cases, utils or abstractions unless there is a concrete need.
Prefer the smallest structure that keeps responsibilities clear.
