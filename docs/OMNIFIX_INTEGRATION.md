# Integración OmniFix: catálogo, seguimiento y taller privado

- Marca visible OmniFix; se conservan nombres técnicos de PostgreSQL/Docker/localStorage para mantener compatibilidad.
- `/catalogo` muestra servicios y redes sin ciudades ni precios inventados.
- `/seguimiento` acepta el enlace o token privado y rechaza formatos inválidos antes de consultar PostgreSQL.
- Seguimiento con noindex y no-referrer; no publica datos del cliente, serie, importes ni notas internas.
- Panel y Server Actions protegidos mediante autenticación HTTP Basic; validación adicional antes de acceder a los datos privados. Las páginas públicas sólo permiten GET/HEAD sin credenciales.
- Sin configuración de acceso, el panel queda cerrado. Requiere `WORKSHOP_ADMIN_USER` y `WORKSHOP_ADMIN_PASSWORD` (mínimo 20 caracteres, única y generada aleatoriamente), configurados en el proveedor de hosting. Usar exclusivamente HTTPS en producción.
- Esta primera versión tiene un único propietario. Para múltiples empleados hacen falta cuentas individuales, sesiones y roles. El navegador administra las credenciales Basic; no hay cierre de sesión propio.

## Validación local

`npm run lint`, `npm run build` y `node --test tests/auth.test.mjs` aprobados. Verificación HTTP del build: catálogo y entrada de seguimiento 200; panel y creación sin credenciales 401; POST público sin credenciales 401; token inválido 404; creación con credenciales válidas 200.

Se creó el esquema inicial en el proyecto Supabase de UNNOBA zgihtbiyhhvmxjfzdxjg, con RLS y sin acceso para anon/authenticated. Aún falta configurar DATABASE_URL y validar el flujo de aplicación contra esa base. Se inició un despliegue desde archivos en Vercel omnifix-taller; no fusionado.

## Pendientes de puesta en marcha

1. Cuenta UNNOBA conectada y proyecto Vercel omnifix-taller creado. Vincular GitHub para futuros despliegues automáticos.
2. Configurar PostgreSQL y credenciales privadas en un entorno de prueba.
3. Alta transaccional, correlativo con máximo numérico y bloqueo por taller, y cambio de estado con comparación del estado anterior implementados; falta comprobar concurrencia contra PostgreSQL real.
4. Probar recepción, cambio de estado, historial y seguimiento con una orden ficticia antes de publicar.
