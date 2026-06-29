import Sidebar from "./Sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { Button, Select, Input, AutoComplete, Modal } from "antd";

import TireOutlined from "../assets/tire.svg?react";

import {
  BellOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CommentOutlined,
  ShoppingOutlined,
  PhoneOutlined,
  MenuUnfoldOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { getPrivilegesUser, type Privilegio } from "../api/auth/privileges";
import { getUserToken, type Usuario, GUEST_USER } from "../api/user/user";
import type { EmpleadoSucursal, Sucursal } from "../types/branch";
import { buscarProductos } from "../api/products/busqueda";
import { CART_UPDATED_EVENT, getCart } from "../api/cart/cart";
import { getMyNotifications } from "../api/notifications/notifications";
import { getEmployeesForBranch } from "../api/branches/branches";
import { logBusqueda } from "../api/reportes/reportes";

const SESSION_ID_KEY = "web_session_id";
const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

export interface ShoppingHeaderHandle {
  showCartItems: (numberItems: number) => void;
  showNotificationCount: (numberItems: number) => void;
}

export interface ShoppingHeaderProps {
  branches: Sucursal[];
  initBranch: number;
  setInitBranch: (value: number) => void;
}

export type Branch = { id: number; name: string };

export type SubMenuItem = {
  icon: React.JSX.Element;
  text: string;
  path: string;
  select: boolean;
  requiresAuth?: boolean; // Solo para usuarios logueados
};

const SubMenuData: SubMenuItem[] = [
  { icon: <HomeOutlined />, text: "Inicio", path: "/", select: true },
  { icon: <TireOutlined />, text: "Llantas", path: "/search", select: false },
  {
    icon: <ShoppingOutlined />,
    text: "Mis Pedidos",
    path: "/orders",
    select: false,
    requiresAuth: true, // Solo para usuarios logueados
  },
  {
    icon: <PhoneOutlined />,
    text: "Contáctanos",
    path: "/contact",
    select: false,
  },
  {
    icon: <CommentOutlined />,
    text: "Sugerencias",
    path: "/suggestions",
    select: false,
  },
];

const NOTIFICATIONS_SEEN_KEY = "notificationsSeenCount";
const NOTIFICATIONS_VIEWED_EVENT = "notificationsViewed";
const ADMIN_SIDEBAR_STORAGE_KEY = "adminSidebarOpen";
const ADMIN_SIDEBAR_EVENT = "admin-sidebar-toggle";
const ADMIN_SIDEBAR_ENABLED_KEY = "adminSidebarEnabled";
const ADMIN_SIDEBAR_ENABLED_EVENT = "admin-sidebar-enabled";
const SIDEBAR_BREAKPOINT = 768;

const getDefaultSidebarOpen = (): boolean => {
  if (typeof window === "undefined") return true;

  const saved = localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY);
  if (saved !== null) return saved === "true";

  return window.innerWidth >= SIDEBAR_BREAKPOINT;
};

const ShoppingHeader = forwardRef<ShoppingHeaderHandle, ShoppingHeaderProps>(
  ({ branches, initBranch, setInitBranch }, ref) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [cartItems, setCartItems] = useState<number>(0);
    const [notificationCount, setNotificationCount] = useState<number>(0);
    const [selectedBranch, setSelectedBranch] = useState<number>(initBranch);
    const [employeeBranchId, setEmployeeBranchId] = useState<number | null>(
      null,
    );
    const [subMenuItems, setSubMenuItems] =
      useState<SubMenuItem[]>(SubMenuData);
    const [menuOpen, setMenuOpen] = useState<boolean>(getDefaultSidebarOpen);
    const [isDesktop, setIsDesktop] = useState<boolean>(() => {
      if (typeof window === "undefined") return true;
      return window.innerWidth >= SIDEBAR_BREAKPOINT;
    });
    const [hasSidebarAccess, setHasSidebarAccess] = useState<boolean>(false);
    const [canChangeBranch, setCanChangeBranch] = useState<boolean>(false);
    const [privileges, setPrivileges] = useState<Privilegio[]>([]);
    const [currentUser, setCurrentUser] = useState<Usuario>(GUEST_USER);
    const [searchValue, setSearchValue] = useState("");
    const [options, setOptions] = useState<
      { value: string; label: React.ReactNode }[]
    >([]);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const employeeBranch = useMemo(
      () =>
        branches.find((branch) => branch.id_sucursal === employeeBranchId) ??
        null,
      [branches, employeeBranchId],
    );

    const visibleBranches = useMemo(() => {
      if (hasSidebarAccess && !canChangeBranch && employeeBranch) {
        return [employeeBranch];
      }

      return branches;
    }, [branches, hasSidebarAccess, canChangeBranch, employeeBranch]);

    const showClientNav =
      !hasSidebarAccess &&
      !location.pathname.startsWith("/admin") &&
      !location.pathname.startsWith("/delivery") &&
      !location.pathname.startsWith("/inv");
    const showCartButton = !hasSidebarAccess && showClientNav;
    const hideHeaderLogo = false;

    // La barra de búsqueda es visible para: invitados, clientes (SOLO_CLIENTES/IS_MAYORIST), o usuarios sin privilegios
    const isGuest = !currentUser || !currentUser.id_usuario;
    const hasClientPrivilege = privileges.some((p) => p.nombre === "SOLO_CLIENTES" || p.nombre === "IS_MAYORIST");
    const hasNoPrivileges = currentUser?.id_usuario && privileges.length === 0;
    const showSearchBar = isGuest || hasClientPrivilege || hasNoPrivileges;

    const updateSidebarState = (next: boolean) => {
      setMenuOpen(next);
      localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, String(next));
      window.dispatchEvent(
        new CustomEvent(ADMIN_SIDEBAR_EVENT, { detail: { open: next } }),
      );
    };

    const updateSidebarEnabled = (enabled: boolean) => {
      localStorage.setItem(ADMIN_SIDEBAR_ENABLED_KEY, String(enabled));
      window.dispatchEvent(
        new CustomEvent(ADMIN_SIDEBAR_ENABLED_EVENT, { detail: { enabled } }),
      );
    };

    const handleLogoClick = () => {
      navigate(hasSidebarAccess ? "/admin" : "/");
    };

    const applyBranchSelection = (branchId: number) => {
      if (branchId === selectedBranch) return;

      const doSwitch = () => {
        setSelectedBranch(branchId);
        // setInitBranch = handleBranchChange from PageLayout, which persists
        // selectedBranch to localStorage and dispatches "branchChanged".
        setInitBranch(branchId);

        // Despachar el evento reactivamente para que React actualice los contadores 
        // y el contenido del carrito de forma suave sin forzar refresh de URL.
        window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      };

      // If there are items in the current cart, ask the user to confirm
      if (showCartButton && cartItems > 0) {
        Modal.confirm({
          title: "¿Cambiar de sucursal?",
          content:
            "Tu carrito actual se guardará. Al volver a esta sucursal tus productos estarán aquí.",
          okText: "Sí, cambiar",
          cancelText: "Cancelar",
          okButtonProps: { style: { background: "#027EB1", borderColor: "#027EB1" } },
          onOk: doSwitch,
        });
      } else {
        doSwitch();
      }
    };

    const handleSearch = async (value?: string) => {
      const term = value || searchValue;
      if (term.trim()) {
        const sessionId = getOrCreateSessionId();
        // Log the search
        try {
          await logBusqueda({
            termino: term.trim(),
            tuvo_resultado: options.length > 0 || !!value, // heuristic if direct select
            id_sesion: sessionId
          });
        } catch (err) {
          console.error("Error logging search:", err);
        }

        navigate("/search", { state: { searchTerm: term.trim() } });
        setSearchValue("");
        setOptions([]);
      }
    };

    const onSearchUpdate = async (searchText: string) => {
      setSearchValue(searchText);

      if (searchTimeout.current) clearTimeout(searchTimeout.current);

      if (searchText.length < 2) {
        setOptions([]);
        return;
      }

      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await buscarProductos({
            busqueda: searchText,
            id_sucursal: selectedBranch,
            page: 1,
            pageSize: 5,
          });

          const suggestions = (res?.data || []).map((item: any) => ({
            value: item.nombre,
            label: (
              <div className="flex items-center justify-between gap-2 py-2 px-2 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-[#003E7B] text-xs md:text-sm truncate">
                    {item.nombre}
                  </span>
                  <span className="text-[10px] text-[#6b7280] uppercase truncate">
                    {item.marca}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[#027EB1] font-bold text-xs md:text-sm">
                    Lps {item.precio_detalle?.toLocaleString()}
                  </span>

                  {item.stock_total <= 0 && (
                    <div className="text-[9px] text-red-500 font-bold">
                      Agotado
                    </div>
                  )}
                </div>
              </div>
            ),
          }));
          setOptions(suggestions);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      }, 300);
    };

    const setSeenNotificationsCount = (value: number): void => {
      localStorage.setItem(NOTIFICATIONS_SEEN_KEY, String(Math.max(0, value)));
    };

    const formatBadgeCount = (value: number): string =>
      value > 99 ? "99+" : String(value);

    const loadCartCount = async (): Promise<void> => {
      try {
        const response = await getCart();
        const count = (response.cart.products || []).reduce((acc, product) => {
          return acc + (product.amount || 0);
        }, 0);
        setCartItems(count);
      } catch (error) {
        setCartItems(0);
      }
    };

    const loadNotificationCount = async (): Promise<void> => {
      try {
        const response = await getMyNotifications("unread");
        const unreadCount = response.unreadCount ?? response.data?.length ?? 0;

        if (location.pathname === "/notification") {
          setSeenNotificationsCount(unreadCount);
          setNotificationCount(0);
          return;
        }

        setNotificationCount(unreadCount);
      } catch (error) {
        setNotificationCount(0);
      }
    };

    const fetchPrivileges = async () => {
      try {
        const response = await getPrivilegesUser();
        setPrivileges(response);

        // Client-only privileges that do NOT grant sidebar access
        const CLIENT_ONLY_PRIVS = ["SOLO_CLIENTES", "IS_MAYORIST"];
        const canSeeSidebar =
          response.length > 0 &&
          response.some((priv) => !CLIENT_ONLY_PRIVS.includes(priv.nombre));

        const hasAllAccess = response.some((priv) => priv.nombre === "ALL_ACCESS");

        setHasSidebarAccess(canSeeSidebar);
        setCanChangeBranch(hasAllAccess);
        updateSidebarEnabled(canSeeSidebar);

        if (!canSeeSidebar) {
          updateSidebarState(false);
          setEmployeeBranchId(null);
          return;
        }

        const savedState = localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY);
        if (savedState === null) {
          updateSidebarState(isDesktop);
        } else {
          setMenuOpen(isDesktop ? savedState === "true" : false);
        }
      } catch (error) {
        setPrivileges([]);
        setHasSidebarAccess(false);
        setCanChangeBranch(false);
        setEmployeeBranchId(null);
        updateSidebarEnabled(false);
        updateSidebarState(false);
      }
    };

    const fetchUser = async () => {
      try {
        const response = await getUserToken();
        if (!response) return;
        setCurrentUser(response);
      } catch (error) {
        console.error(error);
      }
    };

    const findEmployeeBranch = async (userId: number) => {
      if (!userId || branches.length === 0) return;

      const managedBranch = branches.find(
        (branch) => branch.id_usuario === userId,
      );
      if (managedBranch) {
        setEmployeeBranchId(managedBranch.id_sucursal);
        applyBranchSelection(managedBranch.id_sucursal);
        return;
      }

      for (const branch of branches) {
        const employees: EmpleadoSucursal[] = await getEmployeesForBranch(
          branch.id_sucursal,
        );
        const belongsToBranch = employees.some(
          (employee) => employee.id_usuario === userId,
        );

        if (belongsToBranch) {
          setEmployeeBranchId(branch.id_sucursal);
          applyBranchSelection(branch.id_sucursal);
          return;
        }
      }

      setEmployeeBranchId(null);
    };

    const scroll = (direction: "left" | "right") => {
      if (scrollRef.current) {
        const { scrollLeft } = scrollRef.current;
        const scrollTo =
          direction === "left" ? scrollLeft - 150 : scrollLeft + 150;
        scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
      }
    };

    useEffect(() => {
      setSelectedBranch(initBranch);
    }, [initBranch]);

    useEffect(() => {
      const handleResize = () => {
        setIsDesktop(window.innerWidth >= SIDEBAR_BREAKPOINT);
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
      fetchPrivileges();
      fetchUser();
    }, [location.pathname, isDesktop]);

    useEffect(() => {
      if (
        !hasSidebarAccess ||
        canChangeBranch ||
        !currentUser.id_usuario ||
        branches.length === 0
      ) {
        return;
      }

      void findEmployeeBranch(currentUser.id_usuario);
    }, [
      hasSidebarAccess,
      canChangeBranch,
      currentUser.id_usuario,
      branches.length,
    ]);

    useEffect(() => {
      if (
        hasSidebarAccess &&
        canChangeBranch &&
        initBranch &&
        selectedBranch !== initBranch
      ) {
        setSelectedBranch(initBranch);
      }
    }, [canChangeBranch, hasSidebarAccess, initBranch, selectedBranch]);

    useEffect(() => {
      const pathname = location.pathname;
      setSubMenuItems(
        SubMenuData.filter((item) => {
          // Si el item requiere autenticación y el usuario no está logueado, ocultarlo
          if (item.requiresAuth && !currentUser.id_usuario) {
            return false;
          }
          return true;
        }).map((item) => ({
          ...item,
          select: item.path === pathname,
        })),
      );
    }, [location.pathname, currentUser.id_usuario]);

    useEffect(() => {
      if (showCartButton) {
        void loadCartCount();
      } else {
        setCartItems(0);
      }
      void loadNotificationCount();
    }, [location.pathname, showCartButton]);

    useEffect(() => {
      const onCartUpdated = () => {
        if (showCartButton) {
          void loadCartCount();
        }
      };

      const onNotificationsViewed = (event: Event) => {
        const customEvent = event as CustomEvent<{ unreadCount?: number }>;
        const unreadCount = customEvent.detail?.unreadCount ?? 0;
        setSeenNotificationsCount(unreadCount);
        setNotificationCount(0);
      };

      window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
      window.addEventListener(
        NOTIFICATIONS_VIEWED_EVENT,
        onNotificationsViewed as EventListener,
      );

      return () => {
        window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
        window.removeEventListener(
          NOTIFICATIONS_VIEWED_EVENT,
          onNotificationsViewed as EventListener,
        );
      };
    }, [showCartButton]);

    useEffect(() => {
      const enabledHandler = (event: Event) => {
        const customEvent = event as CustomEvent<{ enabled: boolean }>;
        setHasSidebarAccess(customEvent.detail?.enabled ?? false);
      };

      window.addEventListener(
        ADMIN_SIDEBAR_ENABLED_EVENT,
        enabledHandler as EventListener,
      );
      return () => {
        window.removeEventListener(
          ADMIN_SIDEBAR_ENABLED_EVENT,
          enabledHandler as EventListener,
        );
      };
    }, []);

    useEffect(() => {
      return () => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      showCartItems: (n) => setCartItems(n),
      showNotificationCount: (n) => setNotificationCount(n),
    }));

    return (
      <div className="sticky top-0 z-50 w-full bg-white shadow-sm">
        <div
          className="border-b-[3px] border-[#027EB1] px-2 sm:px-3 md:px-6 py-3 sm:py-5 transition-all duration-300"
        >
          <div className="flex flex-col xl:flex-row xl:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="shrink-0 flex items-center gap-2 sm:gap-3">
                {hasSidebarAccess && !menuOpen && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSidebarState(true);
                    }}
                    className="!h-10 !w-10 sm:!h-12 sm:!w-12 !rounded-xl !border-none !bg-[#027EB1] !text-white hover:!bg-[#026a96] shadow-sm"
                    icon={<MenuUnfoldOutlined />}
                  />
                )}

                {!hideHeaderLogo && (
                  <div
                    className="cursor-pointer shrink-0"
                    onClick={handleLogoClick}
                  >
                    <img
                      alt="Inversan Logo"
                      src="/logo.svg"
                      className="h-9 sm:h-12 md:h-14 lg:h-16 w-auto"
                    />
                  </div>
                )}
              </div>

              {showSearchBar && (
                <div className="flex-1 min-w-0 max-w-[700px] header-autocomplete-container">
                  <AutoComplete
                    options={options}
                    onSelect={(value) => handleSearch(value)}
                    onSearch={onSearchUpdate}
                    value={searchValue}
                    className="w-full"
                    classNames={{ popup: { root: "search-suggestions-popup" } }}
                    popupMatchSelectWidth={true}
                    getPopupContainer={(trigger) => trigger.parentElement!}
                  >
                    <Input
                      prefix={
                        <SearchOutlined className="text-[#027EB1] mr-1 sm:mr-2 text-sm sm:text-base md:text-lg" />
                      }
                      className="!h-10 sm:!h-12 !rounded-xl !bg-[#F3F6FA] !border !border-[#D7E3F0] hover:!border-[#027EB1] focus:!border-[#027EB1] [&.ant-input-affix-wrapper-focused]:!border-[#027EB1] [&.ant-input-affix-wrapper-focused]:!shadow-none text-xs sm:text-sm"
                      placeholder="Buscar por nombre o marca..."
                      onPressEnter={() => handleSearch()}
                    />
                  </AutoComplete>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-3 w-full xl:w-auto">
              <div className="flex-1 min-w-0 xl:flex-none xl:w-[280px]">
                <Select
                  className="w-full !h-10 sm:!h-12 [&_.ant-select-selector]:!h-10 sm:[&_.ant-select-selector]:!h-12 [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!bg-[#F3F6FA] [&_.ant-select-selector]:!border-[#D7E3F0] [&_.ant-select-selector]:!px-2 sm:[&_.ant-select-selector]:!px-3 hover:[&_.ant-select-selector]:!border-[#027EB1] [&_.ant-select-focused_.ant-select-selector]:!border-[#027EB1] [&_.ant-select-selection-item]:!leading-[38px] sm:[&_.ant-select-selection-item]:!leading-[46px] [&_.ant-select-selection-placeholder]:!leading-[38px] sm:[&_.ant-select-selection-placeholder]:!leading-[46px] !rounded-xl [&_.ant-select-selection-item]:!text-xs sm:[&_.ant-select-selection-item]:!text-sm [&_.ant-select-selection-item]:!truncate"
                  value={
                    selectedBranch !== undefined && selectedBranch !== null
                      ? selectedBranch
                      : employeeBranchId !== undefined && employeeBranchId !== null
                        ? employeeBranchId
                        : initBranch !== undefined && initBranch !== null
                          ? initBranch
                          : undefined
                  }
                  loading={branches.length === 0}
                  disabled={hasSidebarAccess && !canChangeBranch}
                  onChange={(value: number) => {
                    applyBranchSelection(value);
                  }}
                  placeholder={
                    <div className="flex gap-1.5 sm:gap-2 text-[#4A4A4A] items-center">
                      <EnvironmentOutlined className="text-[#D61216]" />
                      <span className="text-xs sm:text-sm">Sucursal</span>
                    </div>
                  }
                >
                  {visibleBranches.map((branch) => (
                    <Select.Option
                      key={branch.id_sucursal}
                      value={branch.id_sucursal}
                    >
                      <div className="flex gap-2 items-center text-[#003E7B] truncate">
                        <EnvironmentOutlined className="text-[#D61216]" />
                        {branch.nombre}
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
                {showCartButton && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => navigate("/cart")}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-[#027EB1] text-white rounded-xl flex items-center justify-center hover:bg-[#026a96] transition-colors shadow-sm"
                    >
                      <ShoppingCartOutlined className="text-xl sm:text-2xl" />
                    </button>
                    {cartItems > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-[#D61216] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {formatBadgeCount(cartItems)}
                      </span>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-[#003E7B] text-white rounded-xl flex items-center justify-center hover:bg-[#002d5a] transition-colors shadow-sm"
                >
                  <UserOutlined className="text-xl sm:text-2xl" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => navigate("/notification")}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-[#027EB1] text-white rounded-xl flex items-center justify-center hover:bg-[#026a96] transition-colors shadow-sm"
                  >
                    <BellOutlined className="text-xl sm:text-2xl" />
                  </button>
                  {notificationCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-[#D61216] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {formatBadgeCount(notificationCount)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {showClientNav && (
          <div className="relative w-full border-b border-[#E8EEF5] bg-white flex items-center px-2 md:px-4">
            <Button
              type="text"
              icon={<LeftOutlined />}
              className="md:hidden z-10 text-blue-900 hover:!text-[#027EB1] hover:!bg-white"
              onClick={() => scroll("left")}
            />

            <div
              ref={scrollRef}
              className="flex-1 flex overflow-x-auto no-scrollbar scroll-smooth items-center gap-2 md:gap-8 md:justify-center"
            >
              {subMenuItems.map((item, index) => (
                <div
                  key={index}
                  className={`relative flex flex-col items-center py-3 sm:py-4 px-3 sm:px-4 cursor-pointer whitespace-nowrap transition-all ${item.select ? "text-[#027EB1]" : "text-[#003E7B]"
                    }`}
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg">{item.icon}</span>
                    <span className="text-xs sm:text-sm md:text-base font-medium">
                      {item.text}
                    </span>
                  </div>
                  {item.select && (
                    <div className="absolute bottom-0 w-full h-1 bg-[#027EB1] rounded-t-full" />
                  )}
                </div>
              ))}
            </div>

            <Button
              type="text"
              icon={<RightOutlined />}
              className="md:hidden z-10 text-blue-900 hover:!text-[#027EB1] hover:!bg-white"
              onClick={() => scroll("right")}
            />
          </div>
        )}

        {hasSidebarAccess && (
          <Sidebar
            privileges={privileges}
            open={menuOpen}
            currentUser={currentUser}
            onClose={() => updateSidebarState(false)}
          />
        )}
      </div>
    );
  },
);

export default ShoppingHeader;
