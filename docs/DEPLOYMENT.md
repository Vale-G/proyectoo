# Puesta en marcha en UNNOBA

Supabase: `zgihtbiyhhvmxjfzdxjg`. Vercel: `omnifix-taller` / `prj_IPg0s3QRtU6Uy3tFibloHFoVEJci`.

Aplicada mediante Supabase la migración `omnifix_workshop_initial`: contenido de `drizzle/0000_initial.sql`, seguido de ENABLE ROW LEVEL SECURITY en las cinco tablas y REVOKE ALL para anon/authenticated. Es intencional no publicar políticas: la aplicación usa PostgreSQL exclusivamente desde el servidor. Los avisos INFO de RLS sin políticas reflejan este cierre. Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

El bloque de operación comercial agrega `drizzle/0003_workshop_operations.sql`: aprobación pública de presupuestos, historial de pagos, repuestos y vínculo de reingresos por garantía. Crea tablas con RLS y sin privilegios para `anon`/`authenticated`. Fue aplicado y verificado únicamente en `omnifix-preview-qa`; no aplicarlo en producción sin copia de seguridad y autorización explícita.

Configurar en Vercel (no compartir valores en chats ni commits):

- DATABASE_URL: cadena **Transaction pooler** de Connect en Supabase, con contraseña codificada en URL. Postgres.js usa prepare:false para ese modo.
- NEXT_PUBLIC_SUPABASE_URL: URL pública del proyecto Supabase usado para Auth.
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: clave publicable del mismo proyecto (nunca service role).
- WORKSHOP_ADMIN_EMAIL: correo exacto de Google autorizado para administrar el taller.

Volver a desplegar después de configurar variables. Hasta entonces `/login` muestra qué credenciales faltan. Una vez activado el acceso, si falta DATABASE_URL, el propietario ve una página de configuración en lugar de un error. No se ha probado una orden completa a través de la aplicación ni concurrencia real. El despliegue inicial conserva la protección de acceso de Vercel. La cuenta nueva no tiene una conexión GitHub disponible (git_namespaces devolvió una lista vacía). En Vercel, conectar GitHub y luego Settings → Git → Connect Git Repository → Vale-G/proyectoo; usar main como rama de producción cuando este cambio esté fusionado. Se publicaron las fuentes directamente mientras se habilita esa conexión.
