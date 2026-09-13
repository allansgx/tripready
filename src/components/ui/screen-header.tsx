import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Para onde voltar quando a tela foi aberta direto por deep link. */
  fallbackHref?: '/login' | '/profile' | '/profile/edit';
};

/** Cabeçalho com botão voltar ao lado do título, e o texto de apoio abaixo. */
export function ScreenHeader({ title, subtitle, fallbackHref = '/login' }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={12}
        onPress={() => (router.canGoBack() ? router.back() : router.replace(fallbackHref))}
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>

      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  back: {
    width: 36,
    height: 36,
    marginLeft: -spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    backgroundColor: colors.primarySoft,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.screenTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
