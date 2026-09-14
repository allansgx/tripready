import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

import { readTripId } from '@/features/notifications/data/reminder-scheduler';

/**
 * Leva o toque na notificação até a checklist da viagem. `useLastNotificationResponse`
 * cobre os dois casos — app aberto e app fechado, quando o toque é justamente o
 * que trouxe a pessoa de volta.
 *
 * Precisa ser montado dentro de `(app)`: as rotas de viagem só existem com
 * sessão e passaporte, e navegar antes disso não acharia o destino.
 */
export function useNotificationNavigation(): void {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();

  // A resposta continua disponível depois de tratada; sem isto, qualquer nova
  // renderização navegaria de novo para a mesma viagem.
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!response) return;

    const { identifier, content } = response.notification.request;
    if (handledRef.current === identifier) return;
    handledRef.current = identifier;

    const tripId = readTripId(content.data);
    if (!tripId) return;

    router.push({ pathname: '/trips/[id]', params: { id: tripId } });
  }, [response, router]);
}
