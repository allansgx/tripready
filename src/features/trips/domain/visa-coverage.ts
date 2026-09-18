/** O mínimo que a cobertura precisa saber de um item já gravado. */
export type CoverageRequirement = {
  country_code: string | null;
  visa_rule_id: string | null;
};

/**
 * Destinos da viagem que não têm regra de visto conferida.
 *
 * Devolve códigos, nunca texto: quem decide como dizer é a apresentação.
 *
 * O país do passaporte principal fica de fora — ninguém passa por imigração ao
 * voltar para casa —, e por isso uma viagem doméstica não produz nenhum destino
 * aqui. Sem passaporte principal a lista volta vazia: sem saber de onde a pessoa
 * viaja, não há como afirmar que falta regra.
 */
export function destinationsWithoutVerifiedRule(
  countryCodes: readonly string[],
  requirements: readonly CoverageRequirement[],
  passportCountryCode: string | null,
): string[] {
  if (!passportCountryCode) return [];

  const passport = passportCountryCode.toUpperCase();
  const covered = new Set(
    requirements.flatMap((requirement) =>
      requirement.visa_rule_id && requirement.country_code
        ? [requirement.country_code.toUpperCase()]
        : [],
    ),
  );

  const seen = new Set<string>();

  return countryCodes
    .map((code) => code.toUpperCase())
    .filter((code) => {
      if (code === passport || covered.has(code) || seen.has(code)) return false;
      seen.add(code);
      return true;
    });
}
