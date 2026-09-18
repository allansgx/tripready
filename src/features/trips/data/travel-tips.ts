// Caminho relativo com extensão, e não o alias `@/`: este módulo é carregado
// direto pelo `node --test`, que resolve pelo arquivo real. `textKey`, e não
// `text`, pela mesma razão: nada aqui pode depender de `src/i18n/index.ts`
// (que importa `expo-localization`) — a tela resolve `t(tip.textKey)`.
import type { MessageKey } from '../../../i18n/messages/pt-BR.ts';

export type TravelTip = {
  id: string;
  emoji: string;
  textKey: MessageKey;
};

/**
 * Dicas gerais para a Home sem viagem. O destino é desconhecido, então nenhum
 * texto crava exigência, prazo ou consequência.
 */
export const travelTips: readonly TravelTip[] = [
  { id: 'passport-validity', emoji: '🛂', textKey: 'travelTip.passportValidity' },
  { id: 'document-copies', emoji: '📄', textKey: 'travelTip.documentCopies' },
  { id: 'backup-payment', emoji: '💳', textKey: 'travelTip.backupPayment' },
  { id: 'offline-maps', emoji: '📶', textKey: 'travelTip.offlineMaps' },
  { id: 'medication', emoji: '💊', textKey: 'travelTip.medication' },
  { id: 'power-plug', emoji: '🔌', textKey: 'travelTip.powerPlug' },
  { id: 'carry-on-clothes', emoji: '🧳', textKey: 'travelTip.carryOnClothes' },
  { id: 'travel-insurance', emoji: '🏥', textKey: 'travelTip.travelInsurance' },
  { id: 'vaccination', emoji: '💉', textKey: 'travelTip.vaccination' },
  { id: 'connectivity', emoji: '📱', textKey: 'travelTip.connectivity' },
  { id: 'airport-timing', emoji: '🕓', textKey: 'travelTip.airportTiming' },
  { id: 'local-cash', emoji: '💱', textKey: 'travelTip.localCash' },
  { id: 'emergency-contacts', emoji: '📆', textKey: 'travelTip.emergencyContacts' },
  { id: 'baggage-allowance', emoji: '🎒', textKey: 'travelTip.baggageAllowance' },
  { id: 'weather', emoji: '☂️', textKey: 'travelTip.weather' },
];

/**
 * Fisher-Yates parcial: embaralha só as primeiras `count` posições e corta ali,
 * então não repete por construção. `random` é parâmetro por causa do teste.
 */
export function pickTravelTips(
  count: number,
  tips: readonly TravelTip[] = travelTips,
  random: () => number = Math.random,
): TravelTip[] {
  const pool = [...tips];
  const size = Math.max(0, Math.min(count, pool.length));

  for (let i = 0; i < size; i += 1) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, size);
}
