import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import { Image, StyleSheet } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';
import { getAvatarUrl } from '@/features/auth/user-profile';
import { t } from '@/i18n';
import { colors, radius } from '@/theme/tokens';

/**
 * Navegação inferior na web: o `NativeTabs` vira uma pílula no topo, sem
 * ícones, e não dá para reposicionar por propriedade. As rotas são as mesmas —
 * mudar uma aba aqui pede mudar no `_layout.tsx`.
 */
export default function AppWebLayout() {
  const { user } = useAuth();
  const avatarUrl = getAvatarUrl(user);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Explícito de propósito: em tela larga a navegação por abas pode se
        // adaptar para uma barra lateral, e a intenção aqui é o oposto —
        // desktop com a mesma barra inferior do celular.
        tabBarPosition: 'bottom',
        // Sem rótulo, como no iOS: o ícone basta e a barra fica mais leve. O
        // `title` de cada aba continua existindo para o leitor de tela e para o
        // título da página.
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.bar,
        sceneStyle: styles.scene,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="trips"
        options={{
          title: t('tabs.trips'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'airplane' : 'airplane-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size, focused }) =>
            avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={[styles.avatar, { width: size, height: size }]}
              />
            ) : (
              <Ionicons
                name={focused ? 'person-circle' : 'person-circle-outline'}
                size={size}
                color={color}
              />
            ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  scene: {
    backgroundColor: colors.background,
  },
  avatar: {
    borderRadius: radius.pill,
  },
});
