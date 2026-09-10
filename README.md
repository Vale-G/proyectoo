# TecniFlow · Punto Placa

Base de producto para **Punto Placa**, un taller de reparación electrónica, y para su futura plataforma de gestión **TecniFlow**.

El repositorio contiene dos cosas:

- [`docs/vision-del-producto.md`](docs/vision-del-producto.md): definición funcional, flujo operativo, arquitectura y hoja de ruta.
- Un prototipo web navegable sin dependencias (`index.html`) para validar las pantallas principales del MVP.

## Ejecutar el prototipo

No requiere instalación. Desde la raíz del repositorio:

```bash
python3 -m http.server 4173
```

Luego abrir <http://localhost:4173>.

## Alcance actual

El prototipo es una maqueta funcional local: permite recorrer el tablero, crear una orden de ejemplo, buscar órdenes, cambiar estados y consultar la vista pública representada por el QR. Los datos de ejemplo se guardan solamente en el navegador mientras se usa la maqueta.

No incluye todavía autenticación, base de datos, generación real de PDF/QR, pagos ni integraciones externas. Es la base visual y funcional para validar el MVP antes de implementar el producto definitivo.
