import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Para onde voltar quando a tela foi aberta direto por deep link. */
  fallbackHref?: '/login';
};

/** Cabeçalho com botão voltar, título e texto de apoio. */
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

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  back: {
    width: 36,
    height: 36,
    marginLeft: -spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    backgroundColor: colors.primarySoft,
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
