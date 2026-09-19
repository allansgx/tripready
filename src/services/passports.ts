import { supabase } from '@/lib/supabase/client';
import { unwrap, unwrapRequired } from '@/services/errors';
import type { Passport } from '@/types/models';

export const passportsService = {
  async listByUser(userId: string): Promise<Passport[]> {
    return unwrapRequired(
      await supabase
        .from('passports')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true }),
      'Falha ao listar passaportes',
    );
  },

  async create(input: {
    userId: string;
    countryCode: string;
    isPrimary?: boolean;
  }): Promise<Passport> {
    return unwrapRequired(
      await supabase
        .from('passports')
        .insert({
          user_id: input.userId,
          country_code: input.countryCode.toUpperCase(),
          is_primary: input.isPrimary ?? false,
        })
        .select('*')
        .single(),
      'Falha ao criar passaporte',
    );
  },

  /**
   * Marca um passaporte como principal. Limpar o anterior e marcar o novo são
   * duas escritas, e a função no banco as mantém numa transação — sem ela há um
   * instante em que o usuário não tem principal nenhum.
   */
  async setPrimary(passportId: string): Promise<Passport> {
    return unwrapRequired(
      await supabase.rpc('set_primary_passport', { p_passport_id: passportId }),
      'Falha ao definir o passaporte principal',
    );
  },

  /**
   * Remove um passaporte e, se ele era o principal, promove o mais antigo dos
   * restantes na mesma transação. Devolve o país promovido, para a tela avisar,
   * ou `null` quando não houve promoção. Nenhuma viagem é alterada.
   */
  async remove(passportId: string): Promise<string | null> {
    return unwrap(
      await supabase.rpc('delete_passport', { p_passport_id: passportId }),
      'Falha ao remover passaporte',
    );
  },

  /**
   * Viagens que usam este passaporte, com as datas para o status sair de
   * `getTripStatus` — no cliente, pela data local, como no resto do app.
   */
  async listTripsUsingPassport(
    userId: string,
    countryCode: string,
  ): Promise<{ start_date: string | null; end_date: string | null }[]> {
    return unwrapRequired(
      await supabase
        .from('trips')
        .select('start_date, end_date')
        .eq('user_id', userId)
        .eq('passport_country_code', countryCode.toUpperCase()),
      'Falha ao consultar as viagens deste passaporte',
    );
  },

  /** Passaportes cujas regras já cobrem o critério mínimo. Não restringe a escolha: só decide o que a interface informa. */
  async listSupportedCountryCodes(): Promise<string[]> {
    if (!supportedCodes) {
      const rows = unwrapRequired(
        await supabase.from('supported_passport_countries').select('country_code'),
        'Falha ao consultar os passaportes com regras',
      );
      supportedCodes = rows.map((row) => row.country_code);
    }

    return supportedCodes;
  },
};

// O catálogo muda por migration, nunca pelo app: uma leitura por sessão basta.
let supportedCodes: string[] | null = null;
