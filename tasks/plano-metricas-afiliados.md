# Plano — métricas de clique em links de afiliado

Registrar quando o viajante toca em uma recomendação de parceiro na tela de
detalhe de um item da checklist, para medir o desempenho dos links afiliados.

Status: **código implementado, `npm check` limpo.** Falta o que só roda contra o
banco remoto:

1. `npx supabase db push`;
2. a verificação manual de RLS e de toque repetido (§9).

Este documento sai de `tasks/` quando os três fecharem. Antes disso, o app
compila mas o insert responde 404: a tabela ainda não existe no remoto.

---

## 1. Situação verificada

| Ponto                        | Situação                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Tabela de parceiros          | **não existe**; o parceiro hoje é o texto livre em `requirement_offers.name`                                                     |
| Recomendações                | [requirement_offers](../supabase/migrations/20260906140000_requirement_offers.sql), ligadas a `requirement_template_id`          |
| Linhas de oferta cadastradas | **duas**, ambas em `travel-insurance`: SafetyWing e Seguros Promo (cadastradas fora de migration)                                |
| Onde o clique acontece       | `OfferRow` em [[requirementId].tsx](<../src/app/(app)/trips/item/[requirementId].tsx>), via `WebBrowser.openBrowserAsync`        |
| Camada de dados              | `src/services/*.ts`, um arquivo por tabela, exportados por `src/services/index.ts`                                               |
| Padrão de RLS                | tudo `to authenticated`, `(select auth.uid())`, `public.is_trip_owner(trip_id)` nas filhas, nada para `anon`                     |
| Grants                       | tabela nova nasce **sem privilégio** desde [20260912120000](../supabase/migrations/20260912120000_default_privileges_revoke.sql) |
| Analytics existente          | **nenhum**                                                                                                                       |
| Infra de teste               | `node:test` sobre `src/**/*.test.ts`; sem renderer de RN, sem banco                                                              |

## 2. Escopo

Entra:

- coluna `partner_code` em `requirement_offers`;
- tabela `affiliate_clicks` com RLS, grants e índices;
- registro do evento no toque do CTA da recomendação;
- atualização da Política de Privacidade e republicação do site legal.

Não entra:

- sistema genérico de eventos ou analytics;
- dashboard ou área administrativa;
- tabela `partners` com metadados;
- fila offline, retry ou deduplicação de cliques.

## 3. Tabela

Três divergências da proposta inicial, com o motivo:

| Proposto            | Adotado        | Por quê                                                                                                                                                                            |
| ------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `partner_id`        | `partner_code` | Não há tabela de parceiros e o MVP só precisa agrupar. O slug vive em `requirement_offers`, que continua fonte de verdade única; virar FK depois não reescreve as métricas.        |
| `recommendation_id` | `offer_id`     | A recomendação é a oferta; o nome acompanha a tabela referenciada, como no resto do schema.                                                                                        |
| `category`          | **não criar**  | Derivável por `offer_id` → `requirement_template_id` → `requirement_templates.category`. Duplicar congelaria a categoria e daria duas respostas se um template for recategorizado. |

```sql
create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid()
    references public.profiles (id) on delete set null,
  offer_id uuid references public.requirement_offers (id) on delete set null,
  partner_code text not null check (partner_code ~ '^[a-z0-9-]+$'),
  trip_id uuid references public.trips (id) on delete set null,
  clicked_at timestamptz not null default now()
);
```

Decisões embutidas:

- **`user_id` com `default auth.uid()`** — o app não envia o campo, então não
  existe payload em que o cliente possa errar o usuário. Para um visitante não
  autenticado no futuro, o default já resolve como nulo.
- **FKs com `on delete set null`** — excluir conta ou viagem anonimiza o evento
  em vez de apagar a contagem. Deixa de ser dado pessoal e a série histórica
  sobrevive.
- **`partner_code` repetido no evento** — única duplicação deliberada. Log de
  evento guarda o estado do momento: se a oferta for desativada, trocada de
  campanha ou removida, a atribuição do parceiro continua de pé, e a métrica
  principal vira um `group by` sem join.
- **Sem `updated_at` e sem `unique`** — o evento é imutável e cliques repetidos
  são eventos válidos.

**Decisão fechada:** `on delete set null` no `user_id`. Excluir a conta apaga o
vínculo com a pessoa, não a linha — o relatório não perde os cliques de contas
encerradas, e o que sobra deixa de ser dado pessoal. A política precisa dizer
isso com todas as letras (§8).

## 4. Migrations

### `20260913130000_requirement_offers_partner_code.sql`

A tabela já tinha duas linhas, então a coluna não pode nascer `not null`. São
três passos no mesmo arquivo:

```sql
alter table public.requirement_offers
  add column partner_code text check (partner_code ~ '^[a-z0-9-]+$');

update public.requirement_offers set partner_code = 'safetywing'    where id = '547d…';
update public.requirement_offers set partner_code = 'seguros-promo' where id = 'b2f3…';

alter table public.requirement_offers alter column partner_code set not null;
```

O `check` inline convive com a coluna nulável: restrição sobre valor nulo
devolve nulo, que o Postgres aceita.

O backfill é por `id`, e não por `name`. Derivar o slug do texto exibido daria
dois códigos para uma empresa que aparecesse com dois nomes — que é o caso que
a coluna existe para evitar. As duas ofertas atuais são do mesmo requisito
(`travel-insurance`) e de empresas diferentes, uma vendendo apólice própria e a
outra comparando preços, então cada uma tem o seu código.

O `set not null` no fim é a rede de segurança: se algum `id` não casar, ele
falha e o push aborta, em vez de deixar linha sem parceiro passar batido.

### `20260913130100_affiliate_clicks.sql`

Tabela, índices, RLS e grants no mesmo arquivo, como manda a subseção
"Migrations" do `AGENTS.md`. As migrations antigas separam um `_rls`, mas a
regra atual é arquivo único.

```sql
alter table public.affiliate_clicks enable row level security;

create policy "affiliate_clicks_insert_own"
  on public.affiliate_clicks for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (trip_id is null or public.is_trip_owner(trip_id))
  );

revoke select, update, delete on public.affiliate_clicks from authenticated;
grant insert on public.affiliate_clicks to authenticated;
```

O que isso garante:

- `user_id` de outra pessoa é rejeitado pelo `with check`;
- `trip_id` de viagem alheia é rejeitado por `is_trip_owner`;
- **nenhuma policy de SELECT**, então o app não lê cliques, nem os próprios;
  leitura agregada fica para o SQL editor e para um backend administrativo
  futuro;
- nada para `anon`.

Consequência no código do app: o insert **não pode** encadear `.select()`. Sem
ele o supabase-js envia `Prefer: return=minimal` e dispensa privilégio de
leitura; com ele, o PostgREST responde 403.

Antes do `db push`, rodar o diff de RLS do `AGENTS.md` e conferir que
`affiliate_clicks` aparece nas duas listas.

## 5. Índices

```sql
create index affiliate_clicks_partner_idx
  on public.affiliate_clicks (partner_code, clicked_at desc);
create index affiliate_clicks_offer_idx
  on public.affiliate_clicks (offer_id, clicked_at desc);
create index affiliate_clicks_clicked_at_idx
  on public.affiliate_clicks (clicked_at desc);
create index affiliate_clicks_user_idx
  on public.affiliate_clicks (user_id) where user_id is not null;
```

Os três primeiros atendem parceiro, recomendação e série temporal global. O de
`user_id` serve ao `count(distinct user_id)` e também à manutenção da chave
estrangeira: sem ele, cada exclusão de conta varre a tabela inteira. Não há
índice em `trip_id` — nenhuma métrica pedida usa, e a varredura na exclusão de
viagem é irrelevante no volume do MVP.

## 6. Arquivos

Criados:

- `supabase/migrations/20260913130000_requirement_offers_partner.sql`
- `supabase/migrations/20260913130100_affiliate_clicks.sql`
- `src/features/trips/domain/affiliate-click.ts` — `buildAffiliateClick(offer, tripId)`, pura
- `src/features/trips/tests/affiliate-click.test.ts`
- `src/services/affiliate-clicks.ts`

Alterados:

- `src/types/database.ts` — `affiliate_clicks` (Row, Insert, Update, Relationships) e `partner_code` nas três variantes de `requirement_offers`
- `src/types/models.ts` — `AffiliateClickInsert`; o Row não entra porque o app nunca lê
- `src/services/index.ts` — export do serviço
- `src/app/(app)/trips/item/[requirementId].tsx` — `OfferRow` recebe o `tripId` e registra antes de abrir
- `src/features/legal/data/legal-documents.ts` — política de privacidade e `version`
- `site/` — regerado por `npm run site`

Nenhuma camada nova: `services/` já é a camada de dados e `domain/` já é a
convenção do projeto para lógica pura testável.

## 7. Fluxo e tratamento de falha

```
usuário abre o item → toca em uma linha de "Opções para contratar"
                       ├─ void affiliateClicksService.record(buildAffiliateClick(offer, requirement.trip_id))
                       └─ void openLink(offer.url)
```

Os dois disparos saem no mesmo tique e nenhum espera o outro: o navegador abre
sem depender da rede. O link de "Fonte oficial" continua sem registro, porque
não é afiliado.

**A ordem é estrutural, não estética.** O `record` precisa sair antes do
`openLink`, e nunca depois dele. `openBrowserAsync` apresenta um
`SFSafariViewController` dentro do próprio app — o processo continua ativo, o JS
segue rodando e o insert que já estava em trânsito conclui mesmo se a pessoa
fechar app e navegador juntos. Invertido, porém, o registro ficaria pendurado na
resolução da promise, e aí a diferença de plataforma da subseção seguinte vira
viés de dados: no Android o evento sairia na abertura, no iOS só quando o usuário
voltasse do navegador, e todo clique de quem fecha o app de dentro dele sumiria.
A métrica passaria a dizer que iPhone converte menos, o que seria falso.

A única perda que resta é matar o app à força enquanto o POST está no ar, na
casa dos centésimos de segundo. Fechar essa janela exigiria persistir o evento
no aparelho e reenviar depois — a fila offline que §2 deixa fora do escopo. A
perda por rede indisponível, já aceita, é maior que essa.

O serviço quebra de propósito o padrão dos outros — não usa `unwrap`, que lança:

```ts
async record(click: AffiliateClickInsert): Promise<void> {
  const { error } = await supabase.from('affiliate_clicks').insert(click);
  if (error && __DEV__) {
    console.warn(`[affiliate] clique não registrado: ${error.message}`);
  }
}
```

`__DEV__` com `console.warn` prefixado é a convenção já usada em
`auth-service.ts`. Sem retry e sem fila: clique sem rede é perdido, o que basta
para medir tendência de parceiro. Nada disso chega à tela do usuário.

### Toques repetidos

Dois toques em meio segundo são uma intenção só. O banco continua sem
`unique` e sem deduplicação — a decisão é do lado de cá, onde a intenção é
conhecida; nada disso muda o schema.

A trava fica na própria linha da oferta, e cada `OfferRow` é uma instância, então
ela é naturalmente por parceiro: tocar em duas recomendações diferentes em
sequência continua valendo dois eventos, que é o correto.

```tsx
const opening = useRef(false);

async function handlePress() {
  if (opening.current) return;
  opening.current = true;

  void affiliateClicksService.record(buildAffiliateClick(offer, tripId));
  await openLink(offer.url);

  setTimeout(() => {
    opening.current = false;
  }, OFFER_PRESS_COOLDOWN_MS);
}
```

O `setTimeout` no fim não é margem arbitrária, é diferença de plataforma
confirmada na doc do SDK 57: no iOS a promise do `openBrowserAsync` só resolve
quando o usuário fecha o navegador (`cancel` ou `dismiss`), então o `await`
sozinho já tranca a linha durante toda a visita; no Android ela resolve assim
que o navegador abre (`opened`), e sem a espera a linha destravaria com a tela
ainda em transição. Um segundo cobre a rajada ansiosa e é imperceptível para
quem voltou do navegador com a intenção real de tocar de novo.

Efeito colateral bem-vindo: `WebBrowserResultType` tem o valor `locked`, para
quando já existe um navegador aberto. Com a trava, esse caminho deixa de ser
alcançável — hoje ele cairia no `catch` silencioso do `openLink`, e o usuário
veria um toque que não faz nada.

Usar `useRef` e não `useState` é de propósito: não há nada para redesenhar, já
que o navegador cobre a tela. Ref escrita depois da desmontagem é inofensiva,
então o timer não precisa de limpeza.

## 8. Política de Privacidade

A política afirma hoje, na seção "O que o TripReady não coleta", que o
aplicativo "não usa ferramentas de análise de uso, rastreamento ou publicidade"
e promete que, se isso mudar, o texto será atualizado **antes** de a mudança
entrar no ar. Registrar cliques contradiz a frase, então a atualização é
pré-requisito da entrega, não acerto posterior.

O texto novo descreve o evento específico e reserva a palavra "rastreamento"
para o que o app nega fazer:

> O TripReady registra alguns eventos relacionados ao uso de funcionalidades do
> aplicativo, como cliques em links de parceiros, exclusivamente para medir o
> uso dessas recomendações e acompanhar o desempenho dos links afiliados.

> O TripReady não realiza rastreamento do seu comportamento fora do aplicativo,
> não utiliza seus dados para publicidade comportamental e não cria perfis de
> publicidade.

Ainda nesta seção:

- acrescentar o evento à lista do que é coletado, sem nome de tabela ou coluna;
- manter intactos os itens de localização, identificadores de publicidade e
  dados sensíveis, que continuam verdadeiros;
- na seção de exclusão de conta, dizer que o registro de clique é anonimizado em
  vez de apagado, já que deixa de estar ligado a qualquer pessoa;
- subir `version` de `1.0` para `1.1` e rodar `npm run site`.

## 9. Testes

A infra é `node:test` sobre arquivos `.ts`, sem renderer e sem banco. Isso
divide a verificação em duas.

Automatizado, em `affiliate-click.test.ts`, sobre a função pura:

- `partner_code` copiado da oferta;
- `trip_id` presente no contexto de viagem e nulo fora dele;
- o payload **não contém** `user_id` nem `clicked_at`, travando o invariante de
  que quem decide os dois é o banco.

Manual, no SQL editor, depois do push:

- inserir com `user_id` de outro usuário falha por RLS;
- inserir com `trip_id` de viagem alheia falha por RLS;
- `select` na tabela pelo app volta negado;
- três toques deliberados, com ida e volta ao navegador entre eles, geram três
  linhas;
- rajada de toques na mesma linha gera **uma** linha, nas duas plataformas;
- rajada alternando duas recomendações gera uma linha para cada.

A trava de §7 mora no componente e o harness não renderiza RN, então ela fica
fora do teste automatizado — a verificação é a manual acima, nas duas
plataformas, porque é justamente onde elas diferem.

"Falha no registro não impede a abertura do link" é garantida pela estrutura —
`record` não tem caminho que lance e `openLink` não depende dele — e não por
teste.

## 10. Consultas de referência

```sql
-- cliques por parceiro
select partner_code, count(*) from affiliate_clicks group by 1 order by 2 desc;

-- usuários únicos por parceiro
select partner_code, count(distinct user_id) from affiliate_clicks group by 1;

-- cliques por dia
select date_trunc('day', clicked_at) as dia, count(*)
from affiliate_clicks group by 1 order by 1;

-- cliques por recomendação
select o.name, count(*)
from affiliate_clicks c
join requirement_offers o on o.id = c.offer_id
group by 1 order by 2 desc;

-- cliques por categoria
select t.category, count(*)
from affiliate_clicks c
join requirement_offers o on o.id = c.offer_id
join requirement_templates t on t.id = o.requirement_template_id
group by 1 order by 2 desc;
```

## 11. Ordem de execução

1. Migration do `partner_code`, depois de conferir que `requirement_offers` está vazia.
2. Migration de `affiliate_clicks`, com o diff de RLS conferido.
3. `npx supabase db push` (executado pelo dono do projeto).
4. Tipos, serviço, função de domínio e teste.
5. Ligação na tela de detalhe do item.
6. Política de privacidade e `npm run site`.
7. `npm check`.
8. Verificação manual de RLS no SQL editor.
