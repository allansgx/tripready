import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { SectionLabel } from '@/components/ui/section-label';
import { appVersionLabel } from '@/constants/app-version';
import { useAuth } from '@/features/auth/auth-context';
import { DeleteAccountModal } from '@/features/auth/delete-account-modal';
import { getAvatarInitial, getAvatarUrl, getDisplayName } from '@/features/auth/user-profile';
import { PassportsSection } from '@/features/passports/passports-section';
import { colors, spacing, typography } from '@/theme/tokens';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
          <Avatar url={getAvatarUrl(user)} initial={getAvatarInitial(user)} size={56} />
          <View style={styles.identityTexts}>
            <Text style={styles.name} numberOfLines={1}>
              {getDisplayName(user)}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email ?? user?.id}
            </Text>
          </View>
          <Button
            label="Editar"
            variant="soft"
            size="sm"
            onPress={() => router.push('/profile/edit')}
          />
        </View>

        <PassportsSection />

        <View>
          <SectionLabel>Legal</SectionLabel>
          <Card>
            <ListRow
              label="Política de Privacidade"
              icon={<Ionicons name="information-circle-outline" size={18} color={colors.primary} />}
              onPress={() => router.push('/legal/privacidade')}
            />
            <ListRow
              label="Termos de Uso"
              icon={<Ionicons name="document-text-outline" size={18} color={colors.primary} />}
              onPress={() => router.push('/legal/termos')}
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

        {appVersionLabel ? <Text style={styles.version}>{appVersionLabel}</Text> : null}
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
  dangerZone: { marginTop: spacing.sm },
  identityTexts: { flex: 1, gap: 2 },
  name: { ...typography.bodyStrong, color: colors.text },
  email: { ...typography.caption, color: colors.textSecondary },
  version: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
