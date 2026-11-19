# Primera etapa multitaller

Base remota 9908b9f. El checkout anterior tenía nueve commits locales, con equivalentes funcionales en la rama remota. La diferencia restante en headers de Next se conserva en esta rama. Ningún checkout anterior fue reescrito.

El inventario existente incluye recepción estructurada, consentimiento, historial transaccional, pagos, repuestos, garantías, fotos privadas, seguimiento por token y documentos con QR. El catálogo, el shell, los documentos, manifest y textos de ayuda todavía contienen la marca OmniFix. Su personalización pertenece a las etapas siguientes. Los formatos existentes se conservan.

## Acceso

La identidad Google confirmada permite iniciar sesión. La tabla workshop_members asocia el UUID de Supabase Auth con un taller y rol activo. El email configurado ya no concede acceso a datos. WORKSHOP_ADMIN_EMAIL y sus helpers permanecen para verificar la identidad del propietario durante la transición. El resolvedor requiere membresía; no crea ni elige el primer taller. Usuarios con varios talleres seleccionan uno, y la cookie se contrasta contra la membresía en cada solicitud privada.

Owner y admin conservan la operación actual. Technician y reception existen en el modelo pero se rechazan antes de abrir el almacén privado. Sus vistas por asignación, campos permitidos y acciones limitadas quedan pendientes. El registro público y la gestión autónoma de invitaciones siguen cerrados. No se agrega lectura directa desde Supabase: RLS y revocaciones mantienen las tablas inaccesibles para anon/authenticated. La conexión Drizzle conserva privilegios de servidor y requiere el resolvedor antes de cualquier operación privada.

Las relaciones dispositivo-cliente y orden-dispositivo incorporan claves compuestas por taller. Los registros secundarios permanecen asociados a la orden. Descarga PDF, CSV, fotos y Server Actions pasan por el almacén privado existente; el enlace público conserva una proyección acotada y token revocable.

## Transición propuesta

1. Verificar un respaldo restaurable y el identificador exacto del taller histórico.
2. Comprobar relaciones actuales. La migración 0004 valida claves foráneas sin reparar ni reasignar datos; cualquier inconsistencia aborta la aplicación.
3. Aplicar 0004 únicamente con autorización en una base aislada.
4. Verificar en Supabase Auth el UUID y email Google confirmado del propietario actual contra WORKSHOP_ADMIN_EMAIL. Insertar explícitamente una membresía owner con ese UUID y el ID del taller verificado. Nunca inferirlos por el primer registro.
5. Ejecutar el recorrido autenticado, órdenes anteriores, PDFs, exportación, sesión de otro taller y revocación de membresía.
6. Coordinar código y membresía antes de habilitar tráfico. Este código sin la tabla/membresía rechaza el acceso. Evitar desplegarlo sobre la configuración anterior.

La tabla no incorpora una FK a auth.users porque Drizzle puede usar PostgreSQL independiente de Supabase Auth. El UUID debe aprovisionarse de una identidad verificada, exclusivamente por un operador autorizado. La gestión de miembros por la aplicación queda pendiente y no concede escritura pública.

## Verificación

npm run lint, npm run typecheck, npm test, npm run build. El workflow QA existente usa PostgreSQL 17 descartable y ejecuta verify, incluyendo concurrencia con backends independientes y pruebas de navegador con identidad simulada. Las pruebas de integración incluyen dos talleres, roles restringidos, IDs manipulados, revocación y claves foráneas cruzadas.

Preview suspendido para esta rama mediante vercel.json. La base y credenciales de QA requieren verificación separada antes de un deployment manual. No se ejecutan migraciones remotas. Los mockups se requieren para la etapa visual definitiva.

Riesgos pendientes: administración de membresías fuera de la app, vistas restringidas de técnico/recepción, identidad gráfica parametrizable, auditoría de cambios de membresía, QA con Supabase Auth real. Next 16.4.3 conserva el aviso de seguridad conocido y requiere mantenimiento compatible antes de un piloto.
