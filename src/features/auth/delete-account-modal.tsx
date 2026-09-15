import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { renderInlineBold } from '@/components/ui/inline-markup';
import { TextField } from '@/components/ui/text-field';
import { getDeleteConfirmationWord, isDeleteConfirmed } from '@/features/auth/delete-account';
import { t, useLocale } from '@/i18n';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

type DeleteAccountModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Chamado quando a palavra foi digitada e a exclusão foi confirmada. */
  onConfirm: () => void;
};

/**
 * Confirmação da exclusão da conta, por cima do Perfil e não por rota. Aqui
 * nada é excluído: o modal só decide, e a exclusão acontece na tela seguinte.
 */
export function DeleteAccountModal({ visible, onClose, onConfirm }: DeleteAccountModalProps) {
  const insets = useSafeAreaInsets();
  const locale = useLocale();
  const [confirmation, setConfirmation] = useState('');

  const confirmationWord = getDeleteConfirmationWord(locale);
  const confirmed = isDeleteConfirmed(confirmation, locale);

  /** Fechar é só fechar: nada é excluído por sair daqui. */
  function handleClose() {
    setConfirmation('');
    onClose();
  }

  function handleConfirm() {
    if (!confirmed) return;

    setConfirmation('');
    onConfirm();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.action.close')}
          style={StyleSheet.absoluteFill}
          onPress={handleClose}>
          <View style={styles.backdrop} />
        </Pressable>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            accessibilityViewIsModal
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
            <View style={styles.handle} />

            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <View style={styles.badge}>
                  <Ionicons name="trash-outline" size={26} color={colors.danger} />
                </View>

                <Text style={styles.title}>{t('auth.deleteAccount.title')}</Text>

                <Text style={styles.warning}>
                  {renderInlineBold(t('auth.deleteAccount.warning'), styles.warningStrong)}
                </Text>
              </View>

              <TextField
                label={t('auth.deleteAccount.field.label', { word: confirmationWord })}
                value={confirmation}
                onChangeText={setConfirmation}
                placeholder={confirmationWord}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                returnKeyType="done"
                accessibilityLabel={t('auth.deleteAccount.field.a11yLabel', {
                  word: confirmationWord,
                })}
                onSubmitEditing={handleConfirm}
              />

              <View style={styles.actions}>
                <Button
                  label={t('auth.deleteAccount.confirmButton')}
                  tone="danger"
                  onPress={handleConfirm}
                  disabled={!confirmed}
                />
                <Button label={t('common.action.cancel')} variant="outline" onPress={handleClose} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 20, 0.45)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    ...shadow.card,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.progressTrack,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.xl - spacing.xs,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  warning: {
    ...typography.caption,
    fontSize: 15,
    lineHeight: 21,
    color: colors.danger,
    textAlign: 'center',
  },
  warningStrong: {
    fontWeight: '700',
  },
  actions: {
    gap: spacing.md,
  },
});
