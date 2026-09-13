import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Driver nativo do `Animated`, quando a plataforma tem um. Use esta constante
 * em vez de escrever `useNativeDriver: true` na mão.
 */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Se o sistema pede para reduzir movimento. Toda animação decorativa deve
 * consultar isto e mostrar o estado final direto quando for `true`.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => {
        if (active) setReduceMotion(false);
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
