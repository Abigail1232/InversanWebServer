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
- `npm run preview`: Vista previa de la build de producción
- `npm run lint`: Ejecuta ESLint

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