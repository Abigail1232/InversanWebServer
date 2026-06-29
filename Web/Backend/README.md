# WebInversan Backend

API Backend para el proyecto WebInversan construido con Node.js, Express y Prisma.

## 🚀 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales de base de datos
```

3. Generar el cliente de Prisma:
```bash
npm run prisma:generate
```

4. Ejecutar migraciones (crear las tablas en la base de datos):
```bash
npm run prisma:migrate
```

## 🏃‍♂️ Ejecución

### Modo Desarrollo (con auto-reload):
```bash
npm run dev
```

### Modo Producción:
```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000` (o el puerto configurado en `.env`)

## 📚 API Endpoints

### Autenticación

#### Registro de Usuario
- **POST** `/api/auth/register`
- Body:
```json
{
  "nombre": "usuario",
  "contrasena": "password123"
}
```

#### Inicio de Sesión
- **POST** `/api/auth/login`
- Body:
```json
{
  "nombre": "usuario",
  "contrasena": "password123"
}
```

## 🗄️ Base de Datos

El proyecto usa Prisma con MySQL. 

### Comandos útiles de Prisma:

- `npm run prisma:studio` - Abrir Prisma Studio (interfaz visual de la BD)
- `npm run prisma:push` - Sincronizar el schema sin crear migración
- `npm run prisma:migrate` - Crear y aplicar nueva migración

## 📁 Estructura del Proyecto

```
Backend/
├── prisma/
│   └── schema.prisma      # Schema de la base de datos
├── src/
│   ├── Controllers/       # Manejo de peticiones HTTP
│   ├── Services/          # Lógica de negocio y DB
│   ├── Routes/            # Definición de rutas
│   ├── config/            # Configuraciones (DB, etc.)
│   └── index.js           # Punto de entrada
```

Para más detalles sobre la arquitectura, consulta la [Guía de Manejo del Backend](./MANEJO_BACKEND.md).
├── .env                  # Variables de entorno (no incluir en git)
├── .env.example          # Ejemplo de variables de entorno
└── package.json
```

## 🔐 Variables de Entorno

- `DATABASE_URL`: URL de conexión a MySQL
- `PORT`: Puerto del servidor (default: 3000)

## 📦 Dependencias Principales

- **express**: Framework web
- **@prisma/client**: ORM para base de datos
- **bcrypt**: Hash de contraseñas
- **cors**: Manejo de CORS
- **dotenv**: Variables de entorno
