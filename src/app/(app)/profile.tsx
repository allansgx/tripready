import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { SectionLabel } from '@/components/ui/section-label';
import { useAuth } from '@/features/auth/auth-context';
import { getAvatarUrl, getDisplayName } from '@/features/auth/user-profile';
import { passportsService } from '@/services';
import type { Passport } from '@/types/models';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/**
 * Tela provisória (sem design final): valida sessão, leitura/escrita em
 * `passports` e logout. O layout definitivo do Figma virá em outra etapa.
 */
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [passports, setPassports] = useState<Passport[]>([]);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const avatarUrl = getAvatarUrl(user);
  const showAvatar = Boolean(avatarUrl) && !avatarFailed;

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setPassports(await passportsService.listByUser(user.id));
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao carregar.');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function addTestPassport() {
    if (!user) return;
    try {
      await passportsService.create({
        userId: user.id,
        countryCode: passports.length === 0 ? 'BR' : 'IT',
        isPrimary: passports.length === 0,
      });
      await load();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao criar.');
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Perfil</Text>

        <View style={styles.identity}>
          <View style={styles.avatar}>
            {showAvatar ? (
              <Image
                source={{ uri: avatarUrl! }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={150}
                accessibilityLabel="Foto do perfil"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <Ionicons name="person" size={26} color={colors.primary} />
            )}
          </View>
          <View style={styles.identityTexts}>
            <Text style={styles.name} numberOfLines={1}>
              {getDisplayName(user)}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email ?? user?.id}
            </Text>
          </View>
        </View>

        <View>
          <SectionLabel>Passaportes</SectionLabel>
          <Card>
            {passports.map((passport) => (
              <ListRow
                key={passport.id}
                label={passport.country_code}
                description={passport.is_primary ? 'Principal' : undefined}
                right={
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.textSecondary}
                    onPress={async () => {
                      await passportsService.remove(passport.id);
                      await load();
                    }}
                  />
                }
              />
            ))}
            <ListRow
              label="Adicionar passaporte"
              tone="primary"
              icon={<Ionicons name="add" size={18} color={colors.primary} />}
              right={null}
              onPress={addTestPassport}
            />
          </Card>
        </View>

        <View>
          <SectionLabel>Conta</SectionLabel>
          <Card>
            <ListRow
              label="Sair"
              icon={<Ionicons name="log-out-outline" size={18} color={colors.danger} />}
              iconBackground="#FDECEA"
              right={null}
              onPress={() => void signOut()}
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl - spacing.xs, gap: spacing.xl },
  title: { ...typography.screenTitle, color: colors.text },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  identityTexts: { flex: 1, gap: 2 },
  name: { ...typography.bodyStrong, color: colors.text },
  email: { ...typography.caption, color: colors.textSecondary },
});
