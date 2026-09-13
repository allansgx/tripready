import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

/**
 * Stack dentro da aba Viagens: o detalhe é empilhado por cima da listagem
 * mantendo a tab bar nativa visível e o gesto de voltar do sistema.
 */
export default function TripsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
