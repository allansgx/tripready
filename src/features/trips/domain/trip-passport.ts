// Caminho relativo com extensão: este módulo é carregado direto pelo
// `node --test`, que resolve pelo arquivo real e não entende o alias `@/`.
import { getTripStatus, todayISO } from './trip-status.ts';

/**
 * O vínculo entre a viagem e o passaporte que ela usa. Nunca armazenado: sai da
 * comparação entre o código gravado na viagem e os passaportes que o perfil tem
 * agora, do mesmo jeito que o status da viagem sai das datas.
 *
 * Isso é o que permite excluir um passaporte sem escrever uma linha em `trips`:
 * a viagem não aponta para o cadastro, ela guarda o país.
 */
export type PassportLink = 'none' | 'linked' | 'detached';

/** O mínimo que o vínculo precisa saber da viagem. */
export type PassportedTrip = {
  passport_country_code: string | null;
};

/** O mínimo que o vínculo precisa saber de um passaporte do perfil. */
export type OwnedPassport = {
  country_code: string;
};

export type ReviewableTrip = PassportedTrip & {
  start_date: string | null;
  end_date: string | null;
};

/**
 * `none` é a viagem que nunca teve passaporte escolhido — dado antigo, ou o dia
 * em que o produto deixar de exigir a escolha. `detached` é a que teve o
 * passaporte removido do perfil.
 */
export function linkState(trip: PassportedTrip, passports: readonly OwnedPassport[]): PassportLink {
  const code = trip.passport_country_code;
  if (!code) return 'none';

  const wanted = code.toUpperCase();
  return passports.some((passport) => passport.country_code.toUpperCase() === wanted)
    ? 'linked'
    : 'detached';
}

/**
 * A viagem precisa que a pessoa escolha um passaporte antes de as exigências de
 * entrada valerem de novo. Concluída nunca precisa: ela é o registro do que foi
 * preparado, e mexer nela seria reescrever história.
 */
export function needsEntryRulesReview(
  trip: ReviewableTrip,
  passports: readonly OwnedPassport[],
  today: string = todayISO(),
): boolean {
  if (getTripStatus(trip, today) === 'completed') return false;
  return linkState(trip, passports) !== 'linked';
}
