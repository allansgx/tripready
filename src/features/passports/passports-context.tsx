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
import { t } from '@/i18n';
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
  /**
   * As regras de entrada deste país ainda não cobrem o critério mínimo. Nunca
   * restringe a escolha: decide só o que a interface informa.
   *
   * Responde `false` enquanto a lista carrega e também quando a consulta falha.
   * É deliberado — anunciar "ainda não temos regras" por causa de uma oscilação
   * de rede seria pior do que não dizer nada.
   */
  hasPendingRules: (countryCode: string) => boolean;
  /** `false` também quando não há passaporte principal. */
  primaryHasPendingRules: boolean;
  addPassport: (countryCode: string) => Promise<Passport>;
  setPrimary: (passportId: string) => Promise<void>;
  /** Devolve o país promovido a principal, quando a remoção provocou uma. */
  removePassport: (passportId: string) => Promise<string | null>;
  refresh: () => Promise<void>;
};

const PassportsContext = createContext<PassportsContextValue | null>(null);

/** Referência estável para o caso "sem usuário", que não deve refazer memos. */
const NO_PASSPORTS: Passport[] = [];

/**
 * Fonte única dos passaportes: o primeiro nasce principal, existe no máximo um
 * principal, e o último não pode ser removido.
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

  const [supported, setSupported] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setState({ userId, rows: await passportsService.listByUser(userId) });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let active = true;

    passportsService
      .listSupportedCountryCodes()
      .then((codes) => {
        if (active) setSupported(codes);
      })
      .catch(() => {
        // Sem aviso é melhor que aviso errado: a lista segue vazia.
      });

    return () => {
      active = false;
    };
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
    const supportedSet = new Set(supported);
    const hasPendingRules = (countryCode: string) =>
      supportedSet.size > 0 && !supportedSet.has(countryCode.toUpperCase());

    return {
      passports,
      isLoading,
      hasLoadError,
      hasPassport: passports.length > 0,
      primary,
      usedCountryCodes: passports.map((passport) => passport.country_code),
      hasPendingRules,
      primaryHasPendingRules: primary ? hasPendingRules(primary.country_code) : false,

      async addPassport(countryCode) {
        if (!userId) {
          throw new PassportRuleError(t('passports.error.loginRequired'));
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
       * Promove um passaporte. Nenhuma viagem é tocada: o principal é só o
       * valor pré-selecionado ao criar a próxima, e cada viagem guarda o
       * passaporte com que foi montada.
       */
      async setPrimary(passportId) {
        await passportsService.setPrimary(passportId);
        await refresh();
      },

      /**
       * O principal pode sair: com o passaporte escolhido por viagem, ele é só
       * o valor pré-selecionado ao criar a próxima, e a função no banco promove
       * outro na mesma transação. O que não sai é o último — o app precisa de
       * um passaporte no perfil.
       */
      async removePassport(passportId) {
        if (passports.length === 1) {
          throw new PassportRuleError(t('passports.error.onlyOne'));
        }

        const promoted = await passportsService.remove(passportId);
        await refresh();
        return promoted;
      },

      refresh,
    };
  }, [passports, isLoading, hasLoadError, userId, refresh, supported]);

  return <PassportsContext.Provider value={value}>{children}</PassportsContext.Provider>;
}

export function usePassports() {
  const context = useContext(PassportsContext);
  if (!context) {
    throw new Error('usePassports precisa estar dentro de <PassportsProvider>.');
  }
  return context;
}
