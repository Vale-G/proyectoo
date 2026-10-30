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
