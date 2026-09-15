import AsyncStorage from '@react-native-async-storage/async-storage';

import { isLocale, type Locale } from './locales.ts';

const KEY = 'tripready.locale';

/** Nulo quando a pessoa nunca escolheu um idioma e segue o aparelho. */
export async function readLocaleChoice(): Promise<Locale | null> {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    // O idioma do aparelho já está valendo; não há o que dizer ao usuário.
    return null;
  }
}

export async function writeLocaleChoice(locale: Locale | null): Promise<void> {
  try {
    if (locale === null) {
      await AsyncStorage.removeItem(KEY);
      return;
    }
    await AsyncStorage.setItem(KEY, locale);
  } catch {
    // A escolha vale nesta sessão e o app continua funcionando.
  }
}
