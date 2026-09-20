// =============================================================================
// TripReady — recuperação de senha, com filtro de conta só-OAuth
//
// Decisão registrada na seção "Autenticação" do AGENTS.md: o `/recover`
// nativo do Supabase manda o código de recuperação para qualquer conta com
// aquele e-mail, sem olhar o provedor. Uma conta só-Google ou só-Apple
// ganharia senha por esse caminho — comportamento que o produto decidiu não
// aceitar.
//
// O que esta função faz, e a ordem importa para não abrir um oráculo de
// enumeração:
//
//   1. `GET /admin/users?filter=` — identifica o usuário pelo e-mail para
//      checar as identidades, sem mandar nada. Deliberadamente NÃO usa
//      `admin.generateLink({ type: 'recovery' })`: apesar de não enviar
//      e-mail, gerar o link já passa pelo mesmo caminho interno que grava
//      `recovery_sent_at` — ou seja, a própria checagem rearmava o cooldown
//      que o passo 2 checa logo em seguida, e o envio real nunca passava
//      (sempre 429 "only request this after N seconds"). Bug real, encontrado
//      em produção ao testar o reenvio.
//   2. Só quando existe identidade `email`, chama o `resetPasswordForEmail`
//      público — que dispara o envio nativo, pelo SMTP já configurado, com o
//      template "Reset password" do painel do Supabase.
//   3. A resposta ao cliente é sempre a mesma, e o tempo de resposta é nivelado
//      por baixo (`MIN_RESPONSE_MS`) para os três casos — elegível, inelegível
//      e inexistente — não se distinguirem por latência.
//
// Risco conhecido, em aberto (item 2.2 de tasks/plano-email-resend.md): esta
// função não herda o rate limit nativo por IP (`sign_in_sign_ups`), que só
// vale para os endpoints do próprio GoTrue. Só o envio de fato (passo 2)
// continua protegido pela janela de 60s por usuário. Enquanto não houver
// limite próprio na frente desta função, ela é a única porta de recuperação
// sem essa camada — aceitável para o volume atual, a revisar antes de produção
// com tráfego real.
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Piso de resposta, para os três caminhos (elegível, inelegível, inexistente)
// não se distinguirem por tempo. Valor de partida, nunca medido contra o
// projeto real — item 2.1 de tasks/plano-email-resend.md.
const MIN_RESPONSE_MS = 800;

const GENERIC_RESPONSE = { status: 'ok' };

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type AdminUser = { id: string; email?: string };

/**
 * Busca por `filter` (o mesmo parâmetro que a busca de usuários do Supabase
 * Studio usa) só para achar o id do usuário. Esse endpoint de listagem não
 * passa pelo caminho que grava `recovery_sent_at`, então checar a identidade
 * aqui não consome o cooldown que o envio real depende de ler — ao contrário
 * de `admin.generateLink`, que consome mesmo sem enviar nada.
 *
 * O objeto que a listagem devolve não traz `identities` (vem `null`), por
 * isso o passo seguinte busca o usuário completo por id.
 */
async function findUserByEmail(
  supabaseUrl: string,
  serviceRoleKey: string,
  email: string,
): Promise<AdminUser | null> {
  const url = `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`;
  const response = await fetch(url, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { users?: AdminUser[] };
  return body.users?.find((user) => user.email?.toLowerCase() === email) ?? null;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const start = Date.now();

  // Resposta genérica em qualquer problema de entrada — mesmo um corpo
  // malformado não pode se distinguir de "e-mail não encontrado".
  let email: string;
  try {
    const body = await req.json();
    email = normalizeEmail(String(body.email ?? ''));
  } catch {
    email = '';
  }

  if (!EMAIL_PATTERN.test(email)) {
    await levelResponseTime(start);
    return json(GENERIC_RESPONSE);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const found = await findUserByEmail(supabaseUrl, serviceRoleKey, email);
  let isEligible = false;
  if (found) {
    const { data: fullUser } = await admin.auth.admin.getUserById(found.id);
    isEligible = !!fullUser.user?.identities?.some((identity) => identity.provider === 'email');
  }

  if (isEligible) {
    // Erro aqui não é reportado ao cliente — a resposta já é genérica por
    // definição, e sinalizar diferença seria reabrir o oráculo.
    await admin.auth.resetPasswordForEmail(email);
  }

  await levelResponseTime(start);
  return json(GENERIC_RESPONSE);
});

async function levelResponseTime(start: number): Promise<void> {
  const elapsed = Date.now() - start;
  if (elapsed < MIN_RESPONSE_MS) {
    await sleep(MIN_RESPONSE_MS - elapsed);
  }
}
