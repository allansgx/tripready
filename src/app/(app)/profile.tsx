import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { SectionLabel } from '@/components/ui/section-label';
import { useAuth } from '@/features/auth/auth-context';
import { DeleteAccountModal } from '@/features/auth/delete-account-modal';
import { getAvatarUrl, getDisplayName } from '@/features/auth/user-profile';
import { PassportsSection } from '@/features/passports/passports-section';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const avatarUrl = getAvatarUrl(user);
  const showAvatar = Boolean(avatarUrl) && !avatarFailed;

  /** O modal confirma; quem exclui é a tela de processamento. */
  function startDeletion() {
    setIsDeleteOpen(false);
    router.push('/account-deleting');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
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

        <PassportsSection />

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

        {/* Fora do cartão, e por último: excluir a conta não é uma opção entre
            outras da seção — é a saída definitiva. */}
        <View style={styles.dangerZone}>
          <Button
            label="Excluir conta"
            variant="outline"
            tone="danger"
            onPress={() => setIsDeleteOpen(true)}
          />
        </View>
      </ScrollView>

      <DeleteAccountModal
        visible={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={startDeletion}
      />
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
  dangerZone: { marginTop: spacing.sm },
  identityTexts: { flex: 1, gap: 2 },
  name: { ...typography.bodyStrong, color: colors.text },
  email: { ...typography.caption, color: colors.textSecondary },
});
