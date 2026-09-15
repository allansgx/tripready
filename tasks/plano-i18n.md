# Plano — Internacionalização do TripReady (pt-BR · en · es)

> Substitui `tasks/plano-internacionalizacao.md`, que era avaliação sem decisão
> tomada. Quando este plano for aprovado, aquele arquivo sai da pasta.

---

## 1. Resumo executivo

O TripReady fala pt-BR em quatro lugares diferentes, e cada um pede uma solução
diferente:

| Onde o texto mora                                                          | Volume aproximado                   | Estratégia                                  |
| -------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------- |
| Microcopy da UI (telas, componentes, domínio, erros)                       | ~400 chaves, ~60 arquivos           | Dicionário local, no bundle                 |
| Nomes de país                                                              | 255 nomes                           | Dataset local gerado por script             |
| Sugestões de cidade                                                        | ~375 nomes, 81 países               | Lista base + override esparso por idioma    |
| Documentos legais                                                          | ~3.800 palavras, 126 blocos, 2 docs | Um módulo por idioma, carregado sob demanda |
| Catálogo no Supabase (`requirement_templates`, grupos, `visa_rules.notes`) | 24 templates, 10 grupos, 45 regras  | Tabelas de tradução, em lote e com cache    |

A decisão central **não é qual biblioteca usar** — é onde o texto da checklist é
resolvido. Hoje `trip_requirements` **copia** o título e a descrição do template
no momento em que a viagem é criada. Enquanto isso for verdade, nenhuma tradução
alcança uma viagem já existente, e trocar de idioma deixaria metade do app em
português. A correção — guardar a origem (`template_id`, `country_code`,
`group_id`) e resolver o texto na leitura — já era necessária por outro motivo
(editar um template não alcança viagens criadas) e vira pré-requisito aqui.

O segundo ponto estrutural: **texto sai da camada de domínio**. Boa parte do
domínio já devolve estrutura junto com a frase pronta (`TripCountdown` tem
`kind`, `TripLimitResult` tem `issue`, `TripMoment` tem `tone`). O plano leva
isso até o fim: domínio devolve descritor, apresentação resolve texto. É o que
garante, por construção, que o idioma nunca altere regra de negócio — e de
quebra deixa os testes existentes independentes de idioma.

Nada é buscado na rede para renderizar uma tela. O idioma do dispositivo é lido
de forma síncrona, o dicionário está no bundle, e a abertura do app não espera
nenhuma requisição de tradução.

---

## 2. Auditoria dos textos existentes

Varredura de `src/`, `scripts/` e `supabase/migrations/`. Tudo que aparece ou
pode aparecer para o usuário final.

### 2.1 Rotas (`src/app/`)

| Arquivo                                     | Conteúdo visível                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_layout.tsx`                               | "Sua conexão oscilou.", botão "Tentar de novo"                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `(app)/_layout.tsx`                         | Rótulos e `accessibilityLabel` das abas: Início, Viagens, Perfil                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `(app)/index.tsx`                           | "Buscando sua próxima viagem...", "Sua conexão oscilou. Toque para carregar de novo.", "Carregar viagem", empty state ("Para onde você vai?", texto de apoio, "Criar viagem")                                                                                                                                                                                                                                                                                                              |
| `(app)/trips/index.tsx`                     | "Minhas viagens", "Criar nova viagem", "Buscando suas viagens...", "Carregar viagens", empty state geral, 3 empty states de filtro com rótulo de ação cada                                                                                                                                                                                                                                                                                                                                 |
| `(app)/trips/[id].tsx`                      | "Abrindo sua checklist...", "Voltar", "Opções da viagem", menu (Editar viagem / Excluir viagem / Testar lembretes / Cancelar), diálogo de exclusão (título + corpo + 2 botões), 4 avisos de falha, 2 comemorações (título + mensagem), "✓ Tudo certo com os itens obrigatórios!", "pendente"/"pendentes", `${n} item/itens`, "Sua checklist aparece aqui assim que ficar pronta.", "Atualizar checklist", `accessibilityLabel` de marcar/desmarcar/abrir item, textos do teste de lembrete |
| `(app)/trips/item/[requirementId].tsx`      | "Detalhes", "Voltar", "Este item não está mais na sua checklist.", "Voltar para a viagem", seções "O que verificar", "Opções para contratar", "Fonte oficial", aviso de afiliado, lembrete "Confirme sempre nos canais oficiais antes de viajar.", botão "✓ Marcar como verificado"/"Desmarcar item", 2 avisos de falha, `accessibilityLabel` de links                                                                                                                                     |
| `(app)/profile/index.tsx`                   | "Perfil", "Editar", seções "Legal" e "Conta", "Política de Privacidade", "Termos de Uso", "Sair", "Excluir conta"                                                                                                                                                                                                                                                                                                                                                                          |
| `(app)/profile/edit.tsx`                    | "Editar perfil", campos Nome/E-mail, placeholder, seção "Segurança", linha "Senha" + descrição, "Salvar alterações"                                                                                                                                                                                                                                                                                                                                                                        |
| `(app)/profile/password.tsx`                | "Alterar senha", 3 campos + placeholders, 3 mensagens de validação, diálogo "Senha alterada"                                                                                                                                                                                                                                                                                                                                                                                               |
| `(auth)/login.tsx`                          | "TripReady", "Entrar", "Continuar com Google", "Continuar com Apple", "Entrar com e-mail"                                                                                                                                                                                                                                                                                                                                                                                                  |
| `(auth)/email-login.tsx`                    | "Entrar", subtítulo, campos, "Preencha e-mail e senha.", "Esqueci minha senha", "Criar uma conta"                                                                                                                                                                                                                                                                                                                                                                                          |
| `(auth)/sign-up.tsx`                        | "Criar conta", subtítulo, 4 campos + placeholders, 3 validações, tela "Confirme seu e-mail" com interpolação do endereço, "Voltar para o login"                                                                                                                                                                                                                                                                                                                                            |
| `(auth)/forgot-password.tsx`                | "Recuperar senha", subtítulo, validação, mensagem de sucesso (2 frases), "Enviar link de recuperação"                                                                                                                                                                                                                                                                                                                                                                                      |
| `trip-new.tsx`                              | 4 títulos + 4 subtítulos de etapa, "Etapa X de Y", rótulo dinâmico do botão (`Continuar com N país/países`, `N cidade/cidades`, "Pular por enquanto", "Continuar"), "Nome da viagem", placeholder "Minha viagem", "Criar viagem", cabeçalhos de conferência "Datas"/"Roteiro" + "Alterar", dicas e avisos                                                                                                                                                                                  |
| `trip-edit.tsx`                             | "Editar viagem", "Para onde você vai?", subtítulo, "Concluir seleção", "Adicionar ou remover países", "Salvar alterações", "Altere algo acima para salvar.", "Viagem atualizada! 🎉", diálogo "Descartar alterações?", 2 avisos de falha, `SectionLabel` Nome/Países/Cidades/Datas                                                                                                                                                                                                         |
| `trip-preparing.tsx`                        | "Preparando sua checklist..."/"Checklist pronta! 🎉", 2 subtítulos, aviso de falha, "Continuar preparação", "Ver a viagem agora"                                                                                                                                                                                                                                                                                                                                                           |
| `passport-picker.tsx`                       | "Adicionar passaporte", diálogo "Não foi possível adicionar"                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `onboarding.tsx`                            | "Qual passaporte você usa para viajar?", diálogo "Não foi possível salvar"                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `account-deleting.tsx`                      | "Excluindo sua conta..."/"Conta excluída", mensagem de sucesso, 3 mensagens de falha por motivo                                                                                                                                                                                                                                                                                                                                                                                            |
| `auth/callback.tsx`                         | "Concluindo login..."                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `legal/privacidade.tsx`, `legal/termos.tsx` | `Versão X · em vigor desde Y`, rodapé `Versão X — Y`                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### 2.2 Componentes de UI (`src/components/ui/`)

| Arquivo                 | Conteúdo visível                                                     |
| ----------------------- | -------------------------------------------------------------------- |
| `date-range-picker.tsx` | 12 nomes de mês, 7 iniciais de dia da semana, 4 `accessibilityLabel` |
| `search-field.tsx`      | placeholder padrão "Buscar..."                                       |
| `text-field.tsx`        | "Mostrar senha" / "Ocultar senha"                                    |
| `screen-header.tsx`     | "Voltar"                                                             |
| `dialog.tsx`            | "Fechar"                                                             |
| `avatar.tsx`            | "Foto do perfil"                                                     |
| `section-label.tsx`     | **`children.toUpperCase()`** — transformação de caixa em runtime     |
| `accordion-section.tsx` | recebe `meta` já formatado ("3 itens")                               |

### 2.3 Domínio e dados de `features/trips/`

| Arquivo                              | Conteúdo                                                                                                                                                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data/checklist-catalog.ts`          | 5 rótulos de categoria, 3 rótulos de prioridade                                                                                                                                                                         |
| `data/travel-tips.ts`                | 15 dicas (~25 palavras cada)                                                                                                                                                                                            |
| `domain/trip-limits.ts`              | 3 mensagens de limite com número interpolado, dica de duração, `formatCountrySelection` (plural)                                                                                                                        |
| `domain/trip-format.ts`              | 12 abreviações de mês, 4 formatos de intervalo, 13 nomes de região, "Minha viagem", `${a} e ${b}`, `${a}, ${b} e mais N`, 4 estações (label + complemento), verbos por status (3+3), numerais por extenso, "N estações" |
| `domain/trip-progress.ts`            | 6 funções que devolvem frase pronta com plural                                                                                                                                                                          |
| `domain/trip-status.ts`              | `buildTripMoment` (6 rótulos) e `buildTripCountdown` (5 combinações de mensagem + legenda)                                                                                                                              |
| `domain/requirement-matching.ts`     | `TRIP_SECTION_LABEL = 'Toda a viagem'`, `localeCompare(…, 'pt-BR')` na ordenação de seções                                                                                                                              |
| `components/next-trip-hero.tsx`      | "💡 Dica da viagem", 3 títulos de seção, 4 rótulos de próximo passo, 2 frases de estado, "Verificar"/"Abrir", `accessibilityLabel` compostos                                                                            |
| `components/trip-card.tsx`           | "Pronta 🎉"                                                                                                                                                                                                             |
| `components/trip-filter-bar.tsx`     | 4 rótulos de filtro                                                                                                                                                                                                     |
| `components/city-step.tsx`           | "Nenhuma cidade ainda", "Cidades a definir neste país.", 2 placeholders, 3 `accessibilityLabel`                                                                                                                         |
| `components/date-range-summary.tsx`  | "IDA"/"VOLTA", "a escolher", "Escolha a data de ida no calendário.", "Agora toque na data de volta.", `N dia/dias de viagem`, "Limpar"                                                                                  |
| `components/celebration-overlay.tsx` | "Continuar", "Fechar comemoração"                                                                                                                                                                                       |
| `components/trip-country-chips.tsx`  | `e mais N destino/destinos`                                                                                                                                                                                             |

### 2.4 Auth, passaportes, notificações, legal

| Arquivo                                                      | Conteúdo                                                                                                                                                          |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/auth/auth-errors.ts`                               | 7 mensagens por texto do GoTrue + 3 por `code` + 1 por prefixo + fallback                                                                                         |
| `features/auth/password.ts`                                  | 5 rótulos de regra de senha + 3 rótulos de força                                                                                                                  |
| `features/auth/email.ts`                                     | 3 mensagens de validação, uma com interpolação de domínio                                                                                                         |
| `features/auth/delete-account.ts`                            | **`DELETE_CONFIRMATION_WORD = 'Excluir'`** — palavra traduzível usada como validação                                                                              |
| `features/auth/delete-account-modal.tsx`                     | "Excluir conta", aviso com trecho em negrito, rótulo e placeholder do campo, 2 botões                                                                             |
| `features/auth/user-profile.ts`                              | fallback "Usuário", rótulos de provedor                                                                                                                           |
| `features/auth/auth-service.ts`                              | mensagens de `Error` internas (não exibidas diretamente)                                                                                                          |
| `features/passports/passports-context.tsx`                   | 3 mensagens de `PassportRuleError` (essas chegam à tela)                                                                                                          |
| `features/passports/passport-messages.ts`                    | fallback "Sua conexão oscilou. Tente de novo."                                                                                                                    |
| `features/passports/passports-section.tsx`                   | "Passaportes", "Adicionar passaporte", "Principal", "Definir como principal", "Remover passaporte", `Remover {país}?`, diálogos de bloqueio, "Cancelar", "Fechar" |
| `features/passports/country-picker-list.tsx`                 | 2 placeholders de busca, "Nenhum destino/país encontrado para "X"."                                                                                               |
| `features/notifications/domain/trip-reminders.ts`            | 2 títulos de notificação, 4 corpos com plural e contagem                                                                                                          |
| `features/notifications/data/reminder-scheduler.ts`          | nome do canal Android "Lembretes de viagem" (visível nos ajustes do sistema)                                                                                      |
| `features/notifications/components/reminder-opt-in-card.tsx` | título, corpo, "Ativar lembretes", "Agora não"                                                                                                                    |
| `features/legal/data/legal-documents.ts`                     | 2 documentos, 126 blocos, ~3.800 palavras                                                                                                                         |
| `features/legal/components/legal-consent-notice.tsx`         | frase de aceite composta com 2 links                                                                                                                              |

### 2.5 Serviços (`src/services/`)

Todos passam um `context` em português para `unwrap`/`unwrapRequired` (~25
frases: "Tente carregar suas viagens novamente", "Falha ao listar passaportes"…).
Na prática nenhuma chega à tela — as telas capturam a exceção e mostram texto
próprio. São **mensagens de diagnóstico**, não UI: ficam fora do i18n, e a
auditoria precisa confirmar que nenhuma tela renderiza `error.message` de
`DataAccessError`.

### 2.6 Dados e scripts fora de `src/`

| Arquivo                        | Conteúdo                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/constants/countries.ts`   | 255 nomes de país em pt-BR                                                                                                           |
| `src/constants/cities.ts`      | ~375 cidades em 81 países, com exônimos em pt-BR (Munique, Pequim, Nova Délhi)                                                       |
| `scripts/build-legal-site.mjs` | tagline, 5 páginas HTML com texto próprio (índice, suporte, exclusão de conta), `<html lang="pt-BR">`, nomes de arquivo em português |
| `supabase/migrations/*`        | conteúdo do catálogo — ver §8                                                                                                        |

### 2.7 Textos montados dinamicamente (levantamento completo)

São os que não podem virar concatenação ingênua:

- `Continuar com ${n} ${n === 1 ? 'país' : 'países'}` e a versão de cidades
- `${done} de ${total} ${total === 1 ? 'item verificado' : 'itens verificados'}`
- `${done}/${total} ${total === 1 ? 'item' : 'itens'}`
- `${pending} ${pending === 1 ? 'item pendente' : 'itens pendentes'}`
- `${n} obrigatório/obrigatórios` + `pendente/pendentes` (duas concatenações na mesma linha)
- `${n} informação/informações para consultar quando precisar.`
- `${n} ${n === 1 ? 'dia' : 'dias'}` em quatro lugares diferentes
- `Começa em ${days} dias` / `Começa em ${months} ${months === 1 ? 'mês' : 'meses'}`
- `volta em ${n} dias`, "volta amanhã", "último dia"
- `Dia ${day} de ${total}`, `de ${total} dias`
- `${count === 1 ? '1 lembrete a caminho' : count + ' lembretes a caminho'}`
- `Você ainda tem ${n} item(ns) obrigatório(s) para revisar.`
- `e mais ${n} ${n === 1 ? 'destino' : 'destinos'}`
- `${n} de ${MAX} países` / `${n} país(es) selecionado(s)`
- `Etapa ${i} de ${n}`
- `Remover ${nomeDoPaís}?`, `Abrir ${títuloDoItem}`, `Marcar ${título} como verificado`
- `Enviamos um link de confirmação para ${email}.`
- `Você quis dizer @${dominio}?`
- `Versão ${v} · em vigor desde ${data}`
- `Digite ${PALAVRA} para confirmar`
- Datas: `15–30 jun 2026`, `28 dez 2026 – 3 jan 2027`, `A partir de …`, `Até …`
- Estações: `Você vai viajar no inverno`, `Sua viagem passa por três estações`

---

## 3. Classificação dos conteúdos

| Arquivo / origem                                                                                                                                        | Conteúdo                                                     | Categoria             | Origem       | Estratégia                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------- | ------------ | -------------------------------------------------------------------------- |
| `src/app/**`, `src/components/ui/**`                                                                                                                    | rótulos, títulos, botões, placeholders, `accessibilityLabel` | **A. UI static**      | código       | chave em `messages/<locale>.ts`                                            |
| `trip-progress.ts`, `trip-status.ts`, `trip-limits.ts`, `trip-format.ts`                                                                                | frases com número, plural, data, estação                     | **B. Dynamic UI**     | código       | domínio devolve descritor; UI resolve com `t(key, { count })`              |
| `travel-tips.ts`                                                                                                                                        | 15 dicas                                                     | A                     | código       | chaves `tips.<id>`; o `id` continua sendo a chave estável                  |
| `checklist-catalog.ts`                                                                                                                                  | categorias e prioridades                                     | A                     | código       | rótulo por chave; `CATEGORY_ICONS` e a ordem **não** mudam                 |
| `countries.ts`                                                                                                                                          | 255 nomes                                                    | A                     | código       | dataset por idioma; `code` continua sendo a identidade                     |
| `cities.ts`                                                                                                                                             | ~375 sugestões                                               | A                     | código       | lista base + override esparso por idioma                                   |
| `legal-documents.ts`                                                                                                                                    | 2 documentos                                                 | **F. Legal**          | código       | um módulo por idioma, versionado contra o pt-BR                            |
| `trips.name`                                                                                                                                            | nome da viagem                                               | **C. User-generated** | banco        | **nunca traduzido**                                                        |
| `trip_cities.city_name`                                                                                                                                 | cidade escolhida ou digitada                                 | C (ver §9)            | banco        | **nunca traduzido**                                                        |
| `trip_requirements.title/description` de item com `template_id` nulo                                                                                    | texto do usuário                                             | C                     | banco        | **nunca traduzido**                                                        |
| `country_code`, `priority`, `category`, `scope`, `season`, `trip_kind`, `visa_requirement_type`, status derivado, datas, ids, `destination_groups.code` | —                                                            | **D. Structured**     | banco/código | **nunca traduzido**; continuam sendo a chave de tudo                       |
| `requirement_templates.title` / `.description`                                                                                                          | 24 títulos + 24 descrições em tópicos                        | **E. Database**       | banco        | `requirement_template_translations`                                        |
| `destination_groups.name` / `.description`                                                                                                              | 10 grupos                                                    | E                     | banco        | `destination_group_translations`                                           |
| `visa_rules.notes`                                                                                                                                      | 45 observações oficiais                                      | E                     | banco        | `visa_rule_translations`                                                   |
| `visa_rules.source_name`, `requirement_templates.source_name`                                                                                           | nome do órgão oficial                                        | E (parcial)           | banco        | traduz o descritivo, mantém o nome próprio; coluna nullable, fase 5 (§8.4) |
| `requirement_offers.name` / `.description`                                                                                                              | parceiros                                                    | E                     | banco        | `requirement_offer_translations` (tabela hoje vazia)                       |
| `visa_rules.source_url`, `requirement_offers.url`                                                                                                       | URLs                                                         | D                     | banco        | nunca traduzidas                                                           |
| `services/*` (`context` de `unwrap`), `auth-service.ts` (`new Error`)                                                                                   | diagnóstico                                                  | —                     | código       | fora do i18n                                                               |

---

## 4. Comparação das arquiteturas possíveis

Escala: ●●● bom · ●● aceitável · ● ruim.

| Critério                 | 1. Tudo local        | 2. Tudo no banco      | 3. JSON local p/ dinâmico | 4. Só tabelas no Supabase | 5. **Híbrido**             | 6. Serviço externo OTA    |
| ------------------------ | -------------------- | --------------------- | ------------------------- | ------------------------- | -------------------------- | ------------------------- |
| Performance de render    | ●●● lookup           | ● rede/cache          | ●●●                       | ●● 1 lote + cache         | ●●●                        | ●●                        |
| Memória                  | ●●● ~60 KB           | ●● cache + parse      | ●●●                       | ●●                        | ●●●                        | ●● SDK extra              |
| Tempo de inicialização   | ●●● zero rede        | ● bloqueia ou pisca   | ●●●                       | ●●● (catálogo é tardio)   | ●●●                        | ● busca no boot           |
| Nº de requests           | ●●● 0                | ● N                   | ●●● 0                     | ●● 1 por sessão           | ●●● 0 na UI, 1 no catálogo | ●● 1+                     |
| Offline                  | ●●● total            | ● quebra              | ●●●                       | ●● com cache              | ●●●                        | ●●                        |
| Custo                    | ●●●                  | ●● leitura constante  | ●●●                       | ●●● desprezível           | ●●●                        | ● assinatura              |
| Complexidade             | ●●●                  | ●                     | ●● dois mecanismos        | ●● migrations + join      | ●●                         | ●                         |
| Segurança                | ●●● nada exposto     | ●● RLS a manter       | ●●●                       | ●●● padrão do catálogo    | ●●●                        | ● conteúdo sai do domínio |
| Facilidade de atualizar  | ● exige release      | ●●● imediato          | ● exige release           | ●●● imediato              | ●●● onde importa           | ●●●                       |
| Escalabilidade (idiomas) | ●● bundle cresce     | ●●●                   | ●●                        | ●●●                       | ●●●                        | ●●●                       |
| Aparelho fraco           | ●●●                  | ● JSON grande         | ●●●                       | ●●                        | ●●●                        | ●●                        |
| iOS / Android            | ●●● igual            | ●● igual              | ●●●                       | ●●●                       | ●●●                        | ●● plugin nativo          |
| Impacto no bundle        | ●● +~175 KB          | ●●● 0                 | ●●                        | ●●● ~0                    | ●● +~175 KB                | ●●●                       |
| Cache                    | ●●● não precisa      | ● crítico             | ●●●                       | ●● AsyncStorage           | ●●● simples                | ●● opaco                  |
| Sincronização            | ●●● nenhuma          | ●                     | ●●                        | ●●                        | ●●● só o catálogo          | ●                         |
| Risco de inconsistência  | ●● release atrasado  | ●● linha sem tradução | ●●                        | ●●                        | ●● contido a 4 tabelas     | ● duas fontes de verdade  |
| Manutenção               | ●● release por texto | ●●●                   | ●                         | ●●●                       | ●●●                        | ●●                        |
| Impacto no banco         | ●●● nenhum           | ● tabela quente       | ●●●                       | ●● 4 tabelas pequenas     | ●● 4 tabelas pequenas      | ●●●                       |

### Por que não cada uma

**1. Tudo local.** Perde o motivo pelo qual o catálogo existe:
`requirement_templates` foi tirado do TypeScript exatamente para que a regra
mude sem release. Repatriar os textos para o bundle desfaz
`20260906120000_requirement_catalog.sql`.

**2. Tudo no banco.** Viola a restrição explícita: abrir o app passaria a
depender de rede, e um Android de entrada com conexão instável mostraria tela
vazia ou chave crua. Também não é mais barato — os textos da UI não mudam sem
release de qualquer forma, porque as telas que os usam mudam junto.

**3. JSON local para conteúdo dinâmico.** Mesmo problema do (1) para o
catálogo, e ainda introduz um segundo formato: `.json` não é importável pelo
`node --test` sem `with { type: 'json' }` (verificado no Node 22.23 deste
projeto), enquanto o Metro importa sem atributo. Dois mecanismos de import para
o mesmo conteúdo é custo sem retorno.

**4. Só tabelas no Supabase.** É a metade certa da solução, mas aplicada à UI
inteira volta a ser o (2).

**6. Serviço externo com OTA.** Traz gestão de tradução profissional, mas
adiciona SDK, rede no boot e uma fonte de verdade fora do repositório, contra
"não depender de chamadas para cada texto". Reavaliar se o app passar de ~6
idiomas.

### Escolha: **5 — híbrido, com peso no local**

O corte é por **quem controla o texto**:

- Texto que só muda quando o código muda → **bundle** (UI, países, cidades,
  legal). Zero rede, zero cache, zero falha.
- Texto que o produto edita sem release → **banco** (catálogo, grupos, regras de
  visto, ofertas). Uma requisição em lote por sessão, cache em AsyncStorage, e o
  snapshot em pt-BR de `trip_requirements` como último recurso offline.

Isto não é "a sugestão anterior confirmada": o documento anterior propunha `t()`

- dois JSON e deixava a decisão do banco em aberto. Aqui o banco tem resposta
  (tabelas de tradução com fallback por registro), a resolução do texto da
  checklist muda de lugar (leitura, não gravação), e o domínio deixa de produzir
  texto.

---

## 5. Arquitetura recomendada

### 5.1 O núcleo é um singleton de módulo, não um hook

Decisivo: `t()` precisa ser chamado **fora do React**. Quem produz texto hoje
inclui `trip-format.ts`, `trip-progress.ts`, `trip-status.ts`, `auth-errors.ts`,
`trip-reminders.ts` e o agendador de notificações — nenhum é componente. Um
`useTranslation()` obrigaria a passar `t` por parâmetro em toda a cadeia.

```
src/i18n/index.ts
  ├─ estado de módulo: locale ativo + dicionário ativo + dicionário pt-BR
  ├─ t(key, params?)            → string     (chamável de qualquer lugar)
  ├─ getLocale() / setLocale()
  └─ useLocale()                → useSyncExternalStore, para a UI reagir
```

`setLocale` troca o dicionário e notifica os assinantes. Como `t` lê o estado de
módulo, qualquer componente passa a renderizar o texto novo na próxima
renderização — o `useLocale()` no layout raiz força essa renderização uma vez,
na troca.

### 5.2 Domínio devolve descritor, apresentação resolve texto

Regra: **nenhuma função de `domain/` retorna frase pronta**.

| Hoje                                                                                                        | Depois                                                                                           |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `checkTripLimits` → `{ isValid, issue, message }`                                                           | `{ isValid, issue }`; a tela faz `t('trip.limit.' + issue, { max })`                             |
| `buildTripMoment` → `{ tone, label }`                                                                       | `{ tone, kind, days?, months? }`                                                                 |
| `buildTripCountdown` → `{ kind, days, message, label }`                                                     | `{ kind, days }`; mensagem e legenda saem de `kind`                                              |
| `formatProgressLabel(progress)`                                                                             | `t('progress.checked', { count, total })` na tela                                                |
| `summarizeTripSeasons` → `{ headline, detail }`                                                             | `{ season, seasons[], status }`; texto na apresentação                                           |
| `getTripNotificationCandidates` → `{ title, body }`                                                         | `{ marker, requiredPending, recommendedPending }`; o agendador renderiza                         |
| `TRIP_LIMIT_MESSAGES`, `TRIP_DURATION_HINT`, `PASSWORD_RULES[].label`, `PRIORITY_LABELS`, `CATEGORY_LABELS` | viram chaves; as constantes numéricas (`MAX_TRIP_COUNTRIES`) ficam onde estão e são interpoladas |

Ganho colateral: `trip-limits.test.ts`, `trip-status.test.ts`,
`trip-progress.test.ts` e `trip-reminders.test.ts` deixam de assertar português
e passam a assertar estrutura — testes mais estáveis e mais fáceis de ler.

Onde formatar é intrinsecamente linguístico (datas, listas de países), a função
vai para `src/i18n/format.ts` e lê as tabelas do locale ativo.

### 5.3 Formato de mensagem: mínimo próprio, sem biblioteca

Uma chave é `string` ou `{ one, other, zero? }`:

```
'trips.countdown.days': { one: 'Falta {count} dia', other: 'Faltam {count} dias' }
```

`t(key, params)` faz duas coisas: escolhe a forma por `plural(locale, count)` e
substitui `{nome}`. São ~40 linhas, sem dependência e sem `Intl.PluralRules` —
cuja disponibilidade no Hermes varia por versão de Android, que é exatamente o
tipo de diferença que só aparece no aparelho de entrada.

`plural()` para os três idiomas:

- `en`, `es`: `n === 1 ? 'one' : 'other'`
- `pt-BR`: o CLDR classifica `0` como `one` (`i = 0..1`), o que produziria
  "0 dia". A regra do app é `n === 1 ? 'one' : 'other'`, e a chave `zero` existe
  para quando a copy em zero merecer frase própria ("Nenhum item pendente") em
  vez de contagem.

Não há gênero variável a tratar: nenhuma string do app concorda com substantivo
vindo de dado. As que chegam perto (`Remover {país}?`) funcionam nos três
idiomas sem artigo.

### 5.4 Números, datas e unidades

- **Datas**: o formatador manual de `trip-format.ts` fica. Ele existe porque
  `new Date('2026-06-15')` é UTC e volta um dia em fuso negativo — problema que
  `Intl.DateTimeFormat` não resolve sozinho. Só as tabelas de mês (abreviado e
  por extenso) e a **ordem dos campos** vão para o locale. Em `en` a ordem muda
  (`Jun 15–30, 2026`), então o padrão de intervalo é uma chave, não código.
- **Iniciais dos dias da semana** (`date-range-picker.tsx`): tabela por idioma;
  a semana continua começando no domingo nos três (pt-BR, en-US e es-MX usam
  domingo; es-ES usa segunda — perda conhecida, §22).
- **Números**: todos os que aparecem são inteiros pequenos (dias, itens,
  porcentagem, contagem de países). Formatação de milhar não é necessária;
  `Intl.NumberFormat` fica como não-objetivo.
- **Moeda e unidades**: não existem no app hoje. Nenhuma tela mostra preço.
- **Maiúsculas**: `SectionLabel` e `ReviewHeader` deixam de usar
  `toUpperCase()`, e `textTransform: 'uppercase'` sai de `next-trip-hero`. Cada
  idioma escreve o rótulo já na caixa que quer — evita erro de caixa por idioma
  e mantém a regra do projeto de capitalização não vir de transformação.

### 5.5 Catálogo do banco: resolvido na leitura

Mudança estrutural, detalhada em §8. Em resumo:

```
Supabase → 1 request em lote (templates + traduções do locale + pt-BR)
        → normalização
        → cache AsyncStorage (stale-while-revalidate)
        → memória (Map por template_id)
        → UI resolve trip_requirements.template_id → texto
```

E **nunca**: `UI → request → tradução → UI → request → tradução`.

---

## 6. Justificativa de performance

**Tamanhos estimados** (fonte: contagem da auditoria):

| Ativo                                  | Por idioma | 3 idiomas            |
| -------------------------------------- | ---------- | -------------------- |
| `messages/*.ts` (~400 chaves)          | ~24 KB     | ~72 KB               |
| `countries/*.ts` (255 nomes)           | ~5 KB      | ~15 KB               |
| `cities` (override esparso)            | ~2 KB      | ~4 KB                |
| `legal/*.ts` (2 docs, ~3.800 palavras) | ~28 KB     | ~84 KB               |
| Traduções do catálogo (banco)          | ~16 KB     | fora do bundle       |
| **Total no bundle**                    |            | **~175 KB de texto** |

Contra um bundle JS de dezenas de MB, é ruído. O que importa em Android de
entrada não é o tamanho, é **o que é avaliado no boot**.

**Estratégia de carregamento — combinação, não escolha única:**

| Ativo                              | Quando carrega                                            | Por quê                                                       |
| ---------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `messages` do locale ativo + pt-BR | na primeira chamada de `t()`, via `require()` no loader   | 2 dicionários avaliados, nunca 3; a primeira tela já precisa  |
| `countries` do locale ativo        | no primeiro uso (seleção de país, título de item de país) | a Home sem viagem não precisa de 255 nomes                    |
| `cities`                           | no passo de cidades                                       | já é assim hoje                                               |
| `legal` do locale ativo            | `require()` dentro da tela                                | 28 KB que quase ninguém abre; hoje são avaliados em todo boot |
| Traduções do catálogo              | na primeira criação/abertura de viagem, do cache          | tela nenhuma espera rede                                      |

> **Estado na Fase 0:** os três dicionários entram por `import` estático. Com
> duas chaves cada não há custo de avaliação a adiar, e `require()` teria
> introduzido cedo demais uma assimetria real: o Metro o resolve, mas o
> `node --test` carrega `.ts` como ESM e não tem `require`. A troca para carga
> tardia acontece na Fase 4, quando os dicionários crescem, e fica confinada a
> `src/i18n/index.ts` — é por isso que os módulos testados em Node (`locales`,
> `plural`, `message`, `messages/*`) não importam nada de React nem de
> armazenamento.

Metro não faz code splitting em nativo — o bundle carrega inteiro. O que
`require()` tardio economiza é **parse e construção de objeto**, que é
exatamente o custo que pesa em CPU limitada. Hoje `legal-documents.ts` (126
blocos com template literals) é avaliado em todo boot, mesmo de quem nunca abre
os documentos; com o plano, deixa de ser.

**O que a arquitetura impede por construção:**

- uma query por tradução — impossível: a UI nem tem acesso ao Supabase
- query por componente — impossível: `t()` é lookup em objeto
- tradução em runtime por API — não existe chamada externa
- Supabase durante render — o catálogo é lido por serviço, nunca em render
- Supabase ao trocar de tela — inalterado; o catálogo continua sendo lido só em
  criar/editar/abrir viagem, e agora com cache (menos requests que hoje)
- processamento pesado no JS thread — o lookup é `dict[key]`; o único laço é o
  `replace` de `{param}` sobre strings de ~60 caracteres
- estruturas duplicadas em memória — no máximo 2 dicionários vivos
- carregar tudo para usar pouco — os `require()` tardios acima
- re-render em massa na troca de idioma — acontece uma vez, por ação explícita
- bloquear a abertura esperando tradução remota — nada remoto está no boot

**Custo de troca de idioma**: uma leitura de AsyncStorage (a preferência) +
avaliação de 1 dicionário + 1 render da árvore + 1 refetch do catálogo em
background. Sem rede no caminho crítico.

**Estruturas em memória no regime**: 2 dicionários de UI (~50 KB), 1 tabela de
países (~5 KB), 1 catálogo normalizado (~16 KB). Abaixo de 100 KB.

---

## 7. Justificativa de segurança

1. **RLS.** As tabelas de tradução são catálogo, e seguem o padrão já aplicado
   em `20260906120100_requirement_catalog_rls.sql`, **na mesma migration que as
   cria**:
   - `enable row level security`;
   - `create policy ... for select to authenticated using (true)` — permitido
     aqui pela regra do AGENTS.md, por serem tabelas de catálogo;
   - `revoke insert, update, delete ... from authenticated` — obrigatório,
     porque `20260905120200_table_grants.sql` concede tudo por
     `alter default privileges` a cada tabela nova do schema;
   - `grant select ... to authenticated`;
   - **nada para `anon`**.
2. **Dado de usuário nunca entra em estrutura de tradução.** As tabelas têm
   apenas `(entidade_id, locale, campos de texto)`. Nenhum `user_id`, nenhum
   `trip_id`. Um vazamento de tradução vaza o catálogo público do produto.
3. **Tradução não decide comportamento.** A regra é estrutural e já está no
   schema: `visa_requirement_type`, `priority`, `category`, `scope`, `trip_kind`,
   `season`, `country_code` são enums e códigos. `resolveTripRequirements` e
   `diffTripRequirements` casam por `(template_id, group_id, country_code)` —
   nunca por texto. O plano **não introduz** nenhuma comparação de texto nova.
4. **Dois pontos existentes que violam isso e precisam de correção:**
   - `DELETE_CONFIRMATION_WORD = 'Excluir'` — validação por palavra traduzível.
     Passa a comparar, sem acento e sem caixa, contra a palavra do idioma ativo
     **e** contra a de pt-BR, para quem trocou de idioma no meio do fluxo não
     ficar travado. A regra de negócio (exigir digitação consciente) não muda;
     só a representação.
   - `groupRequirementsByScope` ordena com `localeCompare(a, b, 'pt-BR')` fixo.
     Passa a usar o locale ativo; a ordem deixa de ser igual entre idiomas, o
     que é correto e não afeta nenhuma regra.
5. **`auth-errors.ts` casa strings em inglês do GoTrue.** Não é tradução do app,
   é leitura de erro de servidor. Continua válido, mas a preferência passa a ser
   o `code` (já usado em três casos); casar por mensagem vira último recurso, e
   o fallback deixa de ser `error.message` cru (que hoje pode exibir inglês do
   servidor ao usuário) e passa a ser uma frase do dicionário.
6. **Locale vindo do sistema é entrada não confiável.** Normalizado contra a
   allowlist `SUPPORTED_LOCALES` **antes** de qualquer uso, inclusive antes de
   entrar em `.in('locale', [...])`. O PostgREST parametriza, então não há
   injeção; a validação existe para não gerar consulta sem sentido e para o
   cache não ganhar chave arbitrária.
7. **`profiles.locale`** (§14.2): coluna `text` com
   `check (locale in ('pt-BR','en','es'))`, coberta por `profiles_select_own` e
   `profiles_update_own`, que já existem — nenhuma policy nova. Preferência de
   idioma é dado pessoal comum, da mesma natureza do país do passaporte, e a
   Política de Privacidade precisa citá-la na lista de dados da conta.
8. **Idioma fora do token, de propósito** (§14.4). Um claim de idioma fica ao
   lado de `sub` e `role` e convida a escrever `using (locale = …)` em alguma
   policy — o oposto da regra de que o idioma não altera a regra de negócio. A
   forma mais segura de garantir que ninguém escreva essa policy é o valor não
   estar disponível ali. Pelo mesmo motivo, nada em `raw_user_meta_data`: aquilo
   é gravável pelo próprio cliente e não é mais confiável que um parâmetro.
9. **Documentos legais não podem divergir em substância.** Um erro de tradução
   em cláusula é risco jurídico, não bug de UI. Ver §15.

---

## 8. Estratégia para conteúdo do banco

### 8.1 O que precisa de tradução, tabela por tabela

| Tabela                                      | Colunas de linguagem   | Colunas estruturais (nunca traduzir)                                                                                                           |
| ------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `requirement_templates`                     | `title`, `description` | `code`, `priority`, `category`, `scope`, `season`, `passport_country_code`, `trip_kind`, `visa_requirement_type`, `valid_from/until`, `active` |
| `destination_groups`                        | `name`, `description`  | `code`                                                                                                                                         |
| `visa_rules`                                | `notes`                | `passport_country_code`, `destination_country_code`, `requirement_type`, `verified_at`, `valid_from/until`, `source_url`                       |
| `requirement_offers`                        | `name`, `description`  | `url`, `icon`, `is_affiliate`, `position`, códigos de país                                                                                     |
| `destination_group_members`                 | —                      | tudo                                                                                                                                           |
| `requirement_template_groups/_countries`    | —                      | tudo                                                                                                                                           |
| `trips`, `trip_countries`, `trip_cities`    | —                      | conteúdo do usuário ou código                                                                                                                  |
| `trip_requirements`                         | ver §8.3               | `template_id`, `group_id`, `country_code`, `priority`, `category`, `completed`                                                                 |
| `affiliate_clicks`, `passports`, `profiles` | —                      | tudo                                                                                                                                           |

### 8.2 Forma: tabela de tradução, não coluna JSONB

| Forma                               | Prós                                                                            | Contras                                                                                            | Veredito |
| ----------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| `title_i18n jsonb` na própria linha | sem join                                                                        | envia todos os idiomas em toda leitura; sem constraint por idioma; migration mexe na tabela quente | não      |
| Colunas `title_en`, `title_es`      | simples                                                                         | schema muda a cada idioma — exatamente o que `visa_rules` evitou                                   | não      |
| **Tabela `*_translations`**         | idioma novo é INSERT; RLS idêntica; `not null` por campo; fallback por registro | um join                                                                                            | **sim**  |

Forma proposta (mesmo molde para as quatro entidades):

```sql
create table public.requirement_template_translations (
  requirement_template_id uuid not null
    references public.requirement_templates (id) on delete cascade,
  locale text not null check (locale in ('pt-BR', 'en', 'es')),
  title text not null check (length(btrim(title)) > 0),
  description text,
  primary key (requirement_template_id, locale)
);
```

Mais `destination_group_translations`, `visa_rule_translations` (`notes` e
`source_name`, ambos nullable — ver §8.4) e
`requirement_offer_translations`. A chave primária composta já é o índice do
acesso (`in (ids)` + `in (locales)`), então nenhum índice extra é criado — mesmo
raciocínio já registrado em `visa_rules`.

**A linha pt-BR também entra na tabela de tradução.** As colunas originais
continuam existindo e passam a ser a **fonte canônica pt-BR** — não são apagadas
nem viram nulas, e servem de fallback final. A migration de carga copia
`title/description` atuais para as linhas `locale = 'pt-BR'`, e depois insere
`en` e `es`. O app fica com um único caminho de leitura (a tabela de tradução) e
um único caminho de fallback (a coluna).

`check (locale in (...))` em vez de tabela de idiomas: são três valores, e a
lista vive em um lugar só do lado do cliente. Quando passar de ~6, vira
`create type public.locale as enum`.

### 8.3 A mudança que destrava tudo: `trip_requirements` para de congelar texto

Hoje `resolveTripRequirements` grava `title` e `description` já resolvidos. Uma
viagem criada em português continuaria em português para sempre.

**Proposta:**

1. `trip_requirements` ganha
   `visa_rule_id uuid references public.visa_rules (id) on delete set null` — é o
   que falta para reencontrar a observação oficial traduzida. `template_id`,
   `group_id` e `country_code` já estão lá.
2. A gravação **continua preenchendo `title` e `description`, sempre em pt-BR**,
   independentemente do idioma da interface. Não é redundância: é o fallback
   offline garantido e o que mantém a tabela legível para suporte.
3. A **leitura** resolve nesta ordem, por item com `template_id` não nulo:
   1. `visa_rule_translations[locale].notes` (se o item veio de regra de visto)
   2. `requirement_template_translations[locale]`
   3. `visa_rule_translations['pt-BR'].notes`
   4. `requirement_template_translations['pt-BR']`
   5. `trip_requirements.title/description` gravados (último recurso, sempre existe)
4. Itens com `template_id` nulo (criados pelo usuário) usam sempre a coluna, sem
   tradução — categoria **C**.
5. O título de item de país precisa do marcador: `renderTitle` deixa de rodar só
   na gravação e passa a rodar também na leitura, trocando `{country}` pelo nome
   do país **no idioma ativo**. O template traduzido guarda o mesmo marcador.

`diffTripRequirements` não muda: já casa por
`(template_id, group_id, country_code)`. Nenhum item é recriado, nenhum
"verificado" se perde na troca de idioma.

Efeito colateral desejado: editar a descrição de um template passa a alcançar
viagens já criadas — o defeito que o plano anterior identificou como
independente de idioma fica corrigido aqui.

### 8.4 Fontes oficiais (`source_name`)

`visa_rules.source_name` é nome próprio de órgão ("Comissão Europeia — Política
de vistos").

**Decidido: traduzir apenas o descritivo, mantendo o nome próprio**, via
`visa_rule_translations.source_name` **nullable**, com fallback para a coluna
original. O corte é sempre o mesmo — o que identifica a instituição fica, o que
descreve o documento traduz:

| pt-BR (coluna canônica)                | en                                | es                                     |
| -------------------------------------- | --------------------------------- | -------------------------------------- |
| Comissão Europeia — Política de vistos | European Commission — Visa policy | Comisión Europea — Política de visados |
| MERCOSUR — Países do MERCOSUL          | MERCOSUR — Member States          | MERCOSUR — Países del MERCOSUR         |
| ASEAN — Member States                  | ASEAN — Member States             | ASEAN — Estados miembros               |

Três consequências a respeitar na hora de escrever as linhas:

- **A coluna é nullable de propósito.** Uma fonte cujo nome não tem descritivo a
  traduzir (uma sigla sozinha) simplesmente não ganha linha, e o fallback mostra
  o nome canônico. Preencher com uma cópia idêntica só cria trabalho de
  manutenção quando o nome mudar.
- **Não inventar o nome oficial em outro idioma.** Quando o órgão publica o
  próprio nome no idioma de destino, usa-se o dele; quando não publica, traduz-se
  só o descritivo e o nome próprio permanece. Inventar uma versão "oficial" que
  não existe é o mesmo erro que o projeto já evita ao não estimar data de
  vigência.
- **`source_url` nunca muda.** A fonte oficial é a que é, e mandar o usuário para
  uma versão traduzida da página que o órgão não mantém seria pior que o link
  original em outro idioma.

Entra na **fase 5**, não antes: sem ela o link já funciona e a fonte já é
identificável, então não bloqueia o app ficar trilíngue.

### 8.5 `requirement_offers`

A tabela está vazia hoje. A migration de tradução entra junto, para que nenhuma
oferta seja cadastrada sem os três idiomas — é mais barato acertar antes de
existir linha. O aviso de afiliado e os rótulos da seção são UI (categoria A).

---

## 9. Estratégia para países e cidades

### 9.1 Países — dataset local, gerado

`getCountryName(code)` passa a ler o dataset do locale ativo. O `code` continua
sendo a identidade em toda parte (banco, matching, bandeira) — nada muda em
`trip_countries`, `visa_rules` ou `passports`.

Geração: um script (`scripts/build-country-names.mjs`) roda
`Intl.DisplayNames([locale], { type: 'region' })` no **Node**, não no app, e
escreve `src/i18n/countries/<locale>.ts`. Motivos:

- é o mesmo método que originou a lista pt-BR atual, então `en` e `es` nascem
  consistentes;
- rodar no dispositivo dependeria do ICU do Hermes, que varia por versão de
  Android — um usuário veria "Hungary" e outro "HU";
- 255 nomes × 3 idiomas são ~15 KB, e estão no bundle: busca e ordenação
  funcionam offline, sem nenhuma consulta ao Supabase para descobrir que
  `HU = Hungria / Hungary / Hungría`.

A lista pt-BR atual foi curada à mão depois de gerada. O script precisa
**preservar overrides manuais**: gera a base e aplica um mapa de exceções
versionado, para que rodá-lo de novo não desfaça curadoria.

Busca e ordenação:

- `normalizeSearch` (NFD + remoção de diacríticos + lowercase) já é
  accent-insensitive e serve aos três idiomas sem mudança — é o que faz
  "Hungria", "Hungary" e "Hungría" casarem com "hungr".
- Ordenação alfabética passa a usar `localeCompare(a, b, localeAtivo)`. A ordem
  do arquivo deixa de importar; a lista é ordenada no carregamento do dataset,
  uma vez por idioma.
- A busca por código ISO continua funcionando em qualquer idioma ("BR", "JP").

### 9.2 Cidades — lista base + override esparso

`CITY_SUGGESTIONS` tem ~375 nomes curados à mão, com exônimos em português
(Munique, Pequim, Nova Délhi, Cidade do Cabo). A maioria é idêntica nos três
idiomas (Paris, Dubai, Bali).

Proposta: manter **uma** lista base (a atual, que passa a ser a lista pt-BR) e
adicionar, por idioma, apenas um mapa de diferenças:

```
src/i18n/cities/en.ts → { Munique: 'Munich', Pequim: 'Beijing', ... }
```

Estimativa: ~120 entradas em `en` e ~60 em `es` (o espanhol compartilha muito
exônimo com o português). ~2 KB por idioma, contra ~5 KB de uma lista completa
duplicada — e, mais importante, **uma lista só a manter**: acrescentar uma
cidade nova é uma linha, não três.

**Trade-off assumido e explícito:** `trip_cities.city_name` guarda o **texto**,
tem `unique (trip_id, country_code, city_name)`, e `sameCity` compara por nome.
Uma viagem criada em português guarda "Munique"; a mesma viagem aberta em inglês
continua mostrando "Munique". Duas saídas:

- **(α) Tratar o nome gravado como conteúdo do usuário** — nunca traduzir. Zero
  migration, zero risco, coerente com a regra de conteúdo do usuário. A lista de
  _sugestões_ é localizada, então quem cria a viagem em inglês grava "Munich".
- **(β) Guardar um identificador de cidade** e resolver o nome na leitura. Exige
  schema novo, ids estáveis para um catálogo curado à mão, e continua precisando
  da coluna de texto para cidades digitadas livremente.

**Decidido: (α).** O ganho de (β) é pequeno — afeta só quem troca de idioma
depois de já ter criado viagens — e o custo é mudança de schema em tabela de
usuário, com ids estáveis para um catálogo curado à mão. (β) fica registrado como
evolução se a troca de idioma se mostrar comum.

O que (α) significa na prática, para não virar surpresa depois:

- **A lista de sugestões é localizada.** Quem está com o app em inglês vê
  "Munich" na lista e grava "Munich"; quem está em português vê e grava
  "Munique". O idioma do momento da escolha é o que fica.
- **O que já está gravado nunca muda.** Uma viagem criada em português continua
  mostrando "Munique" com o app em inglês, na tela de detalhe, no card e no
  resumo. Isso é tratamento de conteúdo do usuário, não um defeito — e é a mesma
  regra que já protege o nome que a pessoa deu à viagem.
- **`sameCity`, o `unique (trip_id, country_code, city_name)` e a comparação sem
  acento continuam exatamente como estão.** Nenhuma linha de `trip_cities` muda,
  nenhuma migration é necessária, e não há risco de duplicar cidade na edição de
  uma viagem por causa de idioma.
- **O caso a vigiar** é o mesmo que já existe hoje: alguém com o app em inglês
  editando uma viagem criada em português poderia adicionar "Munich" ao lado de
  "Munique", porque `normalizeSearch` não sabe que são a mesma cidade. É o mesmo
  que acontece hoje com uma cidade digitada à mão em grafia diferente, e o
  `CityStep` já resolve o caso conhecido preferindo a grafia do catálogo. Não
  vale schema novo para fechá-lo; vale estar escrito.

---

## 10. Estratégia para conteúdo dinâmico

Cada texto dinâmico do levantamento §2.7 vira uma chave com `{count}` e, quando
necessário, formas `one`/`other`/`zero`. Exemplos com os três idiomas lado a lado
(no arquivo real cada idioma é um arquivo separado):

```
'trips.progress.checked'
  one    pt-BR  '{done} de {total} item verificado'
         en     '{done} of {total} item checked'
         es     '{done} de {total} elemento verificado'
  other  pt-BR  '{done} de {total} itens verificados'
         en     '{done} of {total} items checked'
         es     '{done} de {total} elementos verificados'

'reminders.body.required'
  one    pt-BR  'Você ainda tem 1 item obrigatório para revisar.'
         en     'You still have 1 required item to review.'
         es     'Todavía tienes 1 elemento obligatorio por revisar.'
  other  pt-BR  'Você ainda tem {count} itens obrigatórios para revisar.'
         en     'You still have {count} required items to review.'
         es     'Todavía tienes {count} elementos obligatorios por revisar.'
```

Regras de escrita das chaves:

1. **A frase inteira é uma chave.** Nunca `t('voce_tem') + n + t('itens')` — a
   ordem das palavras muda entre idiomas.
2. **Duas variações na mesma frase viram uma chave só.** O caso
   `{n} obrigatório(s)` + `pendente(s)` de `[id].tsx` hoje são duas concatenações
   independentes; vira `'trip.required.pending'` com uma forma por número.
3. **Contagem zero ganha chave própria quando a frase melhora**: "Tudo
   verificado" já é assim; `zero` cobre os demais casos.
4. **Datas e intervalos são chaves com padrão**, não concatenação:
   `'date.range.sameMonth': '{d1}–{d2} {month} {year}'` muda de forma em `en`
   (`'{month} {d1}–{d2}, {year}'`).
5. **Listas de país** (`{a} e {b}`, `{a}, {b} e mais {n}`) viram chaves; em
   espanhol o `y` muda para `e` conforme a palavra seguinte — como a sugestão de
   nome é um rascunho editável pelo usuário, a aproximação (`y` sempre) é
   aceitável e está registrada como perda conhecida.
6. **`accessibilityLabel` composto é chave**, não concatenação
   (`'a11y.requirement.open': 'Abrir {title}'`).

---

## 11. Estratégia de cache

Só há uma coisa a cachear: o catálogo traduzido do Supabase.

```
Chave:    tripready.catalog.<locale>.v1
Valor:    { fetchedAt, locale, templates[], groups[] }
Store:    AsyncStorage (já é dependência do projeto)
Política: stale-while-revalidate, TTL leve de 24 h
```

Fluxo:

1. Primeira necessidade do catálogo na sessão → lê AsyncStorage. Se houver
   valor, **serve imediatamente**, mesmo vencido.
2. Se estiver vencido (ou não houver), dispara a busca. Falha de rede não é
   erro: se havia cache, ele continua valendo; se não havia, o app cai no
   snapshot pt-BR de `trip_requirements` (§8.3).
3. `visa_rules` continuam fora do cache: dependem do par (passaporte, destino) e
   já são buscadas só em criar/editar viagem. As traduções de nota chegam na
   mesma requisição.
4. Trocar de idioma não invalida nada — a chave inclui o locale, então o
   catálogo anterior permanece em disco e a volta ao idioma antigo é instantânea.
5. Invalidação explícita: comparar o maior `updated_at` retornado com o gravado.
   Como o catálogo inteiro vem em uma requisição, isso é gratuito — não é preciso
   consulta de versão separada nem tabela de versão.

**Requisições por sessão**: 1 para o catálogo (ou 0, se o cache estiver válido).
Hoje é 1 por criação/edição de viagem, sem cache. O plano **reduz** o número de
requests.

Não é cacheado: dicionários de UI (estão no bundle), países, cidades, legal.
Nada disso tem cache a invalidar.

---

## 12. Estratégia offline

| Situação                      | Comportamento                                                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sem rede, app já usado        | Toda a UI, países, cidades e documentos legais funcionam. A checklist já criada é exibida com o texto do cache do catálogo; se o cache estiver frio, com o snapshot pt-BR. |
| Sem rede, primeiro uso        | Login não acontece (já é assim hoje) — i18n não piora nada.                                                                                                                |
| Rede instável ao criar viagem | Inalterado: a tela de preparação já tem retomada por categoria. As traduções chegam junto com o catálogo, na mesma requisição.                                             |
| Troca de idioma offline       | Funciona para toda a UI. O catálogo do novo idioma só chega com rede; até lá a checklist mostra pt-BR — degradação visível e aceitável, nunca chave crua nem tela vazia.   |
| Notificações                  | Já são agendadas localmente com o texto pronto. Disparam offline no idioma em que foram agendadas.                                                                         |

A cadeia de fallback garante que **nunca** falte texto: dicionário do idioma →
dicionário pt-BR → (no catálogo) tradução pt-BR → coluna pt-BR do banco →
snapshot gravado na viagem.

---

## 13. Estratégia de fallback

**Granularidade: por chave (string), não por arquivo nem por namespace.**

Fallback por arquivo deixa uma tela inteira no idioma errado por causa de uma
chave faltando; fallback por chave deixa uma frase. Mas a mistura de idiomas na
mesma tela também é ruim — por isso o runtime tem **duas camadas**:

1. **Tempo de build (o que de fato resolve):** um teste em `src/i18n/tests/`
   assere que o conjunto de chaves de `en` e de `es` é **idêntico** ao de `pt-BR`,
   e que toda chave com formas plurais tem as mesmas formas nos três. Roda em
   `npm check`, logo no CI. Chave faltando não chega a `main`.
2. **Tempo de execução (rede de segurança):** `t()` procura no dicionário ativo;
   se não achar, no de pt-BR; se não achar, devolve a própria chave **e** registra
   `console.warn` em `__DEV__`. Em produção, com a camada 1 no lugar, isso nunca
   dispara.

**Para conteúdo do banco: por registro.** Uma linha de `requirement_templates`
sem tradução em `es` cai para a linha `pt-BR` daquele mesmo template — não
derruba o catálogo inteiro. É necessário porque uma migration nova pode
introduzir uma regra antes de a tradução ser revisada. Um teste não cobre isso (o
dado está no banco), então entra na checklist de auditoria da §18: toda migration
que insere linha de catálogo insere as três traduções no mesmo arquivo.

**Locale de fallback oficial: `pt-BR`**, em todas as camadas.

São duas coisas diferentes, e elas têm respostas diferentes — **decidido**:

- **Idioma inicial para aparelho em idioma não suportado** (francês, alemão,
  japonês) → **`en`**. É o idioma franco: quem tem o telefone em francês lê
  inglês antes de português. Vale só para a _seleção inicial_, e mora em uma
  linha de `normalizeLocale`.
- **Fallback de string ausente** → **`pt-BR`**, sempre. É a fonte canônica, o
  único dicionário garantidamente completo, e é contra ele que o teste de
  completude compara.

Vale registrar a única assimetria que isso cria: para um usuário em `en`, uma
chave faltando mostraria português, que é pior do que mostrar inglês para um
usuário em `es`. Não se corrige encadeando `en → es → pt-BR` (isso só espalha a
mistura de idiomas); corrige-se garantindo que não falte chave — que é o papel do
`completeness.test.ts`. Com ele no CI, esse fallback nunca chega a rodar em
produção, e a escolha canônica vence.

`DEFAULT_LOCALE` (fallback de string) e `FALLBACK_UI_LOCALE` (seleção inicial)
são duas constantes distintas em `src/i18n/locales.ts`, de propósito: dar o mesmo
nome às duas é o caminho mais curto para alguém "simplificar" e reintroduzir o
bug.

---

## 14. Estratégia de troca de idioma

### 14.1 Detecção

`expo-localization` (incluído no Expo Go, com config plugin; confirmado na doc do
SDK 57). `getLocales()` devolve a lista **ordenada** de preferências do usuário,
não só a primeira.

```
1. Preferência salva pelo usuário (AsyncStorage) → se existir, vence
2. Senão, percorre getLocales() em ordem e devolve o primeiro suportado
3. Senão, o padrão de idioma não suportado (§13)
```

Percorrer a lista importa: um usuário com "Português (Portugal), Inglês" recebe
pt-BR; um com "Alemão, Espanhol" recebe `es` em vez do padrão.

**Normalização** (por `languageCode`, ignorando região):

```
pt-*   → pt-BR
en-*   → en
es-*   → es
outros → padrão
```

Confirmação da estratégia, com as ressalvas:

- **`pt-PT` → `pt-BR`** é aceitável e muito melhor que inglês, mas não é neutro:
  vocabulário ("celular"/"telemóvel"), colocação pronominal e a regra de plural do
  CLDR diferem. `pt-PT` fica reservado como locale futuro; o mapeamento é uma
  linha.
- **`es-MX` / `es-ES` / `es-AR` → `es`** exige que a tradução seja escrita em
  **espanhol neutro**: sem "vosotros", sem regionalismo de vocabulário,
  preferindo termos panhispânicos. É instrução para quem traduz, não código.
- **`en-GB` / `en-US` → `en`**: só diferem em ortografia e formato de data. A
  data já é formatada por chave; escolher a ortografia americana e registrar a
  escolha basta.
- `regionCode` continua disponível para o que **não** é idioma (primeiro dia da
  semana, sistema métrico). Nenhum desses é usado hoje.

**iOS — pendência de build, deliberadamente não aplicada.** O que
`expo-localization` lê é `NSLocale.preferredLanguages`, filtrado pelas
localizações declaradas no bundle. Sem declará-las, o iOS pode reportar sempre a
localização base, e a tela de idioma por app não aparece nos Ajustes.

O config plugin do pacote resolve isso, mas **só produz efeito em build nativo**:
lendo `node_modules/expo-localization/plugin/build/withExpoLocalization.js`, ele
escreve `CFBundleLocalizations` no `Info.plist`, gera
`app/src/main/res/xml/locales_config.xml` no Android e mexe no `build.gradle`.
Nada disso alcança o Expo Go, que ignora config plugins. Como o app ainda não
está publicado e o desenvolvimento é todo em Expo Go, a configuração fica
anotada aqui e **não entra no `app.json` agora**:

```jsonc
// app.json → expo.plugins — aplicar antes do primeiro build nativo
["expo-localization", { "supportedLocales": ["pt-BR", "en", "es"] }]
```

`npx expo install expo-localization` acrescenta a entrada `"expo-localization"`
sozinho, sem as opções — foi revertida na Fase 0. Quem for fazer o primeiro
build precisa reaplicá-la **com** `supportedLocales`, e **verificar em build
nativo** (não no Expo Go) que `getLocales()` acompanha a troca de idioma do
sistema no iOS.

Até lá, nada disso bloqueia: o pacote é incluído no Expo Go, a leitura do idioma
funciona em desenvolvimento, e a escolha manual no Perfil não depende do sistema.

### 14.2 Escolha manual

**Onde:** no Perfil, em uma seção própria "Idioma" entre a identidade e a seção
"Legal", usando o `ListRow` que já existe (mesmo padrão de "Política de
Privacidade"). Abre um seletor com as opções e a marcação do ativo. Coerente com
a preferência do projeto por componente nativo: `@expo/ui` já é dependência e a
lista/`Picker` nativo é a primeira opção a avaliar; `Card` + `ListRow` é o
caminho de menor mudança.

**Não** colocar em `profile/edit.tsx`: idioma é preferência do app, não dado de
perfil, e "Editar perfil" tem botão Salvar — idioma deve aplicar na hora.

**Prioridade:** escolha manual **sempre** vence o idioma do dispositivo, para
sempre. Não há reconciliação automática. Uma quarta opção "Padrão do dispositivo"
apaga a preferência salva — é o único jeito de desfazer uma escolha.

**Persistência — decidido: nos dois lugares, com papéis diferentes.**

| Onde                              | Papel                                                                                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| AsyncStorage (`tripready.locale`) | **Autoridade de renderização.** Síncrono, funciona offline, funciona antes do login, aplica na hora.                                            |
| `profiles.locale` no Supabase     | **Cópia durável que acompanha a conta.** Escrita na troca; lida uma vez depois do login, só para semear o valor local quando não houver nenhum. |

Nunca o contrário: a tela jamais espera o banco para saber em que idioma
desenhar.

**A semântica da coluna é "o idioma que a pessoa escolheu", e `null` significa
"segue o aparelho".** Essa distinção é o que faz o comportamento ficar correto
nos dois cenários:

| Momento                             | `profiles.locale` | O que o usuário vê                                            |
| ----------------------------------- | ----------------- | ------------------------------------------------------------- |
| Criação de conta                    | fica `null`       | o idioma do aparelho — sem gravar nada                        |
| Perfil → escolhe um idioma          | `'en'`            | o escolhido, na hora                                          |
| Perfil → "Padrão do dispositivo"    | volta a `null`    | o idioma do aparelho                                          |
| Reinstalação no mesmo aparelho      | inalterado        | a escolha volta; se nunca escolheu, o aparelho decide de novo |
| Login em aparelho novo, sem escolha | `null`            | o idioma do **aparelho novo** — que é o certo                 |
| Login em aparelho novo, com escolha | `'es'`            | espanhol, mesmo que o aparelho novo esteja em outro idioma    |

Gravar o idioma detectado na criação da conta pareceria equivalente, mas não é:
quem cria a conta num telefone em português e depois instala num telefone em
inglês receberia português para sempre, sem nunca ter escolhido isso. `null` é
informação — "esta pessoa não se manifestou" — e apagá-la custa o comportamento
correto.

Migration (arquivo novo, nunca editando os existentes):

```sql
alter table public.profiles
  add column locale text check (locale in ('pt-BR', 'en', 'es'));
```

Nada mais precisa mudar no banco: `handle_new_user()` insere só o `id`, e a
coluna nova é nullable — o gatilho continua válido como está. `profiles` já tem
`profiles_update_own` e `profiles_select_own`, então a escrita e a leitura do
próprio idioma já estão cobertas pelas policies existentes.

**Onde a leitura acontece, sem custar boot.** Hoje `profilesService` existe mas
não é chamado em lugar nenhum — esta seria a primeira leitura de `profiles` do
app, e ela não pode entrar no caminho crítico. O app já tem uma espera depois do
login: `RootNavigator` segura a UI enquanto os passaportes carregam
(`isReady = !isLoadingSession && !(session && isLoadingPassports) && …`). A
leitura do idioma vai **em paralelo com a dos passaportes**, dentro dessa mesma
janela:

- custo de latência adicional: zero, porque a consulta de passaportes já é
  esperada e a de idioma é menor;
- nunca estende a espera: se o idioma demorar mais que os passaportes, a UI
  entra assim mesmo e o valor semeado aplica depois;
- some a troca visível de idioma logo após o login em aparelho novo, que seria o
  único incômodo perceptível desse desenho.

A escrita é disparada na troca e não bloqueia nada: a UI já mudou de idioma
antes de a requisição sair. Se a escrita falhar, a preferência local continua
valendo e a próxima troca (ou a próxima abertura) reconcilia.

### 14.3 O que precisa reagir à troca

1. Árvore React → re-render único via `useLocale()` no layout raiz.
2. Cache do catálogo → busca em background da chave do novo locale.
3. **Lembretes de notificação** → o texto muda, logo a `signature` muda, logo
   `diffReminders` cancela e reagenda sozinho. Basta chamar
   `syncAllTripReminders` logo após a troca (a Home e a lista já o fazem no
   foco, então até sem chamada explícita o reagendamento acontece na próxima
   abertura — mas chamar é melhor). A `signature` passa a incluir o locale, para
   que uma tradução idêntica por coincidência não deixe o lembrete antigo em pé.
4. **Canal de notificação do Android** ("Lembretes de viagem", visível nos
   ajustes do sistema) → `setNotificationChannelAsync` é idempotente e atualiza o
   nome; chamá-lo com o nome traduzido a cada `ensureAndroidChannel` resolve.
5. Estado de tela (seções abertas, rascunho de viagem, rolagem) → **não** pode
   ser perdido. Trocar o idioma não remonta nada; só o texto muda.
6. `profiles.locale` → escrita disparada e esquecida, sem bloquear a UI.

### 14.4 Como o idioma chega até o servidor

A pergunta certa não é "token ou parâmetro", é **onde o servidor produz texto que
o usuário lê**. Só aí ele precisa saber o idioma. No TripReady isso são dois
lugares, hoje e no futuro previsto:

| Onde                                                  | O servidor produz texto?                     | Como o idioma chega                         |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------- |
| Catálogo (templates, grupos, notas de visto, ofertas) | Sim — as linhas traduzidas                   | **Valor de filtro na própria consulta**     |
| Push notification (futuro)                            | Sim — o texto do banner                      | Lido pelo servidor, do idioma gravado (§16) |
| Todo o resto do PostgREST                             | Não                                          | não precisa                                 |
| Edge Function `delete-account`                        | Não — devolve `{ error: 'invalid_session' }` | não precisa                                 |

A última linha é o padrão a preservar e a transformar em regra: **o servidor
devolve código, o cliente traduz.** A função de exclusão de conta já é assim, e é
por isso que ela não aparece nesta discussão. Enquanto essa regra valer, a
pergunta "como mandar o idioma" fica restrita a um único serviço do app.

#### Por que **não** no token

A ideia é boa em sistemas onde o servidor renderiza texto e há dezenas de
endpoints que precisam do idioma de forma ambiente. Este app não tem essa forma,
e um claim traria quatro problemas concretos:

1. **Token é estado congelado.** O access token do Supabase vale 1h e é renovado
   em segundo plano. Trocar o idioma no Perfil não mudaria a claim até o refresh
   — ou exigiria forçar `refreshSession()`, fazendo uma ação instantânea de
   interface depender de ida ao servidor, e quebrada offline. O sintoma seria a
   UI em espanhol e o catálogo voltando em português até o token virar.
2. **Token é identidade e autorização, não apresentação.** Um claim de idioma
   fica ao lado de `sub` e `role`, e convida a escrever `using (locale = …)` em
   alguma policy. Isso é exatamente o que a regra "o idioma nunca altera a regra
   de negócio" proíbe — e a melhor forma de garantir que ninguém escreva essa
   policy é o valor não estar disponível ali.
3. **Não há onde colocá-lo sem custo.** `raw_user_meta_data` é gravável pelo
   próprio cliente via `auth.updateUser`, então não é mais confiável que um
   parâmetro — só menos visível, o que é pior. `raw_app_meta_data` só aceita
   `service_role`, o que faria trocar de idioma passar por uma Edge Function. Um
   Custom Access Token Hook resolveria, mas é infraestrutura nova (função no
   Postgres + hook configurado + o refresh do item 1) para transportar um valor
   que não é segredo.
4. **Não cobre as telas sem sessão.** Login, cadastro, recuperação de senha e os
   documentos legais renderizam antes de existir token. Elas precisam do valor
   local de qualquer jeito — então o mecanismo local existe sempre, e o token
   viraria uma segunda fonte de verdade para o mesmo dado.

E não economiza nada: são 4 consultas que precisam do idioma, não um atributo
ambiente. O token viaja em toda requisição — engordá-lo cobra bytes nas centenas
que não se importam.

#### Por que "query param", aqui, não é o que parece

No PostgREST o filtro vira `?locale=in.(en,pt-BR)` na URL. A objeção instintiva a
isso é sobre dado sensível na URL — e não há nenhum:

- As tabelas de tradução são **catálogo**, com `select … using (true)` para
  qualquer usuário autenticado. O pior que alguém faz manipulando esse valor é
  ler o próprio catálogo em outro idioma — que é uma tela do app.
- O valor é parametrizado pelo PostgREST: não há injeção. E é normalizado contra
  `SUPPORTED_LOCALES` antes de sair do app, então nem consulta sem sentido chega
  ao servidor.
- Diferente do claim, ele é **estado atual**: muda no mesmo instante em que a
  pessoa troca o idioma, com ou sem rede.

#### A preocupação legítima por trás da pergunta

"Não quero repetir o idioma em toda chamada" é a parte certa do instinto, e
resolve-se sem token: o idioma é lido **uma vez, dentro de
`requirementCatalogService`**, direto do módulo `src/i18n`. Nenhuma tela, nenhum
hook, nenhuma função de domínio e nenhuma outra camada recebe ou repassa locale
como parâmetro. Os únicos dois lugares do app que sabem que idioma é um filtro
são esse serviço e a chave do cache — um arquivo e uma string.

#### Terceira opção avaliada e recusada: RPC que lê o idioma no servidor

Seria o "está na sessão, não na chamada" feito direito — uma função
`get_requirement_catalog(p_countries, p_passport)` com
`select locale from profiles where id = auth.uid()` dentro, e o cliente não passa
nada. (Variante equivalente: enviar `Accept-Language` e lê-lo em SQL por
`current_setting('request.headers')`, que o PostgREST expõe.) Recusada porque:

- devolveria a preferência **gravada**, que pode estar atrás da local se a
  escrita falhou ou a pessoa está offline — o mesmo defeito do token, em outro
  lugar;
- acrescenta uma leitura de `profiles` a toda consulta de catálogo;
- põe decisão de apresentação dentro do banco;
- continua sem atender as telas sem sessão;
- é a camada que o AGENTS.md manda não criar sem necessidade concreta.

Fica anotada para quando o servidor passar a renderizar texto de verdade — que é
o cenário de push, tratado na §16.

---

## 15. Estratégia para documentos legais

### 15.1 Como está hoje

`src/features/legal/data/legal-documents.ts` exporta `LEGAL_IDENTITY` (6
marcadores `{{...}}` ainda não preenchidos), `privacyPolicy` e `termsOfUse` — 126
blocos tipados (`heading`/`subheading`/`paragraph`/`list`), com `**negrito**`
inline. Consumido por duas telas e por `scripts/build-legal-site.mjs`, que gera 5
páginas HTML em `site/`.

### 15.2 Proposta

```
src/features/legal/data/
  identity.ts          — LEGAL_IDENTITY (compartilhado, não traduzido)
  types.ts             — LegalBlock, LegalDocument
  pt-BR.ts             — privacyPolicy, termsOfUse (fonte canônica)
  en.ts                — idem, + sourceVersion
  es.ts                — idem, + sourceVersion
  index.ts             — getLegalDocuments(locale), com require() tardio
```

Decisões:

- **Um módulo por idioma, mesma estrutura de blocos.** Não fatiar bloco a bloco
  em chaves de dicionário: documento jurídico se lê e se revisa inteiro, e uma
  cláusula picada em 30 chaves é impossível de revisar.
- **`LEGAL_IDENTITY` não é traduzido.** Razão social, CNPJ, e-mail, domínio e
  foro são os mesmos em qualquer idioma. O foro continua brasileiro, e o texto em
  `en`/`es` precisa dizer isso — traduzir a cláusula não muda a jurisdição.
- **Versionamento:** cada documento traduzido declara `sourceVersion: '1.0'`. Um
  teste em `src/features/legal/tests/` falha quando
  `pt-BR.version !== en.sourceVersion` — ou seja, **mudar o pt-BR quebra o CI até
  as traduções serem atualizadas**. É o mecanismo que impede divergência
  silenciosa.
- Um segundo teste assere que os três documentos têm a **mesma quantidade e a
  mesma sequência de `kind`** de bloco, e o mesmo número de itens em cada lista.
  Não garante que a tradução esteja certa, mas pega seção faltando, item de lista
  esquecido e cláusula perdida — que é o erro real.
- **Carga tardia:** `require()` dentro de `getLegalDocuments`, para os ~84 KB de
  texto jurídico não serem avaliados no boot de quem nunca abre a tela.
- **Revisão humana obrigatória.** Uma primeira versão gerada por IA é ponto de
  partida, nunca publicação. A tradução herda as decisões editoriais já tomadas:
  nada de nome técnico de tabela no texto do usuário, e o país do passaporte
  descrito como dado pessoal comum, não sensível.

### 15.3 `npm run site`

`scripts/build-legal-site.mjs` passa a gerar as páginas nos três idiomas:

```
site/
  index.html  privacidade.html  termos.html  suporte.html  exclusao-de-conta.html
  en/  index.html  privacy.html    terms.html     support.html  delete-account.html
  es/  index.html  privacidad.html terminos.html  soporte.html  eliminar-cuenta.html
```

- `pt-BR` fica na raiz (as URLs atuais não quebram — importante, porque a
  Política de Privacidade é citada nas lojas).
- `<html lang>` correto por página e `<link rel="alternate" hreflang>` entre as
  versões, incluindo `x-default` apontando para a raiz.
- As três páginas que hoje têm texto escrito dentro do script (`index`,
  `suporte`, `exclusao-de-conta`) precisam do mesmo tratamento: esse texto sai do
  `.mjs` para `src/features/legal/data/<locale>.ts`, senão fica um quarto lugar
  com texto solto.
- O aviso de marcador `{{...}}` pendente continua como está e passa a verificar
  os três idiomas.

---

## 16. Estratégia para notificações

**Locais (existem hoje).** O texto é assado no agendamento, porque a notificação
dispara com o app fechado — não há como traduzir na hora do disparo. Desenho:

1. `getTripNotificationCandidates` deixa de devolver `title`/`body` e passa a
   devolver `{ marker, requiredPending, recommendedPending }`. O domínio fica sem
   texto e `trip-reminders.test.ts` deixa de assertar português.
2. `reminder-scheduler.ts` renderiza com `t()` no momento de agendar, no idioma
   ativo.
3. `signature` passa a incluir o locale: `${fireAt}|${locale}|${title}|${body}`.
   Assim a troca de idioma é detectada pelo `diffReminders` mesmo que o texto
   coincida, e o reagendamento é automático e idempotente — sem código novo.
4. O nome do canal Android é traduzido em `ensureAndroidChannel`.
5. `scheduleReminderPreview` (só em `__DEV__`) segue o mesmo caminho.

**Push (futuro).** É o único cenário em que o servidor monta o texto, e por isso
o único que precisa saber o idioma sem o app perguntar. Duas consequências do
desenho da §14.2, que valem registrar agora para não virarem surpresa:

- **`profiles.locale` sozinho não basta**, porque `null` significa "segue o
  aparelho" e o servidor não sabe qual é o aparelho. O idioma **efetivo** vai
  junto do token de push, na tabela que registrar o token. Isso não é remendo: um
  push é entregue a um aparelho, e duas pessoas — ou a mesma pessoa com dois
  telefones em idiomas diferentes — devem receber cada um no idioma do seu. O
  `profiles.locale` continua sendo a escolha explícita; o registro do token
  carrega o resultado dela aplicado àquele aparelho.
- **O texto do banner precisa chegar pronto**, então a tabela de chaves precisa
  existir também do lado do servidor, ou o payload carrega chave + parâmetros e
  quem resolve antes de enviar é o servidor. É aqui que uma RPC ou uma tabela de
  mensagens no banco passa a se justificar — e só aqui.

Nenhuma dessas decisões precisa ser tomada agora; o plano só garante que nada do
que se faz aqui atrapalhe depois.

---

## 17. Estrutura de pastas e arquivos proposta

```
src/i18n/                          ← novo, transversal como theme/ e lib/
  index.ts                         t(), getLocale, setLocale, useLocale
  locales.ts                       SUPPORTED_LOCALES, DEFAULT_LOCALE, normalizeLocale
  plural.ts                        seletor one/other/zero por idioma
  format.ts                        datas, meses, listas, ordenação
  storage.ts                       preferência em AsyncStorage
  messages/
    pt-BR.ts  en.ts  es.ts
  countries/
    pt-BR.ts  en.ts  es.ts         gerados por script + overrides curados
  cities/
    en.ts  es.ts                   overrides esparsos sobre a lista base
  tests/
    locale-normalization.test.ts
    completeness.test.ts           chaves iguais nos 3 idiomas
    fallback.test.ts
    plural.test.ts
    interpolation.test.ts
    format.test.ts
```

Por que `src/i18n/` e não uma feature: internacionalização não pertence a nenhum
domínio — `auth`, `trips`, `passports`, `legal` e `notifications` a consomem
igualmente. É a mesma natureza de `theme/tokens.ts` e de `constants/countries.ts`,
que já são transversais. Não há camada nova de abstração: é um módulo com uma
função pública (`t`) e uma tabela de dados.

O que **não** se cria: nenhum `providers/`, `services/i18n`, `useTranslation`
genérico, classe, registry ou sistema de plugins; nenhuma pasta `translations/`
além de `messages/` — dois nomes para a mesma coisa.

O que muda de lugar:

- `src/constants/countries.ts` mantém `Country`, `getFlagEmoji`,
  `normalizeSearch`, `searchCountries` e passa a **ler** os nomes de
  `src/i18n/countries/`. O arquivo continua sendo a porta de entrada de país —
  nenhum import de tela muda.
- `src/constants/cities.ts` mantém a lista base e aplica o override do locale em
  `getCitySuggestions`.
- Documentos legais ganham um arquivo por idioma **dentro de
  `features/legal/data/`**, respeitando a organização por feature.
- Cache do catálogo em `src/features/trips/data/catalog-cache.ts`, ao lado de
  `trip-persistence.ts`.

---

## 18. Estratégia de migração de todo o conteúdo atual

### Fase 0 — Núcleo (sem tradução nenhuma ainda)

1. Adicionar `expo-localization` e configurar o plugin em `app.json`; verificar
   em build nativo que o iOS reporta o idioma do sistema.
2. Criar `src/i18n/` com `t()`, `plural`, `normalizeLocale`, `storage` e um
   `messages/pt-BR.ts` **vazio**.
3. Criar os testes de `src/i18n/tests/` desde já — inclusive o de completude, que
   passa trivialmente com um idioma.
4. Migration nova: `profiles.locale` nullable com `check` da allowlist (§14.2).
   Nenhuma policy nova e nenhuma alteração no gatilho `handle_new_user()`.
5. `profilesService` ganha leitura e escrita do idioma, e a leitura entra em
   paralelo com a dos passaportes em `RootNavigator`, sem estender a espera.
6. Montar o provider fino em `app/_layout.tsx` e o seletor de idioma no Perfil
   (três idiomas + "Padrão do dispositivo"), ainda sem efeito visível.

Critério de saída: `npm check` passa e o app está idêntico ao de hoje — a
preferência já grava, lê e sincroniza, mas ainda não há o que traduzir.

**Concluída.** O que ficou diferente do previsto, e por quê:

- **`app.json` não foi tocado.** O plugin do `expo-localization` só produz
  efeito em build nativo (§14.1), e o app roda em Expo Go. A entrada que o
  `npx expo install` acrescentou sozinho foi revertida, e a configuração
  correta — com `supportedLocales` — está anotada na §14.1 para o primeiro
  build.
- **Dicionários por `import` estático**, não `require()` tardio — ver a nota
  da §6.
- **O seletor do Perfil já traduz a si mesmo** (duas chaves: o título da seção e
  "Padrão do dispositivo"). Era para ser inerte, mas traduzir a própria tela
  prova o caminho inteiro de ponta a ponta — detecção, escolha, gravação,
  releitura e redesenho — em vez de deixá-lo sem exercício até a Fase 1. Os
  nomes dos idiomas (`LANGUAGE_NAMES`) **não** são chaves: cada um aparece
  escrito nele mesmo, para quem trocou para um idioma que não lê conseguir
  voltar.
- **`ListRow` ganhou `selected`**, que marca o visto e o estado de
  acessibilidade juntos. Sem isso a seleção seria só visual, e um leitor de tela
  não diria qual idioma está ativo — um defeito novo introduzido pela própria
  tela de idioma.
- **`src/types/database.ts` recebeu `locale` à mão**, como o cabeçalho do
  próprio arquivo prevê enquanto o schema é pequeno.
- **Antes do `db push`, a leitura do idioma do perfil falha em silêncio** e o
  app funciona só com a preferência local — `getLocale` e `setLocale` já são
  chamadas com `catch`, e nenhuma tela depende delas.

### Fase 1 — Extrair pt-BR (uma tela por vez)

Ordem sugerida, das folhas para a raiz, para cada tela ser testável sozinha:

1. ✅ `components/ui/*` (8 arquivos, poucas strings)
2. ✅ `features/auth/*` + telas `(auth)/*` + `profile/*`
3. ✅ `features/passports/*` + `passport-picker` + `onboarding`
4. ✅ `features/trips/domain/*` — **esta é a etapa que muda assinatura**: descritor
   em vez de frase. Os testes correspondentes são reescritos junto.
5. ✅ `features/trips/components/*` + `trip-card` + `next-trip-hero`
6. ✅ `app/(app)/index.tsx`, `trips/index.tsx`, `trips/[id].tsx`, `item/[...]`
7. ✅ `trip-new`, `trip-edit`, `trip-preparing`, `account-deleting`, `auth/callback`
8. ✅ `features/notifications/*`
9. ✅ `travel-tips.ts`, `checklist-catalog.ts`

Regra por arquivo: nenhuma string literal visível sobra; o comportamento é
idêntico; `npm check` passa. Reversível a qualquer momento.

Critério de saída: a auditoria da §18.1 não encontra nada.

**Sub-etapa 1 concluída.** Os 15 arquivos de `components/ui/` foram lidos; 8
tinham texto de idioma. O que ficou diferente do previsto:

- **`src/i18n/format.ts` nasceu aqui**, um passo adiante do previsto (a §17 já
  reservava o caminho, mas o plano só chegava a ele na Fase 2). `date-range-picker.tsx`
  precisava dos nomes de mês e das iniciais de dia por idioma para não misturar
  português com uma tabela ainda fixa, e essa tabela — consultada por posição,
  não por frase — fica fora de `messages/*` de propósito: misturar as duas
  coisas tornaria `completeness.test.ts` cego a uma chave de frase esquecida.
  A tabela mensal completa de `trip-format.ts` (abreviada, três letras) é
  diferente desta e continua para a sub-etapa 4.
- **`SectionLabel` perdeu o `toUpperCase()`**, como a §5.4 exige — mas isso
  quebraria as 9 telas que ainda chamam `<SectionLabel>texto solto</SectionLabel>`.
  Em vez de adiar a mudança, os 9 pontos de chamada (em `profile/edit.tsx`,
  `profile/index.tsx`, `[requirementId].tsx` ×3, `login.tsx`, `trip-edit.tsx`
  ×4, `passports-section.tsx`, `travel-tips-carousel.tsx`) ganharam a chave já
  em caixa alta no mesmo commit — só essa linha em cada arquivo, sem tocar no
  resto do texto pt-BR que ainda pertence à sub-etapa daquele arquivo. Sem
  isso, o app rodaria com um regressão visível (rótulos de seção em minúsculas)
  até essas telas chegarem na ordem.
- **`showDialog`'s `DEFAULT_BUTTONS`** deixou de ser uma constante de módulo e
  passou a avaliar `t('common.action.ok')` por chamada, no valor padrão do
  parâmetro — a constante de módulo teria congelado "OK" no idioma de quando o
  arquivo foi importado, e não no idioma ativo no momento do diálogo.
- Nenhuma das 7 outras alterações mudou texto visível em pt-BR: `npx tsc`,
  `expo lint`, `prettier --check` e os 195 testes passam sem diferença de
  comportamento.

**Sub-etapa 2 concluída.** `features/auth/*`, as 4 telas de `(auth)/`, `profile/*`
(4 telas) e `legal-consent-notice.tsx` — este último por acoplamento, pelo
mesmo motivo do `SectionLabel` na sub-etapa 1. Cerca de 110 chaves novas.
Achados que mudaram o previsto:

- **Duas mensagens de erro que a auditoria original classificou como
  "diagnóstico, não exibidas" na verdade chegam à tela.** `createSessionFromUrl`
  e `signInWithApple`, em `auth-service.ts`, lançam `Error`s cujo `.message` cai
  em `toAuthMessage` e, sem correspondência no mapa de mensagens do GoTrue, saía
  cru para a tela de login — em português, em qualquer idioma. Criei
  `AuthUiError` (chave + parâmetros, sem texto) para que a tradução aconteça em
  `toAuthMessage`, no momento de exibir, e não no momento do `throw` — evita que
  um erro lançado em um idioma seja mostrado congelado nele se o idioma mudar
  antes de a tela renderizar. `AuthCancelledError` continua com mensagem em
  português: confirmei que seu `.message` nunca é lido, só o `instanceof`.
- **O fallback de `toAuthMessage` deixou de devolver `error.message` cru.**
  Antes, qualquer erro do GoTrue sem mapeamento aparecia em inglês para o
  usuário. Agora cai em `auth.error.unexpected`, traduzido — a mudança que a
  §7 item 5 do plano já previa e que só ficou concreta ao implementar.
- **`isDeleteConfirmed` mudou de comparação exata para comparação sem acento e
  sem caixa, e passou a aceitar a palavra de dois idiomas** (o ativo e o
  pt-BR), como a §7 item 4 definia. Isso teve um efeito colateral correto:
  `'Excluír'` (só com acento errado) agora confirma, porque normaliza para o
  mesmo texto de `'Excluir'` — não é afrouxamento da regra, é a mesma palavra
  com um erro de teclado. `delete-account.test.ts` foi reescrito para cobrir
  isso e o cruzamento de idiomas explicitamente.
- **`delete-account.ts` só pôde ganhar o idioma da confirmação porque lê
  direto dos módulos puros de `i18n`** (`locales.ts`, `messages/*.ts`), nunca
  de `src/i18n/index.ts` — confirmado por teste manual sob `node --test`, já
  que aquele módulo carrega `expo-localization` e quebraria o `npm test`.
- **`LegalConsentNotice` tinha um defeito de composição anterior ao i18n**:
  montava a frase por concatenação (`{lead}, você concorda com os Termos...`),
  o que produziria ordem de palavras errada em inglês e espanhol. Trocado por
  `variant` (`'continue' | 'createAccount'`) e uma chave com a frase inteira,
  com `{terms}`/`{privacy}` substituídos por nós React (os links) — o mesmo
  princípio do `renderInlineBold` novo, criado para o **negrito** do aviso de
  exclusão de conta e reaproveitável nos documentos legais na Fase 5.
- **`getDisplayName` ganhou um parâmetro `fallback`** em vez de importar
  `t()`: o módulo continua sem depender de idioma, e quem chama (a única tela,
  `profile/index.tsx`) fornece o texto resolvido.
- **`PROVIDER_LABELS` e `PASSWORD_RULES`/`PASSWORD_STRENGTH_LABELS` saíram do
  domínio.** Viraram `PASSWORD_RULE_ORDER` (só a ordem, sem texto) e mapas
  `chave → MessageKey` nas telas que os consomem — a mesma mudança de forma
  que a §5.2 pedia para `trip-limits.ts` etc., aplicada aqui primeiro porque
  `auth/` veio antes na ordem da Fase 1.
- Dois placeholders de senha (`'••••••••'`) ficaram fora do i18n de propósito:
  são glifos decorativos, não idioma — o mesmo raciocínio já usado para `%`
  na sub-etapa 1.
- `npx tsc`, `expo lint`, `prettier --check` e os 201 testes passam.

**Sub-etapa 3 concluída.** `features/passports/*` (4 arquivos), `passport-picker.tsx`
e `onboarding.tsx`. ~34 chaves novas. Sem testes nesta pasta — nenhuma restrição
de `node --test` a considerar. Pontos que valem registrar:

- **`passports-context.tsx` importa `@/i18n` diretamente.** É um contexto React
  fundo na árvore, sem uso fora do app — diferente de `delete-account.ts` na
  sub-etapa 2, não precisou dos módulos puros.
- **Nome de país continua em pt-BR nesta sub-etapa, de propósito.**
  `getCountryName(code)` só localiza na Fase 2; os textos que o envolvem — a11y
  do passaporte principal (`{name}, passaporte principal`), o título do diálogo
  de remoção (`Remover {name}?`) — já usam chave com `{name}` interpolado, então
  quando a Fase 2 trocar `getCountryName`, o texto ao redor já acompanha sem
  tocar de novo nestes arquivos.
- **Um esquecimento pego pela própria varredura final**: a `accessibilityHint`
  "Abre as opções do passaporte" de `PassportRow` não tinha entrado no primeiro
  lote de chaves — a auditoria da §18.1 (grep de literais) não pega
  `accessibilityHint` dinâmico atribuído fora de uma prop de string direta, só o
  `grep` de props com aspas literais pegou porque a linha ainda tinha o texto
  cru no momento da varredura. Adicionado como `a11y.passport.openOptions`.
- `npx tsc`, `expo lint`, `prettier --check` passam; nenhum teste a rodar além
  da suíte completa (201, inalterada).

**Sub-etapa 4 concluída.** `trip-limits.ts`, `trip-progress.ts`, `trip-status.ts`,
`requirement-matching.ts` (2 pontos) e `trip-format.ts` — os cinco arquivos de
`features/trips/domain/`. 6 testes reescritos, ~55 chaves novas. Esta foi a
etapa mais delicada da Fase 1, e o que mudou em relação ao desenho original do
plano vale registrar com cuidado:

- **`trip-format.ts` não virou descritor — continua devolvendo string, só que
  chamando `t()` internamente.** O plano (§5.2) previa
  `summarizeTripSeasons → { season, seasons[], status }`, mas ao chegar na
  implementação isso se mostrou desnecessário: nenhum teste do projeto trava
  este arquivo a texto em português (não existe `trip-format.test.ts`), e ele
  não precisa rodar sob `node --test`. As duas razões que justificam a
  conversão para descritor em `trip-limits.ts`/`trip-status.ts` — destravar o
  arquivo para `node --test` e parar de travar teste a idioma — simplesmente
  não se aplicam aqui. Reclassifiquei o arquivo como **formatador de
  apresentação**, mesma categoria de `src/i18n/format.ts`: continua morando em
  `domain/` porque as regras que ele formata (limite de país, status, estação)
  são daqui, mas não tem mais a obrigação de ficar livre de idioma que os
  módulos com teste têm. Isso evitou mudar a assinatura de `summarizeTripSeasons`
  e, com isso, evitou tocar `trips/[id].tsx` para nada além do que já ia mudar.
  Fica registrado como desvio deliberado do desenho original, não um
  esquecimento — a essência do princípio ("domínio não hardcoda idioma") continua
  valendo, só que por uma regra mais específica: "só o que um teste trava a
  português, ou o que precisa rodar puro, vira descritor".
- **`requirement-matching.ts` só precisou de dois pontos**: `TRIP_SECTION_LABEL`
  ('Toda a viagem') virou `label: null` quando `kind === 'trip'`, resolvido pela
  tela com `t('trips.checklist.wholeTrip')`; e o `localeCompare(a, b, 'pt-BR')`
  de `groupRequirementsByScope` passou a receber `locale` como parâmetro — a
  correção que a §7 item 4 do plano já apontava. `groupRequirementsByScope` não
  tem nenhum consumidor em produção hoje (só `describeRequirementScope` é usado,
  em `[requirementId].tsx`), mas manteve os testes e a correção mesmo assim: é
  código já testado e exportado, e a mesma regra vale para quando ganhar uso.
- **`checkTripLimits` perdeu `message` e ficou só `{ isValid, issue }`,
  exatamente como o plano previa.** `formatCountrySelection` foi removido do
  domínio — as duas chamadas (limite estourado, seletor de país) viraram chaves
  resolvidas na tela. Para não duplicar a resolução de `issue → texto` em
  `trip-new.tsx` e `trip-edit.tsx` (que compartilham a mesma regra via
  `useTripDraft`), criei `formatTripLimitMessage(issue, max)` em `trip-format.ts`
  — reaproveitando a reclassificação do arquivo como formatador — em vez de
  duplicar o mapa `issue → chave` nos dois arquivos.
- **`buildTripMoment`/`buildTripCountdown` viraram descritores exatamente como
  o plano desenhou** (`{ tone, kind, days?, months? }` e
  `{ kind, days, totalDays? }`), e `formatReturnCountdown` virou
  `describeReturnCountdown` (`{ kind, days? }`) — não estava no texto do plano,
  mas é a mesma mudança de forma, e ficou inconsistente deixá-la de fora.
- **Efeito borboleta esperado e absorvido**: mudar as quatro assinaturas quebrou
  compilação em `trip-new.tsx`, `trip-edit.tsx`, `trip-card.tsx`,
  `next-trip-hero.tsx` e `trips/[id].tsx` — todos de sub-etapas futuras (5, 6 e
  7). Cada um recebeu só as linhas especificamente quebradas resolvidas com
  `t()`, nunca a migração completa do arquivo, que continua para a sub-etapa
  correspondente. `trip-card.tsx` e `next-trip-hero.tsx` também tinham dois
  bugs de concatenação preexistentes ao lado do que quebrou — `${pending}
pendentes"` e `${headline}` montado por concatenação de peças já traduzidas —
  corrigidos com chaves de frase inteira (`trips.requiredPendingCount`,
  `a11y.tripHero.dayOf`) em vez de perpetuados.
- **Achado fora do escopo, registrado e não corrigido agora**:
  `next-trip-hero.tsx` tem `textTransform: 'uppercase'` em dois estilos
  (`countdownLabel`, `nextStepLabel`) — a mesma violação que `SectionLabel` já
  tinha na sub-etapa 1 (capitalização não pode vir de `textTransform`, só do
  dicionário). Como o texto que passa por esses estilos só é migrado por inteiro
  na sub-etapa 5, a correção fica para lá — misturar agora inflaria o diff desta
  sub-etapa com uma mudança que não tem relação com o contrato do domínio.
- `npx tsc`, `expo lint`, `prettier --check` e os 203 testes passam.

**Sub-etapa 5 concluída.** Os 12 arquivos de `features/trips/components/`.
`season-shapes.tsx`, `season-field.tsx` e `seasonal-backdrop.tsx` não tinham
texto de usuário (só física de partículas e SVG) e ficaram sem alteração.
`trip-card.tsx` já tinha saído totalmente traduzido da sub-etapa 4 (os ajustes
cirúrgicos cobriram o arquivo inteiro por acaso, não só as linhas quebradas) e
`travel-tips-carousel.tsx` também já usava `t()` desde antes — nenhum dos dois
precisou de mudança aqui. ~35 chaves novas nos seis arquivos restantes
(`next-trip-hero.tsx`, `city-step.tsx`, `celebration-overlay.tsx`,
`trip-country-chips.tsx`, `trip-filter-bar.tsx`, `date-range-summary.tsx`).

- **O achado da sub-etapa 4 foi corrigido aqui**: os dois `textTransform:
'uppercase'` de `next-trip-hero.tsx` (`countdownLabel`, `nextStepLabel`)
  saíram dos estilos. O texto que passava por eles — os rótulos de
  `trip.countdown.*.label` e os quatro rótulos de `nextStepLabel`
  (`✨ Verifique agora` etc.) — já era exibido em caixa alta antes da mudança,
  então a caixa alta foi movida para dentro do dicionário em vez de
  desaparecer, mesmo padrão que `SectionLabel` já usa desde a sub-etapa 1.
  Como `trip.countdown.ongoing.label` (sem `totalDays`) reaproveitava
  `trip.moment.ongoing` — uma chave também usada por `trip-card.tsx` em
  contexto que não é caixa alta —, não deu para só maiusculizar o valor
  existente sem quebrar o card; ganhou uma chave própria,
  `trip.countdown.ongoingUndated.label`, só para este uso.
- **`date-range-summary.tsx`** trocou os literais "IDA"/"VOLTA" (que já eram
  texto solto em caixa alta, sem `textTransform`) por chaves já escritas em
  caixa alta nos três idiomas — sem mudança visual, só saindo do código-fonte.
- Nenhum arquivo desta sub-etapa precisou de descritor: são todos
  apresentação pura (JSX com `Text`), a mesma categoria de `trip-format.ts`.
- `npx tsc`, `expo lint`, `prettier --check` e os 203 testes passam.

**Sub-etapa 6 concluída.** As quatro telas de `app/(app)/`: `index.tsx`
(Home), `trips/index.tsx` (lista), `trips/[id].tsx` (checklist) e
`trips/item/[requirementId].tsx` (detalhe). ~45 chaves novas.

- **Texto repetido entre telas virou chave compartilhada, não duplicada**:
  "Sua conexão oscilou. Toque para carregar de novo." (Home e lista) é
  `trips.error.loadRetry`; "Sua conexão oscilou. Toque no menu para tentar de
  novo." (menu ••• e exclusão, ambos em `trips/[id].tsx`) é
  `trips.error.menuRetry`; "Criar viagem" (botão vazio da Home, botão vazio da
  lista, e a ação do filtro "Futuras" vazio) é `trips.action.create`;
  "Excluir viagem"/"Editar viagem" (menu ••• e diálogo de confirmação) são
  `trips.action.delete`/`trips.action.edit`. Todo o resto de "Sua conexão
  oscilou..." tem uma frase final diferente por tela (atualizar / salvar /
  tentar de novo) e ficou uma chave por caso — juntar teria exigido um
  parâmetro só para a ação final, mais complicado que ter cinco chaves curtas.
- **Texto de `__DEV__` também foi traduzido** ("Testar lembretes" e a
  mensagem de lembretes agendados, em `trips/[id].tsx`): não roda em produção,
  mas ainda é texto que a pessoa lê ao testar, e o plano não abre exceção para
  código atrás de flag.
- **`a11y.openItem: 'Abrir {name}'`** ficou genérico de propósito: o mesmo
  padrão "Abrir X" aparecia em `RequirementRow` (abre o detalhe do item) e em
  `OfferRow` (abre um link externo) — semânticas diferentes, texto idêntico.
  Já a fonte oficial (`Pressable` de `source_url`) tem uma frase mais longa,
  "Abrir a fonte oficial: X", e ficou com chave própria
  (`a11y.requirement.openSource`) em vez de forçar o mesmo molde.
- `CATEGORY_LABELS`/`PRIORITY_LABELS`/`CATEGORY_ICONS` de
  `checklist-catalog.ts`, usados em `trips/[id].tsx` e
  `item/[requirementId].tsx`, não foram tocados — pertencem à sub-etapa 9.
- Durante a edição tentei mexer por engano em
  `features/trips/domain/requirement-matching.ts` (arquivo de outra
  sub-etapa, já concluída); percebi antes de rodar qualquer verificação e
  desfiz a troca no mesmo passo, então o arquivo saiu deste commit sem
  diferença.
- `npx tsc`, `expo lint`, `prettier --check` e os 203 testes passam.

**Sub-etapa 7 concluída.** As cinco telas da lista mais `_layout.tsx` e
`(app)/_layout.tsx`, incluídos por conta própria — ambos estão na lista de
"Alterados" do §21 do plano, mas nenhum dos nove itens da ordem os cobria
explicitamente; ficariam sem dono até o fim da Fase 1. ~70 chaves novas.

- **Bug real corrigido antes desta sub-etapa, fora do plano**: trocar de
  idioma no seletor do perfil não atualizava as telas já montadas — só o
  próprio seletor, que assina `useLocaleChoice()` diretamente. A causa é o
  `StaticContainer` do React Navigation, que embrulha o conteúdo de cada tela
  e ignora re-renderizações do pai quando só os `children` mudam — por isso
  assinar `useLocale()` só no `_layout.tsx`, como a sub-etapa 0 desenhou,
  nunca chegava a redesenhar uma tela já em cena. Corrigido com `key={locale}`
  no `Stack` de `AppContent`: a troca agora remonta a árvore de navegação
  inteira, o mesmo efeito do reload manual que o problema exigia, mas
  instantâneo e sem perder sessão/passaportes (esses ficam fora da `key`,
  achatados em `AuthProvider`/`PassportsProvider`). Commit `c3ab5a7`, separado
  desta sub-etapa por não ser trabalho de tradução.
- **`ReviewHeader` (`trip-new.tsx`) parou de computar `.toUpperCase()`/
  `.toLowerCase()` sobre texto traduzido** — o mesmo problema do
  `SectionLabel`, só que em JS em vez de `textTransform`. Agora recebe
  `label` (já em caixa alta) e `a11yLabel` (frase pronta) diretamente do
  chamador, e o texto do botão ("Alterar") vira `common.action.change`.
- **Texto repetido virou chave compartilhada**: "Para onde você vai?"
  (`trip-new` e o seletor de países do `trip-edit`) é `trip.countryStep.title`;
  "Nome da viagem" (rótulo do campo nos dois fluxos) é `trip.name.label`;
  "Editar viagem" no cabeçalho do `trip-edit` reaproveita `trips.action.edit`,
  já criada na sub-etapa 6; "Fechar"/"Voltar"/"Criar viagem" reaproveitam
  `common.action.close`/`common.action.back`/`trips.action.create`.
  "Tentar de novo" ganhou `common.action.retry`, usada em `_layout.tsx` e em
  `account-deleting.tsx`.
- `npx tsc`, `expo lint`, `prettier --check` e os 203 testes passam.

**Sub-etapa 8 concluída.** Os cinco arquivos de `features/notifications/`.

- **`trip-reminders.ts` virou descritor**, pela mesma dupla razão de
  `trip-limits.ts`/`trip-status.ts` na sub-etapa 4: o próprio arquivo é
  carregado direto por `trip-reminders.test.ts` via import relativo `.ts`
  (comentário no topo do arquivo já avisava disso) e o teste travava
  `.title`/`.body` a frases em português. `TripReminder.title`/`.body` deram
  lugar a `pending: { kind: 'required' | 'recommended'; count: number } |
null` — `null` quando a véspera não tem nada específico a citar (ainda
  assim dispara, só que com a mensagem genérica), e a ausência do campo
  inteiro (`undefined` no retorno do `build` do marco) é o que faz o marco de
  aproximação ser pulado quando não há pendência nenhuma. A `signature`, que
  antes derivava do texto para saber quando reagendar, passou a derivar do
  próprio descritor (`kind`+`pending`), preservando a mesma garantia de
  idempotência sem depender de string.
- **`reminder-scheduler.ts` ganhou `resolveContent()`**, que resolve
  `title`/`body` a partir do descritor só na hora de agendar de verdade — o
  único lugar que toca `expo-notifications`, então o único que precisa
  conhecer o idioma ativo. `scheduleReminderPreview` (o botão `__DEV__` de
  `trips/[id].tsx`) passou a usar a mesma função, então os lembretes de teste
  saem no idioma certo também.
- Nome do canal do Android (`'Lembretes de viagem'`) também passou a vir de
  `t()` — é texto que a pessoa vê nos ajustes de notificação do sistema.
- `reminder-permission.ts` e `use-notification-navigation.ts` não tinham
  texto de usuário (só booleanos e navegação) e ficaram sem alteração.
- `npx tsc`, `expo lint`, `prettier --check` e os 203 testes passam.

**Sub-etapa 9 concluída — Fase 1 fechada.** `travel-tips.ts` e
`checklist-catalog.ts`.

- **`travel-tips.ts` virou catálogo de chaves**, pela mesma razão de
  `trip-reminders.ts` na sub-etapa 8: o comentário no topo do arquivo já
  avisava que `travel-tips.test.ts` o carrega direto via import relativo
  `.ts` sob `node --test`. `text: string` deu lugar a `textKey: MessageKey`,
  e as duas telas que mostram a dica (`travel-tips-carousel.tsx`,
  `next-trip-hero.tsx`) resolvem com `t(tip.textKey)`. O teste que checava
  `tip.text.length <= 140` passou a importar o dicionário pt-BR (também puro,
  sem `expo-localization`) e conferir o comprimento por lá.
- **`checklist-catalog.ts` virou formatador de apresentação**, mesma
  categoria de `trip-format.ts`: nenhum teste o carrega nem trava texto a
  português, então `CATEGORY_LABELS`/`PRIORITY_LABELS` (que eram
  `Record<..., string>`) viraram as funções `categoryLabel()`/
  `priorityLabel()`, chamando `t()` direto. Os três pontos de chamada
  (`trip-preparing.tsx`, `trips/[id].tsx`, `item/[requirementId].tsx`) foram
  ajustados para a nova forma de função em vez de indexação de objeto.
- **Achado fora do escopo das nove sub-etapas, corrigido nesta**: a
  auditoria final da §18.1, rodada no fim desta sub-etapa por já ser o
  fechamento da Fase 1, encontrou `(app)/_layout.web.tsx` — a variante web da
  navegação por abas, um arquivo separado de `(app)/_layout.tsx` que a
  sub-etapa 7 já tinha corrigido — ainda com `'Início'`/`'Viagens'`/`'Perfil'`
  fixos. Reaproveitou as mesmas chaves `tabs.*` já criadas.
- **O restante da varredura ampla confirma código já limpo por desenho**: os
  literais em `services/*.ts` (`'Falha ao listar passaportes'` e afins) são o
  `context` de `DataAccessError`, nunca renderizado — a doc do arquivo já diz
  que "as telas não conhecem o formato do Supabase", e o item de auditoria
  "nenhuma tela renderiza `error.message` de `DataAccessError`" existe
  justamente para isso continuar valendo. `constants/countries.ts`/
  `cities.ts` pertencem à Fase 2, e `legal-documents.ts` à Fase 5 — nenhum dos
  dois é lacuna desta fase.
- `npx tsc`, `expo lint`, `prettier --check` e os 203 testes passam.

### Fase 2 — Países e cidades

10. `scripts/build-country-names.mjs` + overrides curados; `getCountryName`
    localizado.
11. Overrides de cidade em `en` e `es`; ordenação por locale.

### Fase 3 — Catálogo do banco

12. Migration: `visa_rule_id` em `trip_requirements` (arquivo novo).
13. Migration: as 4 tabelas `*_translations`, com RLS, policies, grants e revokes
    no mesmo arquivo, conferidas contra a checklist do AGENTS.md e contra o
    `diff` de `create table` × `enable row level security` antes do `db push`.
14. Migration: carga de `pt-BR` copiando as colunas atuais.
15. Cliente: `requirement-catalog.ts` pede locale + pt-BR na mesma requisição;
    `catalog-cache.ts`; resolução na leitura em `tripsService.getDetail` e em
    `[requirementId].tsx`.
16. Verificar em viagem já existente que o texto continua idêntico com o app em
    pt-BR — a resolução tem que ser transparente antes de existir outro idioma.

### Fase 4 — Traduzir (en e es)

17. Gerar `messages/en.ts` e `es.ts` a partir do pt-BR. A primeira versão pode
    sair de ferramenta/IA, **como conteúdo estático revisável**: vira arquivo
    versionado no repositório, revisado por pessoa, e nunca tradução em runtime.
18. Migrations de carga de `en` e `es` do catálogo (arquivos novos, um por
    idioma, para poder revisar e reverter separadamente).
19. Revisão passando tela por tela nos três idiomas, com atenção a: texto que
    estoura o layout (o espanhol é ~15–20% mais longo que o português em botões),
    `numberOfLines`, `adjustsFontSizeToFit` no contador da Home, e rótulos de aba
    no Android.

### Fase 5 — Legal e acabamento

20. `en.ts` e `es.ts` dos documentos legais + testes de versão e de estrutura.
21. `build-legal-site.mjs` nos três idiomas, com `hreflang`.
22. `source_name` traduzido (opcional, §8.4).
23. Atualizar o AGENTS.md (§20).

### 18.1 Checklist de auditoria — "não sobrou texto hardcoded"

Executável, para rodar ao fim da fase 1 e em toda revisão de PR:

```bash
# 1. Literais acentuados fora de comentário, em src/ (ignorando i18n e testes)
grep -rnE "'[^']*[áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ][^']*'" --include=*.ts --include=*.tsx \
  src --exclude-dir=i18n --exclude-dir=tests | grep -vE ":\s*(//|\*)"

# 2. Texto literal em nó JSX
grep -rnoE ">[A-ZÀ-Úa-zà-ú][^<>{}]{2,}<" --include=*.tsx src

# 3. Props de texto com literal
grep -rnE "\b(label|title|subtitle|placeholder|accessibilityLabel|accessibilityHint|description|meta|lead|message|text)=\"[^\"]+\"" \
  --include=*.tsx src

# 4. Transformação de caixa em runtime (proibida)
grep -rn "toUpperCase()\|textTransform" --include=*.ts --include=*.tsx src

# 5. Concatenação de plural sobrevivente
grep -rnE "=== 1 \?|length === 1 \?" --include=*.ts --include=*.tsx src

# 6. Migrations que inserem texto de catálogo — conferir se têm as 3 traduções
grep -l "insert into public.requirement_templates" supabase/migrations/*.sql
```

Complemento manual (o grep não pega):

- [ ] toda `showDialog(...)` tem título, corpo e rótulos de botão vindos de `t()`
- [ ] todo `accessibilityLabel` e `accessibilityHint` veio de `t()`
- [ ] todo `placeholder` veio de `t()`
- [ ] nenhuma tela renderiza `error.message` de `DataAccessError`
- [ ] nenhum `console.warn`/`log` virou texto de usuário por engano
- [ ] emojis dentro de chaves foram mantidos (são parte da copy, não decoração)
- [ ] `travel-tips` continua com `id` estável (é a chave)
- [ ] nenhuma chave é montada dinamicamente sem uma união de tipo que a cubra

### 18.2 Como as chaves são nomeadas

`area.tela.elemento[.variacao]`, minúsculas e pontos:

```
auth.login.google            trips.list.empty.title
trips.detail.progress.label  trip.new.step.countries.title
common.action.cancel         a11y.requirement.toggle.check
```

`common.*` só para o que aparece em três ou mais lugares (Cancelar, Fechar,
Voltar, Continuar). Duplicar uma chave é melhor que criar um `common` que depois
precisa divergir por contexto.

---

## 19. Estratégia de testes

Todos em `node --test`, sem runner novo, seguindo o padrão atual (import relativo
com extensão `.ts`).

**Motivo para os dicionários serem `.ts` e não `.json`:** verificado neste
projeto que o Node 22.23 recusa `import d from './d.json'` sem
`with { type: 'json' }`, enquanto o Metro aceita sem atributo. `.ts` funciona nos
dois, dá tipagem das chaves e permite comentário para quem traduz.

| Teste                                    | O que assere                                                                                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `locale-normalization.test.ts`           | `pt-PT`→`pt-BR`, `en-GB`→`en`, `es-419`→`es`, `fr-FR`→`en`; lista de preferências percorrida em ordem; entrada malformada não quebra; `DEFAULT_LOCALE` (fallback de string) e `FALLBACK_UI_LOCALE` (seleção inicial) não se confundem |
| `locale-preference.test.ts` (novo)       | escolha local vence o aparelho; `profiles.locale` nulo devolve o aparelho; valor gravado vence em aparelho novo; "Padrão do dispositivo" volta a nulo; valor fora da allowlist vindo do banco é descartado                            |
| `completeness.test.ts`                   | conjunto de chaves idêntico nos 3 idiomas; mesmas formas plurais; nenhum `{param}` presente em um idioma e ausente em outro                                                                                                           |
| `fallback.test.ts`                       | chave ausente no idioma ativo cai em pt-BR; ausente nos dois devolve a chave e avisa; nunca devolve `undefined`                                                                                                                       |
| `plural.test.ts`                         | 0/1/2/11/100 nos três idiomas; `zero` usado quando existe; `pt-BR` com 0 usa `other`                                                                                                                                                  |
| `interpolation.test.ts`                  | `{param}` substituído; parâmetro faltando não quebra; chave sem parâmetro ignora extras                                                                                                                                               |
| `format.test.ts`                         | as 4 formas de intervalo de data nos 3 idiomas; mês por extenso; ordenação de país por locale; a regressão de fuso (`2026-06-15` não volta um dia)                                                                                    |
| `trip-status.test.ts` (reescrito)        | `buildTripMoment`/`buildTripCountdown` devolvem `kind`/`tone` corretos — **sem** assertar texto                                                                                                                                       |
| `trip-progress.test.ts` (reescrito)      | contagens; sem texto                                                                                                                                                                                                                  |
| `trip-limits.test.ts` (reescrito)        | `issue`; sem texto                                                                                                                                                                                                                    |
| `trip-reminders.test.ts` (reescrito)     | marcos e contagens; `signature` muda quando o locale muda; `diffReminders` reagenda na troca de idioma                                                                                                                                |
| `requirement-resolution.test.ts` (novo)  | a cadeia de fallback de §8.3 nas 5 posições; `{country}` resolvido no idioma ativo; item de usuário (`template_id` nulo) nunca traduzido                                                                                              |
| `catalog-cache.test.ts` (novo)           | serve cache vencido; falha de rede preserva o cache; chave por locale; normalização em lote                                                                                                                                           |
| `cities.test.ts` (ampliado)              | override aplicado; cidade sem override cai na base; busca sem acento casa nos 3 idiomas                                                                                                                                               |
| `legal-version.test.ts` (novo)           | `sourceVersion` bate com a versão do pt-BR                                                                                                                                                                                            |
| `legal-structure.test.ts` (novo)         | mesma sequência de `kind` e mesmo tamanho de lista nos 3 idiomas                                                                                                                                                                      |
| `delete-confirmation.test.ts` (ampliado) | palavra do idioma ativo e a de pt-BR são aceitas; caixa e acento ignorados; palavra errada recusada                                                                                                                                   |

**Testes de performance:** um micro-benchmark de `t()` como teste de regressão
vale pouco — é lookup em objeto. O que vale medir, manualmente, em Android de
entrada: tempo até a primeira tela antes e depois, e o tempo da troca de idioma.
Registrar os números no PR, não automatizar.

**Sem internet:** cobertura por teste no `catalog-cache` (rede mockada falhando)
e verificação manual em modo avião dos cenários da §12.

---

## 20. Alterações propostas no AGENTS.md

Seção nova, entre "Regras de negócio" e "UX", no estilo curto do arquivo:

```markdown
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
```

Ajuste de uma linha em **Migrations**, no fim da lista de obrigações:

```markdown
5. Se a tabela guarda texto que o usuário lê, a tradução entra no mesmo
   arquivo — para os três idiomas.
```

Ajuste em **Antes de implementar**, item novo:

```markdown
5. Se a alteração acrescenta texto visível, conferir a seção "Idiomas".
```

---

## 21. Arquivos que provavelmente precisarão de alteração

### Novos (~30)

```
src/i18n/index.ts · locales.ts · plural.ts · format.ts · storage.ts
src/i18n/messages/pt-BR.ts · en.ts · es.ts
src/i18n/countries/pt-BR.ts · en.ts · es.ts
src/i18n/cities/en.ts · es.ts
src/i18n/tests/*.test.ts                                    (6 arquivos)
src/features/legal/data/identity.ts · types.ts · pt-BR.ts · en.ts · es.ts · index.ts
src/features/legal/tests/legal-version.test.ts · legal-structure.test.ts
src/features/trips/data/catalog-cache.ts
src/features/trips/tests/requirement-resolution.test.ts · catalog-cache.test.ts
scripts/build-country-names.mjs
supabase/migrations/<ts>_profiles_locale.sql
supabase/migrations/<ts>_trip_requirements_visa_rule_id.sql
supabase/migrations/<ts>_catalog_translations.sql
supabase/migrations/<ts>_catalog_translations_seed_pt_br.sql
supabase/migrations/<ts>_catalog_translations_seed_en.sql
supabase/migrations/<ts>_catalog_translations_seed_es.sql
```

### Alterados

**Rotas (23):** `_layout.tsx`, `(app)/_layout.tsx`, `(app)/_layout.web.tsx`,
`(app)/index.tsx`, `(app)/trips/index.tsx`, `(app)/trips/[id].tsx`,
`(app)/trips/item/[requirementId].tsx`, `(app)/profile/index.tsx`,
`(app)/profile/edit.tsx`, `(app)/profile/password.tsx`, `(auth)/login.tsx`,
`(auth)/email-login.tsx`, `(auth)/sign-up.tsx`, `(auth)/forgot-password.tsx`,
`trip-new.tsx`, `trip-edit.tsx`, `trip-preparing.tsx`, `passport-picker.tsx`,
`onboarding.tsx`, `account-deleting.tsx`, `auth/callback.tsx`,
`legal/privacidade.tsx`, `legal/termos.tsx`

**Componentes de UI (8):** `date-range-picker.tsx`, `search-field.tsx`,
`text-field.tsx`, `screen-header.tsx`, `dialog.tsx`, `avatar.tsx`,
`section-label.tsx`, `accordion-section.tsx`

**Trips (22):** `data/checklist-catalog.ts`, `data/travel-tips.ts`,
`data/trip-persistence.ts`, `domain/trip-limits.ts`, `domain/trip-format.ts`,
`domain/trip-progress.ts`, `domain/trip-status.ts`,
`domain/requirement-matching.ts`, `hooks/use-trip-draft.ts`,
`components/next-trip-hero.tsx`, `trip-card.tsx`, `trip-filter-bar.tsx`,
`city-step.tsx`, `date-range-summary.tsx`, `celebration-overlay.tsx`,
`trip-country-chips.tsx`, e os 6 testes existentes de `tests/`

**Auth (11):** `auth-errors.ts`, `password.ts`, `email.ts`, `delete-account.ts`,
`delete-account-modal.tsx`, `user-profile.ts`, `password-field.tsx` + 4 testes

**Passaportes (4):** `passports-context.tsx`, `passport-messages.ts`,
`passports-section.tsx`, `country-picker-list.tsx`

**Notificações (4):** `domain/trip-reminders.ts`, `data/reminder-scheduler.ts`,
`components/reminder-opt-in-card.tsx`, `tests/trip-reminders.test.ts`

**Legal (3):** `legal-documents.ts` (dividido), `legal-document-view.tsx`,
`legal-consent-notice.tsx`

**Dados e infra (8):** `constants/countries.ts`, `constants/cities.ts`,
`constants/destinations.ts`, `constants/tests/cities.test.ts`,
`services/requirement-catalog.ts`, `services/trips.ts`, `services/profiles.ts`
(ganha leitura e escrita do idioma), `types/database.ts` (regenerado)

**Auth/contexto (1):** `features/auth/auth-context.tsx` — semeia o idioma
gravado em paralelo com os passaportes

**Configuração (3):** `package.json` (+`expo-localization`, script de países),
`app.json` (plugin + localizações suportadas), `scripts/build-legal-site.mjs`

**Documentação (2):** `AGENTS.md`, `tasks/plano-internacionalizacao.md` (sai)

**Total: ~95 arquivos tocados, ~30 criados.**

---

## 22. Riscos e trade-offs

| Risco                                                                      | Gravidade      | Mitigação                                                                                                                                                                     |
| -------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mudar a resolução de texto da checklist toca a feature mais central do app | **Alta**       | A fase 3 é entregue e verificada **em pt-BR apenas**; se a resolução for transparente com um idioma, é segura com três. Reversível: as colunas antigas continuam preenchidas. |
| Tradução ruim de cláusula jurídica                                         | **Alta**       | Revisão humana obrigatória; teste de `sourceVersion` impede divergência; publicar só depois da revisão.                                                                       |
| Uma migration nova esquece as traduções                                    | Média          | Regra no AGENTS.md + fallback por registro (o pior caso é um item em português, não vazio). Sem cobertura automática — ponto fraco reconhecido.                               |
| Texto em espanhol estoura o layout                                         | Média          | Revisão tela a tela na fase 4; atenção a `numberOfLines`, `adjustsFontSizeToFit` e rótulos de aba no Android.                                                                 |
| iOS não reportar o idioma sem declarar as localizações no bundle           | Média          | Verificar em build nativo na fase 0, antes de qualquer extração.                                                                                                              |
| Domínio mudar de assinatura quebra testes existentes                       | Média          | Está no plano: os testes são reescritos na mesma etapa, e ficam melhores (asserem estrutura, não frase).                                                                      |
| Traduzir o catálogo com IA introduzir imprecisão em conteúdo de visto      | Média          | Título e descrição de template são orientação, não afirmação de fato; `visa_rules.notes` vem de fonte oficial e exige revisão de quem fez a coleta.                           |
| `pt-PT` recebendo pt-BR                                                    | Baixa          | Aceito e documentado; `pt-PT` reservado como locale futuro (uma linha em `normalizeLocale`).                                                                                  |
| `es-ES` com semana começando no domingo                                    | Baixa          | Perda conhecida; corrigível depois via `regionCode`, sem mudar arquitetura.                                                                                                   |
| Cidade gravada em pt aparecer em tela em inglês                            | Baixa          | Decisão (α) explícita na §9.2; caminho (β) registrado.                                                                                                                        |
| Leitura de `profiles` no login atrasar a entrada no app                    | Baixa          | Vai em paralelo com a dos passaportes, que já é esperada, e nunca estende a espera (§14.2).                                                                                   |
| Escrita de `profiles.locale` falhar e a escolha não acompanhar a conta     | Baixa          | A preferência local continua valendo; a próxima troca ou a próxima abertura reconcilia. A UI nunca depende dessa escrita.                                                     |
| Dobra o custo de manutenção de todo texto novo                             | **Permanente** | É o preço real de 3 idiomas. O teste de completude transforma esquecimento em erro de CI, que é o único jeito de esse custo não virar dívida silenciosa.                      |

**O que este plano deliberadamente não faz:** RTL (árabe/hebraico), formatação de
moeda, `Intl.PluralRules`, code splitting por idioma, tradução em runtime,
plataforma de gestão de tradução, `pt-PT`/`es-ES` como locales próprios. Cada um
é adicionável depois sem refazer nada do que está aqui.

---

## 23. Ordem recomendada de implementação

| #   | Etapa                                                                                                      | Depende de | Entrega sozinha?                                                  |
| --- | ---------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------- |
| 0   | **Concluída.** Núcleo `src/i18n/` + `expo-localization` + `profiles.locale` + seletor no Perfil + testes   | —          | sim (nada muda para o usuário)                                    |
| 1   | Extração pt-BR, tela por tela, incluindo descritores no domínio                                            | 0          | sim, por tela                                                     |
| 2   | Países (script + overrides) e cidades (overrides)                                                          | 1          | sim                                                               |
| 3   | Banco: `visa_rule_id`, tabelas de tradução, carga pt-BR, cache, resolução na leitura — verificado em pt-BR | 1          | sim (corrige o defeito de template que não alcança viagem antiga) |
| 4   | `en` e `es`: dicionários, países, cidades, catálogo. O seletor passa a funcionar                           | 1, 2, 3    | sim — é aqui que o app fica trilíngue                             |
| 5   | Documentos legais nos 3 idiomas + `npm run site` + `hreflang`, `source_name` traduzido, AGENTS.md          | 4          | sim                                                               |

A ordem é a que mantém o app funcionando em qualquer ponto de parada: até o fim
da etapa 3 nada muda para o usuário, e a etapa 4 é a única que liga o recurso.

---

## Checklist final

- [x] Todo texto estático identificado — §2.1 a §2.6
- [x] Todo texto dinâmico identificado — §2.7 (25 padrões)
- [x] Todo conteúdo do banco identificado — §8.1
- [x] PT-BR contemplado — canônico, fonte de tudo
- [x] EN contemplado — fase 4
- [x] ES contemplado — fase 4, em espanhol neutro
- [x] Países contemplados — §9.1, dataset gerado, 255 nomes
- [x] Cidades contempladas — §9.2, override esparso; decisão (α), sem migration
- [x] Legal contemplado — §15, app e site, com teste de versão
- [x] Notificações contempladas — §16, locais hoje, push desenhado
- [x] Fallback definido — §13, por chave no app, por registro no banco, pt-BR sempre
- [x] Cache definido — §11, stale-while-revalidate por locale em AsyncStorage
- [x] Offline considerado — §12, cadeia completa até o snapshot pt-BR
- [x] Performance em dispositivos fracos considerada — §6, carga tardia e 2 dicionários vivos
- [x] Segurança/RLS analisada — §7, inclui as 2 violações existentes a corrigir
- [x] Testes planejados — §19, 18 arquivos
- [x] AGENTS.md atualizado no plano — §20

### Decisões já tomadas

1. **Idioma inicial**: o do aparelho, sem gravar nada. — §14.1
2. **Aparelho em idioma não suportado**: `en`. O fallback de string continua
   `pt-BR`; são duas constantes distintas. — §13
3. **Troca manual no Perfil**: vence o aparelho para sempre, com a opção "Padrão
   do dispositivo" para desfazer. — §14.2
4. **Persistência**: AsyncStorage manda no render, `profiles.locale` acompanha a
   conta, `null` = "segue o aparelho". — §14.2
5. **Como o idioma chega ao servidor**: filtro na consulta do catálogo, não
   claim no token. — §14.4

6. **Nome de cidade gravado**: (α) — a lista de sugestões é localizada, o que já
   está gravado nunca muda, nenhuma migration em `trip_cities`. — §9.2
7. **`source_name`**: traduz o descritivo, mantém o nome próprio; coluna
   nullable, na fase 5. — §8.4

Nenhuma decisão em aberto. O plano está fechado.
