import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_SECONDS = 60;
const MAX_SECONDS = 300;
// Passado esse tempo sem uma nova tentativa, a espera volta a começar do
// zero — evita que quem retomar o fluxo bem depois herde a escalada de uma
// sessão de cliques antiga.
const RESET_AFTER_MS = 10 * 60 * 1000;

/** 60s, 120s, 240s, 300s (teto) — cresce a cada reenvio, como a maioria dos apps faz. */
export function cooldownSecondsForAttempt(attempt: number): number {
  return Math.min(BASE_SECONDS * 2 ** attempt, MAX_SECONDS);
}

type CooldownState = { until: number; attempt: number };

/**
 * Persistido, não em estado de tela: sem isso, sair e voltar da tela reinicia
 * a contagem e permite reenviar sem limite.
 */
export function createResendCooldown(storageKey: string) {
  async function readState(): Promise<CooldownState | null> {
    const raw = await AsyncStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CooldownState;
    } catch {
      return null;
    }
  }

  return {
    async getSecondsRemaining(): Promise<number> {
      const state = await readState();
      if (!state) return 0;
      return Math.max(0, Math.ceil((state.until - Date.now()) / 1000));
    },
    async markSent(): Promise<void> {
      const state = await readState();
      const isStale = !state || Date.now() - state.until > RESET_AFTER_MS;
      const attempt = isStale ? 0 : state.attempt + 1;
      const seconds = cooldownSecondsForAttempt(attempt);
      const nextState: CooldownState = { until: Date.now() + seconds * 1000, attempt };
      await AsyncStorage.setItem(storageKey, JSON.stringify(nextState));
    },
  };
}
