import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

/**
 * Stack dentro da aba Perfil: editar perfil e alterar senha empilham por cima
 * da tela principal, mantendo a tab bar nativa visível e o gesto de voltar do
 * sistema.
 */
export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
