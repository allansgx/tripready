/**
 * Tradução para espanhol. Rascunho gerado a partir do texto canônico pt-BR
 * (`./pt-BR.ts`), sem valor jurídico até revisão humana — §15.2 do plano de
 * i18n. `sourceVersion` registra contra qual `version` do pt-BR esta tradução
 * foi feita; `legal-version.test.ts` falha quando divergem.
 */
// Caminho relativo, e não o alias `@/`: este módulo é carregado tanto pelo
// Metro (app) quanto pelo Node puro (`npm run site`), que não conhece alias.
import { LEGAL_IDENTITY } from './identity.ts';
import type { TranslatedLegalDocument } from './types.ts';

export const privacyPolicy: TranslatedLegalDocument = {
  title: 'Política de Privacidad',
  version: '1.0',
  sourceVersion: '1.0',
  effectiveDate: LEGAL_IDENTITY.effectiveDate,
  blocks: [
    {
      kind: 'paragraph',
      text: 'TripReady te ayuda a organizar lo que necesitas preparar antes de viajar. Para armar una checklist que tenga sentido para tu viaje, la aplicación necesita saber muy poco sobre ti — y esta política explica exactamente qué, por qué y qué puedes hacer al respecto.',
    },

    { kind: 'heading', text: '1. Quién es responsable de tus datos' },
    {
      kind: 'paragraph',
      text: `TripReady es ofrecido por **${LEGAL_IDENTITY.companyName}**, inscrita en el CNPJ bajo el número ${LEGAL_IDENTITY.cnpj}, que actúa como responsable del tratamiento de los datos personales procesados en la aplicación.`,
    },
    {
      kind: 'paragraph',
      text: `Para cualquier asunto relacionado con la privacidad, incluido el ejercicio de tus derechos, el canal es **${LEGAL_IDENTITY.contactEmail}**.`,
    },

    { kind: 'heading', text: '2. Qué datos trata TripReady' },
    { kind: 'subheading', text: 'Datos de tu cuenta' },
    {
      kind: 'list',
      items: [
        '**Nombre de usuario**, usado para personalizar la aplicación.',
        '**Dirección de correo electrónico**, que identifica tu cuenta.',
        '**Foto de perfil**, cuando ingresas con Google y él la proporciona. Si ingresas con Apple, no hay foto y la aplicación muestra un avatar predeterminado.',
        '**Contraseña**, solo si creas la cuenta con correo y contraseña. Se guarda cifrada por el servicio de autenticación y no es legible por nosotros.',
        'Un **identificador interno** que vincula tu información con tu cuenta.',
      ],
    },
    { kind: 'subheading', text: 'Datos que registras para armar la checklist' },
    {
      kind: 'list',
      items: [
        '**El país del pasaporte** que usas para viajar, y cuál de ellos es el principal cuando registras más de uno.',
        '**Tus viajes**: el nombre que le das a cada uno, las fechas, los países y las ciudades elegidas.',
        '**Tu checklist**: los ítems generados para el viaje, los ítems que tú mismo creas y cuáles marcaste como verificados.',
      ],
    },
    { kind: 'subheading', text: 'Uso de las recomendaciones de socios' },
    {
      kind: 'paragraph',
      text: 'TripReady registra algunos eventos relacionados con el uso de funciones de la aplicación, como clics en enlaces de socios, exclusivamente para medir el uso de esas recomendaciones y hacer seguimiento del rendimiento de los enlaces de afiliados.',
    },
    {
      kind: 'paragraph',
      text: 'Lo que se registra es el socio indicado, la recomendación en la que tocaste, el viaje a partir del cual ocurrió y el momento del toque. Nada de lo que llenaste en la checklist acompaña ese registro, y el socio no recibe ninguna información tuya.',
    },
    { kind: 'subheading', text: 'Datos guardados en tu dispositivo' },
    {
      kind: 'paragraph',
      text: 'Para que no tengas que iniciar sesión cada vez que abres la aplicación, TripReady mantiene las credenciales de tu sesión en el propio dispositivo. No se envían a nadie y desaparecen cuando cierras sesión.',
    },
    { kind: 'subheading', text: 'Lo que TripReady no recopila' },
    {
      kind: 'paragraph',
      text: 'Vale la pena decirlo con todas las letras, porque es una decisión de producto y no un olvido. La aplicación **no recopila**:',
    },
    {
      kind: 'list',
      items: [
        'número de pasaporte;',
        'vigencia del pasaporte;',
        'foto o copia del pasaporte;',
        'datos biométricos;',
        'información de salud;',
        'religión;',
        'opinión política;',
        'orientación sexual;',
        'cualquier otro dato personal sensible;',
        'tu ubicación;',
        'identificadores publicitarios.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'TripReady **no rastrea tu comportamiento fuera de la aplicación, no usa tus datos para publicidad basada en comportamiento y no crea perfiles publicitarios.** Dentro de la aplicación, el único registro de uso es el descrito arriba, sobre las recomendaciones de socios. Si esto cambia algún día, esta política será actualizada **antes** de que el cambio entre en vigor.',
    },
    {
      kind: 'paragraph',
      text: 'Sobre el país del pasaporte: indica qué documento usas para viajar y es lo que permite saber qué reglas de entrada se aplican a ti. Se trata como dato personal común.',
    },

    { kind: 'heading', text: '3. Cómo TripReady obtiene estos datos' },
    {
      kind: 'list',
      items: [
        '**Cuando ingresas con Google o Apple.** La autenticación ocurre en el navegador de tu dispositivo o en la propia pantalla del sistema, y TripReady nunca tiene acceso a tu contraseña de esos servicios. Solo recibimos el nombre, el correo electrónico y, en el caso de Google, la foto. Si eliges ocultar tu correo al ingresar con Apple, recibimos la dirección de reenvío que Apple crea para ti.',
        '**Cuando creas una cuenta con correo y contraseña.** En ese caso enviamos un mensaje a la dirección indicada, con un enlace de confirmación, para asegurarnos de que el correo es realmente tuyo. La cuenta se activa cuando confirmas.',
        '**Cuando usas la aplicación.** Tú eliges el país del pasaporte, creas los viajes y marcas los ítems de la checklist.',
        '**Cuando la aplicación arma tu checklist.** Los ítems se generan a partir del pasaporte principal, los destinos y el período del viaje.',
      ],
    },

    { kind: 'heading', text: '4. Para qué se usan los datos' },
    {
      kind: 'list',
      items: [
        '**Correo y contraseña** — identificar tu cuenta, permitir el ingreso y recuperar el acceso.',
        '**Nombre y foto** — personalizar la aplicación para ti.',
        '**País del pasaporte** — determinar qué reglas de entrada se aplican a ti en cada destino.',
        '**Viajes, fechas y destinos** — armar la checklist correcta y mostrar en qué etapa está cada viaje.',
        '**Ítems de la checklist** — guardar lo que ya fue verificado y calcular el progreso del viaje.',
        '**Sesión en el dispositivo** — mantenerte conectado entre una apertura y otra.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Estos tratamientos son necesarios para prestar el servicio que solicitaste al crear la cuenta. **TripReady no usa tus datos para publicidad, para crear perfiles de comportamiento ni para ningún fin distinto a los descritos aquí.**',
    },

    { kind: 'heading', text: '5. Por cuánto tiempo se guardan los datos' },
    {
      kind: 'paragraph',
      text: 'Mientras tu cuenta exista, tus viajes y tu checklist siguen disponibles para ti — incluidos los viajes ya finalizados, que permanecen en el historial hasta que los borres.',
    },
    {
      kind: 'paragraph',
      text: 'Cuando eliminas la cuenta, los datos se **borran de forma permanente en el momento de la eliminación**. No hay copia de seguridad desde la cual puedan recuperarse después.',
    },
    {
      kind: 'paragraph',
      text: 'La única excepción es el conteo de clics en recomendaciones de socios: el registro deja de estar vinculado a ti y a tu viaje, y permanece solo como un número sumado al total de ese socio. A partir de ahí no identifica a nadie.',
    },
    {
      kind: 'paragraph',
      text: 'Si creas una cuenta y nunca confirmas el correo, el registro permanece guardado, sin datos de viaje, hasta que lo completes o solicites su eliminación por el canal de contacto.',
    },
    {
      kind: 'paragraph',
      text: 'Los registros técnicos de operación y seguridad mantenidos por la infraestructura que aloja el servicio siguen las políticas del proveedor descrito en la sección 7.',
    },

    { kind: 'heading', text: '6. Dónde se almacenan los datos' },
    {
      kind: 'paragraph',
      text: 'La información de tu cuenta y de tus viajes se guarda en servidores operados por **Supabase**, ubicados en **Estados Unidos**. Esto significa que hay una transferencia internacional de tus datos personales.',
    },
    {
      kind: 'paragraph',
      text: 'La empresa responsable de TripReady sigue siendo la responsable del tratamiento de esta información y responde por ella, sin importar dónde esté almacenada.',
    },

    { kind: 'heading', text: '7. Con quién se comparten los datos' },
    {
      kind: 'paragraph',
      text: '**TripReady no vende tus datos personales ni los comparte con socios comerciales.**',
    },
    {
      kind: 'paragraph',
      text: 'Solo existen los siguientes involucrados, cada uno con una función específica:',
    },
    {
      kind: 'list',
      items: [
        '**Supabase** — almacena la información y gestiona la autenticación, actuando como encargado del tratamiento en nombre de TripReady. También es el servicio que envía los mensajes de confirmación de registro y de restablecimiento de contraseña.',
        '**Google** y **Apple** — solo cuando eliges ingresar por ellos. En ese caso, el proveedor sabe que te autenticaste en TripReady porque fuiste tú quien lo autorizó. Cuando la aplicación muestra tu foto de Google, se carga directamente desde los servidores de Google.',
        '**App Store y Google Play** — distribuyen la aplicación, según las políticas de cada tienda.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'También podremos compartir información cuando exista obligación legal u orden de autoridad competente, en el límite de lo exigido.',
    },

    { kind: 'heading', text: '8. Enlaces a otros sitios' },
    {
      kind: 'paragraph',
      text: 'Algunos ítems de la checklist incluyen enlaces, y son de dos tipos:',
    },
    {
      kind: 'list',
      items: [
        '**Fuentes oficiales** — la página del organismo de inmigración o de la cancillería que determina la exigencia.',
        '**Sugerencias de dónde resolver el ítem** — por ejemplo, empresas de seguro de viaje o de eSIM.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Parte de esas sugerencias son **enlaces de afiliado**, lo que significa que TripReady puede recibir una comisión si contratas por ahí, **sin ningún costo adicional para ti**. Esa comisión no influye en lo que la checklist dice que necesitas verificar: la exigencia viene de la fuente oficial, y la sugerencia es solo dónde resolverla.',
    },
    {
      kind: 'paragraph',
      text: 'En todos los casos, el enlace abre en el navegador de tu dispositivo y **TripReady no envía ningún dato tuyo a esos sitios**. Lo que ellos ven es lo que cualquier visita a una página revela, como tu dirección IP. Desde el momento en que sales de la aplicación, aplican las políticas de privacidad de cada sitio.',
    },
    {
      kind: 'paragraph',
      text: 'El conteo de cuántas personas tocaron cada sugerencia lo hace el propio TripReady, para saber qué recomendaciones son útiles. Queda con nosotros y no se envía al socio.',
    },
    {
      kind: 'paragraph',
      text: 'Si algún día empezamos a enviar alguna información tuya a un socio — por ejemplo, para una cotización hecha dentro de la aplicación —, esta política será actualizada antes.',
    },

    { kind: 'heading', text: '9. Seguridad' },
    {
      kind: 'paragraph',
      text: 'TripReady trata la protección de tus datos como parte del producto, no como un detalle de implementación:',
    },
    {
      kind: 'list',
      items: [
        'cada persona solo accede a su propia información, y esa regla se aplica en la base de datos, no solo en las pantallas;',
        'la aplicación no lleva ninguna clave capaz de acceder a datos de terceros;',
        'la autenticación usa los flujos seguros ofrecidos por Google, Apple y el servicio de autenticación, y tu contraseña nunca llega a la aplicación;',
        'la eliminación de cuenta solo puede afectar la cuenta de quien la solicitó.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Ningún servicio puede prometer seguridad absoluta, pero mantenemos las medidas adecuadas al tipo de información tratada y las revisamos a medida que el producto evoluciona.',
    },

    { kind: 'heading', text: '10. Cómo eliminar tu cuenta y tus datos' },
    { kind: 'paragraph', text: 'Puedes borrar todo sin tener que hablar con nadie:' },
    {
      kind: 'paragraph',
      text: '**Perfil → Eliminar cuenta.** La aplicación te pide escribir una palabra de confirmación y, al terminar, elimina de forma permanente tu perfil, tus pasaportes, tus viajes, los destinos y las checklists. La acción es **irreversible** y no deja copia.',
    },
    {
      kind: 'paragraph',
      text: 'También puedes eliminar solo un viaje, desde su propia pantalla. En ese caso, los destinos y la checklist de ese viaje se eliminan junto con él, y el resto de tu cuenta sigue como está.',
    },

    { kind: 'heading', text: '11. Tus derechos' },
    {
      kind: 'paragraph',
      text: 'La Ley General de Protección de Datos de Brasil (LGPD) te garantiza, entre otros, el derecho a:',
    },
    {
      kind: 'list',
      items: [
        'confirmar si tratamos datos tuyos y acceder a ellos;',
        'corregir datos incompletos, inexactos o desactualizados;',
        'solicitar la anonimización, el bloqueo o la eliminación de datos innecesarios o tratados en incumplimiento de la ley;',
        'solicitar la portabilidad de tus datos;',
        'ser informado sobre con quién compartimos tus datos;',
        'revocar el consentimiento, cuando el tratamiento se base en él.',
      ],
    },
    {
      kind: 'paragraph',
      text: `**La eliminación de tu cuenta la haces tú mismo, directo en la aplicación**, como se describe en la sección 10. Para las demás solicitudes, escribe a **${LEGAL_IDENTITY.contactEmail}**: confirmamos la recepción, verificamos que la solicitud proviene del titular de la cuenta y respondemos en el plazo previsto por la legislación.`,
    },

    { kind: 'heading', text: '12. Uso por menores de edad' },
    {
      kind: 'paragraph',
      text: 'TripReady está destinado a personas de **16 años o más** y no está dirigido a niños. No recopilamos intencionalmente datos de quienes tengan menos de esa edad. Si identificamos un registro en esas condiciones, o si un responsable nos avisa por el canal de contacto, la cuenta y los datos asociados serán eliminados.',
    },

    { kind: 'heading', text: '13. Cambios en esta política' },
    {
      kind: 'paragraph',
      text: `TripReady sigue evolucionando, y esta política acompaña esa evolución. Cuando haya un cambio, la fecha en la parte superior del documento se actualiza y la versión vigente queda siempre disponible en ${LEGAL_IDENTITY.website} y aquí mismo, en **Perfil → Legal → Política de Privacidad**.`,
    },
    {
      kind: 'paragraph',
      text: 'Los cambios relevantes en la forma en que tratamos tus datos serán comunicados antes de que entren en vigor.',
    },

    { kind: 'heading', text: '14. Habla con nosotros' },
    {
      kind: 'paragraph',
      text: `Dudas, solicitudes relacionadas con tus derechos o cualquier asunto sobre privacidad: **${LEGAL_IDENTITY.contactEmail}**.`,
    },
    {
      kind: 'paragraph',
      text: 'También puedes presentar una reclamación ante la Autoridad Nacional de Protección de Datos de Brasil (ANPD).',
    },
  ],
};

export const termsOfUse: TranslatedLegalDocument = {
  title: 'Términos de Uso',
  version: '1.0',
  sourceVersion: '1.0',
  effectiveDate: LEGAL_IDENTITY.effectiveDate,
  blocks: [
    {
      kind: 'paragraph',
      text: 'Estos términos explican qué hace TripReady, qué no hace y qué se espera de cada parte. Al crear una cuenta y usar la aplicación, aceptas lo que está aquí.',
    },

    { kind: 'heading', text: '1. Qué es TripReady' },
    {
      kind: 'paragraph',
      text: 'TripReady es una aplicación de organización de viajes. Reúne, en una checklist, lo que necesitas verificar antes de viajar, considerando el pasaporte que registraste, los destinos elegidos y el período del viaje — y muestra, siempre que exista, el enlace a la fuente oficial de cada exigencia.',
    },
    {
      kind: 'paragraph',
      text: '**Lo que TripReady no es**, y es importante que quede claro:',
    },
    {
      kind: 'list',
      items: [
        'no es una autoridad gubernamental, consulado ni organismo de inmigración;',
        'no es una aerolínea, agencia de viajes o agencia de trámites;',
        'no presta asesoría jurídica;',
        'no emite, solicita ni intermedia visas o documentos;',
        '**no garantiza tu entrada a ningún país.**',
      ],
    },
    {
      kind: 'paragraph',
      text: 'La información de la aplicación es una **orientación para ayudarte a prepararte**. La palabra final siempre es de la fuente oficial y de la autoridad del país de destino.',
    },

    { kind: 'heading', text: '2. Cómo funciona la checklist' },
    {
      kind: 'paragraph',
      text: 'Los ítems de tu checklist se arman a partir de un catálogo de reglas, cruzando el pasaporte principal que registraste, los países del viaje, el período y, en algunos casos, si el destino pertenece a un grupo de países con reglas comunes.',
    },
    { kind: 'paragraph', text: 'Cada ítem tiene una prioridad:' },
    {
      kind: 'list',
      items: [
        '**Obligatorio** — cuenta para decir si el viaje está listo;',
        '**Recomendado** — contribuye a tu progreso;',
        '**Informativo** — aparece para que lo sepas, sin afectar el progreso.',
      ],
    },
    { kind: 'paragraph', text: 'Dos puntos que vale la pena entender:' },
    {
      kind: 'list',
      items: [
        '**La checklist es una foto del momento en que fue creada.** Si una regla cambia después, los ítems ya generados para tu viaje no se reescriben solos.',
        '**Puedes crear tus propios ítems**, que no vienen del catálogo y son responsabilidad exclusivamente tuya.',
      ],
    },

    { kind: 'heading', text: '3. Tu responsabilidad' },
    { kind: 'paragraph', text: 'Al usar TripReady, te comprometes a:' },
    {
      kind: 'list',
      items: [
        '**verificar los requisitos oficiales aplicables a tu viaje** antes de viajar, usando los canales oficiales de cada país;',
        'mantener correctos los datos que alimentan la checklist, especialmente **el pasaporte principal** — es el que determina qué reglas de entrada se aplican;',
        'considerar que existen situaciones personales que la aplicación no conoce y que pueden cambiar por completo lo que se te exige: doble nacionalidad, país de residencia, visas o rechazos anteriores, motivo y duración del viaje, entre otras.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Marcar todos los ítems como verificados significa que **tú** los verificaste. No es una aprobación de TripReady ni una garantía de que no se exigirá nada más.',
    },

    { kind: 'heading', text: '4. Actualidad de la información' },
    {
      kind: 'paragraph',
      text: 'Las reglas de entrada del catálogo se registran a partir de fuentes oficiales y conservan la fecha en que fueron verificadas. Aun así, **las reglas de inmigración cambian sin aviso previo**, y puede haber un intervalo entre un cambio y la actualización de la aplicación.',
    },
    {
      kind: 'paragraph',
      text: 'TripReady no promete que todo el contenido esté actualizado en tiempo real, y por eso insiste, en cada ítem, en que confirmes en los canales oficiales.',
    },

    { kind: 'heading', text: '5. Requisitos de viaje e inmigración' },
    {
      kind: 'paragraph',
      text: 'La decisión sobre tu entrada a un país siempre corresponde a la autoridad de inmigración de ese país. Completar toda la checklist **no crea un derecho de entrada** y no impide que se exijan documentos adicionales en la frontera.',
    },
    {
      kind: 'paragraph',
      text: 'La cobertura del catálogo también tiene límites: según el pasaporte registrado, la aplicación puede no tener todavía reglas específicas de visa para todos los destinos. Cuando no hay un ítem de visa en tu checklist, eso **no significa** que la visa esté exenta — significa que necesitas verificar directamente en la fuente oficial.',
    },

    { kind: 'heading', text: '6. Fuentes oficiales' },
    {
      kind: 'paragraph',
      text: 'Siempre que una exigencia tenga un organismo responsable, la aplicación muestra el enlace a la página oficial correspondiente.',
    },
    {
      kind: 'paragraph',
      text: '**Si hay alguna divergencia entre lo que TripReady presenta y lo que dice la fuente oficial, prevalece la fuente oficial.**',
    },

    { kind: 'heading', text: '7. Enlaces y servicios de terceros' },
    {
      kind: 'paragraph',
      text: 'La aplicación incluye enlaces a sitios de terceros, que se abren en el navegador de tu dispositivo. Esos servicios no son operados por TripReady.',
    },
    {
      kind: 'paragraph',
      text: 'La contratación, el pago, la cobertura, la atención, la cancelación y cualquier obligación derivada son una relación directa entre tú y la empresa elegida, bajo sus propios términos. TripReady no controla la disponibilidad, el contenido ni el precio de esos sitios.',
    },

    { kind: 'heading', text: '8. Sugerencias comerciales y enlaces de afiliado' },
    {
      kind: 'paragraph',
      text: 'Algunos ítems de la checklist traen sugerencias de dónde resolver esa exigencia, como seguro de viaje o eSIM. Parte de esos enlaces son de afiliado: **TripReady puede recibir una comisión si contratas por ahí, sin costo adicional para ti.** Así es como la aplicación se sostiene, y el aviso aparece en la propia pantalla siempre que haya una indicación de ese tipo.',
    },
    { kind: 'paragraph', text: 'Tres compromisos sobre esto:' },
    {
      kind: 'list',
      items: [
        '**La comisión no influye en lo que la checklist exige de ti.** La exigencia viene de la regla oficial; la sugerencia es solo dónde resolverla. Una cosa no cambia la otra.',
        '**Estar entre las sugerencias no es una recomendación técnica** ni una garantía de que ese servicio cumple con las exigencias de tu destino. Verificarlo sigue siendo parte de tu propia verificación.',
        '**Ningún dato personal tuyo se envía a esos socios.** La aplicación solo abre el enlace.',
      ],
    },

    { kind: 'heading', text: '9. Tu cuenta' },
    {
      kind: 'paragraph',
      text: 'Para usar TripReady necesitas crear una cuenta, y al hacerlo aceptas:',
    },
    {
      kind: 'list',
      items: [
        'tener **16 años o más**;',
        'proporcionar información verdadera;',
        'mantener segura tu cuenta, incluida la cuenta de Google o Apple usada para ingresar y el propio dispositivo;',
        'usar la cuenta para ti — es personal.',
      ],
    },

    { kind: 'heading', text: '10. Limitación de responsabilidad' },
    {
      kind: 'paragraph',
      text: `TripReady se ofrece como una herramienta de apoyo a la organización de viajes, y no como garantía de resultado. En la máxima medida permitida por la legislación aplicable, **${LEGAL_IDENTITY.companyName} no se responsabiliza por**:`,
    },
    {
      kind: 'list',
      items: [
        'viaje impedido, embarque negado o entrada rechazada en cualquier país;',
        'visa negada, retrasada o exigida de forma distinta a la presentada;',
        'perjuicios derivados de información desactualizada, incompleta o incorrecta en el catálogo;',
        'servicios contratados con terceros a través de los enlaces de la aplicación;',
        'indisponibilidad temporal del servicio.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Nada en estos términos elimina los derechos que la legislación de protección al consumidor de Brasil te otorga de forma irrenunciable.',
    },

    { kind: 'heading', text: '11. Eliminación de la cuenta' },
    {
      kind: 'paragraph',
      text: 'Puedes cerrar tu cuenta en cualquier momento, en **Perfil → Eliminar cuenta**. La eliminación es **permanente e irreversible**: el perfil, los pasaportes, los viajes, los destinos y las checklists se eliminan, sin copia de recuperación.',
    },
    {
      kind: 'paragraph',
      text: 'También podemos cerrar o suspender una cuenta que incumpla estos términos, en especial la sección 12, comunicando el motivo por el canal de contacto cuando sea posible.',
    },

    { kind: 'heading', text: '12. Uso aceptable' },
    { kind: 'paragraph', text: 'Al usar TripReady, aceptas no:' },
    {
      kind: 'list',
      items: [
        'extraer automáticamente, copiar o redistribuir el contenido del catálogo de reglas, en todo o en parte;',
        'presentar la información de la aplicación como si fuera información oficial o emitida por una autoridad;',
        'intentar acceder a datos de otras personas o eludir las protecciones del servicio;',
        'hacer ingeniería inversa de la aplicación, salvo en lo que la ley permita;',
        'ingresar contenido ilícito, ofensivo o de terceros en los campos libres, como el nombre de los viajes y los ítems que creas.',
      ],
    },

    { kind: 'heading', text: '13. Propiedad intelectual' },
    {
      kind: 'paragraph',
      text: `La marca TripReady, la interfaz, los textos de los ítems, la organización del catálogo y el software son propiedad de **${LEGAL_IDENTITY.companyName}**. El contenido de las fuentes oficiales pertenece a quien lo publica.`,
    },
    {
      kind: 'paragraph',
      text: 'Lo que creas dentro de la aplicación — el nombre de tus viajes y los ítems que agregas — sigue siendo tuyo. Nosotros solo almacenamos ese contenido para prestar el servicio.',
    },

    { kind: 'heading', text: '14. Privacidad' },
    {
      kind: 'paragraph',
      text: `El tratamiento de tus datos personales está descrito en la **Política de Privacidad**, disponible en ${LEGAL_IDENTITY.website} y aquí en la aplicación, en **Perfil → Legal → Política de Privacidad**, que forma parte de estos términos.`,
    },

    { kind: 'heading', text: '15. Cambios en estos términos' },
    {
      kind: 'paragraph',
      text: `Estos términos pueden actualizarse para acompañar la evolución de la aplicación. Cuando eso ocurra, la fecha en la parte superior se actualiza y la versión vigente queda siempre disponible en ${LEGAL_IDENTITY.website} y dentro de la aplicación. Los cambios relevantes serán comunicados antes de entrar en vigor, y seguir usando TripReady después de eso significa aceptar la nueva versión.`,
    },

    { kind: 'heading', text: '16. Ley aplicable y jurisdicción' },
    {
      kind: 'paragraph',
      text: `Estos términos se rigen por la legislación brasileña. Se elige el foro de la comarca de **${LEGAL_IDENTITY.jurisdiction}** para resolver las controversias derivadas de ellos, sin perjuicio del derecho del consumidor de reclamar en el foro de su domicilio.`,
    },

    { kind: 'heading', text: '17. Habla con nosotros' },
    {
      kind: 'paragraph',
      text: `Dudas, sugerencias o problemas: **${LEGAL_IDENTITY.contactEmail}**.`,
    },
    {
      kind: 'paragraph',
      text: `Servicio ofrecido por **${LEGAL_IDENTITY.companyName}**, CNPJ ${LEGAL_IDENTITY.cnpj}.`,
    },
  ],
};
