# OmniFix: issues #4 y #5

Rama aislada: `codex/omnifix-issues-4-5`, base `7bb96b7`. No migrar, fusionar ni desplegar a producción antes de re-QA y aprobación de condiciones.

## Correcciones

- La base negaba `received -> under_warranty` (reproducido sobre el código de base). Ahora se admite ingreso a garantía. El estado y el evento se guardan en una transacción con revisión optimista; dos cambios sobre una misma revisión producen un único ganador. Un error al escribir el historial revierte el estado. Los formularios muestran errores y no borran los datos ingresados ante una validación fallida.
- La demo local heredada usaba `event.dataset` y no el botón del evento. Se corrigió a `currentTarget`. La demo no es el sistema de producción ni una alternativa al backend.
- El seguimiento tiene URL absoluta copiable y compartible por WhatsApp, sin envío automático. Token aleatorio de 256 bits, independiente del número de orden. Rotar el token invalida enlaces/QR anteriores y deja evento. Portal con allowlist; no expone cliente, IMEI, fotos, notas, diagnósticos ni costos internos.
- Recepción: contacto, línea opcional, SIM/SD/accesorios, encendido, golpes/humedad y checklist con motivo obligatorio de pruebas no realizadas. No existe campo de PIN/patrón/contraseña. Desbloqueo presencial.
- Aceptación: versión y texto exacto, fecha/hora, nombre, método y autorización separada de borrado. Las órdenes antiguas conservan consentimiento ausente; no se inventa aceptación retroactiva.
- Datos técnicos editables: diagnóstico privado, trabajo/repuestos/mano de obra, presupuesto cliente, pagos posteriores a la seña, aprobación del presupuesto/adicionales, mensaje público explícito, entrega estimada y garantía. Historial privado de cambios.
- Fotografías privadas en PostgreSQL: hasta 6 por orden, JPEG/PNG/WebP de 2 MB. Validación de tipo y firma, rutas autenticadas, no-store y sin exposición al portal/PDF. El límite se comprueba bajo bloqueo de fila.
- Comprobantes PDF A4 y vista imprimible, QR y URL alternativa, copia de condiciones/aceptación y firma. Se congela presupuesto y seña iniciales; la entrega distingue valores vigentes. PDF de entrega sólo tras registrar receptor y fecha; el historial conserva receptor/accesorios en cada entrega. Los PDF privados no contienen serie, fotos, diagnóstico ni costos internos.
- Identidad: se copió el JPEG original sin recrearlo; RGB exactos y SHA en `brand-source.json`. Tipografía Inter local (licencia OFL incluida), sin descarga de fuentes de terceros. Portal, panel y navegación móvil; PDF de fondo blanco con acentos de marca.
- Next actualizado a 16.4.3 y correcciones de dependencias transitivas. Auditoría de producción: sin vulnerabilidades reportadas en esta ejecución. Persisten cuatro avisos moderados en herramientas de desarrollo Drizzle/esbuild; no se forzó un downgrade incompatible.

## Migración (no aplicada a producción)

Instalación nueva: aplicar `drizzle/0000_initial.sql`, luego `0001_intake_receipts.sql` en una transacción de mantenimiento revisada. Instalación actual con las cinco tablas existentes: aplicar sólo `0001_intake_receipts.sql` una vez. Hacer backup y revisar el esquema antes. La migración agrega campos y tabla de fotos; no reemplaza registros ni inventa consentimientos/snapshots antiguos.

La segunda migración habilita RLS y revoca anon/authenticated en las seis tablas. La aplicación actual es monousuario y accede por conexión PostgreSQL privada del servidor; no abrir políticas públicas para que funcione. Las fotos también son privadas. Verificar privilegios del rol de conexión usado por la aplicación antes de migrar.

No usar `db:generate` para reaplicar las SQL iniciales: el repositorio partía de SQL manual sin diario de Drizzle. Aplicar estas SQL explícitamente con el proceso de migración de su entorno. No se ha ejecutado `db:migrate` contra producción.

Variables: `DATABASE_URL` (Transaction pooler, `prepare:false` ya configurado), `WORKSHOP_ADMIN_USER`, `WORKSHOP_ADMIN_PASSWORD` de 20+ caracteres; `APP_URL` recomendado como origen HTTPS canónico para enlaces y QR (sin ruta ni secretos). La URL/clave pública de Supabase no sustituyen DATABASE_URL.

## Pruebas y límites

`npm run verify` ejecuta typecheck, pruebas, build y navegador real. El CI adjunta PDF/PNG hechos exclusivamente con datos ficticios. Python 3.12+ y Poppler (`pdftotext`, `pdftoppm`) requeridos en tests; no en producción.

Las pruebas de DB usan PostgreSQL 18 embebido (PGlite) por TCP con el driver `postgres.js` de producción, en memoria y sin conexión a cuentas externas. Se prueban transacciones, rollback, revisiones, recepciones concurrentes, aislamiento, revocación y RLS. El multiplexer de PGlite serializa conexiones; no constituye una prueba de carga de Supavisor ni de despliegue Vercel. La infraestructura nativa PostgreSQL no puede iniciarse en este entorno rootless. El workflow de PR incluye un servicio PostgreSQL 17 efímero y ejecuta las mismas pruebas con dos clientes y PID de backend distintos. El helper sólo acepta OMNIFIX_TEST_DATABASE_URL con loopback/base omnifix_test y una habilitación explícita; crea una base aleatoria propia y sólo destruye esa base al finalizar. Nunca toma DATABASE_URL del usuario. La validación nativa se considera pendiente hasta revisar el run real del PR.

Las condiciones son un borrador revisable. Requieren revisión jurídica local antes del uso comercial y una versión nueva si se cambia el texto. No se incluyen renuncias generales por negligencia propia ni reducción de derechos legales. Fuente de referencia: Ley 24.240 (Argentina), https://www.argentina.gob.ar/normativa/nacional/ley-24240-638/actualizacion . No constituye dictamen jurídico.

## Reauditoría del Preview y alcance corregido — 2026-10-30

La validación previa sobre el head `c2429de6bc3c3f6535fb08c59cad2e992e18d597` sí pasó en [CI con PostgreSQL 17 real](https://github.com/Vale-G/proyectoo/actions/runs/41122200877): typecheck, tests de integración con conexiones independientes, build, E2E y auditoría de producción. La revisión de Codex sobre ese head no detectó problemas mayores. Eso **no acredita** que un deployment Vercel tenga variables correctas o migraciones aplicadas.

### Hallazgos de esta reauditoría

| Funcionalidad | Estado al auditar | Corrección / evidencia requerida |
|---|---|---|
| Estado en garantía | Reload y DB cubiertos | Se amplió E2E para logout, login, reapertura y reload de la misma orden |
| Presupuesto imprimible | Faltaba documento específico | PDF `?kind=quote`, enlace en detalle, total/seña/pagos/saldo, trabajo y aviso explícito de que no acredita autorización |
| Aislamiento de Preview | El runtime aceptaba cualquier DATABASE_URL | Barrera de lectura previa a operaciones, marker protegido, migración 0002; no basta una variable booleana del frontend |
| Lint | El script era alias de tsc | ESLint independiente, gate obligatorio; typecheck se conserva separado |
| Preview UNNOBA | Bloqueado por base aislada | Acceso recuperado; producción sigue en main 7bb96b7, Preview anterior c2429de. Variables compartidas con todos los entornos; no se probaron escrituras allí |
| PostgreSQL remoto aislado | Pendiente de provisionar | CI tiene PostgreSQL nativo efímero; no es una base persistente accesible desde Vercel |

### Configuración segura del Preview (pendiente, no aplicada en producción)

1. Crear un proyecto PostgreSQL **separado y vacío**, sin datos ni credenciales productivas. Confirmar organización/costo antes de crear recursos facturables. La cuenta UNNOBA tenía un único proyecto activo al inspeccionar: ese proyecto es producción y no se reutiliza.
2. En la base aislada, aplicar una sola vez `0000_initial.sql`, `0001_intake_receipts.sql` y `0002_environment_guard.sql`, en ese orden. En una instalación existente, revisar primero el esquema y aplicar solo las pendientes. No ejecutar Drizzle migrate ciegamente: falta historial/journal de estas migraciones SQL manuales.
3. **Solo en la base aislada**, ejecutar `UPDATE public.omnifix_environment SET kind='preview' WHERE id=true;`. La migración deja `production` por defecto; Preview rechaza esa identidad antes de crear/consultar órdenes. No cambiar este marker en una base real para habilitar pruebas.
4. En Vercel UNNOBA, proyecto `omnifix-taller`, rama `codex/omnifix-issues-4-5`, agregar variables limitadas al entorno Preview: DATABASE_URL de la base nueva, WORKSHOP_ADMIN_USER y WORKSHOP_ADMIN_PASSWORD exclusivos de QA y APP_URL de ese Preview. No copiar las variables de producción ni publicar secretos.
5. Volver a desplegar **Preview**, comprobar SHA exacto, login, recepción ficticia, garantía, logout/login/reload, seguimiento y PDF/QR. Verificar el registro ficticio directamente en la base aislada y su ausencia de cualquier proceso de prueba en producción sin consultar datos personales.
6. Solicitar QA independiente con URL y SHA. Mantener PR sin merge y no promover a producción.

### Límites que siguen abiertos

- No hay URL Preview funcional validada hasta provisionar una base aislada. Branching en Supabase fue rechazado: requiere Pro. No se contrató ni habilitó un plan pago.
- No se migró ni modificó producción, usuarios reales, credenciales o datos de clientes.
- El historial guarda eventos de estado y referencias de cambios técnicos/importes; no es un sistema de versiones completas de cada campo ni un archivo inmutable de presupuestos emitidos. El PDF de presupuesto refleja los datos vigentes en el momento de descarga.
- El consentimiento sigue siendo borrador identificado, pendiente de revisión profesional. No se presenta como certificación jurídica.
- Los PDF se generan y rasterizan/decodifican en integración; la verificación del despliegue remoto desde computadora y celular sigue pendiente.

### Resultado local de la corrección

`npm run verify`: **APROBADO** (ESLint 0 errores/0 warnings, typecheck, 19 pruebas aprobadas/0 fallos/1 omitida exclusivamente de PID nativo, build Next16.4.3, Chromium E2E actualizado). Auditoría de producción: **0 vulnerabilidades**. PDF de presupuesto rasterizado y QR decodificado; descargas desde viewport de escritorio y móvil cubiertas en E2E. El E2E ahora ejecuta VERCEL_ENV=preview y rechaza una base marcada como producción antes de mostrar el formulario de recepción; luego prueba recepción, garantía inmediata/reload, conflicto obsoleto, privacidad, tokens, PDF y logout/login/reload con garantía persistida.

PGlite solo tiene un backend: localmente se usa la cola de una conexión del driver productivo. Un ensayo local con dos conexiones al mismo backend mostró interferencia transaccional del motor embebido; no se presenta como prueba de contención multiconexión. En CI nativo se mantienen **dos clientes con PID distintos** y los tests simultáneos de estados, fotos y numeración. El nuevo commit requiere su propio run nativo verde; el resultado del run anterior no valida estos cambios.

La suite conserva validaciones reales del driver y no utiliza una URL productiva. Ninguna prueba remota de escritura se ejecutó sin verificar aislamiento.

Auditoría completa tras incorporar ESLint: 20 avisos moderados en herramientas de desarrollo (cadena ESLint/minimatch y Drizzle/esbuild), 0 altos/0 críticos; dependencias de producción: 0. `npm audit fix --ignore-scripts` no ofrece una solución compatible para todos; las sugerencias de `--force` incluyen regresiones mayores como ESLint4/Next config0.2.4/Drizzle0.18.1. No se aplicaron esos downgrades. Estos avisos no se ocultan ni se confunden con la auditoría productiva.


## Prueba remota de Preview aislado

Se creó `omnifix-preview-qa` en UNNOBA y se aplicaron0000/0001/0002 exclusivamente allí. La cuenta técnica tiene RLS limitado a un taller ficticio, sin DELETE, sin administración de usuarios ni permisos sobre otros esquemas. Las variables son exclusivas de la rama Preview; no se cambió producción.

El primer E2E real avanzó por recepción/garantía/conflictos/datos técnicos/fotos/privacidad y PDF, pero falló al recargar. Los logs identificaron `statement timeout` en el chequeo de `information_schema.columns`. Se reemplazó por búsqueda indexada de seis atributos en `pg_catalog.pg_attribute` usando `to_regclass`, manteniendo el rechazo si faltan migraciones y el marcador aislado. No se incrementó el timeout del servidor ni se desactivó el guard. Requiere nueva CI y E2E remota antes de aprobación. Los QR de los PDF remotos de recepción/presupuesto fueron decodificados y contrastados con el texto del documento por QA independiente.

El reemplazo del catálogo por sí solo no eliminó el timeout remoto: también se reprodujo en una consulta indexada mínima. Se corrigió además el ciclo de vida del transporte: PostgreSQL queda limitado a la solicitud con React cache y `after()` de Next cierra el cliente al terminar, en lugar de reutilizar un socket TCP global tras suspensión de Vercel. Supavisor conserva el pooling del lado del proveedor. Se mantiene max1/preparefalse y no se repiten escrituras ni se incrementa statement_timeout. La hipótesis de socket persistente corresponde al patrón documentado por Supabase para postgres-js en serverless; la aprobación depende de la nueva prueba remota, no de esa hipótesis por sí sola.
