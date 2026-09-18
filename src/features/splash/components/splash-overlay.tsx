import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ICON_MARK_SCALE, MARK_SIZE, SPLASH_COLORS } from '@/features/splash/domain/brand-art';
import {
  SPLASH_EXIT_SCALE,
  WAITING_NOTE_AFTER_HOLD_MS,
  canLeaveSplash,
  splashSchedule,
} from '@/features/splash/domain/splash-timing';

/** A logo branca do ícone do app. O PNG tem margem própria, daí a divisão. */
const BRAND_LOGO = require('@/assets/images/android-icon-foreground.png');
const LOGO_SIZE = Math.round(MARK_SIZE / ICON_MARK_SCALE);

/** A saída começa devagar e acelera, como algo que se afasta de quem olha. */
const LEAVE = Easing.bezier(0.45, 0, 0.9, 1);

/** Enquanto o sistema não responde sobre reduzir movimento, nada se move. */
type Motion = 'pending' | 'full' | 'reduced';

/**
 * A abertura do app: a logo branca sobre o roxo da marca. O splash nativo só é
 * escondido depois que este quadro pinta — daí a troca não piscar.
 */
export function SplashOverlay({
  isAppReady,
  onFinish,
}: {
  isAppReady: boolean;
  /** Avisa o layout raiz que a abertura acabou e não volta mais. */
  onFinish: () => void;
}) {
  const [motion, setMotion] = useState<Motion>('pending');
  const [holdReached, setHoldReached] = useState(false);
  const [showWaitingNote, setShowWaitingNote] = useState(false);

  const fade = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function start(reduceMotion: boolean) {
      if (!active) return;
      setMotion(reduceMotion ? 'reduced' : 'full');

      const { holdAt } = splashSchedule(reduceMotion);

      timers.push(
        setTimeout(() => setHoldReached(true), holdAt),
        setTimeout(() => setShowWaitingNote(true), holdAt + WAITING_NOTE_AFTER_HOLD_MS),
      );
    }

    // Uma falha aqui não pode segurar a abertura: sem resposta, anima.
    AccessibilityInfo.isReduceMotionEnabled().then(start, () => start(false));

    return () => {
      active = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (motion === 'pending') return;
    if (!canLeaveSplash({ holdReached, isAppReady })) return;

    const { exitMs } = splashSchedule(motion === 'reduced');

    fade.value = withTiming(0, { duration: exitMs, easing: LEAVE });
    if (motion === 'full') {
      scale.value = withTiming(SPLASH_EXIT_SCALE, { duration: exitMs, easing: LEAVE });
    }

    const id = setTimeout(onFinish, exitMs);
    return () => clearTimeout(id);
  }, [fade, holdReached, isAppReady, motion, onFinish, scale]);

  // Aqui, e não quando o app fica pronto: é o instante em que existe um quadro
  // idêntico ao splash nativo desenhado por cima.
  const nativeHidden = useRef(false);
  const handleLayout = useCallback(() => {
    if (nativeHidden.current) return;
    nativeHidden.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} onLayout={handleLayout}>
      <View style={styles.background} />

      <Animated.View style={[styles.centered, markStyle]}>
        <Image source={BRAND_LOGO} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      {showWaitingNote ? (
        <View style={styles.noteArea} pointerEvents="none">
          <Animated.Text entering={FadeIn.duration(400)} style={styles.waitingNote}>
            Estamos preparando tudo para você.
          </Animated.Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

/** `StyleSheet.absoluteFill` é um estilo registrado e não dá para espalhar. */
const FILL = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

const styles = StyleSheet.create({
  overlay: {
    ...FILL,
    // Acima de qualquer tela já montada atrás, inclusive das modais.
    zIndex: 10,
  },
  background: {
    ...FILL,
    backgroundColor: SPLASH_COLORS.brand,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  centered: {
    ...FILL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Abaixo do centro, longe da marca.
  noteArea: {
    ...FILL,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '38%',
  },
  waitingNote: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: SPLASH_COLORS.note,
  },
});
