# Integración OmniFix: catálogo, seguimiento y taller privado

- Marca visible OmniFix; se conservan nombres técnicos de PostgreSQL/Docker/localStorage para mantener compatibilidad.
- `/catalogo` muestra servicios y redes sin ciudades ni precios inventados.
- `/seguimiento` acepta el enlace o token privado y rechaza formatos inválidos antes de consultar PostgreSQL.
- Seguimiento con noindex y no-referrer; no publica datos del cliente, serie, importes ni notas internas.
- Panel y Server Actions protegidos mediante Supabase Auth en cookie HttpOnly, Secure en producción y SameSite=Lax; se exige el correo confirmado y una identidad Google vinculada antes de acceder a datos privados. Las páginas públicas sólo permiten GET/HEAD sin credenciales.
- Sin configuración de acceso, el panel queda cerrado. Requiere `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `WORKSHOP_ADMIN_EMAIL`. Habilitar Google en Supabase Auth y autorizar la URL `/auth/callback` de cada entorno. Usar exclusivamente HTTPS en producción.
- Esta primera versión tiene un único propietario. Para múltiples empleados hacen falta cuentas individuales y roles. La cookie se limita a 8 horas y la sesión puede cerrarse desde el panel o revocarse desde Supabase Auth.

## Validación local

`npm run verify` cubre lint, tipos, unitarias, integración, build y navegador real. La autenticación se prueba con un servidor Supabase aislado: panel cerrado sin sesión, identidad Google confirmada autorizada, CSRF, cookie, configuración faltante y logout. El flujo OAuth real se valida únicamente en Preview, nunca con credenciales productivas dentro de CI.

Se creó el esquema inicial en el proyecto Supabase de UNNOBA zgihtbiyhhvmxjfzdxjg, con RLS y sin acceso para anon/authenticated. Aún falta configurar DATABASE_URL y validar el flujo de aplicación contra esa base. Se inició un despliegue desde archivos en Vercel omnifix-taller; no fusionado.

## Pendientes de puesta en marcha

1. Cuenta UNNOBA conectada y proyecto Vercel omnifix-taller creado. Vincular GitHub para futuros despliegues automáticos.
2. Configurar PostgreSQL y credenciales privadas en un entorno de prueba.
3. Alta transaccional, correlativo con máximo numérico y bloqueo por taller, y cambio de estado con comparación del estado anterior implementados; falta comprobar concurrencia contra PostgreSQL real.
4. Probar recepción, cambio de estado, historial y seguimiento con una orden ficticia antes de publicar.
