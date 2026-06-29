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
import { message, Spin, ConfigProvider } from "antd";
import { ImageWithFallback } from "../../components/ImageWithFallback";
import DesignProductsView from "./DesignProductsView";
import { getMarcas } from "../../api/products/marcas";
import {
  getDisenos,
  crearDiseno,
  modificarDiseno,
  toggleDisenoActive,
  type Diseno as ApiDiseno,
} from "../../api/admin/disenos";

interface Brand {
  id_marca: number;
  nombre: string;
  activo: boolean;
}

export interface DesignProduct {
  id: number;
  name: string;
  image: string;
  brand: string;
  design: string;
  medida: string;
  price: number;
  status: "Activo" | "Inactivo";
}

export interface Design {
  id_diseno: number;
  nombre: string;
  imagen_url: string;
  descripcion: string;
  activo: boolean;
  id_marca: number;
  marca: Brand;
  productCount: number;
  productos: DesignProduct[];
}

interface DesignFormPayload {
  nombre: string;
  descripcion: string;
  id_marca: number | "";
  imagen: File | null;
  imagenPreview: string;
  activo: boolean;
}

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:3000";

const buildAssetUrl = (value?: string | null) => {
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${API_BASE}/assets/${encodeURIComponent(value)}`;
};

const mapApiDesignToView = (diseno: ApiDiseno): Design => {
  return {
    id_diseno: diseno.id_diseno,
    nombre: diseno.nombre,
    imagen_url: buildAssetUrl(diseno.imagen_url ?? ""),
    descripcion: diseno.descripcion || "",
    activo: diseno.activo ?? true,
    id_marca: diseno.id_marca,
    marca: {
      id_marca: diseno.marca?.id_marca ?? diseno.id_marca,
      nombre: diseno.marca?.nombre ?? "Sin marca",
      activo: diseno.marca?.activo ?? true,
    },
    productCount: diseno.productCount ?? diseno.cantidad_productos ?? 0,
    productos: [],
  };
};

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
        placeholder="Buscar diseño..."
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

function BrandDropdown({
  value,
  onChange,
  brands,
  placeholder = "Filtrar por Marca",
}: {
  value: string;
  onChange: (value: string) => void;
  brands: Brand[];
  placeholder?: string;
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

        {brands.map((brand) => (
          <option key={brand.id_marca} value={String(brand.id_marca)}>
            {brand.nombre}
          </option>
        ))}
      </select>

      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-[#99a1af] pointer-events-none" />
    </div>
  );
}

interface ActionMenuProps {
  design: Design;
  onEdit: () => void;
  onToggleActive: () => void;
}

function ActionMenu({ design, onEdit, onToggleActive }: ActionMenuProps) {
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
                design.activo ? "text-[#d61216]" : "text-[#027eb1]"
              }`}
            >
              {design.activo ? (
                <XCircle className="size-4 text-[#d61216]" />
              ) : (
                <RotateCcw className="size-4 text-[#027eb1]" />
              )}

              {design.activo ? "Desactivar" : "Reactivar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface DesignCardProps {
  design: Design;
  onEdit: (design: Design) => void;
  onToggleActive: (design: Design) => void;
  onViewProducts: (design: Design) => void;
}

function DesignCard({
  design,
  onEdit,
  onToggleActive,
  onViewProducts,
}: DesignCardProps) {
  const inactive = !design.activo;

  return (
    <div
      className={`rounded-[16px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] border border-[#e5e7eb] overflow-hidden transition-all ${
        inactive ? "bg-[#f3f4f6]" : "bg-white"
      }`}
    >
      <div className="h-[61px] border-b border-[#e5e7eb] flex items-center justify-between px-[16px] pb-px">
        <div className="min-w-0">
          <h3
            className={`font-['Arimo',sans-serif] font-bold text-[25px] leading-[24px] truncate ${
              inactive ? "text-[#6b7280]" : "text-[#003e7b]"
            }`}
          >
            {design.nombre}
          </h3>

          <p
            className={`font-['Arimo'] text-[13px] mt-1 truncate ${
              inactive ? "text-[#9ca3af]" : "text-[#6b7280]"
            }`}
          >
            {design.marca.nombre}
          </p>
        </div>

        <ActionMenu
          design={design}
          onEdit={() => onEdit(design)}
          onToggleActive={() => onToggleActive(design)}
        />
      </div>

      <div
        className={`h-[250px] flex items-center justify-center ${
          inactive ? "bg-[#eef0f3]" : "bg-[#f9fafb]"
        }`}
      >
        <div className="w-[155px] h-[210px] rounded-[18px] bg-white shadow-lg flex items-center justify-center overflow-hidden border border-[#e5e7eb]">
          <ImageWithFallback
            src={design.imagen_url}
            alt={design.nombre}
            className={`w-full h-full object-cover ${
              inactive ? "grayscale opacity-70" : ""
            }`}
          />
        </div>
      </div>

      <div className="h-[100px] pt-[16px] px-[16px] flex flex-col gap-[8px]">
        <button
          onClick={() => onViewProducts(design)}
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
          {design.productCount} productos
        </p>
      </div>
    </div>
  );
}

interface DesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  design?: Design | null;
  brands: Brand[];
  onSave: (payload: DesignFormPayload) => Promise<void>;
}

function DesignModal({
  isOpen,
  onClose,
  design,
  brands,
  onSave,
}: DesignModalProps) {
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (design) {
      setName(design.nombre || "");
      setBrandId(design.id_marca || "");
      setDescription(design.descripcion || "");
      setActive(design.activo ?? true);
      setImagePreview(design.imagen_url || "");
      setImageFile(null);
      return;
    }

    const firstActiveBrand = brands.find((brand) => brand.activo);

    setName("");
    setBrandId(firstActiveBrand?.id_marca || "");
    setDescription("");
    setActive(true);
    setImagePreview("");
    setImageFile(null);
  }, [isOpen, design, brands]);

  if (!isOpen) return null;

  const handleClose = () => {
    setName("");
    setBrandId("");
    setDescription("");
    setActive(true);
    setImagePreview("");
    setImageFile(null);
    onClose();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const availableBrands = design ? brands : brands.filter((brand) => brand.activo);

  const handleSubmit = async () => {
    await onSave({
      nombre: name.trim(),
      descripcion: description.trim(),
      id_marca: brandId,
      imagen: imageFile,
      imagenPreview: imagePreview,
      activo: active,
    });

    setName("");
    setBrandId("");
    setDescription("");
    setActive(true);
    setImagePreview("");
    setImageFile(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="font-['Arimo'] font-bold text-[20px] text-[#003e7b]">
            {design ? "Editar Diseño" : "Crear Diseño"}
          </h2>

          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="size-5 text-[#4a5565]" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div>
            <label className="block font-['Arimo'] font-medium text-[14px] text-[#1e2939] mb-2">
              Imagen del diseño
            </label>

            <div className="relative h-[250px] border-2 border-dashed border-[#d1d5dc] rounded-[12px] bg-[#f9fafb] hover:border-[#027eb1] transition-colors overflow-hidden">
              {imagePreview ? (
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  <div className="w-[170px] h-[220px] rounded-[18px] overflow-hidden bg-white border border-[#e5e7eb] shadow-sm">
                    <img
                      src={imagePreview}
                      alt="Vista previa diseño"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <label className="px-3 h-[32px] bg-white rounded-[8px] shadow-md hover:bg-gray-100 cursor-pointer flex items-center justify-center font-['Arimo'] text-[12px] text-[#1e2939]">
                      Cambiar
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>

                    <button
                      onClick={() => {
                        setImagePreview("");
                        setImageFile(null);
                      }}
                      className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                    >
                      <XCircle className="size-4 text-[#d61216]" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                  <span className="font-['Arimo'] text-[14px] text-[#4a5565]">
                    Haz clic para subir imagen
                  </span>

                  <span className="font-['Arimo'] text-[12px] text-[#99a1af] mt-1">
                    Formato vertical recomendado
                  </span>

                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block font-['Arimo'] font-medium text-[14px] text-[#1e2939] mb-2">
              Nombre
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej: Primacy 4"
              className="w-full h-[46px] px-4 border border-[#d1d5dc] rounded-[10px] bg-white font-['Arimo'] text-[14px] text-[#1e2939] focus:outline-none focus:border-[#027eb1]"
            />
          </div>

          <div>
            <label className="block font-['Arimo'] font-medium text-[14px] text-[#1e2939] mb-2">
              Marca
            </label>

            <div className="relative">
              <select
                value={brandId}
                onChange={(event) =>
                  setBrandId(
                    event.target.value === "" ? "" : Number(event.target.value)
                  )
                }
                className={`w-full h-[46px] px-4 pr-10 border border-[#d1d5dc] rounded-[10px] bg-white font-['Arimo'] text-[14px] appearance-none cursor-pointer hover:border-[#027eb1] transition-colors focus:outline-none focus:border-[#027eb1] ${
                  brandId ? "text-[#1e2939]" : "text-[#99a1af]"
                }`}
              >
                <option value="">Seleccionar marca</option>

                {availableBrands.map((brand) => (
                  <option key={brand.id_marca} value={brand.id_marca}>
                    {brand.nombre}
                  </option>
                ))}
              </select>

              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-[#99a1af] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block font-['Arimo'] font-medium text-[14px] text-[#1e2939] mb-2">
              Descripción
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descripción breve del diseño..."
              rows={4}
              className="w-full px-4 py-3 border border-[#d1d5dc] rounded-[10px] bg-white font-['Arimo'] text-[14px] text-[#1e2939] focus:outline-none focus:border-[#027eb1] resize-none"
            />
          </div>

          {design && (
            <div>
              <label className="block font-['Arimo'] font-medium text-[14px] text-[#1e2939] mb-2">
                Estado
              </label>

              <FilterDropdown
                value={active ? "Activa" : "Inactiva"}
                onChange={(value) => setActive(value === "Activa")}
                options={["Activa", "Inactiva"]}
                placeholder="Seleccionar estado"
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#e5e7eb] flex items-center justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={handleClose}
            className="h-[42px] px-6 border border-[#d1d5dc] rounded-[10px] font-['Arimo'] font-medium text-[14px] text-[#4a5565] hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="h-[42px] px-6 bg-[#027eb1] hover:bg-[#026a96] text-white rounded-[10px] font-['Arimo'] font-medium text-[14px] transition-colors"
          >
            {design ? "Guardar Cambios" : "Crear Diseño"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmToggleModalProps {
  isOpen: boolean;
  design: Design | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function ConfirmToggleModal({
  isOpen,
  design,
  onClose,
  onConfirm,
}: ConfirmToggleModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !design) return null;

  const isDeactivate = design.activo;

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
          {isDeactivate ? "Desactivar Diseño" : "Reactivar Diseño"}
        </h2>

        <p className="mt-2 font-['Arimo'] text-[13px] leading-[19px] text-[#4b5563]">
          {isDeactivate ? (
            <>
              ¿Deseas desactivar{" "}
              <span className="font-bold text-[#111827]">
                '{design.nombre}'
              </span>
              ?
            </>
          ) : (
            <>
              ¿Deseas reactivar{" "}
              <span className="font-bold text-[#111827]">
                '{design.nombre}'
              </span>
              ?
            </>
          )}
        </p>

        <p className="mt-1 font-['Arimo'] text-[12px] text-[#6b7280]">
          {isDeactivate
            ? "Podrás revertirlo después."
            : "El diseño volverá a estar disponible."}
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

export default function DesignManagement() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [selectedDesignView, setSelectedDesignView] = useState<Design | null>(
    null
  );

  const loadBrands = async () => {
    try {
      const data = await getMarcas();

      const mappedBrands: Brand[] = data.map((marca) => ({
        id_marca: marca.id_marca,
        nombre: marca.nombre,
        activo: marca.activo ?? true,
      }));

      setBrands(mappedBrands);
    } catch (error: any) {
      console.error("Error cargando marcas:", error);
      message.error(error?.response?.data?.message || "Error cargando marcas");
    }
  };

  const loadDesigns = async () => {
    try {
      setLoading(true);

      const response = await getDisenos({
        search: search.trim() || undefined,
        id_marca: brandFilter || undefined,
        estado: statusFilter as any,
      });

      const mappedDesigns = response.data.map(mapApiDesignToView);
      setDesigns(mappedDesigns);
    } catch (error: any) {
      console.error("Error cargando diseños:", error);
      message.error(
        error?.response?.data?.message || "Error cargando diseños"
      );
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    loadDesigns();
  }, [search, statusFilter, brandFilter]);

  const filteredDesigns = useMemo(() => {
    return [...designs].sort((a, b) => {
      if (a.activo === b.activo) {
        return a.nombre.localeCompare(b.nombre);
      }

      return a.activo ? -1 : 1;
    });
  }, [designs]);

  const existsDesignWithSameName = (
    nombre: string,
    idMarca: number,
    idExcluir?: number
  ) => {
    const normalizedName = nombre.trim().toLowerCase();

    return designs.some((design) => {
      const sameName = design.nombre.trim().toLowerCase() === normalizedName;
      const sameBrand = design.id_marca === idMarca;
      const sameDesign =
        idExcluir !== undefined && design.id_diseno === idExcluir;

      return sameName && sameBrand && !sameDesign;
    });
  };

  const handleEdit = (design: Design) => {
    setSelectedDesign(design);
    setShowEditModal(true);
  };

  const handleAskToggle = (design: Design) => {
    setSelectedDesign(design);
    setShowConfirmModal(true);
  };

  const handleViewProducts = (design: Design) => {
    setSelectedDesignView(design);
  };

  const handleConfirmToggle = async () => {
    if (!selectedDesign) return;

    try {
      await toggleDisenoActive(selectedDesign.id_diseno);

      setShowConfirmModal(false);
      setSelectedDesign(null);

      message.success("Estado del diseño actualizado correctamente");
      await loadDesigns();
    } catch (error: any) {
      console.error("Error cambiando estado del diseño:", error);
      message.error(error?.response?.data?.message || "Ocurrió un error");
    }
  };

  const handleCreateDesign = async (payload: DesignFormPayload) => {
    try {
      if (!payload.nombre.trim()) {
        message.warning("Debes escribir el nombre del diseño");
        return;
      }

      if (!payload.id_marca) {
        message.warning("Debes seleccionar una marca");
        return;
      }

      if (existsDesignWithSameName(payload.nombre, Number(payload.id_marca))) {
        message.warning("Ya existe un diseño con ese nombre para esta marca");
        return;
      }

      await crearDiseno({
        nombre: payload.nombre.trim(),
        descripcion: payload.descripcion.trim(),
        id_marca: Number(payload.id_marca),
        imagen: payload.imagen,
        activo: true,
      });

      setShowCreateModal(false);
      message.success("Diseño creado correctamente");
      await loadDesigns();
    } catch (error: any) {
      console.error("Error creando diseño:", error);
      message.error(error?.response?.data?.message || "Ocurrió un error");
    }
  };

  const handleEditDesign = async (payload: DesignFormPayload) => {
    try {
      if (!selectedDesign) return;

      if (!payload.nombre.trim()) {
        message.warning("Debes escribir el nombre del diseño");
        return;
      }

      if (!payload.id_marca) {
        message.warning("Debes seleccionar una marca");
        return;
      }

      if (
        existsDesignWithSameName(
          payload.nombre,
          Number(payload.id_marca),
          selectedDesign.id_diseno
        )
      ) {
        message.warning("Ya existe un diseño con ese nombre para esta marca");
        return;
      }

      await modificarDiseno({
        id_diseno: selectedDesign.id_diseno,
        nombre: payload.nombre.trim(),
        descripcion: payload.descripcion.trim(),
        id_marca: Number(payload.id_marca),
        imagen: payload.imagen,
        activo: payload.activo,
      });

      setShowEditModal(false);
      setSelectedDesign(null);

      message.success("Diseño actualizado correctamente");
      await loadDesigns();
    } catch (error: any) {
      console.error("Error actualizando diseño:", error);
      message.error(error?.response?.data?.message || "Ocurrió un error");
    }
  };

  if (selectedDesignView) {
    return (
      <DesignProductsView
        design={selectedDesignView}
        onBack={() => {
          setSelectedDesignView(null);
          loadDesigns();
        }}
      />
    );
  }

  return (
  <ConfigProvider>
    <div className="w-full bg-[#f8f9fa] min-h-screen">
      <div className="w-full max-w-[1270px] mx-auto px-6 pt-8 pb-6">
        <h1 className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10">
          Administración de Diseños
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Crea, edita y gestiona los diseños de llantas relacionados a cada
          marca.
        </p>
      </div>

      <div className="w-full max-w-[1270px] mx-auto px-6 pb-6">
        <div className="bg-white rounded-[18px] border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <SearchBar value={search} onChange={setSearch} />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 xl:ml-auto">
              <BrandDropdown
                value={brandFilter}
                onChange={setBrandFilter}
                brands={brands}
              />

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
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-[18px] py-14 px-6 text-center shadow-sm">
            <Spin size="large" />
            <p className="font-['Arimo'] text-[14px] text-[#6b7280] mt-4">
              Cargando diseños...
            </p>
          </div>
        ) : filteredDesigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredDesigns.map((design) => (
              <DesignCard
                key={design.id_diseno}
                design={design}
                onEdit={handleEdit}
                onToggleActive={handleAskToggle}
                onViewProducts={handleViewProducts}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[18px] py-14 px-6 text-center shadow-sm">
            <h2 className="font-['Arimo'] text-[18px] font-bold text-[#1e2939]">
              No hay diseños para mostrar
            </h2>

            <p className="font-['Arimo'] text-[14px] text-[#6b7280] mt-1">
              Cambia los filtros o crea un nuevo diseño.
            </p>
          </div>
        )}
      </div>

      <DesignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        brands={brands}
        onSave={handleCreateDesign}
      />

      <DesignModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDesign(null);
        }}
        design={selectedDesign}
        brands={brands}
        onSave={handleEditDesign}
      />

      <ConfirmToggleModal
        isOpen={showConfirmModal}
        design={selectedDesign}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedDesign(null);
        }}
        onConfirm={handleConfirmToggle}
      />
    </div>
  </ConfigProvider>
  );
}