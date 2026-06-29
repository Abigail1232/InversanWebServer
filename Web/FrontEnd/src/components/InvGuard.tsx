import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getPrivilegesUser } from "../api/auth/privileges";
import { getUserToken } from "../api/user/user";
import {
  mapPrivilegesToPermissions,
  getRequiredPermissionForInvPath,
} from "../lib/routePermissions";

export default function InvGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await getUserToken();
        if (cancelled) return;
        if (!user?.id_usuario) {
          setStatus("denied");
          navigate("/login", { replace: true });
          return;
        }
        const privs = await getPrivilegesUser();
        if (cancelled) return;
        const permissions = mapPrivilegesToPermissions(privs);
        const required = getRequiredPermissionForInvPath(location.pathname);
        if (required === null || required.length === 0) {
          setStatus("denied");
          navigate("/admin", { replace: true });
          return;
        }
        const hasAny = required.some((p) => permissions.includes(p));
        setStatus(hasAny ? "allowed" : "denied");
        if (!hasAny) navigate("/admin", { replace: true });
      } catch {
        if (!cancelled) {
          setStatus("denied");
          navigate("/login", { replace: true });
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
