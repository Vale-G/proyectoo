# TecniFlow · Punto Placa

Aplicación inicial de **TecniFlow**, el sistema de gestión para **Punto Placa** y futuros talleres de reparación electrónica. Esta ya no es una maqueta de `localStorage`: usa **Next.js + TypeScript + PostgreSQL + Drizzle ORM**, Server Actions y un modelo de datos separado para cliente, equipo y orden.

La definición funcional completa está en [`docs/vision-del-producto.md`](docs/vision-del-producto.md).

## Qué está implementado

- Dashboard y listado de órdenes consultados desde PostgreSQL.
- Alta de orden mediante Server Action.
- Entidades separadas: taller, cliente, equipo, orden e historial de estados.
- Detalle técnico e historial persistido de una orden.
- Transiciones de estado validadas en el servidor.
- Portal público de seguimiento con token aleatorio de 256 bits separado del número correlativo de orden.

## Desarrollo local

### 1. Preparar el entorno

```bash
cp .env.example .env.local
docker compose up -d postgres
npm install
```

### 2. Crear las tablas

Usá PostgreSQL para ejecutar la migración inicial:

```bash
docker compose exec -T postgres psql -U tecniflow -d tecniflow < drizzle/0000_initial.sql
```

### 3. Iniciar la aplicación

```bash
npm run dev
```

Abrí <http://localhost:3000>. El primer acceso crea automáticamente el taller inicial **Punto Placa**. Después podés crear órdenes reales desde `/orders/new`.

## Seguridad y límites actuales

- El portal público busca por `publicToken` aleatorio, no por `orderNumber`; ese token se debe codificar en el QR cuando se implemente su generación.
- El portal no selecciona ni expone IMEI/serie, fotos, notas internas, diagnóstico ni montos.
- Aún falta autenticación, carga de fotos, generación física de PDF/QR, pagos, inventario y la separación multiempresa completa. Esas funciones siguen la hoja de ruta del documento de visión.
