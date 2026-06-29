import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ShoppingHeader from "../components/Header";
import Footer from "../components/footer";
import type { Sucursal } from "../types/branch";
import { getAllActiveBranches } from "../api/branches/branches";
import { getPrivilegesUser } from "../api/auth/privileges";
import {
  mapPrivilegesToPermissions,
  canSeeDashboard,
} from "../lib/routePermissions";

const LOCAL_STORAGE_KEY = "selectedBranch";
const BRANCH_CHANGED_EVENT = "branchChanged";
const BRANCHES_UPDATED_EVENT = "branchesUpdated";


export default function PageLayout(): React.JSX.Element | null {
  const location = useLocation();
  const navigate = useNavigate();
  const [staffRedirectCheck, setStaffRedirectCheck] = useState<
    "pending" | "client" | "staff"
  >("pending");

  const [branches, setBranches] = useState<Sucursal[]>([]);
  const [initBranch, setInitBranch] = useState<number>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? Number(saved) : 0;
  });


  // Controla si el usuario es cliente (User o Mayoreo) para mostrar el botón de WhatsApp
  const [isClientUser, setIsClientUser] = useState<boolean>(false);

  const fetchBranches = async () => {
    const response = await getAllActiveBranches();
    setBranches(response);

    const savedBranch = Number(localStorage.getItem(LOCAL_STORAGE_KEY) || "0");

    if (response.length === 0) {
      setInitBranch(0);
      if (savedBranch !== 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, "0");
        window.dispatchEvent(new Event(BRANCH_CHANGED_EVENT));
      }
      return;
    }

    const nextBranch = (savedBranch === 0 || response.some(
      (branch) => branch.id_sucursal === savedBranch,
    ))
      ? savedBranch
      : (response[0]?.id_sucursal ?? 0);

    setInitBranch(nextBranch);

    if (nextBranch !== savedBranch) {
      localStorage.setItem(LOCAL_STORAGE_KEY, String(nextBranch));
      window.dispatchEvent(new Event(BRANCH_CHANGED_EVENT));
    }
  };

  const handleBranchChange = (id: number) => {
    setInitBranch(id);
    localStorage.setItem(LOCAL_STORAGE_KEY, String(id));
    window.dispatchEvent(new Event(BRANCH_CHANGED_EVENT));
  };

  useEffect(() => {
    void fetchBranches();
  }, []);

  // Verificar si el usuario es cliente (sin privilegios de admin/staff)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const privs = await getPrivilegesUser();
        if (cancelled) return;
        // Si no tiene privilegios o solo tiene los exclusivos de cliente, es cliente
        const CLIENT_ONLY_PRIVS = ["SOLO_CLIENTES", "IS_MAYORIST"];
        const isClient =
          privs.length === 0 ||
          privs.every((p) => CLIENT_ONLY_PRIVS.includes(p.nombre));
        setIsClientUser(isClient);
      } catch {
        // Si falla (usuario no logueado), también es cliente
        if (!cancelled) setIsClientUser(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    const handleBranchesUpdated = () => {
      void fetchBranches();
    };

    window.addEventListener(BRANCHES_UPDATED_EVENT, handleBranchesUpdated);

    return () => {
      window.removeEventListener(BRANCHES_UPDATED_EVENT, handleBranchesUpdated);
    };
  }, []);

  useEffect(() => {
    const path = location.pathname.replace(/\/$/, "") || "/";
    if (path !== "/" && path !== "/home") {
      setStaffRedirectCheck("client");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const privs = await getPrivilegesUser();
        if (cancelled) return;
        const permissions = mapPrivilegesToPermissions(privs);
        if (canSeeDashboard(permissions)) {
          setStaffRedirectCheck("staff");
          navigate("/admin", { replace: true });
        } else {
          setStaffRedirectCheck("client");
        }
      } catch {
        if (!cancelled) setStaffRedirectCheck("client");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);


  if (location.pathname === "/" || location.pathname === "/home") {
    if (staffRedirectCheck === "pending") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F6FA]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#027EB1] border-t-transparent" />
        </div>
      );
    }
    if (staffRedirectCheck === "staff") return null;
  }

  // El botón de WhatsApp solo aparece si:
  // 1. El usuario es cliente (User o Mayoreo, no admin/vendedor/gestor)
  // 2. No está en la página de contacto (que ya tiene su propio botón)
  const showWhatsApp =
    isClientUser && !location.pathname.startsWith("/contact");

  return (
    <div className="min-h-screen bg-[#F3F6FA]">
      <ShoppingHeader
        branches={branches}
        initBranch={initBranch}
        setInitBranch={handleBranchChange}
      />

      <div
        className="transition-all duration-300"
      >
        <main className="min-h-[calc(100vh-86px)]">
          <Outlet />
        </main>

        <Footer />
      </div>

      {/* WhatsApp FAB - Solo visible para clientes (User y Mayoreo) */}
      {showWhatsApp && (
        <a
          href="https://wa.me/50495240039?text=Hola%20INVERSAN%2C%20me%20gustaría%20más%20información"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contáctanos por WhatsApp"
          className="fixed bottom-6 right-6 w-[52px] h-[52px] bg-[#25d366] hover:bg-[#1ebe5d] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all z-50"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
        </a>
      )}
    </div>
  );
}
