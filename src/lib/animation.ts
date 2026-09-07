import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Driver nativo do `Animated`, quando a plataforma tem um.
 *
 * No iOS e no Android as animações rodam fora da thread de JS. Na web o módulo
 * nativo não existe: pedir `useNativeDriver: true` lá só gera aviso e cai para
 * o driver de JS mesmo assim. Como todas as animações do app são de `opacity` e
 * `transform`, o resultado visual é o mesmo nos dois casos.
 *
 * Use esta constante em vez de escrever `useNativeDriver: true` na mão.
 */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Se o sistema pede para reduzir movimento.
 *
 * Toda animação decorativa do app deve consultar isto e mostrar o estado final
 * direto quando o valor for `true` — nada de conteúdo que só aparece no fim de
 * uma animação. A preferência é reavaliada enquanto a tela está montada: quem
 * liga o recurso nos ajustes vê o efeito sem reabrir o app.
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
