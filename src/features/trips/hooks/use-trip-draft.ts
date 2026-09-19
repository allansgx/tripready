import { useCallback, useMemo, useState } from 'react';

import type { DateRange } from '@/components/ui/date-range-picker';
import { normalizeSearch } from '@/constants/countries';
import type { SelectedCity } from '@/features/trips/components/city-step';
import { suggestTripName } from '@/features/trips/domain/trip-format';
import { canAddCountry } from '@/features/trips/domain/trip-limits';

export type TripDraft = {
  name: string;
  countryCodes: string[];
  cities: SelectedCity[];
  range: DateRange;
  /** Passaporte-base da viagem; nulo enquanto a pessoa não escolheu. */
  passportCountryCode: string | null;
};

const EMPTY: TripDraft = {
  name: '',
  countryCodes: [],
  cities: [],
  range: { start: null, end: null },
  passportCountryCode: null,
};

/**
 * Mesma cidade, ignorando acento e caixa: quem digita "sao paulo" com "São
 * Paulo" já na lista está falando da mesma cidade, e o `unique` de
 * `trip_cities` deixaria as duas entrarem.
 */
function sameCity(a: SelectedCity, b: SelectedCity) {
  return (
    a.countryCode === b.countryCode && normalizeSearch(a.cityName) === normalizeSearch(b.cityName)
  );
}

/** Comparação estável para detectar alterações não salvas. */
function normalize(draft: TripDraft) {
  return JSON.stringify({
    name: draft.name.trim(),
    countryCodes: [...draft.countryCodes].sort(),
    cities: [...draft.cities].map((city) => `${city.countryCode}:${city.cityName}`).sort(),
    range: draft.range,
    passportCountryCode: draft.passportCountryCode,
  });
}

/**
 * Estado de seleção compartilhado por "Criar viagem" e "Editar viagem": remover
 * um país leva as cidades dele, e o nome acompanha os destinos até ser escrito.
 */
export function useTripDraft(initial?: TripDraft) {
  const [typedName, setTypedName] = useState(initial?.name ?? EMPTY.name);
  const [nameEdited, setNameEdited] = useState(Boolean(initial?.name));
  const [countryCodes, setCountryCodes] = useState<string[]>(
    initial?.countryCodes ?? EMPTY.countryCodes,
  );
  const [cities, setCities] = useState<SelectedCity[]>(initial?.cities ?? EMPTY.cities);
  const [range, setRange] = useState<DateRange>(initial?.range ?? EMPTY.range);
  const [passportCountryCode, setPassport] = useState<string | null>(
    initial?.passportCountryCode ?? EMPTY.passportCountryCode,
  );

  /** Snapshot para comparar o que mudou; trocado a cada hidratação/salvamento. */
  const [baseline, setBaseline] = useState(() => normalize(initial ?? EMPTY));

  // Derivado, e não guardado em estado por um efeito: o nome já sai correto na
  // mesma renderização em que o país muda.
  const name = nameEdited ? typedName : suggestTripName(countryCodes);

  const toggleCountry = useCallback((code: string) => {
    setCountryCodes((current) => {
      // O teto vale aqui, e não só na tela: as duas telas passam por este
      // estado, e nenhuma delas pode gravar um roteiro maior do que o limite.
      if (!current.includes(code)) {
        return canAddCountry(current, code) ? [...current, code] : current;
      }
      // País removido leva junto as cidades dele.
      setCities((currentCities) => currentCities.filter((city) => city.countryCode !== code));
      return current.filter((item) => item !== code);
    });
  }, []);

  const toggleCity = useCallback((city: SelectedCity) => {
    setCities((current) =>
      current.some((item) => sameCity(item, city))
        ? current.filter((item) => !sameCity(item, city))
        : [...current, city],
    );
  }, []);

  const addCity = useCallback((city: SelectedCity) => {
    setCities((current) =>
      current.some((item) => sameCity(item, city)) ? current : [...current, city],
    );
  }, []);

  const changeName = useCallback((value: string) => {
    setNameEdited(true);
    setTypedName(value);
  }, []);

  /** Preenche o rascunho com os dados carregados e zera o "alterado". */
  const hydrate = useCallback((draft: TripDraft) => {
    setTypedName(draft.name);
    setNameEdited(Boolean(draft.name));
    setCountryCodes(draft.countryCodes);
    setCities(draft.cities);
    setRange(draft.range);
    setPassport(draft.passportCountryCode);
    setBaseline(normalize(draft));
  }, []);

  const draft = useMemo<TripDraft>(
    () => ({ name, countryCodes, cities, range, passportCountryCode }),
    [name, countryCodes, cities, range, passportCountryCode],
  );

  const isDirty = normalize(draft) !== baseline;

  return {
    draft,
    isDirty,
    toggleCountry,
    toggleCity,
    addCity,
    changeName,
    setRange,
    setPassport,
    hydrate,
    /** Nome final: o digitado ou, se vazio, a sugestão pelos destinos. */
    resolvedName: name.trim() || suggestTripName(countryCodes),
  };
}
