import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import { colors, radius } from '@/theme/tokens';

type AvatarProps = {
  /** URL da foto do provedor, ou `null` quando não houver. */
  url: string | null;
  /**
   * Inicial a mostrar quando não há foto (ou ela falha ao carregar); ver
   * `getAvatarInitial`. `null` cai no ícone genérico.
   */
  initial: string | null;
  size?: number;
  /** Marca do provedor no canto inferior direito; informativa, não interativa. */
  badge?: ReactNode;
};

/**
 * Foto de perfil com fallback em camadas: foto do provedor → inicial do nome →
 * ícone genérico.
 */
export function Avatar({ url, initial, size = 56, badge }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(url) && !imageFailed;

  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        {showImage ? (
          <Image
            source={{ uri: url! }}
            style={styles.image}
            contentFit="cover"
            transition={150}
            accessibilityLabel={t('a11y.avatar.profilePhoto')}
            onError={() => setImageFailed(true)}
          />
        ) : initial ? (
          <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
        ) : (
          <Ionicons name="person" size={size * 0.46} color={colors.primary} />
        )}
      </View>
      {badge ? <View style={styles.badge}>{badge}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    color: colors.primary,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
