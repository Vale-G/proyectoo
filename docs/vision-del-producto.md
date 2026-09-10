# Visión del producto: Punto Placa y TecniFlow

> Documento de definición inicial. Resume las decisiones tomadas antes de construir el MVP y sirve como referencia viva del proyecto.

## 1. Idea y propósito

**Punto Placa** será la marca de un taller de diagnóstico y reparación electrónica: celulares, tablets, notebooks, computadoras, consolas, joysticks, televisores, monitores y otros equipos.

**TecniFlow** será la plataforma que ordena la operación del taller. Nace para el uso diario de Punto Placa y, tras validarse en trabajo real, podrá ofrecerse a otros talleres como servicio.

La promesa del producto es:

> Recibir, diagnosticar, reparar, documentar y entregar equipos con orden, trazabilidad y una experiencia clara para el cliente.

## 2. Identidad de marca

| Marca | Rol | Personalidad | Bajada sugerida |
| --- | --- | --- | --- |
| Punto Placa | Taller y cara visible ante el cliente | Técnica, cercana, robusta y confiable | Servicio técnico de electrónica |
| TecniFlow | Plataforma de gestión | Profesional, moderna, organizada y escalable | Gestión inteligente para talleres técnicos |

El símbolo propuesto es una **placa o circuito estilizado con una tilde**. La placa representa electrónica y diagnóstico; las pistas representan conexiones y proceso; la tilde expresa control, trabajo verificado y reparación finalizada.

### Paleta inicial

- Azul profundo `#102A43`: confianza, navegación y base de marca.
- Azul de acción `#1479FF`: botones y enlaces principales.
- Cian `#22C7D9`: detalles tecnológicos y estados de prueba.
- Verde `#18A66A`: éxito, equipos listos y pagos confirmados.
- Ámbar `#E8A317`: diagnóstico, espera y atención.
- Rojo `#D64545`: problemas, rechazo o reparación no realizada.
- Fondo `#F4F7FA` y texto `#25313C`: legibilidad y espacio de trabajo.

## 3. Problema que resuelve

Un taller suele depender de cuadernos, chats y memoria para saber qué recibió, qué se probó, qué repuesto falta, qué presupuesto se aprobó y cuándo retirar un equipo. Eso crea pérdidas de tiempo, confusiones y poca visibilidad para el cliente.

TecniFlow centraliza cada orden de reparación y crea un historial verificable de recepción, diagnóstico, pagos, reparación, pruebas, garantía y entrega.

## 4. Usuarios

### Cliente final

- Entrega un equipo y recibe una orden con QR.
- Consulta el estado sin acceder a información privada.
- Recibe avisos y garantía al finalizar el trabajo.

### Propietario / técnico

- Crea, busca y actualiza órdenes.
- Registra diagnóstico, costos, repuestos y pruebas.
- Mantiene el control operativo y técnico del taller.

### Recepción y técnicos futuros

- Recepción crea órdenes, cobra señas y comunica novedades.
- Técnicos trabajan solo en las órdenes autorizadas y registran avances.

### Administrador de plataforma futuro

- Administra talleres, planes, usuarios, límites y soporte sin mezclar los datos privados de cada negocio.

## 5. Flujo de trabajo de una orden

1. **Recepción:** se registra el cliente, el equipo, la falla declarada, accesorios, estado físico, fotos y autorizaciones.
2. **Control inicial:** si el equipo permite pruebas, se marca qué funciona, qué falla y qué no pudo probarse.
3. **Diagnóstico o reparación conocida:** para una pantalla rota o batería se puede presupuestar de inmediato; para un equipo sin encendido se abre una etapa de diagnóstico.
4. **Presupuesto y aprobación:** se registra solución, repuesto, costo, seña, plazo y forma de aprobación. No se realizan costos adicionales sin autorización.
5. **Repuesto y reparación:** se solicita o reserva la pieza, se registra su llegada, se asigna técnico y se documenta el trabajo.
6. **Pruebas:** se completa un checklist final antes de marcar el equipo como listo.
7. **Entrega y garantía:** se cobra el saldo, se registra la entrega y se genera comprobante de garantía.

### Estados iniciales

1. Recibido.
2. En diagnóstico.
3. Esperando aprobación.
4. Esperando seña.
5. Esperando repuesto.
6. En reparación.
7. En pruebas.
8. Listo para retirar.
9. Entregado.
10. No reparado / retirado.
11. En garantía.

No todas las órdenes recorren todos los estados. Un cambio de pantalla puede pasar directamente de recibido a esperando repuesto; un equipo mojado puede comenzar en diagnóstico.

## 6. Datos de la orden

### Cliente

- Nombre y apellido.
- Teléfono/WhatsApp.
- Correo y documento opcionales.
- Historial de órdenes y observaciones.

### Equipo

- Categoría: celular/tablet, notebook/PC, consola/joystick, TV/monitor u otro.
- Marca, modelo, color, IMEI o número de serie cuando corresponda.
- Accesorios recibidos y fotografías de ingreso.

### Recepción

- Falla declarada en palabras del cliente.
- Golpe, líquido, apertura o reparación previa.
- Estado físico: pantalla, tapa, marco, cámaras, puertos, botones, señales de humedad y observaciones.
- Checklist de pruebas iniciales adaptado a cada categoría.
- Consentimientos de diagnóstico, apertura y pruebas.

### Trabajo, dinero y entrega

- Diagnóstico inicial/final, solución, riesgos y técnico responsable.
- Repuesto, calidad, proveedor y costo interno.
- Presupuesto, seña, pagos, saldo y aprobación.
- Pruebas finales, garantía y fecha/persona de entrega.
- Historial automático de todas las acciones relevantes.

## 7. Documentos y QR

### Copia para cliente

- Datos de Punto Placa, número de orden y QR.
- Cliente, equipo, falla, accesorios y estado físico resumido.
- Presupuesto o aviso de diagnóstico pendiente.
- Seña, saldo, fecha estimada y condiciones principales.

### Copia interna

Incluye además diagnóstico, checklist, fotos, costos, proveedor, técnico, ubicación física y notas privadas.

### Portal público de QR

Muestra número de orden, tipo/modelo del equipo, fecha de ingreso, estado, mensaje claro, fecha estimada, saldo opcional, garantía y un acceso a WhatsApp.

Nunca debe mostrar contraseñas, IMEI completo, fotos internas, notas técnicas, costos internos ni datos personales que no sean necesarios.

## 8. Condiciones y privacidad

Las condiciones definitivas deben ser revisadas por un profesional legal del país donde opere el taller. Como base funcional, la orden debe documentar:

- Estado y accesorios con que ingresa el equipo.
- Autorización de diagnóstico, apertura y pruebas.
- Costo de diagnóstico y criterios de aprobación de presupuesto.
- Riesgos de equipos mojados, golpeados, previamente abiertos, sin encendido o con fallas intermitentes.
- Política de repuestos, señas, cancelaciones, retiro y garantía.
- Autorización de comunicaciones por WhatsApp/teléfono.

Las contraseñas deben evitarse cuando sea posible. Si se requieren para pruebas, deben ser temporales, visibles solo a personal autorizado y eliminarse al cerrar o entregar la orden.

## 9. MVP

El MVP tiene un solo objetivo: gestionar de punta a punta una reparación real sin depender de cuaderno, planilla o conversaciones dispersas.

Incluye:

- Cuenta y configuración básica de Punto Placa.
- Clientes y búsqueda por nombre/teléfono.
- Órdenes, equipos, fotos y checklists básicos.
- Estados, diagnóstico, presupuesto, seña, pagos y saldo.
- Lista de órdenes con filtros y búsqueda.
- Historial de acciones.
- Comprobante de orden, ficha interna y garantía en PDF/impresión.
- QR seguro y portal público de seguimiento.

No incluye inicialmente inventario completo, facturación electrónica, pagos integrados, mensajes automáticos, Obsidian, IA, múltiples sucursales, planes de suscripción ni panel global.

## 10. Evolución por fases

### Fase 1 — Núcleo operativo

Órdenes, clientes, estados, fotos, pagos, impresión, QR y garantía.

### Fase 2 — Gestión de taller

Repuestos, proveedores, stock, etiquetas, agenda de entregas, mensajes preparados y reportes básicos.

### Fase 3 — Conocimiento técnico

Compatibilidad con Markdown y Obsidian, fichas por modelo, casos resueltos, procedimientos y checklists.

### Fase 4 — IA asistida por conocimiento

Búsqueda en notas y casos propios, sugerencias de diagnóstico, resúmenes para cliente, borradores para Obsidian y consulta trazable de precios/proveedores. La IA sugiere; el técnico confirma.

### Fase 5 — Producto comercial

Multiempresa, usuarios y permisos, sucursales, marca por taller, planes, suscripciones, panel administrador y soporte.

## 11. Arquitectura técnica recomendada

La primera implementación definitiva debe comenzar como un **monolito modular**, no como microservicios.

### Tecnologías candidatas

- Frontend y servidor: TypeScript, React y Next.js.
- Base de datos: PostgreSQL.
- Archivos y fotografías: almacenamiento de objetos separado de la base de datos.
- Autenticación: roles de propietario, recepción, técnico y administrador global.
- Documentos: generación de PDF desde plantillas de orden y garantía.
- QR: tokens largos y no adivinables, no únicamente números correlativos.

### Entidades principales

```text
Taller
 ├── Usuarios
 ├── Clientes
 │    └── Equipos
 │         └── Órdenes
 │              ├── Fotos/documentos
 │              ├── Diagnósticos
 │              ├── Presupuestos
 │              ├── Pagos
 │              ├── Repuestos
 │              ├── Pruebas
 │              ├── Garantías
 │              └── Historial
 ├── Inventario y proveedores
 ├── Base de conocimiento
 └── Configuración
```

Para la versión comercial, toda entidad de negocio debe pertenecer a un taller y las reglas de acceso deben impedir que una empresa consulte registros de otra.

### Decisiones ya incorporadas en el arranque técnico

- La aplicación usa Next.js con TypeScript y Server Actions; no depende de API routes para el flujo inicial de órdenes.
- PostgreSQL separa taller, cliente, equipo, orden e historial de estados, en lugar de duplicar datos de cliente dentro de cada orden.
- El número de orden es correlativo e interno. El enlace público se resuelve exclusivamente con un token aleatorio de 256 bits, distinto del número visible en el comprobante.
- Las transiciones de estado se validan del lado del servidor. Una orden no puede saltar, por ejemplo, de "esperando aprobación" a "entregado".

## 12. Principios de producto

1. Crear una orden debe ser más rápido que escribirla en un cuaderno.
2. Las fotos, accesorios, autorizaciones e historial protegen al taller y al cliente.
3. El cliente entiende el progreso sin ver datos privados ni tecnicismos confusos.
4. La IA apoya el criterio técnico; no aprueba presupuestos ni ejecuta decisiones críticas por sí sola.
5. Los datos deben poder respaldarse y exportarse.
6. Punto Placa valida cada función antes de convertirla en una función comercial de TecniFlow.
