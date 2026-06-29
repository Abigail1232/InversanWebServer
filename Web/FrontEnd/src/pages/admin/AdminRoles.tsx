import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message, Checkbox, ConfigProvider} from "antd";
import { AnimatePresence } from "framer-motion";
import {
  fetchRoles,
  createRole,
  updateRole,
  activateRole,
  deactivateRole,
  type Role,
} from "../../api/admin/roles";
import {
  getAllPrivilegios,
  getPrivilegiosByRol,
  assignPrivilegio,
  removePrivilegio,
  type Privilegio,
} from "../../api/privileges/privileges";
import {
  Pencil,
  X,
  AlertTriangle,
  ChevronLeft,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { Switch } from "antd";

import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";

const ITEMS_PER_PAGE = 6;

type ModalType = "crear" | "editar" | null;

export default function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [selectedRol, setSelectedRol] = useState<Role | null>(null);

  const [formNombre, setFormNombre] = useState("");
  const [formDescription, setFormDescripcion] = useState("");

  // Permissions state
  const [allPrivilegios, setAllPrivilegios] = useState<Privilegio[]>([]);
  const [selectedPrivIds, setSelectedPrivIds] = useState<Set<number>>(new Set());
  const [privsLoading, setPrivsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const filtered = roles.filter((r) => {
    const nombre = r?.nombre?.toLowerCase() || "";
    const descripcion = r?.descripcion?.toLowerCase() || "";
    const term = search.toLowerCase();
    return nombre.includes(term) || descripcion.includes(term);
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await fetchRoles();
      setRoles(data);
    } catch (error) {
      message.error("Error al cargar los roles");
    } finally {
      setLoading(false);
    }
  };

  // --- Columns ---
  const columns: DataTableColumn<Role>[] = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      render: (value) => (
        <div className="w-full text-left px-6 font-semibold text-gray-900">
          {String(value)}
        </div>
      ),
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      render: (value) => (
        <div className="w-full text-left px-6 text-gray-600">
          {String(value)}
        </div>
      ),
    },
    {
      title: "Estado",
      dataIndex: "activo",
      key: "activo",
      width: 120,
      render: (_, rol) => (
        <div className="flex justify-center">
          <Switch
            checked={rol.activo}
            loading={loading && selectedRol?.id_rol === rol.id_rol}
            onChange={() => {
              setSelectedRol(rol);
              setStatusConfirmOpen(true);
            }}
            style={{
              backgroundColor: rol.activo ? "#16A34A" : "#D1D5DB",
            }}
          />
        </div>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, rol) => (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => openEditar(rol)}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
          >
            <Pencil className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // --- Load privileges for modal ---
  const loadPrivilegios = async (roleId?: number) => {
    setPrivsLoading(true);
    try {
      const all = await getAllPrivilegios();
      setAllPrivilegios(all);
      if (roleId !== undefined) {
        const assigned = await getPrivilegiosByRol(roleId);
        setSelectedPrivIds(new Set(assigned.map((p) => p.id_privilegio)));
      } else {
        setSelectedPrivIds(new Set());
      }
    } catch {
      message.error("Error al cargar los privilegios");
    } finally {
      setPrivsLoading(false);
    }
  };

  const togglePriv = (id: number) => {
    const privBeingToggled = allPrivilegios.find(p => p.id_privilegio === id);
    const isSoloClientes = privBeingToggled?.nombre === "SOLO_CLIENTES";

    setSelectedPrivIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Enforce SOLO_CLIENTES exclusivity, but allow IS_MAYORIST
        if (isSoloClientes) {
          // Activar clientes desactiva TODOS los demás EXCEPTO IS_MAYORIST
          const mayoristPrivId = allPrivilegios.find(p => p.nombre === "IS_MAYORIST")?.id_privilegio;
          const hasMayorist = mayoristPrivId && next.has(mayoristPrivId);
          
          next.clear();
          next.add(id);
          if (hasMayorist) next.add(mayoristPrivId); // Mantiene el de mayoreo si estaba activo
        } else {
          // Activar cualquier otro
          const isMayorist = privBeingToggled?.nombre === "IS_MAYORIST";
          const soloClientesPriv = allPrivilegios.find(p => p.nombre === "SOLO_CLIENTES");
          if (!isMayorist && soloClientesPriv && next.has(soloClientesPriv.id_privilegio)) {
            message.warning("El permiso exclusivo de clientes no permite asignar otros permisos simultáneamente.");
            return prev;
          }
          next.add(id);
        }
      }
      return next;
    });
  };

  // --- Save helpers ---
  const syncPrivilegios = async (roleId: number, previousIds: Set<number>) => {
    const toAdd = [...selectedPrivIds].filter((id) => !previousIds.has(id));
    const toRemove = [...previousIds].filter((id) => !selectedPrivIds.has(id));
    await Promise.all([
      ...toAdd.map((id) => assignPrivilegio(roleId, id)),
      ...toRemove.map((id) => removePrivilegio(roleId, id)),
    ]);
  };

  const handleGuardarCrear = async () => {
    if (!formNombre.trim()) return;
    setSaving(true);
    try {
      const nuevoRol = await createRole(formNombre.trim(), formDescription.trim());
      // Assign selected privileges
      await Promise.all(
        [...selectedPrivIds].map((id) => assignPrivilegio(nuevoRol.id_rol, id))
      );
      setRoles((prev) => [...prev, nuevoRol]);
      message.success("Rol creado correctamente");
      closeModal();
    } catch {
      message.error("Error al crear el rol");
    } finally {
      setSaving(false);
    }
  };

  const handleGuardarEditar = async () => {
    if (!formNombre.trim() || !selectedRol) return;
    setSaving(true);
    try {
      const previousIds = new Set(
        (await getPrivilegiosByRol(selectedRol.id_rol)).map((p) => p.id_privilegio)
      );
      const actualizado = await updateRole(
        selectedRol.id_rol,
        formNombre.trim(),
        formDescription.trim(),
      );
      await syncPrivilegios(selectedRol.id_rol, previousIds);
      setRoles(roles.map((r) => (r.id_rol === actualizado.id_rol ? actualizado : r)));
      message.success("Rol actualizado correctamente");
      closeModal();
    } catch {
      message.error("Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedRol) return;
    try {
      setLoading(true);
      const updated = selectedRol.activo
        ? await deactivateRole(selectedRol.id_rol)
        : await activateRole(selectedRol.id_rol);

      setRoles((prev) =>
        prev.map((r) => (r.id_rol === selectedRol.id_rol ? updated : r)),
      );

      message.success(
        selectedRol.activo
          ? "Rol desactivado correctamente"
          : "Rol activado correctamente",
      );
      setStatusConfirmOpen(false);
      setSelectedRol(null);
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Error al cambiar el estado");
    } finally {
      setLoading(false);
    }
  };

  const openCrear = () => {
    setFormNombre("");
    setFormDescripcion("");
    setModalType("crear");
    loadPrivilegios();
  };

  const openEditar = (rol: Role) => {
    setSelectedRol(rol);
    setFormNombre(rol.nombre);
    setFormDescripcion(rol.descripcion);
    setModalType("editar");
    loadPrivilegios(rol.id_rol);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedRol(null);
    setFormNombre("");
    setFormDescripcion("");
    setAllPrivilegios([]);
    setSelectedPrivIds(new Set());
  };

  return (
    <ConfigProvider>
    <div className="min-h-screen flex flex-col bg-gray-50 md:bg-transparent">
      <div className="flex-grow max-w-[1200px] w-full mx-auto px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-5">
            <div className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10">
              Administración de Roles
            </div>
            <div className="text-sm text-slate-500 mt-1">
              Controla las capacidades de los usuarios y asegura la integridad
              de los módulos.
            </div>
          </div>

          {/* Filter bar */}
          <div className="bg-white rounded-2xl shadow-md px-4 py-4 md:px-6 md:py-6 mb-6 border border-[#D7E3F0] flex flex-col lg:flex-row lg:items-center gap-3 md:gap-4">
            <div className="flex-1 w-full">
              <FilterBar
                className="bg-transparent shadow-none px-0 py-0 mb-0 border-none"
                search={{
                  value: search,
                  onChange: (v) => {
                    setSearch(v);
                    setCurrentPage(1);
                  },
                  placeholder: "Buscar por nombre o descripción...",
                }}
                onClear={() => setSearch("")}
              />
            </div>
            <button
              onClick={openCrear}
              className="w-full lg:w-auto px-6 h-11 bg-[#027EB1] text-white rounded-xl hover:bg-[#026085] transition-all font-medium shadow-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <span className="text-xl font-bold">+</span>
              <span>Crear Rol</span>
            </button>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden flex flex-col gap-3 mb-6">
            {paginated.length === 0 ? (
              <div className="text-center text-gray-400 py-10 text-sm bg-white rounded-xl shadow-sm">
                No se encontraron resultados.
              </div>
            ) : (
              paginated.map((rol: any) => (
                <div
                  key={rol.id_rol}
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border border-gray-100"
                >
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-bold text-gray-900">
                      {rol.nombre}
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      {rol.descripcion}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={rol.activo}
                      size="small"
                      loading={loading && selectedRol?.id_rol === rol.id_rol}
                      onChange={() => {
                        setSelectedRol(rol);
                        setStatusConfirmOpen(true);
                      }}
                      style={{
                        backgroundColor: rol.activo ? "#16A34A" : "#D1D5DB",
                      }}
                    />
                    <button
                      onClick={() => openEditar(rol)}
                      className="text-[#027EB1] hover:text-[#026085] transition-colors"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Vista Desktop */}
          {/* Desktop table */}
          <div className="hidden md:block mb-6">
            <DataTable
              rowKey="id_rol"
              columns={columns}
              dataSource={filtered.slice(
                (currentPage - 1) * ITEMS_PER_PAGE,
                currentPage * ITEMS_PER_PAGE,
              )}
              emptyMessage="No se encontraron roles."
              pagination={{
                current: currentPage,
                pageSize: ITEMS_PER_PAGE,
                total: filtered.length,
                onChange: (page) => setCurrentPage(page),
              }}
            />
          </div>
        </div>
      </div>

      {/* Modal de crear/editar */}
      {/* Modals */}
      <AnimatePresence>
        {modalType && (
          <div
            className="fixed inset-0 bg-black/40 flex items-stretch justify-center z-50 md:items-center md:p-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            {(modalType === "crear" || modalType === "editar") && (
              <RolFormModal
                isMobileTitle={modalType === "crear" ? "Crear Rol" : "Editar Rol"}
                desktopTitle={modalType === "crear" ? "Creación de Rol" : "Edición de Rol"}
                nombre={formNombre}
                descripcion={formDescription}
                onNombreChange={setFormNombre}
                onDescripcionChange={setFormDescripcion}
                onClose={closeModal}
                onGuardar={modalType === "crear" ? handleGuardarCrear : handleGuardarEditar}
                saving={saving}
                isEdit={modalType === "editar"}
                onPermissionsClick={() =>
                  navigate("/admin/permissions", {
                    state: { preselectRoleId: selectedRol?.id_rol },
                  })
                }
                allPrivilegios={allPrivilegios}
                selectedPrivIds={selectedPrivIds}
                onTogglePriv={togglePriv}
                privsLoading={privsLoading}
              />
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación de estado (independiente) */}
      <AnimatePresence>
        {statusConfirmOpen && selectedRol && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 md:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setStatusConfirmOpen(false);
                setSelectedRol(null);
              }
            }}
          >
            <div className="bg-white rounded-2xl md:rounded-xl shadow-xl w-[90%] md:w-full max-w-sm mx-auto p-6 md:p-8 text-center">
              <div className="flex justify-center mb-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    selectedRol.activo ? "bg-red-50" : "bg-green-50"
                  }`}
                >
                  {selectedRol.activo ? (
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  )}
                </div>
              </div>
              <h2 className="text-gray-900 font-bold text-lg mb-2">
                {selectedRol.activo ? "Desactivar Rol" : "Activar Rol"}
              </h2>
              <p className="text-sm text-gray-600 mb-1">
                ¿Estás seguro que deseas{" "}
                {selectedRol.activo ? "desactivar" : "activar"} el rol{" "}
                <span className="text-gray-900 font-semibold">
                  '{selectedRol.nombre}'
                </span>
                ?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {selectedRol.activo
                  ? "Podrás volver a activarlo más adelante."
                  : "El rol volverá a estar disponible para su uso."}
              </p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setStatusConfirmOpen(false);
                    setSelectedRol(null);
                  }}
                  className="w-full md:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white order-2 md:order-1 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleToggleStatus}
                  className={`w-full md:w-auto px-6 py-2.5 text-white rounded-lg text-sm font-medium order-1 md:order-2 transition-colors ${
                    selectedRol.activo
                      ? "bg-[#DC2626] hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {selectedRol.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </ConfigProvider>
  );
}

// ─────────────────────────────────────────────
// RolFormModal – with inline permissions panel
// ─────────────────────────────────────────────

interface RolFormModalProps {
  isMobileTitle: string;
  desktopTitle: string;
  nombre: string;
  descripcion: string;
  onNombreChange: (v: string) => void;
  onDescripcionChange: (v: string) => void;
  onClose: () => void;
  onGuardar: () => void;
  allPrivilegios: Privilegio[];
  selectedPrivIds: Set<number>;
  onTogglePriv: (id: number) => void;
  privsLoading: boolean;
  saving: boolean;
  isEdit?: boolean;
  onPermissionsClick?: () => void;
}

function RolFormModal({
  isMobileTitle,
  desktopTitle,
  nombre,
  descripcion,
  onNombreChange,
  onDescripcionChange,
  onClose,
  onGuardar,
  allPrivilegios,
  selectedPrivIds,
  onTogglePriv,
  privsLoading,
  saving,
  isEdit = false,
  onPermissionsClick,
}: RolFormModalProps) {
  const allSelected =
    allPrivilegios.length > 0 &&
    allPrivilegios.every((p) => selectedPrivIds.has(p.id_privilegio));

  const toggleAll = () => {
    if (allSelected) {
      allPrivilegios.forEach((p) => {
        if (selectedPrivIds.has(p.id_privilegio)) onTogglePriv(p.id_privilegio);
      });
    } else {
      // Si seleccionan todos, se seleccionan todos MENOS SOLO_CLIENTES
      allPrivilegios.forEach((p) => {
        if (p.nombre === "SOLO_CLIENTES") return; // skip
        if (!selectedPrivIds.has(p.id_privilegio)) onTogglePriv(p.id_privilegio);
      });
    }
  };

  return (
    <div className="bg-gray-50 md:bg-white w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:rounded-xl shadow-xl md:max-w-2xl flex flex-col overflow-hidden">
      {/* Mobile header */}
      <div className="bg-[#027EB1] text-white px-4 py-4 flex items-center gap-3 md:hidden shrink-0 shadow-sm">
        <button onClick={onClose} className="p-1">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="font-semibold text-[17px] flex-grow text-center pr-8">
          {isMobileTitle}
        </h2>
      </div>

      {/* Desktop header */}
      <div className="hidden md:flex items-center justify-between p-6 pb-4 border-b border-gray-100">
        <h2 className="text-gray-900 font-bold text-xl">{desktopTitle}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className={`min-h-0 flex-grow overflow-y-auto p-4 md:px-6 md:py-5 flex flex-col ${!isEdit ? "md:grid md:grid-cols-2 md:gap-6" : "max-w-md mx-auto w-full"}`}>
        {/* Left column – name & description */}
        <div className="flex flex-col gap-4 md:h-full">
          {/* Nombre */}
          <div>
            <label className="block text-[13px] md:text-sm font-medium text-gray-700 mb-1.5">
              Nombre del rol
            </label>
            <input
              type="text"
              placeholder="Ej: Admin"
              value={nombre}
              onChange={(e) => onNombreChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 md:border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#027EB1] focus:border-transparent shadow-sm"
            />
          </div>

          {/* Descripción */}
          <div className="flex flex-col md:flex-1">
            <label className="block text-[13px] md:text-sm font-medium text-gray-700 mb-1.5">
              Descripción
            </label>
            <textarea
              placeholder="Describe las responsabilidades de este rol..."
              value={descripcion}
              onChange={(e) => onDescripcionChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 md:border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#027EB1] focus:border-transparent resize-none shadow-sm h-[120px] md:flex-1 md:h-full md:min-h-[80px] md:max-h-[180px]"
            />
          </div>

          {/* Permissions section for Edit mode */}
          {isEdit && (
            <div className="mt-2">
              <label className="block text-[13px] md:text-sm font-medium text-gray-700 mb-2">
                Permisos
              </label>
              <button
                type="button"
                onClick={onPermissionsClick}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-[#027EB1] text-[#027EB1] bg-white hover:bg-blue-50 transition-all font-semibold text-sm shadow-sm active:scale-[0.98]"
              >
                <KeyRound className="w-5 h-5" />
                Gestionar permisos del rol
              </button>
            </div>
          )}
        </div>

        {/* Right column – permissions (Create mode only) */}
        {!isEdit && (
          <div className="flex min-h-0 flex-col mt-4 md:mt-0">
            <div className="flex flex-col gap-2 mb-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-[13px] md:text-sm font-medium text-gray-700">
                Permisos
              </label>
              {!privsLoading && allPrivilegios.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="self-start rounded-lg bg-[#EAF7FD] px-3 py-1.5 text-xs text-[#027EB1] hover:bg-[#D9F0FB] font-medium sm:self-auto"
                >
                  {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                </button>
              )}
            </div>

            <div className="max-h-[34vh] overflow-y-auto md:max-h-[260px] rounded-lg border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
              {privsLoading ? (
                <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                  Cargando permisos…
                </div>
              ) : allPrivilegios.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                  No hay permisos disponibles.
                </div>
              ) : (
                allPrivilegios.map((priv) => {
                  const checked = selectedPrivIds.has(priv.id_privilegio);
                  return (
                    <label
                      key={priv.id_privilegio}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors select-none ${checked ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      onClick={() => onTogglePriv(priv.id_privilegio)}
                    >
                      <Checkbox checked={checked} className="shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {priv.nombre}
                        </div>
                        {priv.descripcion && (
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {priv.descripcion}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Counter – only for create */}
            {!privsLoading && allPrivilegios.length > 0 && (
              <div className="text-xs text-gray-400 mt-2 text-right">
                {selectedPrivIds.size} de {allPrivilegios.length} seleccionados
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="shrink-0 flex flex-col md:flex-row items-center justify-end gap-3 bg-white px-4 md:px-6 py-3 md:py-5 border-t border-gray-100">
        <button
          onClick={onGuardar}
          disabled={saving}
          className="w-full md:w-auto px-5 py-3 md:py-2.5 bg-[#027EB1] text-white rounded-lg flex items-center justify-center hover:bg-[#026085] transition-colors order-1 md:order-2 font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando…" : (
            <>
              <span className="md:hidden">Guardar cambios</span>
              <span className="hidden md:inline">Guardar</span>
            </>
          )}
        </button>
        <button
          onClick={onClose}
          disabled={saving}
          className="w-full md:w-auto px-5 py-3 md:py-2.5 bg-white border border-gray-200 md:border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors order-2 md:order-1 font-medium shadow-sm md:shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
