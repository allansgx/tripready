import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { USE_NATIVE_DRIVER, useReduceMotion } from '@/lib/animation';
import { colors, priorityColors, radius, shadow, spacing, typography } from '@/theme/tokens';

const CONFETTI_COUNT = 14;
const CONFETTI_COLORS = [
  colors.primary,
  priorityColors.recommended,
  priorityColors.informational,
  '#34C759',
] as const;

// `leftFraction` em vez de pixels: o sorteio não depende da tela e acontece uma
// vez só, fora da renderização.
function createPieces() {
  return Array.from({ length: CONFETTI_COUNT }, (_, index) => ({
    key: index,
    leftFraction: Math.random(),
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    distance: 0.6 + Math.random() * 0.6,
    drift: (Math.random() - 0.5) * 80,
    size: 7 + Math.random() * 6,
    spin: Math.random() > 0.5 ? 1 : -1,
  }));
}

export type Celebration = {
  title: string;
  message: string;
};

/**
 * Comemoração de viagem pronta, em `Modal` nativo e não em rota. O fechamento é
 * sempre ação do usuário, nunca por tempo.
 */
export function CelebrationOverlay({
  celebration,
  onDismiss,
}: {
  celebration: Celebration | null;
  onDismiss: () => void;
}) {
  const { width } = useWindowDimensions();
  const reduceMotion = useReduceMotion();

  // Inicializador de `useState`: cada valor nasce uma vez e nunca é trocado,
  // então a animação sobrevive a qualquer re-renderização.
  const [backdrop] = useState(() => new Animated.Value(0));
  const [card] = useState(() => new Animated.Value(0));
  const [badge] = useState(() => new Animated.Value(0));
  const [confetti] = useState(() => new Animated.Value(0));

  const [pieces] = useState(createPieces);

  useEffect(() => {
    if (!celebration) {
      backdrop.setValue(0);
      card.setValue(0);
      badge.setValue(0);
      confetti.setValue(0);
      return;
    }

    if (reduceMotion) {
      backdrop.setValue(1);
      card.setValue(1);
      badge.setValue(1);
    } else {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 180,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(card, {
          toValue: 1,
          useNativeDriver: USE_NATIVE_DRIVER,
          speed: 13,
          bounciness: 9,
        }),
        Animated.sequence([
          Animated.delay(120),
          Animated.spring(badge, {
            toValue: 1,
            useNativeDriver: USE_NATIVE_DRIVER,
            speed: 10,
            bounciness: 16,
          }),
        ]),
        Animated.timing(confetti, {
          toValue: 1,
          duration: 1900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start();
    }
    // Sem fechamento automático: a comemoração fica na tela até o usuário
    // confirmar em "Continuar".
  }, [celebration, reduceMotion, backdrop, card, badge, confetti]);

  if (!celebration) return null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar comemoração"
          style={styles.backdropArea}
          onPress={onDismiss}>
          <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />
        </Pressable>

        {!reduceMotion
          ? pieces.map((piece) => (
              <Animated.View
                key={piece.key}
                style={[
                  styles.confetti,
                  {
                    left: piece.leftFraction * width,
                    width: piece.size,
                    height: piece.size * 1.6,
                    backgroundColor: piece.color,
                    opacity: confetti.interpolate({
                      inputRange: [0, 0.75, 1],
                      outputRange: [1, 1, 0],
                    }),
                    transform: [
                      {
                        translateY: confetti.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-60, 700 * piece.distance],
                        }),
                      },
                      {
                        translateX: confetti.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, piece.drift],
                        }),
                      },
                      {
                        rotate: confetti.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', `${piece.spin * 540}deg`],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))
          : null}

        <View style={styles.center}>
          <Animated.View
            accessibilityViewIsModal
            accessibilityLiveRegion="polite"
            style={[
              styles.card,
              {
                opacity: card,
                transform: [
                  {
                    scale: card.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              },
            ]}>
            <Animated.Text
              style={[
                styles.badge,
                {
                  transform: [
                    {
                      scale: badge.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1],
                      }),
                    },
                  ],
                },
              ]}>
              🎉
            </Animated.Text>

            <Text style={styles.title}>{celebration.title}</Text>
            <Text style={styles.message}>{celebration.message}</Text>

            <View style={styles.action}>
              <Button label="Continuar" onPress={onDismiss} />
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdropArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 17, 20, 0.45)',
  },
  center: {
    flex: 1,
    pointerEvents: 'box-none',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    ...shadow.card,
  },
  badge: {
    fontSize: 56,
    lineHeight: 64,
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
  confetti: {
    position: 'absolute',
    pointerEvents: 'none',
    top: 0,
    borderRadius: 2,
  },
});
