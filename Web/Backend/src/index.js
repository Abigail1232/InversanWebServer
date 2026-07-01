/**
 * Punto de entrada del servidor Express para WebInversan.
 * Configura middlewares globales, rutas, documentación Swagger y errores.
 */
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");

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
const suggestionsRoutes = require("./Routes/suggestions");
const paypalRoutes = require("./Routes/paypal_route");
const promocionesRoutes = require("./Routes/promociones");
const marcaRoutes = require("./Routes/marca");
const dashboardRoutes = require("./Routes/dashboard");
const disenosRoutes = require("./Routes/disenos");
const visitasRoutes = require("./Routes/visitas");
const reportesRoutes = require("./Routes/reportes_route");
const asistenciasRoutes = require("./Routes/asistencias");

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET no está definido. El servidor no puede iniciar.");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  "https://grupoinversan.com",
  "https://www.grupoinversan.com",
  "https://api.grupoinversan.com",
  "http://localhost:5173",
  "http://localhost:3000",
  ...envOrigins,
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const allowed = allowedOrigins.some((allowedOrigin) => allowedOrigin === origin);

    if (process.env.DEBUG_CORS === "true") {
      console.log("[CORS] Origin:", origin, "Allowed:", allowed);
    }

    return callback(null, allowed);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-cart-token"],
  exposedHeaders: ["x-cart-token"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());

app.use("/public", express.static(path.join(process.cwd(), "assets")));
app.use("/assets", express.static(path.join(process.cwd(), "assets")));

// Health check básico para verificar que el servidor responde
app.get("/", (req, res) => {
  res.json({ message: "WebInversan API - Server running" });
});

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
app.use("/api/producto-event", visitasRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/asistencias", asistenciasRoutes);

if (process.env.NODE_ENV !== "production") {
  const swaggerUi = require("swagger-ui-express");
  const swaggerJsdoc = require("swagger-jsdoc");
  const swaggerDocs = swaggerJsdoc({
    swaggerDefinition: {
      openapi: "3.0.3",
      info: {
        title: "API's WebInversan",
        version: "1.0.0",
        description: "API para una tienda en línea",
      },
      servers: [{ url: process.env.API_URL || "http://localhost:3000" }],
    },
    apis: ["./Routes/*.js"],
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

const globalErrorHandler = require("./middleware/errorHandler");
app.use(globalErrorHandler);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
