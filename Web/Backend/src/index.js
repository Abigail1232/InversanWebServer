/**
 * Punto de entrada del servidor Express para WebInversan.
 *
 * Este archivo configura middlewares globales, rutas, documentación Swagger,
 * y el manejador de errores global. No contiene lógica de negocio directa.
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const pedidoRoutes = require("./Routes/pedido_route");
const departmentsRoutes = require("./Routes/departments");
const entriesRoutes = require("./Routes/entries");
const authRoutes = require("./Routes/auth_route");
const facturaRoutes = require("./Routes/factura_route");
const usersRoutes = require("./Routes/users");
const privilegesRoutes = require("./Routes/privileges_route");
const rolesRoutes = require("./Routes/roles_route");
const productoRoutes = require("./Routes/products");
const productoIngresoRoutes = require("./Routes/producto_ingreso");
const sucursalRoutes = require("./Routes/sucursal");
const municipioRoutes = require("./Routes/municipio");
const bodegaRoutes = require("./Routes/bodega");
const cartRoutes = require("./Routes/cart");
const notificationRoutes = require("./Routes/notificaciones");
const modelRoutes = require("./Routes/models");
const swaggerUi = require("swagger-ui-express");
const cookieParser = require("cookie-parser");
const swaggerJsdoc = require("swagger-jsdoc");
const suggestionsRoutes = require("./Routes/suggestions");
const paypalRoutes = require("./Routes/paypal_route");
const promocionesRoutes = require("./Routes/promociones");
const marcaRoutes = require("./Routes/marca");
const dashboardRoutes = require("./Routes/dashboard");
const disenosRoutes = require("./Routes/disenos");
const path = require("path");
const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;
const visitasRoutes = require("./Routes/visitas");
const reportesRoutes = require("./Routes/reportes_route");

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "https://web-inversan.vercel.app",
  /https:\/\/web-inversan.*\.vercel\.app$/,
  "https://grupoinversan.com",
  "https://www.grupoinversan.com",
  /^https:\/\/([a-z0-9-]+\.)*grupoinversan\.com$/,
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

// Middlewares globales
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const allowed = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin instanceof RegExp) return allowedOrigin.test(origin);
        return allowedOrigin === origin;
      });

      return callback(allowed ? null : new Error("Origen no permitido por CORS"), allowed);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-cart-token'],
    exposedHeaders: ['x-cart-token']
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/public", express.static(path.join(process.cwd(), "assets")));
app.use("/assets", express.static(path.join(process.cwd(), "assets")));

// Rutas del API
app.use("/api/departments", departmentsRoutes);
app.use("/api/notificaciones", notificationRoutes);
app.use("/api/entries", entriesRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/pedido", pedidoRoutes);
app.use("/api/factura", facturaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/privileges", privilegesRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/products", productoRoutes);
app.use("/api/stock-entries", productoIngresoRoutes);
app.use("/api/sucursales", sucursalRoutes);
app.use("/api/municipios", municipioRoutes);
app.use("/api/bodegas", bodegaRoutes);
app.use("/api/suggestions", suggestionsRoutes);
app.use("/api/paypal", paypalRoutes);
app.use("/api/admin/promociones", promocionesRoutes);
app.use("/api/models", modelRoutes);
app.use("/api/marcas", marcaRoutes);
app.use("/api/disenos", disenosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/assets", express.static(path.join(process.cwd(), "assets")));
app.use("/api/producto-event", visitasRoutes);
app.use("/api/reportes", reportesRoutes);

// Health check básico para verificar que el servidor responde
app.get("/", (req, res) => {
  res.json({ message: "WebInversan API - Server running" });
});

// Documentación Swagger generada automáticamente
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.3",
    info: {
      title: "API's WebInversan",
      version: "1.0.0",
      description: "API para una tienda en línea",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Manejador global de errores
const globalErrorHandler = require("./middleware/errorHandler");
app.use(globalErrorHandler);

// Inicia el servidor en el puerto configurado
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
