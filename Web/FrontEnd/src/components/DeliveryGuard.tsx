import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { getPrivilegesUser, type Privilegio } from "../api/auth/privileges";
import { getUserToken } from "../api/user/user";

function mapPrivilegesToDeliveryAccess(privs: Privilegio[]): { canEntrega: boolean; isAdmin: boolean } {
  let canEntrega = false;
  let isAdmin = false;
  privs.forEach((p) => {
    switch (p.nombre) {
      case "PED_ENTREGA":
        canEntrega = true;
        break;
      case "ALL_ACCESS":
        canEntrega = true;
        isAdmin = true;
        break;
      case "ADM_USUARIOS":
      case "ADM_SUCURSALES":
        isAdmin = true;
        break;
      default:
        break;
    }
  });
  return { canEntrega, isAdmin };
}

export default function DeliveryGuard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await getUserToken();
        if (cancelled) return;
        if (!user || !user.id_usuario) {
          setStatus("denied");
          navigate("/login", { replace: true });
          return;
        }
        const privs = await getPrivilegesUser();
        if (cancelled) return;
        const { canEntrega, isAdmin } = mapPrivilegesToDeliveryAccess(privs);
        if (isAdmin || canEntrega) {
          setStatus("allowed");
        } else {
          setStatus("denied");
          navigate("/admin", { replace: true });
        }
      } catch {
        if (!cancelled) {
          setStatus("denied");
          navigate("/login", { replace: true });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

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
