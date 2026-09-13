import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AlertButton,
} from 'react-native';

import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

/**
 * Alertas e menus de ação: no nativo é o `Alert` do sistema; na web o
 * `Alert` do react-native-web é um no-op, daí o `DialogHost` abaixo. Use
 * `showDialog` no lugar de `Alert.alert` em todo o app.
 */

type DialogRequest = {
  title: string;
  message?: string;
  buttons: AlertButton[];
};

const DEFAULT_BUTTONS: AlertButton[] = [{ text: 'OK' }];

/** Preenchido pelo host da web enquanto ele está montado. */
let present: ((request: DialogRequest) => void) | null = null;

export function showDialog(
  title: string,
  message?: string,
  buttons: AlertButton[] = DEFAULT_BUTTONS,
): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  present?.({ title, message, buttons });
}

/**
 * Onde o diálogo da web aparece. Fica na raiz do app e não desenha nada até
 * alguém chamar `showDialog`. No nativo não faz nada.
 */
export function DialogHost() {
  const [request, setRequest] = useState<DialogRequest | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    present = setRequest;
    return () => {
      present = null;
    };
  }, []);

  if (!request) return null;

  function choose(button: AlertButton) {
    // Fecha antes de agir: a ação pode navegar, e um diálogo aberto sobre a
    // tela nova ficaria preso.
    setRequest(null);
    button.onPress?.();
  }

  /** Fechar pelo fundo ou pelo Esc equivale a cancelar. */
  function dismiss() {
    const cancel = request?.buttons.find((button) => button.style === 'cancel');
    setRequest(null);
    cancel?.onPress?.();
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={dismiss}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          style={StyleSheet.absoluteFill}
          onPress={dismiss}>
          <View style={styles.backdrop} />
        </Pressable>

        <View accessibilityViewIsModal style={styles.card}>
          <View style={styles.texts}>
            <Text style={styles.title}>{request.title}</Text>
            {request.message ? <Text style={styles.message}>{request.message}</Text> : null}
          </View>

          {request.buttons.map((button, index) => (
            <Pressable
              key={button.text ?? index}
              accessibilityRole="button"
              onPress={() => choose(button)}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
              <Text
                style={[
                  styles.actionText,
                  button.style === 'destructive' && styles.actionDestructive,
                  button.style === 'cancel' && styles.actionCancel,
                ]}>
                {button.text}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 20, 0.45)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  texts: {
    gap: spacing.xs,
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  action: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  actionPressed: {
    backgroundColor: colors.background,
  },
  actionText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  actionDestructive: {
    color: colors.danger,
  },
  actionCancel: {
    color: colors.textSecondary,
  },
});
