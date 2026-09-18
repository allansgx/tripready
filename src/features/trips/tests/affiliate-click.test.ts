import assert from 'node:assert/strict';
import test from 'node:test';

import type { RequirementOffer } from '@/types/models';

import { buildAffiliateClick } from '../domain/affiliate-click.ts';

function offer(overrides: Partial<RequirementOffer> = {}): RequirementOffer {
  return {
    id: 'offer-1',
    requirement_template_id: 'template-1',
    partner_code: 'seguradora-x',
    name: 'Seguradora X',
    description: null,
    url: 'https://exemplo.com',
    icon: null,
    destination_country_code: null,
    passport_country_code: null,
    is_affiliate: true,
    position: 0,
    active: true,
    valid_from: null,
    valid_until: null,
    created_at: '2026-09-13T00:00:00Z',
    updated_at: '2026-09-13T00:00:00Z',
    ...overrides,
  };
}

test('o evento aponta para a oferta e o parceiro dela', () => {
  const click = buildAffiliateClick(offer(), 'trip-1');

  assert.equal(click.offer_id, 'offer-1');
  assert.equal(click.partner_code, 'seguradora-x');
});

test('o parceiro vem da oferta, e não do nome exibido', () => {
  const click = buildAffiliateClick(
    offer({ partner_code: 'esim-y', name: 'eSIM Y — plano anual' }),
    'trip-1',
  );

  assert.equal(click.partner_code, 'esim-y');
});

test('a viagem entra quando há contexto e fica nula quando não há', () => {
  assert.equal(buildAffiliateClick(offer(), 'trip-1').trip_id, 'trip-1');
  assert.equal(buildAffiliateClick(offer(), null).trip_id, null);
});

/**
 * Quem decide os dois é o banco: `auth.uid()` no default e o relógio do
 * servidor. Enviá-los do cliente reabriria o que a policy fecha.
 */
test('o cliente não envia usuário nem horário', () => {
  const click = buildAffiliateClick(offer(), 'trip-1');

  assert.ok(!('user_id' in click));
  assert.ok(!('clicked_at' in click));
});
