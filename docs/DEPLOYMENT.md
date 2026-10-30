# Puesta en marcha en UNNOBA

Supabase: `zgihtbiyhhvmxjfzdxjg`. Vercel: `omnifix-taller` / `prj_IPg0s3QRtU6Uy3tFibloHFoVEJci`.

Aplicada mediante Supabase la migración `omnifix_workshop_initial`: contenido de `drizzle/0000_initial.sql`, seguido de ENABLE ROW LEVEL SECURITY en las cinco tablas y REVOKE ALL para anon/authenticated. Es intencional no publicar políticas: la aplicación usa PostgreSQL exclusivamente desde el servidor. Los avisos INFO de RLS sin políticas reflejan este cierre. Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

Configurar en Vercel (no compartir valores en chats ni commits):

- DATABASE_URL: cadena **Transaction pooler** de Connect en Supabase, con contraseña codificada en URL. Postgres.js usa prepare:false para ese modo.
- WORKSHOP_ADMIN_USER: usuario elegido por el dueño.
- WORKSHOP_ADMIN_PASSWORD: contraseña única de al menos 20 caracteres.

Volver a desplegar después de configurar variables. Hasta entonces el panel queda cerrado. No se ha probado una orden completa a través de la aplicación ni concurrencia real. El despliegue inicial conserva la protección de acceso de Vercel. GitHub no está vinculado a la cuenta nueva; se subieron fuentes directamente.
