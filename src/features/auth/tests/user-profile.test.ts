import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getAccountProvider,
  getAvatarInitial,
  getDisplayName,
  getStoredName,
} from '../user-profile.ts';

import type { User, UserIdentity } from '@supabase/supabase-js';

function identity(provider: string): UserIdentity {
  return {
    provider,
    identity_data: {},
    identity_id: 'id',
    id: 'id',
    user_id: 'user',
    created_at: '',
    last_sign_in_at: '',
    updated_at: '',
  } as UserIdentity;
}

function user(overrides: Partial<User>): User {
  return {
    id: 'user',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
    ...overrides,
  } as User;
}

test('getAccountProvider: identidade só google', () => {
  assert.equal(getAccountProvider(user({ identities: [identity('google')] })), 'google');
});

test('getAccountProvider: google e email juntas prevalece email', () => {
  assert.equal(
    getAccountProvider(user({ identities: [identity('google'), identity('email')] })),
    'email',
  );
});

test('getAccountProvider: sem identities, cai no app_metadata', () => {
  assert.equal(
    getAccountProvider(user({ identities: undefined, app_metadata: { provider: 'apple' } })),
    'apple',
  );
});

test('getAccountProvider: usuário null é email', () => {
  assert.equal(getAccountProvider(null), 'email');
});

test('getStoredName: prioriza display_name sobre full_name', () => {
  assert.equal(
    getStoredName(user({ user_metadata: { display_name: 'Bilas', full_name: 'Bilas Sobrenome' } })),
    'Bilas',
  );
});

test('getStoredName: cai em full_name sem display_name', () => {
  assert.equal(getStoredName(user({ user_metadata: { full_name: 'Bilas' } })), 'Bilas');
});

test('getStoredName: null quando só há e-mail', () => {
  assert.equal(getStoredName(user({ email: 'bilas@gmail.com' })), null);
});

test('getAvatarInitial: primeira letra do nome, maiúscula', () => {
  assert.equal(getAvatarInitial(user({ user_metadata: { display_name: 'bilas' } })), 'B');
});

test('getAvatarInitial: sem nome, cai na primeira letra do e-mail', () => {
  assert.equal(getAvatarInitial(user({ email: 'bilas@gmail.com' })), 'B');
});

test('getAvatarInitial: ignora espaço à esquerda do nome', () => {
  assert.equal(getAvatarInitial(user({ user_metadata: { display_name: '  bilas' } })), 'B');
});

test('getAvatarInitial: acento no início do nome', () => {
  assert.equal(getAvatarInitial(user({ user_metadata: { display_name: 'Ávila' } })), 'Á');
});

test('getAvatarInitial: sem nome e sem e-mail é null', () => {
  assert.equal(getAvatarInitial(user({})), null);
});

test('getDisplayName: prioriza o nome sobre o e-mail e o fallback', () => {
  assert.equal(
    getDisplayName(
      user({ user_metadata: { display_name: 'Bilas' }, email: 'bilas@gmail.com' }),
      'Fallback',
    ),
    'Bilas',
  );
});

test('getDisplayName: sem nome, cai no e-mail', () => {
  assert.equal(getDisplayName(user({ email: 'bilas@gmail.com' }), 'Fallback'), 'bilas@gmail.com');
});

test('getDisplayName: sem nome e sem e-mail, usa o fallback do idioma ativo', () => {
  assert.equal(getDisplayName(user({}), 'Fallback'), 'Fallback');
  assert.equal(getDisplayName(null, 'Fallback'), 'Fallback');
});
