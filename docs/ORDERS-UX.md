# Órdenes: primera entrega de UX/UI

Base: d66bc5e del PR #8. La entrega conserva el resolvedor multitaller, Server Actions, control de revisión concurrente y consultas existentes.

## Recepción

El formulario usa cinco etapas: cliente y equipo, recepción, pruebas, presupuesto y autorización. Los campos permanecen montados al cambiar de etapa y se envían en una sola operación transaccional. No se guardan borradores en el navegador. Se validan los campos antes de avanzar y al enviar; si falta un campo requerido se abre la etapa correspondiente. Las validaciones de importes y consentimiento siguen ejecutándose en el servidor. El botón Ver formulario completo permite revisar todos los datos.

El método de desbloqueo se agrega como propiedad opcional de intake_data: none, pin, password, pattern, in_person o not_provided. No hay campos de credenciales, cuadrícula ni almacenamiento de claves. Los métodos PIN, contraseña y patrón se presentan como coordinación presencial. Las órdenes anteriores sin propiedad siguen mostrando Sin registrar. La propiedad está validada por Zod y no forma parte de la proyección pública.

## Ficha y listado

La ficha conserva cabecera, documentos, acciones de estado y seguimiento. Las secciones se seleccionan mediante enlaces persistentes en la URL: recepción, diagnóstico, presupuesto, pruebas, fotografías, historial y entrega. Los formularios existentes mantienen sus nombres y acciones. Diagnóstico y presupuesto comparten el formulario técnico actual; las pruebas iniciales se conservan como registro de recepción. La entrega muestra los datos reales y utiliza la transición existente con identificación de quien retira.

El listado mantiene búsqueda y estado combinables. En móvil presenta tarjetas y en escritorio conserva la tabla. Las prioridades se derivan de estado y fecha estimada, con vencimiento por día de Buenos Aires. Un vencimiento señala una estimación anterior, no un compromiso contractual. El dashboard reduce separaciones en móvil.

## Verificación

npm run lint, npm run typecheck, npm test, npm run build, npm run test:e2e. El recorrido E2E conserva recepción, importes inválidos, garantía, concurrencia de revisión, diagnóstico, fotos, PDF, privacidad pública, rotación del token y cierre de sesión. Se actualiza la navegación de pestañas en las pruebas.

npm run test:design agrega capturas de listado, ficha y recepción en ambos temas y tamaños de pantalla, usando PostgreSQL aislado y Auth simulado. Verifica retención de campos entre pasos, ausencia de inputs de credenciales, filtros combinados y ausencia de desbordamiento. No ejecuta escrituras sobre Supabase.

## Siguiente entrega

Orden unificada con copia inmutable del ingreso y secciones de cierre, etiqueta con QR administrativo autenticado, ubicación física configurable y pruebas finales estructuradas. Se conservan los documentos y formatos actuales en esta entrega. No se añadieron migraciones ni campos ficticios de ubicación.

El Preview automático de esta rama permanece suspendido. El aviso heredado de Next 16.4.3 requiere mantenimiento antes del piloto. La revisión visual y el QA con Supabase Auth real permanecen pendientes.

## Evidencia revisable

Recorrido local final en PostgreSQL 17.11, pruebas de navegador y 27 pruebas aprobadas sin omisiones. El primer intento con PGlite produjo errores de protocolo de sentencias sin nombre; el motor nativo permitió validar el flujo completo. La captura también detectó y permitió corregir la etiqueta accesible del método de desbloqueo.

| Pantalla | Dark escritorio | Dark móvil | Light escritorio | Light móvil |
| --- | --- | --- | --- | --- |
| Recepción | [Ver](orders-evidence/intake-dark-desktop.png) | [Ver](orders-evidence/intake-dark-mobile.png) | [Ver](orders-evidence/intake-light-desktop.png) | [Ver](orders-evidence/intake-light-mobile.png) |
| Ficha | [Ver](orders-evidence/detail-dark-desktop.png) | [Ver](orders-evidence/detail-dark-mobile.png) | [Ver](orders-evidence/detail-light-desktop.png) | [Ver](orders-evidence/detail-light-mobile.png) |
| Listado | [Ver](orders-evidence/list-dark-desktop.png) | [Ver](orders-evidence/list-dark-mobile.png) | [Ver](orders-evidence/list-light-desktop.png) | [Ver](orders-evidence/list-light-mobile.png) |

Todas las capturas usan datos sintéticos y sesiones de prueba. La revisión de fidelidad visual y accesibilidad completa requiere revisión humana. El mecanismo de impresión histórica conserva sus documentos separados hasta la entrega específica de orden unificada.
