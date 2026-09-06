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
 * Fonte única dos passaportes do usuário logado.
 *
 * Concentra as regras que o banco sozinho não expressa: o primeiro passaporte
 * nasce principal, existe no máximo um principal (garantido também pelo índice
 * único parcial em `passports`) e o principal não pode ser removido enquanto
 * houver outros passaportes.
 */
export function PassportsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  /**
   * A leitura guarda de qual usuário ela é.
   *
   * Com o dono junto, "sem usuário", "carregando" e "os passaportes de outra
   * conta" saem todos de uma comparação na renderização — não é preciso um
   * efeito zerando estado no logout, que faria uma renderização a mais
   * mostrando a lista da sessão anterior.
   */
  const [loaded, setLoaded] = useState<{ userId: string; rows: Passport[] } | null>(null);

  const isCurrent = loaded !== null && loaded.userId === userId;
  const passports = isCurrent ? loaded.rows : NO_PASSPORTS;
  const isLoading = userId !== null && !isCurrent;

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoaded({ userId, rows: await passportsService.listByUser(userId) });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let active = true;

    passportsService
      .listByUser(userId)
      .then((rows) => {
        if (active) setLoaded({ userId, rows });
      })
      // Sem passaportes é um estado válido: o onboarding assume daqui.
      .catch(() => {
        if (active) setLoaded({ userId, rows: [] });
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

      async setPrimary(passportId) {
        if (!userId) return;
        await passportsService.setPrimary(userId, passportId);
        await refresh();
      },

      /**
       * O passaporte principal nunca é removido: se for o único, é preciso
       * adicionar outro e promovê-lo; se houver outros, é preciso promover um
       * deles antes. Assim o usuário nunca fica sem passaporte principal nem
       * sem passaporte nenhum.
       */
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
  }, [passports, isLoading, userId, refresh]);

  return <PassportsContext.Provider value={value}>{children}</PassportsContext.Provider>;
}

export function usePassports() {
  const context = useContext(PassportsContext);
  if (!context) {
    throw new Error('usePassports precisa estar dentro de <PassportsProvider>.');
  }
  return context;
}
