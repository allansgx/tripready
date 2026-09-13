# Avaliação — Internacionalização (inglês além do pt-BR)

Este documento nasceu de uma pergunta durante a auditoria de países/cidades
([plano-cobertura-paises-cidades.md](tasks/plano-cobertura-paises-cidades.md)):
o app hoje só fala pt-BR — o quanto custaria ter inglês também? É uma
avaliação de escopo e dificuldade, não um plano de implementação pronto para
executar; nenhuma decisão de seguir foi tomada.

---

## 1. Resposta curta

Tecnicamente não é difícil — o mecanismo de trocar texto por idioma é simples
e bem resolvido em React Native/Expo. O tamanho do trabalho vem de **onde** o
texto do app mora, não de como trocá-lo. Há três lugares, de dificuldade bem
diferente:

| Onde                            | Volume                          | Dificuldade                                              |
| ------------------------------- | ------------------------------- | -------------------------------------------------------- |
| Microcopy da UI (telas, botões) | ~107 arquivos com texto visível | Mecânica, mas extensa                                    |
| Conteúdo gravado no banco       | Checklist, regras de visto      | Exige mudança de arquitetura, não só tradução            |
| Documentos legais               | ~3.800 palavras                 | Baixo volume de arquivos, alto risco de erro de tradução |

---

## 2. Microcopy da UI — a parte mecânica

Textos de tela (`<Text>Perfil</Text>`, rótulos de botão, mensagens de erro)
estão espalhados por praticamente todo `src/app` e `src/features`. Trocar de
"hardcoded" para "vem de um dicionário" é:

1. Uma função `t(key)` simples, apoiada em dois arquivos JSON (`pt-BR.json`,
   `en.json`) — **sem** puxar uma biblioteca como `react-i18next` ou
   `i18next`: o app não precisa de plural complexo, interpolação avançada nem
   troca de idioma em tempo real por enquanto, e o AGENTS.md já pede para
   evitar camada que o MVP não precisa.
2. `expo-localization` para ler o idioma do aparelho (`Localization.locale`) e
   escolher o dicionário — pacote leve, sem custo de configuração nativa
   extra na versão atual do Expo.
3. Passar por cada arquivo com texto visível e trocar a string literal pela
   chave — trabalho real, mas sem risco: cada tela testa sozinha, sem
   depender de banco ou de outra tela.

Este é o único dos três blocos que dá para fazer aos poucos, tela por tela,
sem quebrar nada no caminho.

### Nomes de país e cidade — quase de graça

O comentário em [countries.ts](src/constants/countries.ts#L10) explica que a
lista atual foi gerada uma vez com `Intl.DisplayNames({ locale: 'pt-BR' })` e
colada como array. Gerar a versão em inglês é rodar o mesmo script com
`locale: 'en'` — não é preciso traduzir 251 nomes à mão.

Cidades são outra história: [cities.ts](src/constants/cities.ts) foi curado à
mão, cidade por cidade, com exônimos em português (`Moscou`, `Cairo`,
`Nova York`). Uma segunda lista em inglês precisaria da mesma curadoria da
[camada 1 do plano de cidades](tasks/plano-cobertura-paises-cidades.md#4-camadas-propostas-para-os-204-países-sem-sugestão),
só que em inglês — menor problema dos três, mas não é automático.

---

## 3. Conteúdo do banco — o bloco que exige decisão de arquitetura

O texto da checklist (`requirement_templates.title`, `.description`) está em
português no catálogo. O problema não é traduzir — é que
`trip_requirements` **copia** o texto do template no momento em que a viagem é
criada, em vez de guardar uma referência a ele
([requirement-matching.ts](src/features/trips/domain/requirement-matching.ts)).
Isso já está registrado como um problema à parte, independente de idioma, em
[plano-melhoria-checklist.md §1.2](tasks/plano-melhoria-checklist.md#12-mudar-a-copy-não-alcança-as-viagens-que-já-existem):
mudar o texto de um template não alcança viagens já criadas.

Ter dois idiomas em cima disso significa responder, antes de qualquer
tradução:

- A viagem grava o texto já traduzido no idioma de quem a criou (some do
  jeito que a copy atual já "congela" o texto no momento da criação — o
  problema de "duas pessoas com a mesma viagem veem textos diferentes" citado
  no outro plano fica pior, não melhor, com dois idiomas)? Ou
- `trip_requirements` passa a guardar `template_id` e o texto é resolvido em
  tempo de leitura, no idioma de quem está olhando a tela — o que é a correção
  arquitetural que o outro plano já recomendava por outro motivo, e essa
  mudança **precisaria vir antes** de qualquer coluna de tradução.

Ou seja: internacionalizar o checklist não é uma tarefa nova — é uma
consequência que torna obrigatório resolver primeiro um problema que já existe
hoje, sem nenhum segundo idioma envolvido.

As regras de visto (`visa_rules`) teriam o mesmo tipo de decisão, se algum
texto delas chegar à tela em vez de virar só lógica de checklist.

---

## 4. Documentos legais — pouco volume, risco alto

Termos de Uso e Política de Privacidade somam ~3.800 palavras em
[legal-documents.ts](src/features/legal/data/legal-documents.ts). Tecnicamente
é só mais um par de entradas no dicionário de textos, mas o conteúdo é texto
jurídico: uma tradução literal ou automática pode mudar o sentido de uma
cláusula. O mesmo cuidado editorial que hoje já se aplica a esses dois
documentos em português — nada de termo técnico de banco vazando para o texto
do usuário, por exemplo — vale em dobro para uma tradução, onde um termo
jurídico mal escolhido muda o sentido de uma cláusula sem ninguém perceber no
primeiro olhar. Traduzir errado aqui é pior do que não traduzir.

Cada idioma também vira um documento a versionar e manter atualizado daqui
para frente — dobra a manutenção desses dois arquivos permanentemente.

---

## 5. Recomendação

O AGENTS.md já orienta a não expandir o MVP além do necessário. Como não há,
hoje, sinal de que uma fração relevante dos usuários precise de inglês, minha
recomendação é **não começar por decisão própria** — é esforço real (a
extração de UI sozinha já é grande) para atender uma demanda ainda não
confirmada.

Se e quando a decisão for seguir, a ordem que minimiza risco é:

1. **Infraestrutura + UI** primeiro: `t()`, dicionários, `expo-localization`,
   extração tela por tela. Reversível e testável isoladamente — dá para parar
   a qualquer momento com o app ainda funcionando em pt-BR.
2. **Nomes de país/cidade** junto, já que o de país é praticamente grátis.
3. **Conteúdo do banco** só depois de resolver a arquitetura de cópia do
   checklist (item independente, já pendente).
4. **Documentos legais** por último, com revisão humana da tradução antes de
   publicar — nunca gerado e publicado sem revisão.

Cada etapa entrega valor sozinha e nenhuma delas exige as seguintes — dá para
parar em qualquer ponto dessa lista sem deixar o app pela metade.
