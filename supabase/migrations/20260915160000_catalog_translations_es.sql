-- =============================================================================
-- TripReady — catálogo em espanhol
--
-- Mesmo critério de `20260915150000_catalog_translations_en.sql`: conteúdo
-- estático revisável (§17 do plano de i18n), com a mesma estrutura de tópicos
-- por descrição — a primeira linha diz o que fazer, as seguintes são
-- verificação, espelhando `20260913120000_requirement_description_topics.sql`.
--
-- `source_name` de `visa_rule_translations` fica de fora aqui de propósito —
-- entra na Fase 5 (§8.4).
-- =============================================================================

insert into public.requirement_template_translations (requirement_template_id, locale, title, description)
select t.id, 'es', v.title, v.description
from (
  values
    ('passport-validity', 'Verificar la vigencia del pasaporte', concat_ws(E'\n',
      'Consulta hasta cuándo es válido tu pasaporte y compáralo con la fecha de regreso.',
      'Algunos destinos exigen vigencia más allá de la fecha de salida, y el margen varía según el país.',
      'El margen de cada destino está en las exigencias de entrada de tu viaje.',
      'Revisa también si aún quedan páginas en blanco para los sellos.'
    )),
    ('country-entry-requirements', 'Verificar las exigencias de entrada — {country}', concat_ws(E'\n',
      'Cada país define lo que pide al llegar, además de la visa.',
      'Lo más común son comprobante de alojamiento, pasaje de vuelta, seguro y comprobación de solvencia.',
      'La lista oficial está en la página de inmigración del destino.',
      'Ten preparado lo que se pida, impreso o en el celular, junto con tus documentos.'
    )),
    ('document-copies', 'Guardar copias de los documentos y reservas', concat_ws(E'\n',
      'Fotografía o descarga el pasaporte, la visa, el seguro, los pasajes y las reservas.',
      'Guárdalos en un lugar que abra sin internet: los archivos descargados en el celular, no solo el enlace del correo.',
      'Deja una copia también con alguien de confianza.',
      'Si algún documento se pierde en el camino, la copia es lo que agiliza el duplicado.'
    )),
    ('travel-insurance', 'Contratar un seguro de viaje', concat_ws(E'\n',
      'Compara las pólizas antes de contratar.',
      'Revisa la cobertura médica y el monto máximo por atención.',
      'Verifica si las fechas cubren todo el viaje, de ida y vuelta.',
      'Algunos destinos exigen un seguro con monto mínimo de cobertura al ingresar — revisa las exigencias del país.',
      'Después de contratar, guarda la póliza y el teléfono de emergencia junto con tus copias.'
    )),
    ('emergency-contacts', 'Anotar los contactos de emergencia', concat_ws(E'\n',
      'Anota los contactos en un lugar que abra sin internet.',
      'Teléfono de emergencia de la aseguradora y número de póliza.',
      'Consulado o embajada de tu país en el destino.',
      'Una persona de confianza que pueda ayudarte a distancia.',
      'Conviene dejarlo también en papel, junto con los documentos.'
    )),
    ('payment-methods', 'Organizar los medios de pago', concat_ws(E'\n',
      'Lleva más de una forma de pagar.',
      'Tarjetas de distintos emisores, guardadas en lugares separados.',
      'Algo de efectivo para las primeras horas: transporte desde el aeropuerto y una comida.',
      'En la app del banco, revisa el límite disponible y si la tarjeta está habilitada para uso en el exterior.'
    )),
    ('budget-plan', 'Planificar el presupuesto del viaje', 'Alojamiento, transporte, comida y un extra de reserva.'),
    ('connectivity-plan', 'Resolver la conexión a internet en el destino', concat_ws(E'\n',
      'Decide antes de embarcar cómo vas a mantenerte conectado.',
      'Compara eSIM, chip local y el plan internacional de tu operadora por el precio por día.',
      'Si vas a usar eSIM, confirma que tu celular sea compatible.',
      'Actívalo todavía en casa, con internet — después de embarcar es más difícil.'
    )),
    ('luggage-list', 'Armar la lista de equipaje', concat_ws(E'\n',
      'Arma la lista antes de abrir la maleta.',
      'Cuenta los días y piensa en lo que ya sabes que vas a hacer.',
      'Separa lo que usas todos los días: cargadores, lentes, artículos de higiene.',
      'Marca lo que no puedes comprar en el destino — eso es lo que no puedes olvidar.'
    )),
    ('airline-luggage-rules', 'Verificar las reglas de equipaje de la aerolínea', concat_ws(E'\n',
      'Las reglas son de la aerolínea y de tu tarifa, no del aeropuerto.',
      'En el sitio de la aerolínea, revisa cuántas piezas, qué peso y qué dimensiones incluye tu tarifa.',
      'Verifica si el equipaje de mano está incluido — algunas tarifas no lo incluyen.',
      'Si el viaje tiene tramos con aerolíneas distintas, revisa cada una.',
      'Revisa también los límites de líquidos y lo que no puede ir en el equipaje de mano.'
    )),
    ('schengen-short-stay', 'Verificar el límite de 90 días cada 180 en el Espacio Schengen', concat_ws(E'\n',
      'El límite es para el Espacio Schengen entero, no para cada país.',
      'Los días se suman aunque cambies de destino dentro de la región.',
      'El cálculo mira los 180 días anteriores a cada entrada, así que viajes recientes también cuentan.',
      'Suma los días antes de cerrar las fechas.'
    )),
    ('visa-required', 'Solicitar la visa de entrada — {country}', concat_ws(E'\n',
      'La visa se solicita antes de viajar, en el consulado o en el sistema oficial del destino.',
      'Empieza por aquí: entre la cita, los documentos y la emisión, suele ser el trámite más lento.',
      'Revisa la lista de documentos, la tarifa y el plazo en la página oficial.'
    )),
    ('visa-evisa', 'Solicitar la visa electrónica — {country}', concat_ws(E'\n',
      'El trámite se hace en línea, en el sitio oficial de inmigración del destino.',
      'Desconfía de sitios intermediarios que cobran de más.',
      'Revisa el plazo de procesamiento indicado y solicítala con margen.',
      'Con la visa aprobada, llévala impresa y guardada en el celular.'
    )),
    ('visa-eta', 'Solicitar la autorización electrónica — {country}', concat_ws(E'\n',
      'La autorización se solicita en línea y debe estar aprobada antes de embarcar.',
      'Solicítala en el sitio oficial del destino.',
      'Pídela con algo de margen: suele salir rápido, pero no siempre al instante.',
      'Guarda el comprobante junto con tus copias.'
    )),
    ('visa-on-arrival', 'Preparar la visa a la llegada — {country}', concat_ws(E'\n',
      'La visa se emite al llegar, pero puedes adelantar todo lo que pide.',
      'Ten lista una foto en el formato exigido.',
      'Lleva la tarifa en una forma de pago aceptada.',
      'Ten a mano los comprobantes de alojamiento y de vuelta.',
      'Revisa en la página oficial si se puede tramitar en línea por adelantado — en algunos destinos, sí.'
    )),
    ('visa-free', 'Entrada sin visa — {country}', concat_ws(E'\n',
      'Para turismo, este destino no exige visa con tu pasaporte.',
      'Revisa el tiempo máximo de estadía.',
      'Verifica si la entrada exige algún registro en línea antes de llegar.'
    )),
    ('visa-conditional', 'Confirmar las condiciones de entrada — {country}', concat_ws(E'\n',
      'Las exigencias cambian según tu caso.',
      'El historial de visas, el medio de transporte y el motivo del viaje pueden cambiar la respuesta.',
      'Revisa la fuente oficial antes de comprar el pasaje.',
      'La diferencia entre una condición y otra puede ser una autorización en línea o una visa en el consulado.'
    )),
    ('domestic-photo-id', 'Llevar el documento de identificación', concat_ws(E'\n',
      'Verifica qué documento acepta la aerolínea para embarcar.',
      'Comprueba que esté dentro de su vigencia.',
      'La lista de documentos aceptados está en el sitio de la aerolínea o del organismo de aviación civil de tu país.'
    )),
    ('transit-requirements', 'Verificar las exigencias de la escala', concat_ws(E'\n',
      'Si tu viaje tiene conexión en otro país, revisa qué exige de quien solo cambia de avión.',
      'Algunos países piden visa o autorización incluso en tránsito.',
      'La regla es del país de la escala, no del destino final.',
      'Puede cambiar según el aeropuerto y el tiempo de conexión.'
    )),
    ('ticket-name-match', 'Verificar el nombre en el pasaje', concat_ws(E'\n',
      'Compara el nombre impreso en el pasaje con el del pasaporte, letra por letra.',
      'Revisa todos los apellidos y su orden.',
      'Las correcciones suelen ser posibles, pero se encarecen cerca del viaje.'
    )),
    ('vaccination-requirements', 'Verificar las vacunas — {country}', concat_ws(E'\n',
      'Consulta en la página oficial de salud o de inmigración del destino qué se pide.',
      'Verifica si se exige alguna vacuna para entrar y cuáles son recomendadas.',
      'Revísalo con anticipación: algunas requieren más de una dosis o tiempo para hacer efecto.',
      'El comprobante puede pedirse al llegar.'
    )),
    ('medication-plan', 'Separar los medicamentos de uso continuo', concat_ws(E'\n',
      'Separa los medicamentos que usas a diario antes de armar la maleta.',
      'Lleva la cantidad para todo el viaje, con margen.',
      'Prefiere el equipaje de mano y el envase original.',
      'Lleva también la receta o un informe médico.',
      'Algunos países controlan el ingreso de ciertas sustancias — si usas algún medicamento controlado, revisa las reglas del destino.'
    )),
    ('power-adapter', 'Verificar el enchufe y el voltaje del destino', concat_ws(E'\n',
      'Revisa el tipo de enchufe del destino y lleva el adaptador correcto.',
      'Verifica también el voltaje.',
      'Los cargadores de celular y notebook suelen aceptar ambos, pero la secadora y la afeitadora no siempre.'
    )),
    ('destination-weather', 'Verificar el clima para las fechas del viaje', concat_ws(E'\n',
      'Revisa el pronóstico y el promedio de la época para cada destino antes de elegir la ropa.',
      'En viajes por más de un país, la diferencia puede ser grande dentro de la misma maleta.',
      'Lo mismo vale para viajes que atraviesan más de una estación.'
    ))
) as v(code, title, description)
join public.requirement_templates t on t.code = v.code
on conflict do nothing;

insert into public.destination_group_translations (destination_group_id, locale, name, description)
select g.id, 'es', v.name, v.description
from (
  values
    ('SCHENGEN', 'Espacio Schengen', 'Área de libre circulación con reglas comunes de entrada y de estadía de corta duración.'),
    ('MERCOSUL', 'MERCOSUR', 'Mercado Común del Sur. Estados Parte; los miembros suspendidos quedan con el período de vigencia cerrado.'),
    ('CAN', 'Comunidad Andina', 'Comunidad Andina de Naciones (CAN), creada por el Acuerdo de Cartagena.'),
    ('CA4', 'CA-4', 'Acuerdo de libre movilidad entre Guatemala, El Salvador, Honduras y Nicaragua.'),
    ('ASEAN', 'ASEAN', 'Asociación de Naciones del Sudeste Asiático.'),
    ('EAC', 'Comunidad de África Oriental', 'East African Community (EAC).'),
    ('ECOWAS', 'CEDEAO', 'Comunidad Económica de Estados de África Occidental (ECOWAS/CEDEAO).'),
    ('GCC', 'Consejo de Cooperación del Golfo', 'Gulf Cooperation Council (GCC).'),
    ('PACIFIC_ALLIANCE', 'Alianza del Pacífico', 'Bloque de integración entre Chile, Colombia, México y Perú.'),
    ('CARICOM', 'CARICOM', 'Comunidad del Caribe.')
) as v(code, name, description)
join public.destination_groups g on g.code = v.code
on conflict do nothing;

insert into public.visa_rule_translations (visa_rule_id, locale, notes)
select r.id, 'es', v.notes
from (
  values
    ('AT', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('BE', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('CH', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('CZ', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('DE', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('DK', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('ES', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('FI', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('FR', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('GR', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('HR', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('HU', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('IS', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('IT', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('NL', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('NO', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('PL', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('PT', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('RO', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('SE', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('GB', 'Autorización electrónica (ETA) aprobada antes de embarcar, para visitas de hasta 6 meses.'),
    ('IE', 'Nacionalidad no sujeta a visa de entrada.'),
    ('US', 'Brasil no participa del Visa Waiver Program: se necesita visa de visitante (B-2).'),
    ('CA', 'La autorización electrónica aplica a quienes tuvieron una visa canadiense en los últimos 10 años o tienen una visa estadounidense vigente, y llegan por avión. En los demás casos, se necesita visa de visitante.'),
    ('MX', 'Autorización electrónica (SAE) para llegada por vía aérea con pasaporte electrónico. Por tierra o mar, se necesita visa.'),
    ('AR', 'Entrada sin visa para turismo.'),
    ('CL', 'Entrada sin visa para turismo. Se acepta el documento de identidad en lugar del pasaporte.'),
    ('CO', 'Entrada sin visa para turismo por hasta 90 días, prorrogables según la reglamentación.'),
    ('PE', 'Entrada sin visa para turismo. Se acepta el documento de identidad en lugar del pasaporte.'),
    ('UY', 'Entrada sin visa para turismo. Se acepta el documento de identidad en lugar del pasaporte.'),
    ('JP', 'Exención válida para pasaporte electrónico con estándar ICAO, en estadías de hasta 90 días.'),
    ('CN', 'Entrada sin visa por hasta 30 días, según la política vigente hasta el 31/12/2026.'),
    ('KR', 'Autorización electrónica (K-ETA) aprobada antes de embarcar, para estadías de hasta 90 días.'),
    ('IL', 'Autorización electrónica (ETA-IL) solicitada hasta 72 horas antes de la llegada.'),
    ('IN', 'Visa electrónica solicitada con al menos 4 días de anticipación.'),
    ('ID', 'Visa emitida a la llegada, por hasta 30 días. Se puede pagar en línea antes del viaje (e-VOA).'),
    ('VN', 'Visa electrónica de hasta 90 días, presentada impresa a la llegada.'),
    ('TH', 'Entrada sin visa para turismo por hasta 60 días.'),
    ('SG', 'Entrada sin visa por hasta 30 días. Se debe enviar la SG Arrival Card antes de llegar.'),
    ('AU', 'El eVisitor está restringido a pasaportes europeos: se necesita visa de visitante, solicitada en línea.'),
    ('NZ', 'Autorización electrónica (NZeTA) obtenida antes del viaje.'),
    ('AE', 'Entrada sin visa por hasta 90 días cada 12 meses; el sello se da a la llegada.'),
    ('TR', 'Entrada sin visa para estadías de hasta 90 días cada 180.'),
    ('EG', 'Visa electrónica solicitada antes del viaje.'),
    ('ZA', 'Entrada sin visa por hasta 90 días.')
) as v(destination_country_code, notes)
join public.visa_rules r
  on r.passport_country_code = 'BR' and r.destination_country_code = v.destination_country_code
on conflict do nothing;
