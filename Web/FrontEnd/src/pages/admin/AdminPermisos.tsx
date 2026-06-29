import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { Select, Checkbox, message, Grid, Card, ConfigProvider } from "antd";
import { useLocation } from "react-router-dom";
import LoadingScreen from "../../components/LoadingScreen";
import { getAllRoles } from "../../api/roles/roles";
import {
  getAllPrivilegios,
  getPrivilegiosByRol,
  assignPrivilegio,
  removePrivilegio,
} from "../../api/privileges/privileges";
import type { Rol } from "../../api/roles/roles";
import type { Privilegio } from "../../api/privileges/privileges";

const { useBreakpoint } = Grid;
const PAGE_SIZE = 12;

interface PrivilegeCardProps {
  priv: Privilegio;
  checked: boolean;
  disabled: boolean;
  onToggle: (privilegeId: number, checked: boolean) => void;
}

const PrivilegeCard = memo(({ priv, checked, disabled, onToggle }: PrivilegeCardProps) => (
  <div className="flex flex-col justify-between rounded-2xl border border-[#d1d5dc] bg-white p-5 shadow-sm">
    <div>
      <p className="text-sm font-bold text-[#003E7B] mb-1">{priv.nombre}</p>
      <p className="text-xs text-[#6b7280] mb-4">{priv.descripcion}</p>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onChange={(e) => onToggle(priv.id_privilegio, e.target.checked)}
      />
      <span className={`text-sm font-semibold ${checked ? "text-[#003E7B]" : "text-[#9ca3af]"}`}>
        {checked ? "Permitido" : "No Permitido"}
      </span>
    </div>
  </div>
));

interface MobileCardProps {
  record: Rol;
  privileges: Privilegio[];
  assignedIds: number[];
  onToggle: (rolId: number, privilegeId: number, checked: boolean) => void;
}

const MobileCard = memo(({ record, privileges, assignedIds, onToggle }: MobileCardProps) => (
  <Card className="mb-4 rounded-xl shadow-sm border-slate-200">
    <div className="flex items-center justify-between mb-4 pb-2 border-b">
      <h3 className="font-bold text-lg text-[#003E7B] m-0">{record.nombre}</h3>
      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
        {assignedIds.length} de {privileges.length}
      </span>
    </div>
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {privileges.map((priv) => {
        const isSoloClientesActive = assignedIds.some(
          (id) => privileges.find((p) => p.id_privilegio === id)?.nombre === "SOLO_CLIENTES"
        );
        const hasOtherPrivs = assignedIds.some(
          (id) => {
            const p = privileges.find((p) => p.id_privilegio === id);
            return p?.nombre !== "SOLO_CLIENTES" && p?.nombre !== "IS_MAYORIST";
          }
        );
        let isDisabled = false;
        if (!assignedIds.includes(Number(priv.id_privilegio))) {
          if (priv.nombre === "SOLO_CLIENTES" && hasOtherPrivs) isDisabled = true;
          if (priv.nombre !== "SOLO_CLIENTES" && priv.nombre !== "IS_MAYORIST" && isSoloClientesActive) isDisabled = true;
        }

        return (
          <div
            key={priv.id_privilegio}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              isDisabled ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-gray-100 hover:bg-gray-50"
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDisabled ? 'text-gray-400' : 'text-gray-800'}`}>{priv.nombre}</p>
              <p className={`text-xs truncate mt-1 ${isDisabled ? 'text-gray-300' : 'text-gray-500'}`}>{priv.descripcion}</p>
            </div>
            <Checkbox
              checked={assignedIds.includes(Number(priv.id_privilegio))}
              disabled={isDisabled}
              onChange={(e) => onToggle(record.id_rol, priv.id_privilegio, e.target.checked)}
              className="ml-3 flex-shrink-0"
            />
          </div>
        );
      })}
    </div>
  </Card>
));

const AdminPermisos = () => {
  const screens = useBreakpoint();
  const location = useLocation();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [selectedRol, setSelectedRol] = useState<number | null>(null);
  const [allPrivileges, setAllPrivileges] = useState<Privilegio[]>([]);
  const [rolePrivilegesMap, setRolePrivilegesMap] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const preselectRoleId = useMemo(() => {
    const fromState = (location.state as { preselectRoleId?: number } | null)?.preselectRoleId;
    const fromQuery = new URLSearchParams(location.search).get("rolId");
    const raw = fromState ?? (fromQuery ? Number(fromQuery) : undefined);
    return raw != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
  }, [location.search, location.state]);

  const fetchPrivilegios = useCallback(async () => {
    const data = await getAllPrivilegios();
    setAllPrivileges(data);
  }, []);

  const fetchAllRolePrivileges = useCallback(async (rolesList: Rol[]) => {
    const results = await Promise.all(
      rolesList.map(async (r) => {
        const privs = await getPrivilegiosByRol(r.id_rol);
        return {
          id_rol: r.id_rol,
          ids: Array.isArray(privs) ? privs.map((p) => Number(p.id_privilegio)) : [],
        };
      })
    );
    const map: Record<number, number[]> = {};
    results.forEach(({ id_rol, ids }) => { map[id_rol] = ids; });
    setRolePrivilegesMap(map);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [rolesData] = await Promise.all([getAllRoles(), fetchPrivilegios()]);
        setRoles(rolesData);
        
        // En móvil, seleccionar automáticamente el rol de administrador si no hay preselección
        let defaultSelectedRole = null;
        if (!preselectRoleId && screens.xs) {
          const adminRole = rolesData.find((r) => 
            r.nombre.toLowerCase().includes('admin') || 
            r.nombre.toLowerCase().includes('administrador')
          );
          if (adminRole) {
            defaultSelectedRole = Number(adminRole.id_rol);
            setSelectedRol(defaultSelectedRole);
          }
        } else if (preselectRoleId && rolesData.some((r) => Number(r.id_rol) === preselectRoleId)) {
          setSelectedRol(preselectRoleId);
        }
        
        await fetchAllRolePrivileges(rolesData);
      } catch {
        message.error("Error de conexión");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchPrivilegios, fetchAllRolePrivileges, preselectRoleId, screens.xs]);

  const handleSelectRol = useCallback((id: number | undefined) => {
    setSelectedRol(id ? Number(id) : null);
    setCurrentPage(1);
  }, []);

  const handleTogglePermission = useCallback(
    async (rolId: number, privilegeId: number, checked: boolean) => {
      const numRolId = Number(rolId);
      const numPrivId = Number(privilegeId);

      // --- Exclusividad SOLO_CLIENTES (compatible con IS_MAYORIST) ---
      const clickedPrivName = allPrivileges.find(p => p.id_privilegio === numPrivId)?.nombre;
      const currentPrivIds = rolePrivilegesMap[numRolId] || [];
      const soloClientesPrivId = allPrivileges.find(p => p.nombre === "SOLO_CLIENTES")?.id_privilegio;
      const mayoristPrivId = allPrivileges.find(p => p.nombre === "IS_MAYORIST")?.id_privilegio;

      if (checked) {
        if (clickedPrivName === "SOLO_CLIENTES") {
          const hasIncompatible = currentPrivIds.some(id => id !== mayoristPrivId);
          if (hasIncompatible) {
            message.warning("Debes desasignar todos los demás permisos antes de asignar SOLO_CLIENTES.");
            return;
          }
        }

        if (clickedPrivName !== "SOLO_CLIENTES" && clickedPrivName !== "IS_MAYORIST" && soloClientesPrivId && currentPrivIds.includes(Number(soloClientesPrivId))) {
          message.warning("No puedes asignar otros permisos mientras SOLO_CLIENTES esté activo.");
          return;
        }
      }
      // ------------------------------------

      setRolePrivilegesMap((prev) => ({
        ...prev,
        [numRolId]: checked
          ? [...(prev[numRolId] || []), numPrivId]
          : (prev[numRolId] || []).filter((id) => id !== numPrivId),
      }));

      try {
        if (checked) {
          await assignPrivilegio(numRolId, numPrivId);
        } else {
          await removePrivilegio(numRolId, numPrivId);
        }
      } catch {
        message.error("Error al actualizar permiso");
        const privs = await getPrivilegiosByRol(numRolId).catch(() => []);
        setRolePrivilegesMap((prev) => ({
          ...prev,
          [numRolId]: Array.isArray(privs)
            ? privs.map((p) => Number(p.id_privilegio))
            : prev[numRolId],
        }));
      }
    },
    [allPrivileges, rolePrivilegesMap]
  );

  const handleToggleForSelected = useCallback(
    (privilegeId: number, checked: boolean) => {
      if (!selectedRol) {
        message.warning("Selecciona un rol primero");
        return;
      }
      handleTogglePermission(selectedRol, privilegeId, checked);
    },
    [selectedRol, handleTogglePermission]
  );

  const mobileDataSource = useMemo(() => {
    const base = selectedRol ? roles.filter((r) => r.id_rol === selectedRol) : roles;
    return base.map((r) => ({ ...r, key: r.id_rol }));
  }, [roles, selectedRol]);

  const totalPages = Math.ceil(allPrivileges.length / PAGE_SIZE);

  const paginatedPrivileges = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return allPrivileges.slice(start, start + PAGE_SIZE);
  }, [allPrivileges, currentPage]);

  const selectedAssignedIds = selectedRol ? (rolePrivilegesMap[selectedRol] || []) : [];
  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, allPrivileges.length);

  return (
  <ConfigProvider>
    <div className="min-h-screen flex flex-col bg-gray-50 md:bg-transparent">
      <style>{`
        @media (max-width: 768px) {
          .ant-select-selection-item,
          .ant-select-selection-placeholder {
            text-align: center !important;
            justify-content: center !important;
          }
        }
      `}</style>

      <div className="flex-grow max-w-[1200px] w-full mx-auto px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">

          <div className="mb-4 md:mb-6 mt-2 md:mt-0">
            <h1 className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10">
              Gestión de Permisos
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestiona la información y opciones a la que tiene acceso cada usuario.
            </p>
          </div>

          <div className="md:bg-white md:rounded-xl md:shadow-sm md:px-6 md:py-5 mb-4 flex flex-col md:flex-row items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
              <label className="text-sm font-black text-slate-700 whitespace-nowrap text-center md:text-left">
                Seleccionar Rol de Usuario
              </label>
              <Select
                value={selectedRol ?? undefined}
                placeholder="Selecciona un rol"
                className="w-full md:w-72 h-10"
                onChange={handleSelectRol}
                allowClear
                options={roles.map((r) => ({ label: r.nombre, value: r.id_rol }))}
              />
            </div>
          </div>

          {screens.xs ? (
            <div className="flex flex-col gap-2">
              {mobileDataSource.map((item) => (
                <MobileCard
                  key={item.key}
                  record={item}
                  privileges={allPrivileges}
                  assignedIds={rolePrivilegesMap[item.id_rol] || []}
                  onToggle={handleTogglePermission}
                />
              ))}
            </div>
          ) : (
            <div>
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  <div className="py-2 text-sm text-[#4a5565] mb-3">
                    Mostrando{" "}
                    <span className="font-semibold text-[#1e2939]">{start}-{end}</span>{" "}
                    de{" "}
                    <span className="font-semibold text-[#1e2939]">{allPrivileges.length}</span>{" "}
                    resultados
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedPrivileges.map((priv) => {
                      const isSoloClientesActive = selectedAssignedIds.some(
                        (id) => allPrivileges.find((p) => p.id_privilegio === id)?.nombre === "SOLO_CLIENTES"
                      );
                      const hasOtherPrivs = selectedAssignedIds.some(
                        (id) => {
                          const p = allPrivileges.find((p) => p.id_privilegio === id);
                          return p?.nombre !== "SOLO_CLIENTES" && p?.nombre !== "IS_MAYORIST";
                        }
                      );
                      
                      let isDisabled = !selectedRol;
                      if (selectedRol && !selectedAssignedIds.includes(Number(priv.id_privilegio))) {
                        if (priv.nombre === "SOLO_CLIENTES" && hasOtherPrivs) isDisabled = true;
                        if (priv.nombre !== "SOLO_CLIENTES" && priv.nombre !== "IS_MAYORIST" && isSoloClientesActive) isDisabled = true;
                      }

                      return (
                        <PrivilegeCard
                          key={priv.id_privilegio}
                          priv={priv}
                          checked={selectedAssignedIds.includes(Number(priv.id_privilegio))}
                          disabled={isDisabled}
                          onToggle={handleToggleForSelected}
                        />
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex h-[50px] items-center justify-between bg-[rgba(139,90,43,0.04)] px-4 mt-4 rounded-[10px]">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="rounded-lg border border-[#d1d5dc] bg-white px-3 py-1.5 text-sm font-medium text-[#364153] disabled:opacity-40"
                      >
                        Anterior
                      </button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setCurrentPage(p)}
                            className={`h-10 w-10 rounded-lg text-sm font-medium ${
                              p === currentPage
                                ? "bg-[#0B4E87] text-white"
                                : "border border-[#d1d5dc] bg-white text-[#364153]"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="rounded-lg border border-[#d1d5dc] bg-white px-3 py-1.5 text-sm font-medium text-[#364153] disabled:opacity-40"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  </ConfigProvider>
  );
};

export default AdminPermisos;