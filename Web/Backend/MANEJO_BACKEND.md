# Guía de Manejo del Backend - WebInversan

Este documento explica la arquitectura actual del backend tras la reciente refactorización. El objetivo principal es desacoplar la lógica de negocio de la gestión de peticiones HTTP.

## 🏗️ Arquitectura de Capas

El backend ahora sigue un patrón de **Controlador-Servicio**, lo que permite una mayor escalabilidad, facilidad de pruebas y reutilización de código.

### 1. Rutas (`src/Routes/`)
Son el punto de entrada de las peticiones. Su única responsabilidad es:
- Definir el endpoint (URL y método HTTP).
- Aplicar middlewares (autenticación, validación de esquemas, manejo de archivos).
- Llamar al método correspondiente del **Controlador**.

### 2. Controladores (`src/Controllers/`)
Actúan como mediadores entre el protocolo HTTP y la lógica de negocio.
- **Responsabilidades**:
    - Extraer datos de la petición (`req.body`, `req.params`, `req.query`, `req.user`).
    - Pasar estos datos a los métodos del **Servicio**.
    - Retornar la respuesta HTTP (usualmente un JSON con status 200).
- **Herramientas**:
    - Utilizan `asyncHandler` para envolver las funciones y capturar errores automáticamente sin necesidad de bloques `try-catch` repetitivos.

### 3. Servicios (`src/Services/`)
Contienen toda la **Lógica de Negocio**. Son independientes de Express y del protocolo HTTP.
- **Responsabilidades**:
    - Consultar y modificar la base de datos (vía Prisma).
    - Cálculos matemáticos, validaciones de reglas de negocio, envío de correos, generación de notificaciones.
    - Manejo de transacciones (`prisma.$transaction`).
- **Forma de Uso**:
    - Se definen como clases y se exporta una instancia única (`singleton`).
    - Lanzan errores (usando `throw { status: 400, message: "..." }` o `new AppError(...)`) cuando algo falla.

### 4. Base de Datos (`src/config/database.js`)
- Administrada por **Prisma ORM**.
- El cliente de Prisma se importa en los Servicios para interactuar con MySQL.

---

## 🛠️ Flujo de una Petición (Ejemplo)

1. **Cliente** envía `POST /api/pedido`.
2. **Router** (`pedido_route.js`) recibe la petición y llama a `pedidoController.realizarCompra`.
3. **Controlador** (`pedido.js`) extrae los datos y llama a `pedidosClientService.realizarCompra(datos)`.
4. **Servicio** (`PedidosClientService.js`):
    - Valida stock.
    - Inicia una transacción.
    - Crea el pedido y descuenta stock.
    - Envía correo de confirmación.
    - Retorna el objeto `pedido` creado.
5. **Controlador** recibe el objeto y responde al cliente con `res.status(200).json(resultado)`.

---

## 🚨 Manejo de Errores

El sistema utiliza un manejador de errores centralizado (`src/middleware/errorHandler.js`).

- **En el Servicio**: Para devolver un error, simplemente haz un `throw`.
  ```javascript
  if (!id_sucursal) {
    throw { status: 400, message: "La sucursal es obligatoria" };
  }
  ```
- **En el Controlador**: No es necesario `try-catch` gracias a `asyncHandler`.
  ```javascript
  const miMetodo = asyncHandler(async (req, res) => {
    const data = await miServicio.hacerAlgo(req.body);
    res.status(200).json(data);
  });
  ```

---

## 📝 Convenciones de Nombres
- **Controladores**: Nombre del recurso (ej: `pedido.js`, `products.js`).
- **Servicios**: Nombre del recurso seguido de `Service` (ej: `PedidosClientService.js`, `AuthService.js`).
- **Métodos**: camelCase descriptivo (ej: `obtenerDetallePedido`, `actualizarEstado`).
