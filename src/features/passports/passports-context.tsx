import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { rebuildChecklistsForPassport } from '@/features/trips/data/trip-persistence';
import { passportsService } from '@/services';
import type { Passport } from '@/types/models';

/** Erro de regra de negócio — a mensagem é escrita para o usuário ler. */
export class PassportRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PassportRuleError';
  }
}

type PassportsContextValue = {
  passports: Passport[];
  /** `true` enquanto a primeira carga da sessão não terminou. */
  isLoading: boolean;
  /** Diferente de "não tem passaporte": não manda ao onboarding quem perdeu a conexão. */
  hasLoadError: boolean;
  /** Usado pelo layout raiz para decidir entre onboarding e área principal. */
  hasPassport: boolean;
  primary: Passport | null;
  /** Códigos já cadastrados, para o seletor não oferecer repetidos. */
  usedCountryCodes: string[];
  addPassport: (countryCode: string) => Promise<Passport>;
  setPrimary: (passportId: string) => Promise<void>;
  removePassport: (passportId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const PassportsContext = createContext<PassportsContextValue | null>(null);

/** Referência estável para o caso "sem usuário", que não deve refazer memos. */
const NO_PASSPORTS: Passport[] = [];

/**
 * Fonte única dos passaportes: o primeiro nasce principal, existe no máximo um
 * principal e ele não pode ser removido enquanto houver outros.
 */
export function PassportsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // A leitura guarda de qual usuário ela é: sem isso, o logout precisaria de um
  // efeito zerando estado, e uma renderização mostraria a lista anterior.
  const [state, setState] = useState<
    { userId: string; rows: Passport[] } | { userId: string; failed: true } | null
  >(null);

  const isCurrent = state !== null && state.userId === userId;
  const loadedRows = isCurrent && 'rows' in state ? state.rows : null;
  const passports = loadedRows ?? NO_PASSPORTS;
  const isLoading = userId !== null && !isCurrent;
  const hasLoadError = isCurrent && loadedRows === null;

  const refresh = useCallback(async () => {
    if (!userId) return;
    setState({ userId, rows: await passportsService.listByUser(userId) });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let active = true;

    passportsService
      .listByUser(userId)
      .then((rows) => {
        if (active) setState({ userId, rows });
      })
      .catch(() => {
        if (active) setState({ userId, failed: true });
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const value = useMemo<PassportsContextValue>(() => {
    const primary = passports.find((passport) => passport.is_primary) ?? null;

    return {
      passports,
      isLoading,
      hasLoadError,
      hasPassport: passports.length > 0,
      primary,
      usedCountryCodes: passports.map((passport) => passport.country_code),

      async addPassport(countryCode) {
        if (!userId) {
          throw new PassportRuleError('Faça login para adicionar um passaporte.');
        }

        const created = await passportsService.create({
          userId,
          countryCode,
          // O primeiro passaporte do usuário já entra como principal.
          isPrimary: passports.length === 0,
        });

        await refresh();
        return created;
      },

      /**
       * Promove um passaporte e recalcula as checklists. O recálculo é melhor
       * esforço: falhando, a troca continua valendo e a próxima edição acerta.
       */
      async setPrimary(passportId) {
        if (!userId) return;

        const promoted = await passportsService.setPrimary(userId, passportId);
        await refresh();

        try {
          await rebuildChecklistsForPassport(userId, promoted.country_code);
        } catch {
          // Sem ação: a próxima edição de cada viagem refaz a checklist.
        }
      },

      /** O principal nunca é removido: é preciso promover outro antes. */
      async removePassport(passportId) {
        const target = passports.find((passport) => passport.id === passportId);

        if (target?.is_primary) {
          throw new PassportRuleError(
            passports.length === 1
              ? 'Este é o seu único passaporte. Adicione outro e defina-o como principal para poder remover este.'
              : 'Este é o seu passaporte principal. Defina outro como principal antes de removê-lo.',
          );
        }

        await passportsService.remove(passportId);
        await refresh();
      },

      refresh,
    };
  }, [passports, isLoading, hasLoadError, userId, refresh]);

  return <PassportsContext.Provider value={value}>{children}</PassportsContext.Provider>;
}

export function usePassports() {
  const context = useContext(PassportsContext);
  if (!context) {
    throw new Error('usePassports precisa estar dentro de <PassportsProvider>.');
  }
  return context;
}
