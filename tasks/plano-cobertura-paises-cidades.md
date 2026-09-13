# Plano — Cobertura de países e cidades no roteiro (Etapas 1 e 2)

Status: **Camada 1 implementada** — os 34 países da seção 4 foram
acrescentados a [cities.ts](src/constants/cities.ts), com os dois testes de
salvaguarda da seção 6 em
[cities.test.ts](src/constants/tests/cities.test.ts). A Camada 2 e a
internacionalização (ver
[plano-internacionalizacao.md](tasks/plano-internacionalizacao.md)) seguem em
aberto.

Escopo: a auditoria pedida sobre os países disponíveis e as cidades sugeridas
por país, usados nas etapas "Para onde você vai?" e "Quais cidades você
pretende visitar?" da criação de viagem
([trip-new.tsx](src/app/trip-new.tsx)), e a mesma lista reaproveitada na edição
([trip-edit.tsx](src/app/trip-edit.tsx)) e no cadastro de passaporte.

**Nenhum código foi alterado.** Este documento é só o levantamento e a proposta
de como fechar a lacuna encontrada.

---

## 1. Países (Etapa 1) — já está completo

[countries.ts](src/constants/countries.ts) foi comparado, código por código,
contra a lista oficial ISO 3166-1 alpha-2 (249 códigos correntemente
atribuídos). Resultado: **os 249 estão presentes**, sem nenhum faltando.

A lista tem dois códigos a mais, que não fazem parte do padrão ISO:

- `XK` (Kosovo) — não tem código ISO oficial (o território é reconhecido só
  por parte da ONU), mas várias organizações internacionais o usam como código
  de fato. Já está na lista.
- `CQ` (Sark) — código informal de uso local, não-ISO.

Nenhum dos dois atrapalha nada — são bônus, não lacunas — e não há necessidade
de mexer na lista de países. **A etapa 1 não precisa de nenhuma alteração.**

---

## 2. Cidades (Etapa 2) — a lacuna real

[cities.ts](src/constants/cities.ts) tem sugestões para **47 dos 251 países**
da lista (~19%). Os outros 204 não têm chip nenhum: a etapa 2 mostra só o campo
de texto livre ("Digite uma cidade deste país"), que sempre funciona — nenhuma
viagem fica bloqueada por falta de sugestão — mas o app perde a chance de
ajudar quem está montando o roteiro.

Isso afeta duas telas, não só a etapa 2:

1. **Etapa 2** ([city-step.tsx](src/features/trips/components/city-step.tsx)) —
   os chips somem para os 204 países sem entrada.
2. **Etapa 1**, quando a pessoa digita uma cidade em vez de um país — a busca
   ali (`searchByCity`, em
   [country-picker-list.tsx:32](src/features/passports/country-picker-list.tsx#L32))
   também consulta `CITY_SUGGESTIONS`
   ([destinations.ts:40](src/constants/destinations.ts#L40)). Quem digita
   "Angkor Wat" pensando em ir ao Camboja não encontra nada hoje, porque `KH`
   não tem cidade cadastrada — mesmo o país existindo na lista.

Fechar essa lacuna melhora as duas etapas com a mesma mudança.

---

## 3. Por que não cobrir os 251 de uma vez

Curar 3–6 cidades por país é trabalho editorial, não uma migration — não tem
risco de dado errado ir para produção, mas também não faz sentido gastar o
mesmo cuidado em `Bouvet Island` (0 habitantes) e em `Portugal`. A proposta é
fechar a lacuna em camadas, por relevância turística real, e parar quando o
retorno cair — não perseguir 251/251.

Uma parte relevante dos 204 sem sugestão está em uma destas situações, e fica
de fora por padrão nas duas primeiras camadas:

- **Território não habitado ou quase**: Antártida, Ilha Bouvet, Ilhas Heard e
  McDonald, Territórios Franceses do Sul, Território Britânico do Oceano
  Índico, Ilhas Geórgia do Sul e Sandwich do Sul, Ilhas Menores Distantes dos
  EUA, Sark.
- **Sem rota de turismo civil hoje** (conflito ativo, isolamento político ou
  risco declarado): Afeganistão, Iêmen, Iraque, Síria, Líbia, Somália, Sudão,
  Sudão do Sul, Coreia do Norte, República Centro-Africana, Chade.

Para essas, o campo de texto livre já resolve — ninguém precisa de chip de
sugestão para um lugar que não recebe turista.

---

## 4. Camadas propostas para os 204 países sem sugestão

### Camada 1 — maior impacto, prioridade alta

Destinos de alto volume turístico que estão sem nenhuma sugestão hoje. Dividido
por região para facilitar a curadoria (cada linha vira, depois, uma entrada de
3–6 cidades em `CITY_SUGGESTIONS`, no mesmo padrão do arquivo atual — capital
ou cidade mais visitada primeiro):

**Caribe e América Central** — forte presença em pacotes vendidos a partir do
Brasil, e hoje só o México está coberto:

República Dominicana · Bahamas · Cuba · Jamaica · Costa Rica · Panamá ·
Porto Rico · Belize

**Europa com alto volume e zero cobertura**:

Croácia (já coberta) — as que faltam: Malta · Eslovênia · Sérvia · Bulgária ·
Chipre · Vaticano (extensão natural de Roma) · Rússia

**Ásia com alto volume e zero cobertura**:

Filipinas · Malásia · Sri Lanka · Camboja · Nepal · Jordânia · Catar ·
Arábia Saudita · Geórgia · Cazaquistão · Uzbequistão · Azerbaijão

**África com alto volume e zero cobertura**:

Quênia · Tanzânia · Seicheles · Maurício · Madagascar · Tunísia · Namíbia

Isso soma **cerca de 35 países**, escolhidos por serem destino turístico
estabelecido e, ao mesmo tempo, terem zero cobertura hoje — o maior ganho por
entrada adicionada.

### Camada 2 — cobertura secundária

Destinos com procura real, porém menor que a Camada 1. Exemplos: Albânia,
Armênia, Bósnia, Estônia, Letônia, Lituânia, Eslováquia, Moldávia, Bolívia,
Equador, Paraguai, Guatemala, Honduras, El Salvador, Nicarágua, Brunei,
Mongólia, Omã, Ruanda, Fiji, Vanuatu, Papua-Nova Guiné.

Fica como uma segunda rodada, depois de validar a Camada 1 com uso real.

### Fora de escopo por ora

Territórios não habitados, zonas de conflito ativo (listados na seção 3), e o
restante de microterritórios com turismo residual (Ilhas Cook, Niue, Tokelau
etc.) — todos continuam funcionando pelo campo de texto livre, sem chip.

---

## 5. Como a curadoria deve ser feita

Diferente das regras de visto (que exigem fonte oficial, por norma do
projeto), nome de cidade turística é fato de conhecimento público e estável —
não muda com legislação. Não é necessário o mesmo rigor de "pendente de fonte
oficial" usado em [coleta-vistos-br.md](tasks/coleta-vistos-br.md); a
curadoria pode seguir direto o padrão já estabelecido no arquivo:

- 3 a 6 cidades por país (o arquivo atual varia entre 1 e 10; a média das
  entradas existentes fica em 5).
- Ordem por relevância turística, não alfabética — a primeira cidade do
  array é a mais visitada (geralmente a capital, mas não sempre: `AU` começa
  com Sydney, não Camberra).
- Nome em português quando existe exônimo consolidado (`Cairo`, `Moscou`,
  `Praga`), e o nome local nos demais casos — mesmo critério já usado no
  arquivo.

---

## 6. Salvaguardas a acrescentar junto (evita erro de digitação silencioso)

Hoje nada garante que uma chave de `CITY_SUGGESTIONS` corresponda a um código
válido em `COUNTRIES` — um typo como `'AI'` vira `'A1'` e o país correto nunca
recebe as sugestões, sem nenhum erro visível. Ao ampliar a lista para dezenas
de países novos, esse risco cresce. Duas checagens simples, cobertas por teste
(`src/features/trips/tests/` ou um `cities.test.ts` novo ao lado de
[cities.ts](src/constants/cities.ts)):

1. Toda chave de `CITY_SUGGESTIONS` existe em `COUNTRIES` (usa `getCountry`).
2. Nenhuma lista de cidades tem duas entradas iguais ignorando acento e caixa
   (mesma normalização de `normalizeSearch`) — o mesmo cuidado que
   `city-step.tsx` já toma ao comparar cidade sugerida com cidade digitada.

Isso é código, mas é validação, não a curadoria em si — cabe fazer junto do
primeiro lote de cidades novas.

---

## 7. Entregável e sequência sugerida

1. Acrescentar a Camada 1 (~35 países) a `CITY_SUGGESTIONS`, em um ou mais
   commits pequenos por região (Caribe/América Central, Europa, Ásia, África) —
   mais fácil de revisar do que um único diff de 35 países.
2. Escrever os dois testes de salvaguarda da seção 6, rodando contra a lista
   já ampliada.
3. Validar com `npm check`.
4. Deixar a Camada 2 como próximo passo, só depois de confirmar que a Camada 1
   já muda a experiência (ex.: menos gente digitando cidade à mão nesses
   países).

Nenhuma migration, nenhuma mudança de schema, nenhuma tela nova — é extensão
de dado em um `Record` que já existe, mais dois testes.
