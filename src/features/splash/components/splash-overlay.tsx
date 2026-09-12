import * as SplashScreen from 'expo-splash-screen';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AltitudeGradient } from '@/features/splash/components/altitude-gradient';
import { PlaneMark } from '@/features/splash/components/plane-mark';
import { CloudDecks } from '@/features/splash/components/sky-clouds';
import { PLANE_MARK_SIZE, SPLASH_COLORS } from '@/features/splash/domain/plane-art';
import {
  REDUCED_CLIMB_MS,
  SPLASH_BEATS,
  SPLASH_EXIT_MS,
  STATUS_BAR_FLIP_AT,
  WAITING_NOTE_AFTER_HOLD_MS,
  canLeaveSplash,
  splashSchedule,
} from '@/features/splash/domain/splash-timing';

/** O recuo antes de subir. */
const CROUCH = 9;

/**
 * A subida acelera. Uma curva de desaceleração joga quase todo o deslocamento
 * nos primeiros quadros: o avião salta e some, e o resto da janela passa com a
 * tela já vazia — justamente enquanto as camadas de nuvem estão entrando para
 * dizer que ele está subindo. Acelerando, ele fica em quadro até quase o fim.
 */
const RISE = Easing.in(Easing.quad);
/** A saída: começa devagar e acelera, como algo que se abre para a frente. */
const OPEN = Easing.bezier(0.45, 0, 0.9, 1);

/** Enquanto o sistema não responde sobre reduzir movimento, nada se move. */
type Motion = 'pending' | 'full' | 'reduced';

/**
 * A abertura do app: um avião que decola, e a Home.
 *
 * O primeiro quadro — céu chapado e o avião de 76pt no centro — é o próprio
 * splash nativo redesenhado em SVG, e o nativo só é escondido depois que ele
 * pinta. Daí a troca não piscar.
 *
 * Enquanto ele sobe, o alto do céu escurece no roxo da marca: é isso que faz a
 * subida parecer deslocamento e não um avião subindo parado no mesmo lugar.
 *
 * Quando o avião sai pelo topo, a cena está inteira e nada mais se move: é ali
 * que a espera pela sessão e pelos passaportes acontece, sem parecer espera.
 * Assim que o app tem o que mostrar, o céu se abre para a frente e se apaga
 * sobre a Home, que já está montada atrás — a saída é a entrada dela.
 */
export function SplashOverlay({
  isAppReady,
  onFinish,
}: {
  isAppReady: boolean;
  /** Avisa o layout raiz que a abertura acabou e não volta mais. */
  onFinish: () => void;
}) {
  // Um retrato das medidas, tirado uma vez: o app é retrato travado e a tela
  // vive pouco mais de um segundo — reagir a mudança de dimensão só reiniciaria
  // a animação no meio.
  const [screen] = useState(() => Dimensions.get('window'));

  const [motion, setMotion] = useState<Motion>('pending');
  const [holdReached, setHoldReached] = useState(false);
  const [showWaitingNote, setShowWaitingNote] = useState(false);

  const altitude = useSharedValue(0);
  const planeY = useSharedValue(0);
  const planeX = useSharedValue(0);
  const planeScale = useSharedValue(1);
  const overlay = useSharedValue(1);
  const overlayScale = useSharedValue(1);

  const climb = screen.height / 2 + 140;

  useEffect(() => {
    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function start(reduceMotion: boolean) {
      if (!active) return;
      setMotion(reduceMotion ? 'reduced' : 'full');

      if (!reduceMotion) {
        const beats = SPLASH_BEATS;

        altitude.value = withDelay(
          beats.climb.at,
          withTiming(1, { duration: beats.climb.duration, easing: Easing.inOut(Easing.quad) }),
        );

        planeY.value = withDelay(
          beats.crouch.at,
          withSequence(
            withTiming(CROUCH, {
              duration: beats.crouch.duration,
              easing: Easing.out(Easing.quad),
            }),
            withTiming(-climb, { duration: beats.takeoff.duration, easing: RISE }),
          ),
        );

        planeScale.value = withDelay(
          beats.crouch.at,
          withSequence(
            withTiming(0.97, { duration: beats.crouch.duration }),
            withTiming(1.12, {
              duration: beats.takeoff.duration,
              easing: Easing.out(Easing.cubic),
            }),
          ),
        );

        // O arco: o avião não sobe em linha reta, escapa um pouco de lado.
        planeX.value = withDelay(
          beats.takeoff.at,
          withTiming(9, { duration: beats.takeoff.duration, easing: Easing.inOut(Easing.quad) }),
        );
      } else {
        altitude.value = withTiming(1, { duration: REDUCED_CLIMB_MS });
      }

      const { holdAt } = splashSchedule(reduceMotion);

      timers.push(
        setTimeout(
          () => setStatusBarStyle('light', true),
          reduceMotion ? REDUCED_CLIMB_MS : STATUS_BAR_FLIP_AT,
        ),
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
    // Todos os valores compartilhados são referências estáveis, assim como as
    // medidas — a lista existe para o lint, não para reexecutar.
  }, [altitude, climb, planeScale, planeX, planeY]);

  useEffect(() => {
    if (!canLeaveSplash({ holdReached, isAppReady })) return;

    // A Home é clara; o céu, a essa altura, está roxo em cima.
    setStatusBarStyle('dark', true);

    // A Home não entra por baixo de uma cortina que some: é o céu que se abre
    // para a frente e sai de quadro, deixando ela no lugar.
    overlay.value = withTiming(0, { duration: SPLASH_EXIT_MS, easing: OPEN });
    overlayScale.value = withTiming(1.14, { duration: SPLASH_EXIT_MS, easing: OPEN });

    const id = setTimeout(onFinish, SPLASH_EXIT_MS);
    return () => clearTimeout(id);
  }, [holdReached, isAppReady, onFinish, overlay, overlayScale]);

  /**
   * O splash nativo sai aqui, e não quando o app fica pronto: este é o instante
   * em que existe um quadro idêntico a ele desenhado por cima.
   */
  const nativeHidden = useRef(false);
  const handleLayout = useCallback(() => {
    if (nativeHidden.current) return;
    nativeHidden.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const altitudeStyle = useAnimatedStyle(() => ({ opacity: altitude.value }));

  const planeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: planeX.value },
      { translateY: planeY.value },
      { scale: planeScale.value },
    ],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlay.value,
    transform: [{ scale: overlayScale.value }],
  }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} onLayout={handleLayout}>
      <View style={styles.sky} />

      <Animated.View style={[styles.altitude, altitudeStyle]}>
        <AltitudeGradient width={screen.width} height={screen.height} />
      </Animated.View>

      {motion === 'pending' ? null : (
        <CloudDecks
          width={screen.width}
          height={screen.height}
          reduceMotion={motion === 'reduced'}
        />
      )}

      <Animated.View style={[styles.centered, planeStyle]}>
        <PlaneMark size={PLANE_MARK_SIZE} />
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
  sky: {
    ...FILL,
    backgroundColor: SPLASH_COLORS.sky,
  },
  altitude: FILL,
  centered: {
    ...FILL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Abaixo do centro, onde o avião já não está e as nuvens ainda não chegaram.
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
