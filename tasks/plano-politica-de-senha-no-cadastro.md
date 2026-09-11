# Plano — Política de senha no cadastro

Feature: exigir senha forte no cadastro por e-mail, com os requisitos listados
um a um e um indicador de força que acompanha a digitação.

Status: **implementado**. As decisões da §8 foram tomadas assim: a força mede só
o comprimento (8–11 "Média", 12+ "Forte", abaixo disso "Fraca"), independente dos
requisitos; o botão "Criar conta" fica desabilitado enquanto e-mail ou senha não
forem válidos; e a política do projeto remoto foi aplicada pelo dono do projeto
no painel — daqui não há como conferi-la, então o `config.toml` local foi
alinhado e o painel segue sendo a fonte da verdade.

O conjunto de símbolos da §2.1 foi **confirmado na documentação do Supabase**
antes de escrever o código, não reproduzido de memória.

---

## 1. O que a análise encontrou

### 1.1 Biblioteca de validação ou de força de senha

**Não existe nenhuma.** A varredura no `package.json` por `zod`, `yup`,
`valibot`, `joi`, `validator`, `formik`, `react-hook-form`, `zxcvbn` e afins não
devolve nada, e o código não usa schema de validação em lugar nenhum — as
checagens de formulário são `if` direto na tela.

**Nenhuma dependência nova é necessária.** São cinco regras booleanas sobre uma
string; um `zxcvbn` da vida custaria centenas de KB no bundle para resolver um
problema que cabe em um módulo puro de trinta linhas. O padrão para isso já
existe no projeto: `delete-account.ts` e, agora, `email.ts`.

### 1.2 Política de senha do Supabase Auth

| Onde                                               | Valor hoje                      |
| -------------------------------------------------- | ------------------------------- |
| `supabase/config.toml` → `minimum_password_length` | `6`                             |
| `supabase/config.toml` → `password_requirements`   | `""` (nenhuma exigência)        |
| Tela de cadastro (`MIN_PASSWORD_LENGTH`)           | `6`                             |
| GoTrue do projeto linkado                          | **não verificado** (ver abaixo) |

O `config.toml` descreve o Supabase **local**. O projeto linkado
(`bojskwfmabwtqlcylhfi`, GoTrue v2.196.0) tem a própria configuração no painel,
em Authentication → Sign In / Providers → Password, e eu não tenho como lê-la
daqui. **Confirme o valor no painel antes de implementar.**

**O ponto importante do alinhamento:** o Supabase aceita exatamente a política
pedida, sem nada customizado —

```toml
minimum_password_length = 8
password_requirements = "lower_upper_letters_digits_symbols"
```

Se o servidor ficar em `6` e sem requisitos enquanto o app exige oito
caracteres com maiúscula, minúscula, número e símbolo, a regra existe só na
tela: qualquer outro caminho que venha a definir senha (uma tela futura de "nova
senha", o painel, uma chamada direta à API) grava uma senha fraca que o app
aceitaria no login. A validação do cliente é a boa experiência; a do servidor é
a regra.

Por isso o plano inclui os dois lados — o `config.toml` **e** o painel do
projeto linkado (ou `npx supabase config push`, que envia a configuração de auth
para o projeto remoto).

### 1.3 Onde a senha é digitada hoje

| Tela                                                        | O que faz                      | Entra na política? |
| ----------------------------------------------------------- | ------------------------------ | ------------------ |
| [sign-up.tsx](<src/app/(auth)/sign-up.tsx>)                 | Cria a conta                   | **Sim**            |
| [email-login.tsx](<src/app/(auth)/email-login.tsx>)         | Entra com senha existente      | **Não**            |
| [forgot-password.tsx](<src/app/(auth)/forgot-password.tsx>) | Envia o link; não define senha | Não se aplica      |

O login fica de fora de propósito: quem já tem conta pode ter uma senha de 6
caracteres, e passar a recusá-la na entrada trancaria a pessoa para fora por uma
regra que só vale para cadastro novo.

Não existe hoje tela de "definir nova senha" — o link de recuperação abre o app
com a sessão iniciada. Se uma for criada depois, ela deve reusar o mesmo módulo.

---

## 2. As regras, em um módulo puro

`src/features/auth/password.ts`, no mesmo formato de `email.ts`:

```ts
export type PasswordRule = 'length' | 'uppercase' | 'lowercase' | 'digit' | 'symbol';

export const PASSWORD_RULES: readonly { id: PasswordRule; label: string }[] = [
  { id: 'length', label: 'Pelo menos 8 caracteres' },
  { id: 'uppercase', label: 'Letra maiúscula' },
  { id: 'lowercase', label: 'Letra minúscula' },
  { id: 'digit', label: 'Número' },
  { id: 'symbol', label: 'Símbolo' },
];

export function checkPassword(value: string): Record<PasswordRule, boolean>;
export function isPasswordValid(value: string): boolean; // todas as regras
export function getPasswordStrength(value: string): 'weak' | 'medium' | 'strong';
```

### 2.1 O que conta como símbolo

Este é o detalhe que decide se a validação do app e a do servidor concordam. O
GoTrue tem um conjunto fechado de símbolos, e um caractere fora dele (um `£`, um
espaço, um emoji) faria o app dizer "válida" e o servidor recusar no envio.

A implementação deve usar **o mesmo conjunto do GoTrue**:

```
!@#$%^&*()_+-=[]{};'\:"|<>?,./`~
```

Na implementação isso vira uma constante com um comentário dizendo de onde veio,
e o conjunto precisa ser conferido contra a versão de GoTrue em uso (v2.196.0)
no momento de escrever — é a fonte da verdade, não a memória.

---

## 3. A força da senha

Aqui há uma decisão de produto, porque "válida" e "forte" não são a mesma coisa.
Como a senha só é aceita com **todas** as cinco regras cumpridas, contar regras
cumpridas faria o medidor dizer "Forte" exatamente quando o botão habilita — um
segundo jeito de mostrar o que a lista de requisitos já mostra.

**Proposta (recomendada):** o medidor fala de comprimento, que é o que mais pesa
depois que a variedade de caracteres já está garantida.

| Força     | Quando                                 | Botão "Criar conta" |
| --------- | -------------------------------------- | ------------------- |
| **Fraca** | Falta alguma regra                     | Desabilitado        |
| **Média** | Todas as regras, de 8 a 11 caracteres  | **Habilitado**      |
| **Forte** | Todas as regras, 12 caracteres ou mais | **Habilitado**      |

O risco é alguém ler "Média" como "não serve". A lista de requisitos toda
marcada e o botão habilitado desfazem isso, e o rótulo da seção é "Força da
senha" — não "Senha válida".

**Alternativa mais simples**, se você preferir evitar esse risco: a força
acompanha só a contagem de regras cumpridas (0–2 Fraca, 3–4 Média, 5 Forte).
Fica redundante com a lista, mas nunca diz "Média" para uma senha aceita.

Me diga qual das duas na aprovação.

---

## 4. A interface

`src/features/auth/password-field.tsx` — o campo de senha com os dois
indicadores logo abaixo, para a tela de cadastro não virar um arquivo de duzentas
linhas.

```
  SENHA
  ┌────────────────────────────────────────┐
  │ ••••••••••                             │
  └────────────────────────────────────────┘
  ▬▬▬▬▬▬▬▬  ▬▬▬▬▬▬▬▬  ░░░░░░░░   Média

  ✓ Pelo menos 8 caracteres
  ✓ Letra maiúscula
  ✓ Letra minúscula
  ○ Número
  ○ Símbolo
```

- **Barra de força**: três segmentos, preenchidos conforme o nível. Cores já
  existentes nos tokens: `priorityColors.required` (vermelho) para fraca,
  `priorityColors.recommended` (âmbar) para média, e o verde de
  `tripMomentColors.upcoming.accent` para forte. Nenhuma cor nova.
- **Lista de requisitos**: linha compacta com ícone e rótulo — `ellipse-outline`
  em `colors.textSecondary` quando falta, `checkmark-circle` em verde quando
  cumprida. O `StepRow` que a exclusão usa **não serve aqui**: ele é um bloco
  alto com fundo próprio, feito para quatro linhas em tela cheia, e cinco deles
  empurrariam o botão para fora do formulário.
- Os dois indicadores só aparecem depois do primeiro caractere digitado. Campo
  vazio não é uma senha fraca, é um campo vazio.
- A lista atualiza **enquanto digita** (é orientação, não repreensão). A
  mensagem de erro do campo, se houver, segue a regra do e-mail: aparece no blur
  ou no envio.

### 4.1 Acessibilidade

Cada requisito leva `accessibilityLabel` dizendo o estado por extenso
("Número: pendente"), porque a diferença entre ○ e ✓ é visual. A barra usa
`accessibilityRole="progressbar"` com `accessibilityValue`, como o
`ProgressRing` já faz.

---

## 5. Arquivos

### 5.1 Novos

| Arquivo                                    | Por quê                                      |
| ------------------------------------------ | -------------------------------------------- |
| `src/features/auth/password.ts`            | As regras e a força, puras e testáveis       |
| `src/features/auth/password-field.tsx`     | Campo + barra de força + lista de requisitos |
| `src/features/auth/tests/password.test.ts` | Testes das regras e dos limites da força     |

### 5.2 Alterados

| Arquivo                                            | Motivo                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [sign-up.tsx](<src/app/(auth)/sign-up.tsx>)        | Usa o `PasswordField`; `MIN_PASSWORD_LENGTH` sai e a regra vem do módulo                       |
| [auth-errors.ts](src/features/auth/auth-errors.ts) | Traduzir a recusa de senha fraca do GoTrue, hoje em inglês e técnica                           |
| [supabase/config.toml](supabase/config.toml)       | `minimum_password_length = 8` e `password_requirements = "lower_upper_letters_digits_symbols"` |

### 5.3 Fora do plano

O login, a recuperação de senha, as contas já existentes e o campo "Confirmar
senha", que continua como está.

---

## 6. Testes

`src/features/auth/tests/password.test.ts`, no padrão `node --test` já usado:

| Caso                                              | Espera                              |
| ------------------------------------------------- | ----------------------------------- |
| `''`                                              | nenhuma regra cumprida, `weak`      |
| `'abcdefgh'`                                      | só `length` e `lowercase`           |
| `'Abcdefgh'`                                      | falta número e símbolo              |
| `'Abcdef1'` (7 caracteres)                        | falta `length` e `symbol`           |
| `'Abcdef1!'` (8)                                  | válida, `medium`                    |
| `'Abcdef123!xy'` (12)                             | válida, `strong`                    |
| `'Abcdef1£'` (símbolo fora do conjunto do GoTrue) | **inválida** — alinhada ao servidor |
| Um caso por símbolo do conjunto                   | `symbol` cumprida                   |
| Senha com espaço no meio                          | aceita, mas espaço não é símbolo    |

Os indicadores em si (barra e lista) não têm como ser testados automaticamente
com o setup atual — não há biblioteca de renderização de componentes, e instalar
uma está fora desta tarefa. Ficam no roteiro manual.

---

## 7. Critérios de aceite

- [ ] A senha só é aceita com 8+ caracteres, maiúscula, minúscula, número e símbolo.
- [ ] A lista de requisitos muda de estado enquanto a pessoa digita.
- [ ] A força aparece e acompanha a digitação, com os três níveis.
- [ ] Nenhum indicador aparece com o campo vazio.
- [ ] Uma senha que passa no app é aceita pelo Supabase — sem recusa por símbolo.
- [ ] Uma senha que o app recusa não chega a ser enviada.
- [ ] `minimum_password_length` e `password_requirements` do projeto linkado batem com a regra do app.
- [ ] Quem já tem conta com senha antiga continua entrando normalmente.
- [ ] Nenhuma dependência nova no `package.json`.
- [ ] `pnpm check` passa.

---

## 8. O que preciso que você decida

1. **A escala de força**: a recomendada (comprimento acima do mínimo) ou a
   simples (contagem de regras)? — §3.
2. **A política no servidor**: confirmo com você o valor atual no painel e você
   aplica a mudança, ou prefere que eu deixe só o `config.toml` ajustado e um
   passo documentado?
3. **Botão desabilitado ou bloqueio no envio?** Hoje o cadastro valida no
   `submit` e nenhum campo desabilita o botão. Manter esse padrão, ou a senha
   inválida passa a desabilitar "Criar conta"?
