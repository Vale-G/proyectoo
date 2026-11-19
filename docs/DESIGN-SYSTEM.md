# Workshop Dark y Workshop Light

Primera entrega visual sobre el commit 8e0156c del PR #7. Referencia revisada: mockup aprobado 91917.png, que combina escritorio, móviles y documentos. Este PR adapta el escritorio del mockup al dashboard real y entrega el sistema compartido de apariencia. Los documentos, la ficha técnica y el formulario conservan sus funciones actuales.

## Componentes reutilizables

| Componente | Responsabilidad |
| --- | --- |
| AppFrame | Identidad del taller resuelto, navegación, contenido principal y salida de sesión |
| WorkshopNavigation | Enlaces reales, estado activo y navegación de teclado |
| AppearanceControl | Tema claro/oscuro con cookie HttpOnly, SameSite=Lax, Secure en producción y valores permitidos |
| WorkshopIdentityMark | Nombre y monograma del taller, logo HTTPS opcional |
| brandStyle | Color del taller validado como hexadecimal y limitado al acento de identidad |
| MetricCard | Indicador enlazado con estado semántico e icono decorativo |
| StatusBadge existente | Texto de estado y estilos compartidos para ambos temas |
| workshop-panel / workshop-table | Contenedor, título, tabla desplazable y jerarquía tipográfica |
| recent-mobile-list | Órdenes recientes como enlaces con equipo, estado y fecha en celular |
| workshop-empty | Mensaje de inicio y acción para recibir el primer equipo |
| button / form-feedback existentes | Acciones, confirmaciones y errores conservados |

Los tokens están en src/app/workshop.css y cubren tipografía Inter local, espacios, radios, canvas, sidebar, superficies, bordes, foco y estados. Los alias actuales de globals.css se mantienen para adoptar los temas progresivamente. Las reglas de impresión existentes conservan el fondo blanco. El selector cambia la preferencia del navegador y no guarda valores de marca compartidos.

## Identidad y alcance

El shell obtiene publicName únicamente del taller autorizado por privateStore. El nombre de plataforma es genérico. La identidad acepta logo y acento como propiedades por taller; su edición persistente requiere revisar un modelo posterior y no se simula con variables globales ni almacenamiento del navegador. La tabla actual workshops no guarda logo o colores, por lo que el shell usa un monograma y el acento de plataforma. El catálogo y los documentos de marca existentes quedan para la siguiente entrega.

El mockup muestra inventario, proveedores, finanzas, notificaciones y búsquedas globales. No se incorporan controles sin una ruta o funcionalidad existente. El primer indicador representa equipos recibidos, con enlace al filtro correspondiente. Las cifras proceden de las órdenes reales del taller autorizado. La tabla muestra fecha de ingreso porque la consulta actual no expone la última actualización.

## Verificación y evidencia

npm run lint, npm run typecheck, npm test, npm run build y npm run test:e2e. tests/design-capture.ts usa la infraestructura PostgreSQL aislada existente y cuatro órdenes sintéticas. Comprueba ambos temas, persistencia de cookie HttpOnly tras recarga, contraste del título y navegación móvil. Ejecutar después del build con node --import tsx tests/design-capture.ts. No ejecutar en paralelo con otro harness que use los mismos puertos locales.

Las capturas de antes proceden del PR #7 con los mismos cuatro registros sintéticos. Las posteriores muestran la aplicación renderizada en navegador a 1280px y 390px. La revisión visual detectó títulos blancos heredados en el tema claro y se corrigieron antes de emitir las capturas finales. Se requiere revisión humana de fidelidad y accesibilidad completa antes de continuar con otras pantallas.

Sin migraciones nuevas. La rama suspende su despliegue Git automático para evitar credenciales heredadas. Conserva el aviso conocido de Next 16.4.3 y requiere actualización compatible antes del piloto.

## Capturas comparativas

Todas contienen registros ficticios. En escritorio se usa 1280 × 900; en móvil, 390 × 844. Las imágenes son de página completa.

| Estado | Escritorio | Móvil |
| --- | --- | --- |
| PR #7 | [Antes](design-evidence/before-desktop.png) | [Antes](design-evidence/before-mobile.png) |
| Workshop Dark | [Después](design-evidence/after-dark-desktop.png) | [Después](design-evidence/after-dark-mobile.png) |
| Workshop Light | [Después](design-evidence/after-light-desktop.png) | [Después](design-evidence/after-light-mobile.png) |
