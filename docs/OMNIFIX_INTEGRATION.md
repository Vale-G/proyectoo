# OmniFix: catálogo y seguimiento

## Cambio inicial

- `/catalogo`: servicios de celulares, consolas, joysticks y personalización; enlaces de Instagram/Facebook del dueño, sin ciudades ni precios inventados.
- `/seguimiento`: entrada del enlace privado o token de 64 caracteres hexadecimales; navegación interna, sin redirección a URLs aportadas por el visitante.
- `/seguimiento/[token]`: reutiliza el seguimiento existente y añade regreso al catálogo.
- Validación del token antes de abrir conexión; metadatos noindex/nofollow y política no-referrer para seguimiento.
- No se cambió la marca/configuración existente Punto Placa/TecniFlow ni se migraron registros. Confirmar cómo conviven esas marcas antes de cambiar datos existentes.

## Validación

- `npm ci --ignore-scripts`: completado.
- `npm run lint` (TypeScript, no ESLint): aprobado.
- `npm run build`: aprobado; catálogo y entrada de seguimiento estáticos.
- Sin base PostgreSQL de prueba configurada: no se verificó alta/cambio/consulta de una orden real ni concurrencia.

## Bloqueos de lanzamiento

La app base NO tiene autenticación del panel ni de Server Actions. No desplegar públicamente esta rama ni conectarla al catálogo público hasta proteger lecturas y escrituras administrativas. Noindex no sustituye autenticación. El token es una credencial de acceso y debe mantenerse privado; evitar registrarlo en analítica/logs externos.

Próximo incremento: autenticación y autorización en servidor; entorno aislado con datos ficticios; pruebas alta → actualización → consulta pública sin datos personales. Revisar transacciones y numeración de órdenes (actualmente cuenta filas + 1, expuesto a concurrencia). Luego adaptar marca del taller de forma explícita y añadir QR, revocación de enlaces y presupuesto público aprobado. El portal actual no muestra montos.

No hubo despliegue, migración, cambios en la base ni merge.
