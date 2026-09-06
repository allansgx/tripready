import { useCallback, useEffect, useMemo, useState } from 'react';

import type { DateRange } from '@/components/ui/date-range-picker';
import type { SelectedCity } from '@/features/trips/city-step';
import { suggestTripName } from '@/features/trips/trip-format';

export type TripDraft = {
  name: string;
  countryCodes: string[];
  cities: SelectedCity[];
  range: DateRange;
};

const EMPTY: TripDraft = {
  name: '',
  countryCodes: [],
  cities: [],
  range: { start: null, end: null },
};

function sameCity(a: SelectedCity, b: SelectedCity) {
  return a.countryCode === b.countryCode && a.cityName === b.cityName;
}

/** Comparação estável para detectar alterações não salvas. */
function normalize(draft: TripDraft) {
  return JSON.stringify({
    name: draft.name.trim(),
    countryCodes: [...draft.countryCodes].sort(),
    cities: [...draft.cities]
      .map((city) => `${city.countryCode}:${city.cityName}`)
      .sort(),
    range: draft.range,
  });
}

/**
 * Estado de seleção de uma viagem, compartilhado por "Criar viagem" e
 * "Editar viagem".
 *
 * Concentra as regras que as duas telas precisam: remover um país leva junto
 * as cidades dele, e o nome acompanha os destinos até o usuário escrever o
 * seu. A tela de edição começa com `initial` preenchido; a de criação começa
 * vazia.
 */
export function useTripDraft(initial?: TripDraft) {
  const [name, setName] = useState(initial?.name ?? EMPTY.name);
  const [nameEdited, setNameEdited] = useState(Boolean(initial?.name));
  const [countryCodes, setCountryCodes] = useState<string[]>(
    initial?.countryCodes ?? EMPTY.countryCodes,
  );
  const [cities, setCities] = useState<SelectedCity[]>(initial?.cities ?? EMPTY.cities);
  const [range, setRange] = useState<DateRange>(initial?.range ?? EMPTY.range);

  /** Snapshot para comparar o que mudou; trocado a cada hidratação/salvamento. */
  const [baseline, setBaseline] = useState(() => normalize(initial ?? EMPTY));

  // Enquanto o usuário não escrever um nome, ele acompanha os destinos.
  useEffect(() => {
    if (!nameEdited) {
      setName(suggestTripName(countryCodes));
    }
  }, [countryCodes, nameEdited]);

  const toggleCountry = useCallback((code: string) => {
    setCountryCodes((current) => {
      if (!current.includes(code)) return [...current, code];
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
    setName(value);
  }, []);

  /** Preenche o rascunho com os dados carregados e zera o "alterado". */
  const hydrate = useCallback((draft: TripDraft) => {
    setName(draft.name);
    setNameEdited(Boolean(draft.name));
    setCountryCodes(draft.countryCodes);
    setCities(draft.cities);
    setRange(draft.range);
    setBaseline(normalize(draft));
  }, []);

  const draft = useMemo<TripDraft>(
    () => ({ name, countryCodes, cities, range }),
    [name, countryCodes, cities, range],
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
    hydrate,
    /** Nome final: o digitado ou, se vazio, a sugestão pelos destinos. */
    resolvedName: name.trim() || suggestTripName(countryCodes),
  };
}
