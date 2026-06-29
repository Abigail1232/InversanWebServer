import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPrivilegesUser } from "../api/auth/privileges";
import { getUserToken } from "../api/user/user";
import { canAccessDeliveryHistory } from "../lib/routePermissions";

type Props = { children: React.ReactNode };

export default function DeliveryHistoryGuard({ children }: Props) {
  const navigate = useNavigate();
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
        if (canAccessDeliveryHistory(privs)) {
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
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="text-[#6b7280]">Cargando...</div>
      </div>
    );
  }
  if (status === "denied") return null;
  return <>{children}</>;
}
