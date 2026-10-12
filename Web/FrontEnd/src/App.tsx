import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import "./App.css";
import ScrollToTop from "./components/ScrollToTop";

import LoadingScreen from "./components/LoadingScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLayout from "./pages/PageLayout";
import ProductDetailPage from "./pages/Client/productDetailPage";
import HomePage from "./pages/Client/home";
import type { Product } from "./types/product";
import TireSizePage from "./pages/Client/TireSizePage";
import VehicleTirePage from "./pages/Client/VehicleTirePage";
import type {
  TireSizeLandingData,
  VehicleLandingData,
} from "./api/seo";
import { parseTireSizeSlug } from "./seo/productSeo";

const DesignManagement = lazy(() => import("./pages/admin/DesignManagement"));
const Login = lazy(() => import("./pages/Auth/Login"));
const Register = lazy(() => import("./pages/Auth/Register"));
const Orders = lazy(() => import("./pages/Client/orders"));
const GuestOrderView = lazy(() => import("./pages/Client/GuestOrderView"));
const OrderVerifier = lazy(() => import("./pages/Client/OrderVerifier"));
const DeliveryHistory = lazy(() => import("./pages/Client/deliveryHistory"));
const SearchPage = lazy(() => import("./pages/Client/searchPage"));
const PromotionPage = lazy(() => import("./pages/Client/promotion"));
const BrandPage = lazy(() => import("./pages/Client/brandPage"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminPermisos = lazy(() => import("./pages/admin/AdminPermisos"));
const AdminBiometrics = lazy(() => import("./pages/admin/AdminBiometrics"));
const ProfilePage = lazy(() => import("./pages/Client/profile"));
const ChangePasswordPage = lazy(() => import("./pages/Client/changePassword"));
const ForgotPasswordPage = lazy(() => import("./pages/Client/forgotPassword"));
const ContactPage = lazy(() => import("./pages/Client/contact"));
const Suggestions = lazy(() => import("./pages/Client/suggestions"));
const AdminBranches = lazy(() => import("./pages/admin/AdminBranches"));
const Checkout = lazy(() => import("./pages/Client/checkout/index"));
const Error = lazy(() => import("./pages/ErrorPage"));
const CartPage = lazy(() => import("./pages/Client/CartPage"));
const NotificationPage = lazy(() => import("./pages/Client/NotificationPage"));
const ForgotPasswordLog = lazy(() => import("./pages/Auth/forgotPassword"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminRoles = lazy(() => import("./pages/admin/AdminRoles"));
const BrandManagement = lazy(() => import("./pages/admin/BrandManagement"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const DeliveryOrders = lazy(() => import('./pages/delivery/deliveryOrders'));
const DeliveryGuard = lazy(() => import('./components/DeliveryGuard'));
const InvHistory = lazy(() => import('./pages/inventory/history'));
const AdminModels = lazy(() => import("./pages/admin/AdminModels"));
const AdminPedidos = lazy(() => import("./pages/admin/AdminPedidos"));
const AdminPromociones = lazy(() => import('./pages/admin/AdminPromociones'));
const CrearPromocion = lazy(() => import('./pages/admin/CrearPromocion'));
const AdminStockEntry = lazy(() => import("./pages/admin/AdminstockEntry"));
const AdminStockDecrement = lazy(() => import("./pages/admin/AdminStockDecrement"));
const Reportsuggestions = lazy(() => import("./pages/report/Reportsuggestions"));
const ReportVisitas = lazy(() => import("./pages/report/ReportVisitas"));
const ReporteVentas = lazy(() => import("./pages/report/ReporteVentas"));
const MarkAttendance = lazy(() => import("./pages/employees/MarkAttendance"));
const AttendanceReports = lazy(() => import("./pages/employees/AttendanceReports"));
const MyAttendance = lazy(() => import("./pages/employees/MyAttendance"));
const SelfAttendance = lazy(() => import("./pages/employees/SelfAttendance"));

const AdminGuard = lazy(() => import("./components/AdminGuard"));
const DeliveryHistoryGuard = lazy(() => import("./components/DeliveryHistoryGuard"));
const ClientGuard = lazy(() => import("./components/ClientGuard"));

function LegacyProductRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !/^\d+$/.test(id)) {
      setDestination("/search");
      return;
    }
    void import("./api/products/productos")
      .then(({ getProductoById }) => getProductoById(Number(id)))
      .then((product) =>
        import("./seo/productSeo").then(({ buildProductUrl }) =>
          setDestination(buildProductUrl(product)),
        ),
      )
      .catch(() => setDestination("/search"));
  }, [id]);

  useEffect(() => {
    if (destination) navigate(destination, { replace: true });
  }, [destination, navigate]);

  return null;
}

function RouteRobots() {
  const { pathname } = useLocation();
  useEffect(() => {
    const path = pathname.replace(/\/+$/, "") || "/";
    const noindexPrefixes = [
      "/login",
      "/register",
      "/forgot-password",
      "/profile",
      "/cart",
      "/checkout",
      "/orders",
      "/notification",
      "/admin",
      "/mi-asistencia",
      "/marcar-mi-asistencia",
      "/asistencia",
      "/reportes",
      "/delivery",
      "/search",
      "/suggestions",
      "/promotion",
      "/brand",
    ];
    const noindex = noindexPrefixes.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.append(robots);
    }
    robots.content = path === "/brand" || path.startsWith("/brand/")
      ? "noindex,follow"
      : noindex
        ? "noindex,nofollow"
        : "index,follow";
  }, [pathname]);
  return null;
}

/**
 * Componente raíz de la aplicación React.
 *
 * Define el enrutamiento principal, la carga perezosa de pantallas y el
 * manejo de errores global en la interfaz de usuario.
 */
interface AppRoutesProps {
  initialProduct?: Product;
  initialTireSizeData?: TireSizeLandingData;
  initialVehicleData?: VehicleLandingData;
  initialBranch?: number;
  initialMenuOpen?: boolean;
}

export function AppRoutes({
  initialProduct,
  initialTireSizeData,
  initialVehicleData,
  initialBranch,
  initialMenuOpen,
}: AppRoutesProps) {
  return (
    <>
      <RouteRobots />
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPasswordLog />} />

            <Route path="/pedido/:numeroPedido" element={<GuestOrderView />} />
            <Route
              path="/api/pedido/verificar/:numeroPedido"
              element={<OrderVerifier />}
            />

            <Route
              path="/"
              element={
                <PageLayout
                  initialBranch={initialBranch}
                  initialMenuOpen={initialMenuOpen}
                />
              }
            >
              <Route index element={<HomePage />} />
              <Route path="home" element={<HomePage />} />
              <Route
                path="llantas/vehiculo/:brand/:model/:year/:version?"
                element={<VehicleTirePage initialData={initialVehicleData} />}
              />
              <Route
                path="llantas/:slug"
                element={
                  <LandingOrProductRoute
                    initialProduct={initialProduct}
                    initialTireSizeData={initialTireSizeData}
                  />
                }
              />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="mi-asistencia" element={<MyAttendance />} />
              <Route path="marcar-mi-asistencia" element={<SelfAttendance />} />
              <Route
                path="profile/change-password"
                element={<ChangePasswordPage />}
              />
              <Route
                path="profile/forgot-password"
                element={<ForgotPasswordPage />}
              />
              <Route path="orders" element={<Orders />} />
              <Route
                path="delivery-history"
                element={
                  <DeliveryHistoryGuard>
                    <DeliveryHistory />
                  </DeliveryHistoryGuard>
                }
              />
              <Route path="notification" element={<NotificationPage />} />
              <Route path="checkout" element={<Checkout />} />

              {/* Rutas accesibles para clientes y visitantes */}
              <Route element={<ClientGuard />}>
                <Route path="search" element={<SearchPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="suggestions" element={<Suggestions />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="product/:id" element={<LegacyProductRedirect />} />
                <Route path="promotion/:id" element={<PromotionPage />} />
                <Route path="brand/:id" element={<BrandPage />} />
              </Route>

              {/* Rutas administrativas protegidas */}
              <Route path="admin" element={<AdminGuard />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="permissions" element={<AdminPermisos />} />
                <Route path="biometria" element={<AdminBiometrics />} />
                <Route path="branches" element={<AdminBranches />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="roles" element={<AdminRoles />} />
                <Route path="productos" element={<AdminProducts />} />
                <Route path="promotions" element={<AdminPromociones />} />
                <Route path="promotions/add" element={<CrearPromocion />} />
                <Route path="brands" element={<BrandManagement />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="designs" element={<DesignManagement />} />
                <Route path="models" element={<AdminModels />} />
                <Route path="pedidos" element={<AdminPedidos />} />
                <Route
                  path="reportes/sugerencias"
                  element={<Reportsuggestions />}
                />
                <Route path="reportes/visitas" element={<ReportVisitas />} />
                <Route path="reportes/ventas" element={<ReporteVentas />} />

                <Route path="empleados/asistencia/marcar" element={<MarkAttendance />} />
                <Route path="empleados/asistencia/reportes" element={<AttendanceReports />} />
                
                {/* Nuevas rutas de inventario dentro de admin */}
                <Route path="inventory">
                  <Route path="history" element={<InvHistory />} />
                  <Route path="entry" element={<AdminStockEntry />} />
                  <Route path="decrement" element={<AdminStockDecrement />} />
                </Route>
              </Route>

              {/* Rutas de entrega */}
              <Route path="delivery" element={<DeliveryGuard />}>
                <Route index element={<DeliveryOrders />} />
                <Route path="orders" element={<DeliveryOrders />} />
              </Route>
            </Route>
            <Route
              path="*"
              element={
                <Error
                  errorCode="404"
                  errorTitle="Página no encontrada"
                  errorMessage="Lo sentimos, la página que buscas no existe o ha sido movida."
                />
              }
            />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

function LandingOrProductRoute({
  initialProduct,
  initialTireSizeData,
}: Pick<AppRoutesProps, "initialProduct" | "initialTireSizeData">) {
  const { slug = "" } = useParams();
  return parseTireSizeSlug(slug) ? (
    <TireSizePage initialData={initialTireSizeData} />
  ) : (
    <ProductDetailPage initialProduct={initialProduct} />
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
