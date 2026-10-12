# WebInversan

WebInversan es una aplicación web full-stack para la gestión de un negocio de autopartes o similar. Incluye un panel de administración para gestionar modelos de carros, productos, pedidos, facturas, usuarios, roles y sucursales. La aplicación está construida con un backend en Node.js y Express, utilizando Prisma como ORM para MySQL, y un frontend en React con TypeScript y Vite. Utiliza Docker para la contenerización y despliegue.

## Arquitectura

- **Backend**: API RESTful construida con Node.js, Express y Prisma. Incluye autenticación JWT, integración con PayPal, envío de correos, y gestión de base de datos.
- **Frontend**: Interfaz de usuario moderna construida con React, TypeScript, Vite, Ant Design, Tailwind CSS y Framer Motion.
- **Base de Datos**: MySQL con Prisma como ORM.
- **Cache**: Redis para almacenamiento en caché.
- **Contenerización**: Docker y Docker Compose para desarrollo y producción.

## Tecnologías Principales

### Backend
- Node.js
- Express.js
- Prisma (ORM para MySQL)
- JWT (autenticación)
- PayPal SDK
- Nodemailer
- Multer (subida de archivos)
- Swagger (documentación API)

### Frontend
- React 19
- TypeScript
- Vite
- Ant Design
- Tailwind CSS
- Framer Motion
- Axios
- React Router
- Leaflet (mapas)
- Three.js (modelos 3D)
- Recharts (gráficos)

### Infraestructura
- Docker
- Docker Compose
- MySQL 8.0
- Redis 7

## Instalación y Configuración

### Prerrequisitos
- Docker y Docker Compose
- Node.js (para desarrollo local sin Docker)
- npm o yarn

### Configuración con Docker (Recomendado)

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd WebInversan
```

2. Crea un archivo `.env` en la raíz del proyecto con las variables de entorno necesarias:
```env
MYSQL_ROOT_PASSWORD=tu_password_root
MYSQL_DATABASE=webinversan
MYSQL_USER=webinversan_user
MYSQL_PASSWORD=tu_password_usuario

# Otras variables para el backend (ver Web/Backend/.env.example)
DATABASE_URL="mysql://webinversan_user:tu_password_usuario@db:3306/webinversan"
PORT=3000
JWT_SECRET=tu_jwt_secret
# etc.
```

3. Construye y ejecuta los contenedores:
```bash
docker-compose up --build
```

La aplicación estará disponible en:
- Frontend: http://localhost:5000
- Backend API: http://localhost:3000
- Base de datos: localhost:3306
- Redis: localhost:6379

### Configuración Local (Sin Docker)

#### Backend
```bash
cd Web/Backend
npm install
cp .env.example .env
# Edita .env con tus credenciales locales
npm run prisma:generate
npm run prisma:reset
npm run dev
```

#### Frontend
```bash
cd Web/FrontEnd
npm install
npm run dev
```

## Uso

### Panel de Administración
- Gestiona modelos de carros y sus productos asociados.
- Administra usuarios, roles y privilegios.
- Maneja pedidos, facturas y entregas.
- Visualiza reportes y estadísticas.

### API
La API incluye endpoints para:
- Autenticación y autorización
- Gestión de productos y modelos
- Pedidos y facturas
- Usuarios y roles
- Sucursales y empleados
- Notificaciones y reportes

Documentación completa disponible en `/api-docs` cuando el backend esté ejecutándose.

## Estructura del Proyecto

```
WebInversan/
├── docker-compose.yml          # Configuración de Docker Compose
├── docker-compose.dev.yml      # Configuración de desarrollo
├── docker/
│   └── web/
│       └── Dockerfile          # Dockerfile para el contenedor web
├── Web/
│   ├── Backend/
│   │   ├── Dockerfile          # Dockerfile del backend
│   │   ├── package.json
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Esquema de la base de datos
│   │   │   └── migrations/     # Migraciones de Prisma
│   │   └── src/
│   │       ├── Controllers/    # Lógica de negocio
│   │       ├── Routes/         # Definición de rutas
│   │       ├── middleware/     # Middlewares
│   │       └── index.js        # Punto de entrada
│   └── FrontEnd/
│       ├── Dockerfile          # Dockerfile del frontend
│       ├── Dockerfile.dev      # Dockerfile de desarrollo
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── src/
│           ├── components/     # Componentes React
│           ├── pages/          # Páginas
│           ├── api/            # Servicios API
│           └── types/          # Tipos TypeScript
```

## Scripts Disponibles

### Backend
- `npm run dev`: Ejecuta el servidor en modo desarrollo con auto-reload
- `npm start`: Ejecuta el servidor en modo producción
- `npm run prisma:generate`: Genera el cliente de Prisma
- `npm run prisma:migrate`: Ejecuta migraciones de base de datos
- `npm run prisma:studio`: Abre Prisma Studio (interfaz visual de BD)
- `npm run prisma:seed`: Ejecuta seeders de datos

### Frontend
- `npm run dev`: Ejecuta el servidor de desarrollo de Vite
- `npm run build`: Construye la aplicación para producción
- `npm run build:ssr`: Construye el renderer SSR público
- `npm run start:ssr`: Sirve la SPA y las páginas SSR de llantas en el puerto 5000
- `npm run test:seo`: Ejecuta pruebas de slugs y rutas SSR
- `npm run preview`: Vista previa de la build de producción
- `npm run lint`: Ejecuta ESLint

### SSR de productos públicos

El frontend conserva React/Vite para el resto del sitio. El contenedor de producción
usa un servidor Node pequeño para renderizar dinámicamente `/llantas/:slug` y
redirigir `/product/:id`; precio e inventario no se dejan en caché. El servidor
consulta la API interna mediante `SSR_API_URL`, mientras `PUBLIC_API_URL` se usa
para generar URLs públicas de imágenes y `PUBLIC_SITE_URL` para canonical/OG.
Ninguna respuesta SSR expone el costo interno del producto.

Para probar con el backend local activo, primero construye en
`Web/FrontEnd`:

```powershell
$env:VITE_API_URL = "http://localhost:3000"
$env:VITE_PUBLIC_SITE_URL = "http://localhost:5000"
npm ci
npm run build
$env:SSR_API_URL = "http://localhost:3000"
$env:PUBLIC_API_URL = "http://localhost:3000"
$env:PUBLIC_SITE_URL = "http://localhost:5000"
npm run start:ssr
```

En otra terminal, usa el slug de un producto existente:

```powershell
$url = "http://localhost:5000/llantas/roadx-265-65-r17-rxmotion-123"
curl.exe -i $url
curl.exe -s $url | Select-String -Pattern "<title>|265/65R17|Lps\.|Descripción"
curl.exe -i "http://localhost:5000/product/123"
```

La primera URL devuelve `200` con el producto en el HTML inicial; una URL
`/product/:id` o un slug incorrecto con ID existente responde `301`; un ID
inexistente responde `404` y lleva `noindex`. El servidor Vite de desarrollo
(`npm run dev`) sigue siendo para HMR; para comprobar SSR local se usa la build
y `npm run start:ssr`.

Las páginas SSR de llantas incluyen Product y Offer JSON-LD en el `<head>`.
La disponibilidad estructurada representa el stock total de todas las
sucursales; después de hidratar, la interfaz puede mostrar el stock de la
sucursal seleccionada sin alterar esa disponibilidad pública. La página se
sirve sin caché para que el siguiente SSR refleje el stock y precio actuales.
No se emite `itemCondition`, ya que el catálogo no identifica explícitamente
si un artículo es nuevo o usado.

Después del despliegue, valida una URL pública con
[Google Rich Results Test](https://search.google.com/test/rich-results). Para
comprobar el SSR local sin ejecutar JavaScript, inspecciona el origen de la
página o ejecuta:

```powershell
curl.exe -s $url | Select-String -Pattern 'application/ld\+json|schema.org/(InStock|OutOfStock)'
```

El JSON-LD del origen incluye solo precio de detalle público (incluida una
promoción activa), stock general, imágenes públicas y especificaciones; no
incluye costo, mayoreo, margen ni inventario privado por bodega.

Las páginas de medida y vehículo se publican solo cuando existen productos
activos con esa medida o una asociación explícita `Modelo_Producto`. El
sitemap y el feed RSS de Merchant Center se sirven en `/sitemap.xml` y
`/google-merchant.xml`; la configuración de Search Console y validación está
documentada en [docs/GOOGLE_SEO_SETUP.md](docs/GOOGLE_SEO_SETUP.md).

## Control de Versiones y Changelog

Este repositorio utiliza un changelog manual en `CHANGELOG.md`.

- Registra cambios en la sección `Unreleased` antes de crear una nueva release.
- Usa ramas descriptivas para cada feature o corrección (por ejemplo, `feature/nombre` o `fix/descripcion`).
- Mantén los commits atómicos y con mensajes claros.

Para ver el historial de cambios, abre `CHANGELOG.md`.

## Estándares de Código y Comentarios

- Usa comentarios JSDoc en funciones y métodos del backend para describir entradas, salidas y comportamiento.
- Añade comentarios inline donde la lógica no sea inmediata, especialmente en middleware, servicios y rutas.
- En el frontend, documenta hooks y funciones de servicio con comentarios claros.
- No necesitas comentar cada línea; enfócate en explicar el propósito de bloques complejos y el contrato de las funciones.

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia ISC.</content>
<filePath>README.md