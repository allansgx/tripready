import { showDialog } from '@/components/ui/dialog';
import { MAX_TRIPS_PER_USER } from '@/features/trips/domain/trip-limits';
import { t } from '@/i18n';

/** O teto da conta dito onde a criação começa: Início e Viagens. */
export function showTripLimitDialog(): void {
  showDialog(t('trips.limit.title'), t('trips.limit.message', { max: MAX_TRIPS_PER_USER }), [
    { text: t('common.action.gotIt') },
  ]);
}
