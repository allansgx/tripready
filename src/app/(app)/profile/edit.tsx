import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormLayout } from '@/components/ui/form-layout';
import { FormMessage } from '@/components/ui/form-message';
import { ListRow } from '@/components/ui/list-row';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionLabel } from '@/components/ui/section-label';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/features/auth/auth-context';
import { toAuthMessage } from '@/features/auth/auth-errors';
import {
  getAccountProvider,
  getAvatarInitial,
  getAvatarUrl,
  getStoredName,
  type AccountProvider,
} from '@/features/auth/user-profile';
import { t, type MessageKey } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const NAME_MAX_LENGTH = 60;

const PROVIDER_ICONS = {
  google: 'logo-google',
  apple: 'logo-apple',
} as const;

const PROVIDER_LABEL_KEYS: Record<Exclude<AccountProvider, 'email'>, MessageKey> = {
  google: 'auth.provider.google',
  apple: 'auth.provider.apple',
};

export default function EditProfileScreen() {
  const { user, updateDisplayName } = useAuth();
  const router = useRouter();

  const provider = getAccountProvider(user);
  const isEmailAccount = provider === 'email';

  const [name, setName] = useState(getStoredName(user) ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storedName = getStoredName(user) ?? '';
  const canSubmit = isEmailAccount && name.trim().length > 0 && name.trim() !== storedName;

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await updateDisplayName(name);
      router.back();
    } catch (err) {
      setError(toAuthMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const providerLabel = isEmailAccount ? null : t(PROVIDER_LABEL_KEYS[provider]);
  const badge = isEmailAccount ? undefined : (
    <Ionicons name={PROVIDER_ICONS[provider]} size={12} color={colors.textSecondary} />
  );

  return (
    <FormLayout>
      <ScreenHeader title={t('profile.edit.title')} fallbackHref="/profile" />

      <View style={styles.avatarRow}>
        <Avatar url={getAvatarUrl(user)} initial={getAvatarInitial(user)} size={88} badge={badge} />
      </View>

      <View style={styles.form}>
        <View>
          <TextField
            label={t('common.field.name.label')}
            value={name}
            onChangeText={setName}
            locked={!isEmailAccount}
            placeholder={t('common.field.name.placeholder')}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={NAME_MAX_LENGTH}
            returnKeyType="done"
          />
          {!isEmailAccount && providerLabel ? (
            <View style={styles.managedRow}>
              <Ionicons name={PROVIDER_ICONS[provider]} size={14} color={colors.textSecondary} />
              <Text style={styles.managedText}>
                {t('profile.edit.managedBy', { provider: providerLabel })}
              </Text>
            </View>
          ) : null}
        </View>

        <TextField label={t('common.field.email.label')} value={user?.email ?? ''} locked />

        {isEmailAccount ? (
          <View>
            <SectionLabel>{t('profile.section.security')}</SectionLabel>
            <Card>
              <ListRow
                label={t('profile.security.passwordRow.label')}
                description={t('profile.security.passwordRow.description')}
                icon={<Ionicons name="lock-closed-outline" size={18} color={colors.primary} />}
                onPress={() => router.push('/profile/password')}
              />
            </Card>
          </View>
        ) : (
          providerLabel && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                {t('profile.edit.externalNotice', { provider: providerLabel })}
              </Text>
            </View>
          )
        )}

        {error ? <FormMessage text={error} /> : null}

        {isEmailAccount ? (
          <Button
            label={t('profile.edit.submit')}
            onPress={submit}
            loading={busy}
            disabled={!canSubmit}
          />
        ) : null}
      </View>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  avatarRow: {
    alignItems: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  managedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  managedText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  notice: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  noticeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
