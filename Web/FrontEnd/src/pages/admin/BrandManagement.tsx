import {
  Search,
  Plus,
  MoreVertical,
  Edit2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { message, ConfigProvider } from "antd";
import { ImageWithFallback } from "../../components/ImageWithFallback";
import BrandProductsView from "./BrandProductsView";
import {
  getMarcas,
  crearMarca,
  modificarMarca,
  eliminarMarca,
  getProductosPorMarca,
} from "../../api/products/marcas";
import BrandModal from "../../components/modal/BrandModal";
import { buildAssetUrl } from "../../utils/assetUrl";

interface Brand {
  id: number;
  name: string;
  logo: string;
  banner?: string;
  productCount: number;
  active: boolean;
}

//type BrandFilter = "Todas" | "Activas" | "Inactivas";

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative w-full md:max-w-[620px]">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar marca..."
        className="w-full h-[46px] px-4 pr-12 border border-[#d1d5dc] rounded-[10px] bg-white font-['Arimo'] text-[14px] text-[#1e2939] focus:outline-none focus:border-[#027eb1]"
      />
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-[#99a1af]" />
    </div>
  );
}

function FilterDropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="relative min-w-[220px]">
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#99a1af] pointer-events-none z-10"
        fill="none"
        viewBox="0 0 20 20"
      >
        <path
          d="M4 5h12l-4.5 5.25V15l-3-1.5v-3.25L4 5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-[46px] pl-11 pr-10 border border-[#d1d5dc] rounded-[10px] bg-white font-['Arimo'] text-[14px] appearance-none cursor-pointer hover:border-[#027eb1] transition-colors focus:outline-none focus:border-[#027eb1] ${
          value ? "text-[#1e2939]" : "text-[#99a1af]"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>

      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-[#99a1af] pointer-events-none" />
    </div>
  );
}

interface ActionMenuProps {
  brand: Brand;
  onEdit: () => void;
  onToggleActive: () => void;
}

function ActionMenu({ brand, onEdit, onToggleActive }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreVertical className="size-5 text-[#4a5565]" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 w-[190px] mt-2 bg-white border border-[#d1d5dc] rounded-[10px] shadow-lg overflow-hidden">
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left text-[14px] font-['Arimo'] text-[#1e2939] hover:bg-[#f3f4f6] transition-colors flex items-center gap-3"
            >
              <Edit2 className="size-4 text-green-600" />
              Editar
            </button>

            <button
              onClick={() => {
                onToggleActive();
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-[14px] font-['Arimo'] hover:bg-[#f3f4f6] transition-colors flex items-center gap-3 ${
                brand.active ? "text-[#d61216]" : "text-[#027eb1]"
              }`}
            >
              {brand.active ? (
                <XCircle className="size-4 text-[#d61216]" />
              ) : (
                <RotateCcw className="size-4 text-[#027eb1]" />
              )}
              {brand.active ? "Desactivar" : "Reactivar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface BrandCardProps {
  brand: Brand;
  onEdit: (brand: Brand) => void;
  onToggleActive: (brand: Brand) => void;
  onViewProducts: (brand: Brand) => void;
}

function BrandCard({
  brand,
  onEdit,
  onToggleActive,
  onViewProducts,
}: BrandCardProps) {
  const inactive = !brand.active;

  return (
    <div
      className={`rounded-[16px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] border border-[#e5e7eb] overflow-hidden transition-all ${
        inactive ? "bg-[#f3f4f6]" : "bg-white"
      }`}
    >
      <div className="h-[61px] border-b border-[#e5e7eb] flex items-center justify-between px-[16px] pb-px">
        <div className="flex items-center gap-3 min-w-0">
          <h3
            className={`font-['Arimo',sans-serif] font-bold text-[25px] leading-[24px] truncate ${
              inactive ? "text-[#6b7280]" : "text-[#003e7b]"
            }`}
          >
            {brand.name}
          </h3>
        </div>

        <ActionMenu
          brand={brand}
          onEdit={() => onEdit(brand)}
          onToggleActive={() => onToggleActive(brand)}
        />
      </div>

      <div
        className={`h-[200px] flex items-center justify-center ${
          inactive ? "bg-[#eef0f3]" : "bg-[#f9fafb]"
        }`}
      >
        <div className="w-[140px] h-[140px] rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-4 border-[#f9fafb] p-4">
          <ImageWithFallback
            src={brand.logo}
            alt={brand.name}
            className={`max-w-full max-h-full object-contain ${
              inactive ? "grayscale opacity-70" : ""
            }`}
          />
        </div>
      </div>

      <div className="h-[100px] pt-[16px] px-[16px] flex flex-col gap-[8px]">
        <button
          onClick={() => onViewProducts(brand)}
          className={`w-full h-[42px] rounded-[10px] flex items-center justify-center transition-colors ${
            inactive
              ? "bg-[#9ca3af] hover:bg-[#8b949e]"
              : "bg-[#027eb1] hover:bg-[#026a96]"
          }`}
        >
          <span className="font-['Arimo',sans-serif] font-normal text-[16px] leading-[21px] text-white text-center">
            Ver todos sus productos
          </span>
        </button>

        <p
          className={`font-['Arimo',sans-serif] font-bold text-[14px] leading-[18px] text-center ${
            inactive ? "text-[#9ca3af]" : "text-[#99a1af]"
          }`}
        >
          {brand.productCount} productos
        </p>
      </div>
    </div>
  );
}

interface ConfirmToggleModalProps {
  isOpen: boolean;
  brand: Brand | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function ConfirmToggleModal({
  isOpen,
  brand,
  onClose,
  onConfirm,
}: ConfirmToggleModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !brand) return null;

  const isDeactivate = brand.active;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-[300px] rounded-[16px] bg-white px-5 py-5 text-center shadow-2xl">
        <div className="mx-auto flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#fdf1f1]">
          <AlertTriangle className="size-5 text-[#ef4444]" />
        </div>

        <h2 className="mt-3 font-['Arimo'] text-[16px] font-bold text-[#111827]">
          {isDeactivate ? "Desactivar Marca" : "Reactivar Marca"}
        </h2>

        <p className="mt-2 font-['Arimo'] text-[13px] leading-[19px] text-[#4b5563]">
          {isDeactivate ? (
            <>
              ¿Deseas desactivar{" "}
              <span className="font-bold text-[#111827]">'{brand.name}'</span>?
            </>
          ) : (
            <>
              ¿Deseas reactivar{" "}
              <span className="font-bold text-[#111827]">'{brand.name}'</span>?
            </>
          )}
        </p>

        <p className="mt-1 font-['Arimo'] text-[12px] text-[#6b7280]">
          {isDeactivate
            ? "Podrás revertirlo después."
            : "La marca volverá a estar disponible."}
        </p>

        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-[38px] w-[96px] rounded-[10px] border border-[#d1d5dc] bg-white font-['Arimo'] text-[13px] font-medium text-[#374151] transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`h-[38px] w-[96px] rounded-[10px] font-['Arimo'] text-[13px] font-medium text-white transition-colors disabled:opacity-60 ${
              isDeactivate
                ? "bg-[#ef2222] hover:bg-[#d91c1c]"
                : "bg-[#027eb1] hover:bg-[#026a96]"
            }`}
          >
            {loading
              ? "Procesando..."
              : isDeactivate
              ? "Desactivar"
              : "Reactivar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrandManagement() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  // const [stateFilter, setStateFilter] = useState<BrandFilter>("Activas");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedBrandView, setSelectedBrandView] = useState<Brand | null>(
    null
  );
const loadBrands = async () => {
    try {
      const data = await getMarcas();

      const mapped: Brand[] = await Promise.all(
        data.map(async (marca: any) => {
          let productCount = marca.cantidad_productos ?? 0;

          if (marca.cantidad_productos === undefined) {
            try {
              const productos = await getProductosPorMarca(marca.id_marca);
              productCount = productos.length;
            } catch {
              productCount = 0;
            }
          }

          return {
            id: marca.id_marca,
            name: marca.nombre,
            logo: buildAssetUrl(marca.logo_url ?? marca.imagen_url ?? ""),
            banner: buildAssetUrl(
              marca.banner_url ??
                marca.banner ??
                marca.imagen_banner ??
                marca.banner_imagen ??
                marca.url_banner ??
                ""
            ),
            productCount,
            active: marca.activo ?? true,
          };
        })
      );

      setBrands(mapped);
    } catch (error: any) {
      console.error("Error cargando marcas:", error);
      console.error("Respuesta backend:", error?.response?.data);
      message.error(error?.response?.data?.message || "Ocurrió un error");
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const filteredBrands = useMemo(() => {
    let result = brands.filter((brand) => {
      const matchesSearch = brand.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === ""
          ? true
          : statusFilter === "Activa"
          ? brand.active
          : !brand.active;

      return matchesSearch && matchesStatus;
    });

    result = result.sort((a, b) => {
      if (a.active === b.active) {
        return a.name.localeCompare(b.name);
      }
      return a.active ? -1 : 1;
    });

    return result;
  }, [brands, search, statusFilter]);

  const existeMarcaConEseNombre = (nombre: string, idExcluir?: number) => {
    const nombreNormalizado = nombre.trim().toLowerCase();

    return brands.some((brand) => {
      const mismoNombre = brand.name.trim().toLowerCase() === nombreNormalizado;
      const esLaMismaMarca = idExcluir !== undefined && brand.id === idExcluir;

      return mismoNombre && !esLaMismaMarca;
    });
  };
  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand);
    setShowEditModal(true);
  };

  const handleAskToggle = (brand: Brand) => {
    setSelectedBrand(brand);
    setShowConfirmModal(true);
  };

  const handleConfirmToggle = async () => {
    if (!selectedBrand) return;

    try {
      await eliminarMarca(selectedBrand.id);
      setShowConfirmModal(false);
      setSelectedBrand(null);
      await loadBrands();
    } catch (error: any) {
      console.error("Error cambiando estado de marca:", error);
      console.error("Respuesta backend:", error?.response?.data);
      message.error(error?.response?.data?.message || "Ocurrió un error");
    }
  };

  const handleViewProducts = (brand: Brand) => {
    setSelectedBrandView(brand);
  };

  const handleCreateBrand = async (payload: {
    nombre: string;
    logo: File | null;
    banner: File | null;
    activo: boolean;
  }) => {
    try {
      if (!payload.nombre.trim()) {
        message.warning("Debes escribir el nombre de la marca");
        return;
      }
      if (existeMarcaConEseNombre(payload.nombre)) {
        message.warning("Ya existe una marca con ese nombre");
        return;
      }

      if (!payload.logo || !payload.banner) {
        message.warning("Debes seleccionar logo y banner para crear la marca");
        return;
      }

      await crearMarca({
        nombre: payload.nombre.trim(),
        logo: payload.logo,
        banner: payload.banner,
        activo: true,
      });

      setShowCreateModal(false);
      message.success("Marca creada correctamente");
      await loadBrands();
    } catch (error: any) {
      console.error("Error creando marca:", error);
      console.error("Respuesta backend:", error?.response?.data);
      message.error(error?.response?.data?.message || "Ocurrió un error");
    }
  };

  const handleEditBrand = async (payload: {
    nombre: string;
    logo: File | null;
    banner: File | null;
    activo: boolean;
  }) => {
    try {
      if (!selectedBrand) return;

      if (!payload.nombre.trim()) {
        message.warning("Debes escribir el nombre de la marca");
        return;
      }
      if (existeMarcaConEseNombre(payload.nombre, selectedBrand.id)) {
        message.warning("Ya existe una marca con ese nombre");
        return;
      }

      await modificarMarca({
        id_marca: selectedBrand.id,
        nombre: payload.nombre.trim(),
        logo: payload.logo,
        banner: payload.banner,
        activo: payload.activo,
      });

      setShowEditModal(false);
      setSelectedBrand(null);
      message.success("Marca actualizada correctamente");
      await loadBrands();
    } catch (error: any) {
      console.error("Error editando marca:", error);
      console.error("Respuesta backend:", error?.response?.data);
      message.error(error?.response?.data?.message || "Ocurrió un error");
    }
  };

  if (selectedBrandView) {
    return (
      <BrandProductsView
        brand={selectedBrandView}
        onBack={() => setSelectedBrandView(null)}
      />
    );
  }

  return (
  <ConfigProvider>
    <div className="w-full bg-[#f8f9fa] min-h-screen">
      <div className="w-full max-w-[1270px] mx-auto px-6 pt-8 pb-6">
        <h1 className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10">
          Administración de Marcas
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Crea, edita y gestiona las marcas disponibles en el catálogo.
        </p>
      </div>

      <div className="w-full max-w-[1270px] mx-auto px-6 pb-6">
        <div className="bg-white rounded-[18px] border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <SearchBar value={search} onChange={setSearch} />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:ml-auto">
              <FilterDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filtrar por Estado"
                options={["Activa", "Inactiva"]}
              />

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center gap-2 h-[46px] px-6 rounded-[10px] bg-[#027eb1] text-white font-['Arimo'] text-[14px] font-medium hover:bg-[#026a96] transition-colors whitespace-nowrap"
              >
                <Plus className="size-5" />
                Crear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1270px] mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredBrands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              onEdit={handleEdit}
              onToggleActive={handleAskToggle}
              onViewProducts={handleViewProducts}
            />
          ))}
        </div>
      </div>

      <BrandModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateBrand}
      />

      <BrandModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBrand(null);
        }}
        brand={selectedBrand}
        onSave={handleEditBrand}
      />

      <ConfirmToggleModal
        isOpen={showConfirmModal}
        brand={selectedBrand}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedBrand(null);
        }}
        onConfirm={handleConfirmToggle}
      />
    </div>
  </ConfigProvider>
  );
}
