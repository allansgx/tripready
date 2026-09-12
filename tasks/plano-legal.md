# Plano — documentos legais

Política de Privacidade e Termos de Uso: o que já está pronto, o que foi
decidido e o que falta para publicar. Substitui os quatro arquivos anteriores
(levantamento, plano dos Termos e os dois rascunhos em markdown).

Status: **implementado no app; pendente de valores e de revisão jurídica.**

---

## 1. Onde o conteúdo mora

**O texto dos documentos é código.** Não existe mais cópia em markdown, de
propósito: duas versões do mesmo documento divergem, e a do app é a que as
pessoas leem.

| Peça                              | Arquivo                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| Texto dos dois documentos         | [legal-documents.ts](src/features/legal/data/legal-documents.ts)                         |
| Identidade do responsável         | `LEGAL_IDENTITY`, no mesmo arquivo                                                       |
| Renderização                      | [legal-document-view.tsx](src/features/legal/components/legal-document-view.tsx)         |
| Frase de aceite com os dois links | [legal-consent-notice.tsx](src/features/legal/components/legal-consent-notice.tsx)       |
| Telas                             | [privacidade.tsx](src/app/legal/privacidade.tsx), [termos.tsx](src/app/legal/termos.tsx) |
| Gerador do site público           | [build-legal-site.mjs](scripts/build-legal-site.mjs), saída em `site/` (§3.2)            |

As rotas ficam em `src/app/legal/`, registradas no layout raiz **fora dos grupos
protegidos**. O motivo: `(app)` só é montado com sessão e `(auth)` só sem ela, e
os documentos precisam ser alcançáveis dos dois lados. Hoje chegam por três
caminhos — Perfil → Legal, tela de login e tela de cadastro.

## 2. Decisões tomadas

| Decisão                | Definição                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| Responsável legal      | Pessoa jurídica — o MEI existente                                                                 |
| Login por e-mail/senha | Permanece na versão pública                                                                       |
| Confirmação de e-mail  | Ligada                                                                                            |
| Serviço de e-mail      | Padrão do Supabase no MVP, sem SMTP próprio                                                       |
| Plano Supabase         | Free, **sem backup configurado** — a exclusão é definitiva, sem cópia a expirar                   |
| Região                 | `aws-0-us-west-2` (EUA) — **há transferência internacional**                                      |
| Idade mínima           | **16 anos**, declarada nos Termos, sem verificação de idade no app                                |
| País do passaporte     | **Dado pessoal comum**, nunca classificado como sensível                                          |
| Foto de perfil         | Mantida, declarada como conveniência                                                              |
| Analytics              | Nenhum no MVP; se entrar, avaliado e declarado **antes** do uso                                   |
| Direitos do titular    | Exclusão no app; demais direitos por canal de contato, sem tela e sem prazo além do legal         |
| Afiliados              | Só tráfego por link; nenhum dado pessoal enviado a parceiro no MVP, sem prometer que nunca mudará |

Sobre a idade: 16 anos é cláusula contratual, **não** classificação de loja. O
app não tem conteúdo adulto e a classificação segue na faixa baixa. No
questionário da App Store, atenção à pergunta sobre acesso irrestrito à web: o
TripReady abre um conjunto curado de links no navegador do sistema e não embute
navegador, então **não** é acesso irrestrito.

## 3. Bloqueiam a publicação — quatro valores

1. **Razão social** e **CNPJ** do MEI.
2. **E-mail de contato.** Peso maior que o normal: é por ele que acesso,
   correção e portabilidade são exercidos.
3. **Domínio** e a URL pública estável dos documentos — ver §3.1.
4. **Foro** — a comarca.

### 3.1 O que as lojas exigem de fato

| Documento               | App Store                                                         | Google Play                                      |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------ |
| Política de Privacidade | **Obrigatória**, com URL pública e também acessível dentro do app | **Obrigatória**, com URL pública no Play Console |
| Termos de Uso           | Não exigidos. Sem EULA próprio, vale o padrão da Apple            | Não exigidos                                     |

A URL da Política precisa abrir **sem login**, responder de verdade quando o
revisor clicar e continuar no ar depois da publicação. O acesso dentro do app já
está resolvido em Perfil → Legal.

Termos só viram exigência da Apple em app com assinatura, o que não é o caso.

**Ainda assim os dois devem ser publicados**, por três razões:

1. **Os próprios documentos prometem isso.** Tanto a Política quanto os Termos
   afirmam que a versão vigente fica sempre disponível no domínio. Publicar sem
   site torna a frase falsa — ou o site existe, ou essas frases mudam.
2. **A App Store exige uma Support URL** no cadastro do app, então um endereço
   próprio já é necessário de qualquer forma. Hospedar as duas páginas nele não
   acrescenta custo.
3. **Quem ainda não instalou não consegue ler o documento de dentro do app.**

Uma página estática simples resolve — o conteúdo sai de
[legal-documents.ts](src/features/legal/data/legal-documents.ts), que continua
sendo a fonte. Se as duas cópias existirem, definir qual manda (§6).

### 3.2 O site público — gerado, aguardando os valores

**As cinco páginas já existem em `site/`**, geradas por
[build-legal-site.mjs](scripts/build-legal-site.mjs) a partir do mesmo
[legal-documents.ts](src/features/legal/data/legal-documents.ts) que alimenta o
app. Não há segunda cópia do texto para manter em dia: mudou o documento, roda-se
o gerador.

```
npm run site
```

| Página                   | Para que serve                                              |
| ------------------------ | ----------------------------------------------------------- |
| `index.html`             | Porta de entrada, com links para as demais                  |
| `privacidade.html`       | URL da Política exigida pelas duas lojas                    |
| `termos.html`            | Torna verdadeira a frase que os documentos já afirmam       |
| `suporte.html`           | **Support URL** exigida pela App Store                      |
| `exclusao-de-conta.html` | **URL de exclusão de conta** exigida pelo Google Play (§10) |

**O app não é publicado.** O que sobe é a pasta `site/`, que tem só HTML e CSS —
nada de React, nada de bundle, nenhuma chave do Supabase. O `src/` continua sendo
código-fonte, não conteúdo servido.

Na Vercel: **Root Directory** `site`, sem build command, output no próprio
diretório. Como os HTML são versionados, a plataforma apenas serve arquivos.

#### ⚠️ Pendência antes de apontar o domínio

As páginas foram geradas **de propósito com os marcadores visíveis**, para que a
estrutura ficasse pronta antes de os valores existirem. Hoje `{{RAZAO_SOCIAL}}`,
`{{CNPJ}}`, `{{EMAIL_CONTATO}}`, `{{DOMINIO}}` e `{{DATA_VIGENCIA}}` aparecem no
texto publicável — e `{{FORO}}` nos Termos.

Quando os valores da §3 existirem:

1. substituir em `LEGAL_IDENTITY`, em
   [legal-documents.ts](src/features/legal/data/legal-documents.ts);
2. rodar `npm run site` — ele avisa no fim quais marcadores ainda restam;
3. conferir que `grep -r "{{" site/` não devolve nada;
4. só então apontar o domínio.

**Nenhum domínio público deve apontar para `site/` enquanto o passo 3 não passar.**
Uma página legal com `{{CNPJ}}` à mostra é pior do que página nenhuma, e o
revisor da loja abre esse link.

## 4. Revisão jurídica — três pontos específicos

Este material é levantamento de produto e não substitui parecer. O que mais
precisa de olhar profissional:

1. **A cláusula de limitação de responsabilidade** (seção 10 dos Termos). Em
   relação de consumo esse tipo de cláusula tem limites no CDC, e o texto atual
   já ressalva direitos irrenunciáveis — mas é o ponto mais sensível do
   documento.
2. **As bases legais** de cada finalidade. A leitura de produto é que conta,
   autenticação, viagens e checklist se sustentam na execução do contrato.
3. **O fundamento da transferência internacional**, já que o banco está nos EUA.

## 5. Antes de lançar — respostas que não são de documento

1. **CNAE do MEI.** Confirmar com o contador se a ocupação cobre disponibilizar
   o app e receber comissão de afiliados. Não bloqueia publicar os documentos;
   bloqueia o primeiro link de afiliado gerar receita.
2. **SMTP próprio.** Com a confirmação de e-mail ligada, o serviço padrão do
   Supabase — poucas mensagens por hora, sem garantia de entrega — vira a porta
   de entrada do produto. Sustenta teste, não cadastro aberto ao público.
3. **Backup.** Hoje não existe. Simplifica a Política e é risco operacional: se
   passar a existir, a seção de retenção precisa ser reescrita.
4. **Retenção de logs** do plano Free — consulta de painel.
5. **Cadastro não confirmado expira?** Conta criada e nunca confirmada permanece
   indefinidamente.
6. **Viagem concluída** deve ser apagada depois de um tempo?
7. **EAS Update, push ou e-mail não transacional** — cada um acrescenta
   tratamento a declarar.
8. **Cidades da viagem**: viram funcionalidade ou ficam como conveniência
   declarada? Hoje são gravadas e nenhuma regra do catálogo é por cidade.
9. **Edição de nome e foto** entra no escopo? Correção é direito do titular, por
   ora atendido pelo canal de contato.
10. **Atualização das regras de visto**: existe processo? O `verified_at` será
    mostrado ao usuário?

## 6. Processo dos documentos

- **Versão canônica**: [legal-documents.ts](src/features/legal/data/legal-documents.ts).
  O site é gerado a partir dele, então app e web não têm como divergir — o que
  elimina a pergunta de "qual manda". Só volta a existir se alguém editar o HTML
  à mão, o que não deve acontecer: a próxima geração desfaz.
- **Comunicação de nova versão**: por ora só a data no topo. Aviso dentro do app
  exigiria versionamento.
- **Registro de aceite**: fora do escopo. O aceite é implícito, sem data guardada
  por usuário — guardar exigiria coluna nova e é, ele próprio, tratamento de dado.

## 7. Pendência de código

Os comentários que marcam o login por e-mail/senha como **TEMPORÁRIO** em
[auth-service.ts](src/features/auth/auth-service.ts) e
[login.tsx](<src/app/(auth)/login.tsx>) — inclusive a instrução "para remover:
apague estes três métodos" — contradizem a decisão de manter esse caminho na
versão pública, e vão induzir a erro quem ler depois.

Opcional: um aviso em `__DEV__` quando sobrar marcador `{{` em `LEGAL_IDENTITY`,
como rede de segurança contra publicar com as chaves em tela.

## 8. Mapa de dados

Serve para preencher os formulários de privacidade da App Store (Nutrition
Labels) e do Google Play (Data Safety), que precisam ficar **coerentes com a
Política publicada** — divergência é motivo de rejeição.

| Dado                           | Origem                                     | Onde fica                                    | Finalidade                                      | Compartilhado com                    |
| ------------------------------ | ------------------------------------------ | -------------------------------------------- | ----------------------------------------------- | ------------------------------------ |
| Nome de exibição               | Google, Apple ou digitado no cadastro      | Serviço de autenticação (Supabase)           | Personalizar o app                              | Ninguém                              |
| E-mail                         | Google, Apple (pode ser relay) ou digitado | Serviço de autenticação                      | Identificar a conta, login, confirmação e reset | Serviço de e-mail padrão do Supabase |
| Foto de perfil (URL)           | Google. Apple nunca envia                  | Serviço de autenticação (só a URL)           | Avatar no Perfil e na aba                       | Google (a imagem é carregada de lá)  |
| Senha                          | Digitada no cadastro por e-mail            | Serviço de autenticação, com hash            | Autenticação                                    | Ninguém                              |
| Token de confirmação de e-mail | Gerado no cadastro                         | Serviço de autenticação e a caixa de entrada | Confirmar o endereço antes de ativar a conta    | Serviço de e-mail padrão do Supabase |
| Identificador do usuário       | Gerado pelo Supabase                       | Banco                                        | Ligar cada linha ao dono e aplicar o isolamento | Ninguém                              |
| Tokens de sessão               | Supabase Auth                              | **No aparelho**                              | Manter o login entre aberturas                  | Ninguém                              |
| País do passaporte             | Escolhido pela pessoa                      | Banco                                        | Determinar as regras de entrada aplicáveis      | Ninguém                              |
| Viagens (nome, datas)          | Digitadas pela pessoa                      | Banco                                        | Identificar a viagem e calcular o status        | Ninguém                              |
| Países e cidades               | Escolhidos pela pessoa                     | Banco                                        | Gerar a checklist e casar as regras de visto    | Ninguém                              |
| Itens da checklist             | Catálogo ou criados pela pessoa            | Banco                                        | A checklist e o progresso                       | Ninguém                              |
| IP e user agent                | Inerente a qualquer requisição             | Logs da infraestrutura                       | Operação e segurança                            | Supabase (operador)                  |
| IP ao abrir um link            | Inerente à navegação                       | No servidor do terceiro                      | Nada, do lado do TripReady                      | O site aberto                        |

**Não é coletado**, e vale declarar: número, validade ou imagem do passaporte;
dados biométricos; saúde; religião; opinião política; orientação sexual;
quaisquer outros dados sensíveis; localização; identificadores de publicidade.
Não há analytics, crash reporting nem rastreamento de qualquer tipo.

**Terceiros a declarar:** Supabase (banco, autenticação, Edge Function de
exclusão e e-mail transacional), Google e Apple (só quando o login social é
escolhido) e as próprias lojas.

A App Store exige que um app com login ofereça exclusão de conta — o TripReady
**já cumpre**, em Perfil → Excluir conta.

## 9. Ordem para publicar

1. Fechar os quatro valores da §3 e substituí-los em `LEGAL_IDENTITY`.
2. Revisão jurídica, com atenção aos três pontos da §4.
3. Rodar `npm run site` e conferir que nenhum `{{` sobrou.
4. Publicar a pasta `site/` e obter a URL estável.
5. Cadastrar as URLs: Política e suporte na App Store; Política e **exclusão de
   conta** no Play Console.
6. Preencher os formulários de privacidade a partir da §8 e da §10.2.

## 10. Conformidade com as lojas

### 10.1 Exclusão de conta — as duas lojas, exigências diferentes

| Loja        | O que exige                                                           | Situação                    |
| ----------- | --------------------------------------------------------------------- | --------------------------- |
| App Store   | Exclusão **iniciada dentro do app**, não só um pedido por e-mail      | ✅ Perfil → Excluir conta   |
| Google Play | O mesmo **mais uma URL pública** onde a exclusão possa ser solicitada | ✅ `exclusao-de-conta.html` |

A exigência do Google costuma passar batido porque parece redundante. Não é: a
URL existe para quem **já desinstalou** o aplicativo e não tem como abrir a tela
de Perfil. Ela é declarada no Play Console, em App content → Data deletion, e
precisa dizer o que é apagado e o que é retido — é exatamente o conteúdo da
página.

No nosso caso a resposta de retenção é a mais simples possível: **nada é
retido**, porque não há backup (§2).

### 10.2 Formulários de privacidade

Nutrition Labels (App Store) e Data safety (Google Play) saem da §8. Precisam
ficar **coerentes com a Política publicada** — divergência entre formulário e
documento é motivo de rejeição, e é o erro mais comum nessa etapa.

Pontos que o TripReady responde bem e vale não errar por distração:

- **Nenhum rastreamento.** Sem analytics, sem identificador de publicidade, sem
  SDK de terceiro coletando nada. Nos dois formulários isso é "não".
- **Dados vinculados à conta**, e não anônimos: e-mail, nome, foto, país do
  passaporte, viagens e checklist.
- **Dados trafegam cifrados** (HTTPS) e o usuário pode solicitar exclusão.

### 10.3 Já atendido, sem ação necessária

- **Sign in with Apple**: a App Store o exige quando o app oferece login social
  de terceiros; o TripReady oferece Google **e** Apple.
- **Política acessível dentro do app**, e não apenas na ficha da loja.
- **Classificação etária**: nada de conteúdo adulto. Ver §2 sobre a pergunta de
  acesso irrestrito à web, que é onde um app inocente costuma se prejudicar.
- **Links de afiliado** são permitidos nas duas lojas; o que elas cobram é
  transparência, que está na seção 8 dos Termos e na 8 da Política.

### 10.4 A verificar fora do escopo dos documentos

**Privacy manifest do iOS.** Desde 2024 a Apple exige que o app declare o motivo
de uso de certas APIs ("required reason APIs") e liste SDKs de rastreamento. O
`AsyncStorage`, usado para guardar a sessão, apoia-se em `NSUserDefaults`, que
está nessa lista. Bibliotecas atuais do Expo e do React Native já trazem o
próprio manifesto, então **provavelmente não há nada a fazer** — mas isso se
confirma no primeiro build de submissão, não aqui. É requisito de build, não de
documento; anotado para não ser descoberto na primeira rejeição.
