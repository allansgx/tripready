import { Platform, StyleSheet, Text } from 'react-native';

import { getFlagEmoji } from '@/constants/countries';
import { colors, typography } from '@/theme/tokens';

/**
 * Bandeira derivada do código ISO. O Android não traz essas imagens na fonte do
 * sistema, então lá mostramos o código em duas letras.
 */
export function CountryFlag({ code, size = 26 }: { code: string; size?: number }) {
  const normalized = code.trim().toUpperCase();
  // A largura acompanha o tamanho para a bandeira ficar alinhada com o texto
  // ao lado, seja ela o ícone de uma seção ou uma marca dentro de uma linha.
  const box = { width: size * 1.4 };

  if (Platform.OS === 'android') {
    return <Text style={[styles.code, box, { fontSize: size * 0.6 }]}>{normalized}</Text>;
  }

  return (
    <Text
      style={[styles.flag, box, { fontSize: size, lineHeight: size * 1.25 }]}
      accessibilityElementsHidden
      importantForAccessibility="no">
      {getFlagEmoji(normalized)}
    </Text>
  );
}

const styles = StyleSheet.create({
  flag: {
    textAlign: 'center',
  },
  code: {
    ...typography.bodyStrong,
    color: colors.text,
    textAlign: 'center',
  },
});
