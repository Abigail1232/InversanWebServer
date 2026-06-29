import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getPrivilegesUser } from "../api/auth/privileges";
import { mapPrivilegesToPermissions, isAdminRestrictedClientRoute, isUserAdmin } from "../lib/routePermissions";

export default function ClientGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const privs = await getPrivilegesUser();
        if (cancelled) return;
        
        const permissions = mapPrivilegesToPermissions(privs);
        const isAdmin = isUserAdmin(permissions);
        const isRestrictedRoute = isAdminRestrictedClientRoute(location.pathname);

        if (isAdmin && isRestrictedRoute) {
          setStatus("denied");
          navigate("*", { replace: true });
          return;
        }

        setStatus("allowed");
      } catch {
        if (!cancelled) {
          setStatus("allowed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, location.pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="text-[#6b7280]">Cargando...</div>
      </div>
    );
  }
  if (status === "denied") return null;
  return <Outlet />;
}
