import { Platform, StyleSheet, Text } from 'react-native';

import { getFlagEmoji } from '@/constants/countries';
import { colors, typography } from '@/theme/tokens';

/**
 * Bandeira do país derivada do código ISO.
 *
 * No iOS e na web o emoji vira a bandeira de verdade. O Android não traz essas
 * imagens na fonte do sistema, então lá mostramos o código em duas letras —
 * que é como a referência do Figma apresenta e como o próprio Android
 * costuma degradar esses emojis.
 */
export function CountryFlag({ code }: { code: string }) {
  const normalized = code.trim().toUpperCase();

  if (Platform.OS === 'android') {
    return <Text style={styles.code}>{normalized}</Text>;
  }

  return (
    <Text style={styles.flag} accessibilityElementsHidden importantForAccessibility="no">
      {getFlagEmoji(normalized)}
    </Text>
  );
}

const styles = StyleSheet.create({
  flag: {
    fontSize: 26,
    lineHeight: 32,
    width: 36,
    textAlign: 'center',
  },
  code: {
    ...typography.bodyStrong,
    color: colors.text,
    width: 36,
    textAlign: 'center',
  },
});
