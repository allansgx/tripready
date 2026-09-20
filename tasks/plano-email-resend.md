# Pendências — e-mails transacionais com Resend

A confirmação de cadastro e a recuperação de senha por código **estão
funcionando em produção** desde 19/09/2026, com o Resend como SMTP do Supabase
Auth. O que foi decidido e por quê está na seção "Autenticação" do
[AGENTS.md](AGENTS.md); o histórico está no git.

Este arquivo guarda **só o que falta**. Ele sai de `tasks/` quando a lista
zerar.

---

## 1. Bloqueado pelo domínio

Nada aqui anda enquanto não houver domínio próprio — e o domínio depende de
fechar o nome do app, que segue indefinido (TripReady e as variações testadas
já têm apps publicados com esses nomes).

**A restrição que isso impõe hoje:** o remetente é o sandbox do Resend
(`onboarding@resend.dev`), que **só entrega para o e-mail da própria conta do
Resend**. Não é configuração que se contorne — sem domínio verificado não há
como mandar e-mail para mais ninguém. Qualquer beta com outras pessoas está
travado até aqui.

| #   | O que fazer                                                                                | Onde                                               |
| --- | ------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| 1.1 | Decidir o nome e comprar o domínio                                                         | —                                                  |
| 1.2 | Verificar o domínio no Resend: SPF, DKIM e DMARC em `p=none`, com e-mail de teste entregue | painel do Resend                                   |
| 1.3 | Trocar o remetente do sandbox para o domínio real                                          | Supabase → Auth → SMTP (um campo só)               |
| 1.4 | Preencher os seis marcadores de `LEGAL_IDENTITY`                                           | [identity.ts](src/features/legal/data/identity.ts) |
| 1.5 | Regerar e republicar o site legal                                                          | `npm run site`                                     |

Os seis marcadores de 1.4 (`{{RAZAO_SOCIAL}}`, `{{CNPJ}}`, `{{EMAIL_CONTATO}}`,
`{{DOMINIO}}`, `{{FORO}}`, `{{DATA_VIGENCIA}}`) são o que o `npm run site` avisa
a cada execução. Enquanto estiverem ali, nenhum domínio público deve apontar
para as páginas geradas.

**Cuidado que já deu errado uma vez:** um endereço `noreply@` não serve como
contato oficial dos Termos e da Política de Privacidade, nem como `reply-to` do
e-mail de recuperação — que existe justamente para a pessoa pedir ajuda. Isso
foi configurado e revertido em 19/09/2026. Conferir de novo quando
`contactEmail` for preenchido de verdade.

---

## 2. Antes de tráfego real de produção

| #   | O que fazer                                 | Por quê                                                         |
| --- | ------------------------------------------- | --------------------------------------------------------------- |
| 2.1 | Calibrar `MIN_RESPONSE_MS` na Edge Function | hoje são 800 ms chutados, nunca medidos contra o projeto real   |
| 2.2 | Decidir o limite por IP da recuperação      | a função não herda o rate limit nativo por IP                   |
| 2.3 | Rever os limites de envio                   | foram dimensionados pelo teto do Resend free                    |
| 2.4 | Montar ambiente de teste separado           | estourar limite de propósito derruba o envio do projeto inteiro |

**2.1** — a função nivela o tempo de resposta por baixo para que conta elegível,
conta só-OAuth e e-mail inexistente não se distingam por latência. O valor atual
é um chute. O teste que fecha isso precisa de **pelo menos 30 amostras de cada
caso**, e o critério é que a diferença mediana não permita separar os grupos.
Sem essa medição, a proteção contra oráculo de tempo é teórica.

**2.2** — a chamada ao `resetPasswordForEmail` sai de dentro da Edge Function,
então o GoTrue enxerga o IP da infraestrutura do Supabase, não o de quem pediu.
O limite nativo por IP deixa de proteger esse caminho específico; sobra só a
janela de 60 s por usuário. Aceitável no volume atual, não em produção aberta.

**2.3** — `email_sent = 10/h` foi calculado sobre o teto do plano free do Resend
(100/dia, 3.000/mês). Publicar o app com volume maior exige revisar esse número
junto com o plano contratado.

---

## 3. Decisões ainda em aberto

| #   | Decisão                                                  | Situação                                                          |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| 3.1 | O vazamento de enumeração no `/signup`: manter ou fechar | nunca decidido                                                    |
| 3.2 | Checagem automática dos templates publicados             | ou automatiza, ou vira item manual **com prazo**                  |
| 3.3 | Rate limiting próprio fica fora do MVP                   | confirmar                                                         |
| 3.4 | Código em vez de link                                    | formalmente ainda recomendação, não decisão — depende do item 4.1 |

**3.1** — o `/signup` responde de forma diferente para e-mail já cadastrado, o
que revela a existência da conta. É deliberado (a alternativa piora a
experiência de quem erra o próprio endereço), mas nunca virou decisão escrita.
Registrar a escolha evita que alguém "conserte" isso sem saber do trade-off.

**3.2** — sem comparar o template publicado no painel com o que está no
repositório, uma divergência aparece semanas depois como "o e-mail está com o
texto antigo". Se automatizar não se justifica agora, o substituto é item de
checklist com data marcada — não adiamento aberto.

---

## 4. Testes que faltam

| #   | Teste                                           | Situação                                                                                            |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 4.1 | D1–D10 em aparelho físico                       | você executa; anotar aparelho, versão e data                                                        |
| 4.2 | D2, D4 e D9 (Android)                           | **sem cobertura** — não há aparelho Android disponível                                              |
| 4.3 | S1–S3 e R8 contra a Edge Function               | valida a função nova, não mais o `/recover` nativo                                                  |
| 4.4 | `npm run functions:check`                       | não roda aqui (sem Deno instalado); via CI ou na sua máquina                                        |
| 4.5 | F6 — o código anterior é invalidado no reenvio? | o comportamento esperado do GoTrue é sobrescrever o token, mas isso nunca foi confirmado na prática |

**4.1** — enquanto D1–D10 não estiverem registrados, a escolha de código em vez
de link (item 3.4) continua sem base escrita, e alguém vai refazer o mesmo teste
daqui a três meses.

**4.5** — em 19/09/2026 o código antigo continuou válido depois de um reenvio,
mas a causa foi o reenvio ter sido barrado pelo limite de frequência: nada novo
chegou a ser gerado. O caso segue sem uma verificação limpa.

---

## 5. Adiado por escolha

| #   | O quê                                        | Situação                                               |
| --- | -------------------------------------------- | ------------------------------------------------------ |
| 5.1 | `src/features/auth/pending-email.ts`         | o endereço pendente não sobrevive ao fechamento do app |
| 5.2 | E-mails em inglês e espanhol                 | hoje só pt-BR                                          |
| 5.3 | Apagar o Template criado no painel do Resend | sobra de uma arquitetura que foi abandonada            |

**5.1** — não é pendência bloqueante: o caso que mais importava (tentar entrar
sem ter confirmado) foi resolvido de outro jeito, reenviando o código no login
e levando direto à tela certa.

**5.2** — o GoTrue manda um template único, sem saber o idioma de quem recebe.
A saída conhecida seria um condicional dentro do próprio template, o que **nunca
foi testado** — a decisão foi ir pela opção mais simples enquanto o alcance é
pequeno.

**5.3** — sem custo e sem risco, só limpeza: o Template do painel do Resend foi
criado quando o desenho previa enviar pela API do Resend, o que deixou de
acontecer. Nada o usa hoje.
