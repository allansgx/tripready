// =============================================================================
// TripReady — exclusão permanente da conta
//
// `auth.users` não é exposta pelo PostgREST e não pode ser apagada pelo role
// `authenticated`. Apagar a linha é uma operação privilegiada, e este é o único
// lugar do projeto onde a chave de serviço existe: ela é injetada pelo runtime
// das Edge Functions e nunca chega ao aplicativo.
//
// A função não recebe nenhum id. O alvo é sempre o dono do token que chamou,
// então não existe payload capaz de alcançar a conta de outra pessoa.
//
// Apagar o usuário basta: a partir de `auth.users` a cascata do banco leva
// junto `profiles`, `passports`, `trips`, `trip_countries`, `trip_cities` e
// `trip_requirements`, e o GoTrue remove identidades, sessões e refresh tokens.
//
// A operação é idempotente. Uma resposta perdida por rede faz o app tentar de
// novo, e a segunda chamada precisa dizer "já foi" em vez de "não foi
// possível" — daí a distinção entre sessão inválida (401) e conta que já não
// existe (200 `already_deleted`).
// =============================================================================

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

type AdminClient = SupabaseClient;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: Record<string, string>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/**
 * Lê o `sub` do token sem validá-lo, só para saber de quem ele era quando o
 * usuário já não existe. A autenticidade vem do `verify_jwt = true`, e nenhuma
 * exclusão acontece por este caminho.
 */
function readSubject(token: string): string | null {
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as { sub?: unknown };

    return typeof claims.sub === 'string' && claims.sub.length > 0 ? claims.sub : null;
  } catch {
    return null;
  }
}

type UserState = 'exists' | 'missing' | 'unknown';

/**
 * `unknown` existe de propósito: falha de rede contra o Auth não pode ser lida
 * como "a conta já foi apagada", que é a resposta de sucesso.
 */
async function findUser(admin: AdminClient, userId: string): Promise<UserState> {
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (data?.user) return 'exists';
  if (!error) return 'missing';
  return error.status === 404 ? 'missing' : 'unknown';
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const authorization = req.headers.get('Authorization');
  const token = authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return json({ error: 'invalid_session' }, 401);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: caller } = await admin.auth.getUser(token);

  // O token não resolveu um usuário: ou a sessão é inválida, ou a conta já foi
  // apagada por uma tentativa anterior desta mesma pessoa.
  if (!caller?.user) {
    const subject = readSubject(token);
    if (!subject) return json({ error: 'invalid_session' }, 401);

    const state = await findUser(admin, subject);
    if (state === 'missing') return json({ status: 'already_deleted' }, 200);
    if (state === 'exists') return json({ error: 'invalid_session' }, 401);
    return json({ error: 'delete_failed' }, 500);
  }

  const userId = caller.user.id;
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    // Outro dispositivo pode ter concluído a mesma exclusão no meio do caminho.
    if ((await findUser(admin, userId)) === 'missing') {
      return json({ status: 'already_deleted' }, 200);
    }

    // Sem dado pessoal no log: só o suficiente para investigar.
    console.error(`delete-account: exclusão recusada (status ${error.status ?? 'desconhecido'})`);
    return json({ error: 'delete_failed' }, 500);
  }

  return json({ status: 'deleted' }, 200);
});
