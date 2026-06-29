import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getPrivilegesUser } from "../api/auth/privileges";
import { getUserToken } from "../api/user/user";
import {
  mapPrivilegesToPermissions,
  canSeeDashboard,
  getRequiredPermissionForAdminPath,
} from "../lib/routePermissions";
import ErrorPage from "../pages/ErrorPage";

type GuardStatus =
| "loading"
| "unauthenticated"
| "forbidden"
| "allowed";

export default function AdminGuard() {
  const location = useLocation();
  const [status, setStatus] = useState<GuardStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await getUserToken();
        if (cancelled) return;

        if (!user?.id_usuario) {
          setStatus("unauthenticated");
          return;
        }

        const privs = await getPrivilegesUser();
        if (cancelled) return;
        const permissions = mapPrivilegesToPermissions(privs);
        const required = getRequiredPermissionForAdminPath(location.pathname);

        if (required === null) {
          setStatus("allowed");
          return;
        }

        if (required.length === 0) {
          const allowed = canSeeDashboard(permissions);
          setStatus(allowed ? "allowed" : "forbidden");
          return;
        }

        const hasAny = required.some((p) => permissions.includes(p));
        setStatus(hasAny ? "allowed" : "forbidden");

      } catch {
        if (!cancelled) {
          setStatus("unauthenticated");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
      <div className="text-[#6b7280]">Cargando...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  if (status === "forbidden") {
    return (
      <ErrorPage
        errorCode="403"
        errorTitle="Acceso denegado"
        errorMessage="No tienes permisos para acceder a esta sección."
      />
    );
  }

  return <Outlet />;
}
