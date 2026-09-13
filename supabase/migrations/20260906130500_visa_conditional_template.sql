-- =============================================================================
-- TripReady — texto do resultado `conditional`
--
-- Este template ficou de fora da carga anterior porque um item "confirmar as
-- condições" só ajuda se a observação da regra estiver bem escrita, e isso
-- dependia da coleta de dados.
--
-- A coleta aconteceu e produziu um caso claro: o Canadá. A autorização
-- eletrônica só vale para quem já teve visto canadense nos últimos dez anos ou
-- tem visto americano válido, e apenas para quem chega de avião; fora disso é
-- preciso visto de visitante. Não é `visa_required` nem `eta` — depende do
-- histórico de quem viaja.
--
-- Sem este template a regra entraria no banco e ficaria muda: nenhum item
-- apareceria para o destino, e a checklist esconderia justamente o caso que
-- mais precisa de atenção.
-- =============================================================================

insert into public.requirement_templates (
  code, title, description, priority, category, scope, visa_requirement_type
)
values
  (
    'visa-conditional',
    'Confirmar as condições de entrada — {country}',
    'As exigências mudam conforme o seu caso. Confira na fonte oficial antes de comprar a passagem.',
    'required', 'documents', 'visa', 'conditional'
  );
