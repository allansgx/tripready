import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

import { useNotificationNavigation } from '@/features/notifications/hooks/use-notification-navigation';
import { t } from '@/i18n';
import { colors } from '@/theme/tokens';

/**
 * Navegação inferior nativa: `NativeTabs` monta as abas do próprio sistema, e
 * nada aqui sobrescreve transparência, blur ou minimização. Os rótulos somem só
 * no iOS, por isso cada aba declara `accessibilityLabel`.
 */
const hideLabels = Platform.OS === 'ios';

/**
 * O contêiner nativo de cada aba não tem cor própria: sem isto, a troca de aba
 * mostra o fundo padrão do sistema por um quadro antes da tela pintar, o que
 * aparece como um piscar contra o cinza claro do app.
 */
const tabContentStyle = { backgroundColor: colors.background } as const;

export default function AppLayout() {
  // Aqui, e não no layout raiz: as rotas de viagem só existem deste lado.
  useNotificationNavigation();

  return (
    <NativeTabs tintColor={colors.primary}>
      <NativeTabs.Trigger
        name="index"
        accessibilityLabel={t('tabs.home')}
        contentStyle={tabContentStyle}>
        <NativeTabs.Trigger.Label hidden={hideLabels}>{t('tabs.home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md={{ default: 'home', selected: 'home' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="trips"
        accessibilityLabel={t('tabs.trips')}
        contentStyle={tabContentStyle}>
        <NativeTabs.Trigger.Label hidden={hideLabels}>{t('tabs.trips')}</NativeTabs.Trigger.Label>
        {/* Avião subindo em diagonal, como quem decola. No iOS o símbolo é
            sólido nos dois estados: o `airplane` do SF Symbols não tem variante
            de contorno, e quem marca a aba ativa é o roxo do `tintColor`. No
            Android, `flight_takeoff` é o equivalente do Material. */}
        <NativeTabs.Trigger.Icon
          sf={{ default: 'airplane.up.right', selected: 'airplane.up.right' }}
          md={{ default: 'flight_takeoff', selected: 'flight_takeoff' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="profile"
        accessibilityLabel={t('tabs.profile')}
        contentStyle={tabContentStyle}>
        <NativeTabs.Trigger.Label hidden={hideLabels}>{t('tabs.profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md={{ default: 'account_circle', selected: 'account_circle' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
