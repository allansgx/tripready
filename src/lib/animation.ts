import { Platform } from 'react-native';

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
