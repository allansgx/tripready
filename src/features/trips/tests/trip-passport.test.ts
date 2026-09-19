import assert from 'node:assert/strict';
import test from 'node:test';

import {
  linkState,
  needsEntryRulesReview,
  type OwnedPassport,
  type ReviewableTrip,
} from '../domain/trip-passport.ts';

/**
 * O vínculo com o passaporte é derivado, nunca gravado. Estes casos travam a
 * regra que sustenta a promessa mais forte do modelo: excluir um passaporte do
 * perfil não escreve nada em `trips`.
 */

const TODAY = '2026-09-18';

const BR: OwnedPassport = { country_code: 'BR' };
const PT: OwnedPassport = { country_code: 'PT' };

function trip(overrides: Partial<ReviewableTrip> = {}): ReviewableTrip {
  return {
    passport_country_code: 'BR',
    start_date: '2026-12-10',
    end_date: '2026-12-20',
    ...overrides,
  };
}

test('viagem sem código de passaporte nunca teve escolha', () => {
  assert.equal(linkState(trip({ passport_country_code: null }), [BR]), 'none');
});

test('o vínculo existe quando o perfil ainda tem aquele passaporte', () => {
  assert.equal(linkState(trip({ passport_country_code: 'BR' }), [BR, PT]), 'linked');
});

test('o vínculo se desfaz quando o passaporte sai do perfil', () => {
  assert.equal(linkState(trip({ passport_country_code: 'BR' }), [PT]), 'detached');
});

test('perfil sem passaporte nenhum deixa a viagem desvinculada', () => {
  assert.equal(linkState(trip({ passport_country_code: 'BR' }), []), 'detached');
});

test('a caixa do código não decide o vínculo', () => {
  assert.equal(linkState(trip({ passport_country_code: 'br' }), [BR]), 'linked');
  assert.equal(
    linkState(trip({ passport_country_code: 'BR' }), [{ country_code: 'br' }]),
    'linked',
  );
});

test('recadastrar o mesmo país religa a viagem, sem nada ser reescrito', () => {
  const viagem = trip({ passport_country_code: 'PT' });

  assert.equal(linkState(viagem, [BR]), 'detached');
  assert.equal(linkState(viagem, [BR, PT]), 'linked');
});

test('viagem futura desvinculada precisa de revisão', () => {
  const viagem = trip({ start_date: '2026-12-10', end_date: '2026-12-20' });

  assert.equal(needsEntryRulesReview(viagem, [PT], TODAY), true);
});

test('viagem em andamento desvinculada precisa de revisão', () => {
  const viagem = trip({ start_date: '2026-09-15', end_date: '2026-09-25' });

  assert.equal(needsEntryRulesReview(viagem, [PT], TODAY), true);
});

test('viagem concluída nunca precisa de revisão, mesmo desvinculada', () => {
  const viagem = trip({ start_date: '2026-01-10', end_date: '2026-01-20' });

  assert.equal(linkState(viagem, [PT]), 'detached');
  assert.equal(needsEntryRulesReview(viagem, [PT], TODAY), false);
});

test('viagem vinculada não precisa de revisão', () => {
  assert.equal(needsEntryRulesReview(trip(), [BR], TODAY), false);
});

test('viagem não concluída sem passaporte escolhido também precisa de revisão', () => {
  const viagem = trip({ passport_country_code: null });

  assert.equal(needsEntryRulesReview(viagem, [BR], TODAY), true);
});

test('viagem sem datas conta como futura e pede revisão quando desvinculada', () => {
  const viagem = trip({ start_date: null, end_date: null });

  assert.equal(needsEntryRulesReview(viagem, [PT], TODAY), true);
});
