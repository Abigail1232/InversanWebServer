import { useState, useEffect, createElement } from "react";
import { AutoComplete, Select, message } from "antd";
import {
  ChevronLeft,
  ChevronDown,
  File,
  Trash2,
  AlertTriangle,
  Plus,
  Upload,
  Info,
  XCircle,
} from "lucide-react";

import {
  getCategorias,
  getMarcas,
  getTodosModelos,
  createProducto,
  updateProducto,
  cambiarEstadoProducto,
  getEspecificacionesExistentes,
} from "../../api/products/productos";
import CategoryModal from "./CategoryModal";
import ModeloModal from "./modifyModel";
import { saveModel } from "../../api/admin/models";
import { crearMarca } from "../../api/products/marcas";
import { getDisenos, crearDiseno, type Diseno } from "../../api/admin/disenos";
import BrandModal from "./BrandModal";


interface DesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  marcaNombre: string;
  onSave: (payload: {
    nombre: string;
    descripcion: string;
    imagen: File | null;
    activo: boolean;
  }) => Promise<void>;
}

function DesignModal({ isOpen, onClose, marcaNombre, onSave }: DesignModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setName("");
    setDescription("");
    setActive(true);
    setImageFile(null);
    setImagePreview("");
    setSaving(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (saving) return;

    setName("");
    setDescription("");
    setActive(true);
    setImageFile(null);
    setImagePreview("");
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

  const handleSubmit = async () => {
    if (!name.trim()) {
      message.warning("Debes escribir el nombre del diseño");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        nombre: name.trim(),
        descripcion: description.trim(),
        imagen: imageFile,
        activo: active,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-['Arimo'] font-bold text-[20px] text-[#003e7b]">
              Crear Diseño
            </h2>
            <p className="font-['Arimo'] text-[13px] text-[#6b7280] mt-1">
              Marca: {marcaNombre || "Selecciona una marca"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-60"
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
                      type="button"
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
                  <Upload className="size-8 text-[#99a1af] mb-2" />
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
              Nombre <span className="text-red-500">*</span>
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

          <div>
            <label className="block font-['Arimo'] font-medium text-[14px] text-[#1e2939] mb-2">
              Estado
            </label>

            <div className="relative">
              <select
                value={active ? "Activa" : "Inactiva"}
                onChange={(event) => setActive(event.target.value === "Activa")}
                className="w-full h-[46px] px-4 pr-10 border border-[#d1d5dc] rounded-[10px] bg-white font-['Arimo'] text-[14px] appearance-none cursor-pointer hover:border-[#027eb1] transition-colors focus:outline-none focus:border-[#027eb1] text-[#1e2939]"
              >
                <option value="Activa">Activa</option>
                <option value="Inactiva">Inactiva</option>
              </select>

              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-[#99a1af] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#e5e7eb] flex items-center justify-end gap-3 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="h-[42px] px-6 border border-[#d1d5dc] rounded-[10px] font-['Arimo'] font-medium text-[14px] text-[#4a5565] hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="h-[42px] px-6 bg-[#027eb1] hover:bg-[#026a96] text-white rounded-[10px] font-['Arimo'] font-medium text-[14px] transition-colors disabled:opacity-60"
          >
            {saving ? "Creando..." : "Crear Diseño"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
  mode: "create" | "edit";
  onSuccess?: () => void;
}

const tireSpecificationFields = [
  "ancho",
  "perfil",
  "rin",
  "lonas",
  "profundidad",
  "presionMaxima",
  "indiceVelocidad",
  "indiceCarga",
];

const cleanText = (value: any) => {
  if (value === null || value === undefined) return "";
  return value.toString().trim();
};

const buildTireSpecification = (data: any) => {
  const ancho = cleanText(data.ancho);
  const perfil = cleanText(data.perfil);
  const rin = cleanText(data.rin);
  const lonas = cleanText(data.lonas);
  const profundidad = cleanText(data.profundidad);
  const presionMaxima = cleanText(data.presionMaxima);
  const indiceVelocidad = cleanText(data.indiceVelocidad);
  const indiceCarga = cleanText(data.indiceCarga);

  const parts: string[] = [];

  if (ancho || perfil || rin) {
    let medida = "";

    if (ancho) medida += ancho;
    if (perfil && perfil !== "0") medida += `${medida ? "/" : ""}${perfil}`;
    if (rin) medida += `${medida ? "R" : "R"}${rin}`;

    parts.push(medida);
  }

  if (indiceCarga || indiceVelocidad) {
    if (indiceCarga && indiceVelocidad) {
      parts.push(`${indiceCarga}/${indiceVelocidad}`);
    } else {
      parts.push(indiceCarga || indiceVelocidad);
    }
  }

  if (lonas) parts.push(`${lonas}PR`);
  if (profundidad) parts.push(`${profundidad}mm`);
  if (presionMaxima) parts.push(`${presionMaxima}psi`);

  return parts.join(" ");
};

export default function ProductModal({
  isOpen,
  onClose,
  product,
  mode,
  onSuccess,
}: ProductModalProps) {
  const [formData, setFormData] = useState(() => {
    const initialData = {
      nombre: product?.nombre || "",
      categoria: product?.categoria || "",
      marca: product?.marca || "",
      modelos: (() => {
        if (Array.isArray(product?.modelos) && product.modelos.length > 0) {
          return product.modelos.map((m: any) => typeof m === "string" ? m : m.nombre).filter(Boolean);
        }
        if (Array.isArray(product?.modelo_producto) && product.modelo_producto.length > 0) {
          return product.modelo_producto.map((m: any) => m.modelo?.nombre || m.nombre).filter(Boolean);
        }
        if (typeof product?.modelo === "string" && product.modelo !== "N/A") {
          return product.modelo.split(",").map((m: string) => m.trim()).filter(Boolean);
        }
        return [];
      })(),
      diseno: typeof product?.diseno === "string" ? product?.diseno : product?.diseno?.nombre || product?.version || "",
      id_diseno: product?.id_diseno || product?.disenoData?.id_diseno || (typeof product?.diseno === "object" ? product?.diseno?.id_diseno : ""),
      ancho: product?.ancho || "",
      perfil: product?.perfil || "",
      rin: product?.rin || "",
      lonas: product?.lonas || "",
      profundidad: product?.profundidad || "",
      presionMaxima: product?.presionMaxima || "",
      indiceVelocidad: product?.indiceVelocidad || "",
      indiceCarga: product?.indiceCarga || "",
      especificacionCompleta: product?.especificacionCompleta || "",
      precio: product?.precio || "",
      precioMayoreo: product?.precioMayoreo || "",
      imagen3D: product?.imagen3D || "",
      nombreCarpetaModelo3D: product?.nombreCarpetaModelo3D || "",
      descripcion: product?.descripcion || "",
      versionVehiculo: (() => {
        if (Array.isArray(product?.versiones) && product.versiones.length > 0) {
          return product.versiones[0].nombre;
        }
        if (Array.isArray(product?.modelo_producto) && product.modelo_producto.length > 0) {
          const firstWithVersion = product.modelo_producto.find((mp: any) => mp.version);
          return firstWithVersion?.version?.nombre || "";
        }
        return "";
      })(),
      modelosData: (() => {
        if (Array.isArray(product?.modelosData) && product.modelosData.length > 0) {
          return product.modelosData;
        }
        return [];
      })(),
    };

    return {
      ...initialData,
      especificacionCompleta:
        initialData.especificacionCompleta || buildTireSpecification(initialData),
    };
  });

  const [images, setImages] = useState<any[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [model3DFiles, setModel3DFiles] = useState<any[]>([]);
  const [invalidModel3DFiles, setInvalidModel3DFiles] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [disenos, setDisenos] = useState<Diseno[]>([]);
  const [loadingDisenos, setLoadingDisenos] = useState(false);
  const [modelos, setModelos] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isModeloModalOpen, setIsModeloModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [modal3DOpen, setModal3DOpen] = useState(false);
  const [modelViewerReady, setModelViewerReady] = useState(false);
  const [localModelPreviewUrl, setLocalModelPreviewUrl] = useState("");
  const [specsDb, setSpecsDb] = useState<{
    anchos: string[];
    perfiles: string[];
    rines: string[];
    lonas: string[];
    profundidades: string[];
    presiones: string[];
    velocidades: string[];
    cargas: string[];
  }>({
    anchos: [],
    perfiles: [],
    rines: [],
    lonas: [],
    profundidades: [],
    presiones: [],
    velocidades: [],
    cargas: [],
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!modal3DOpen || !(localModelPreviewUrl || formData.imagen3D)) return;

    import("@google/model-viewer").then(() => setModelViewerReady(true));
  }, [modal3DOpen, localModelPreviewUrl, formData.imagen3D]);

  const fetchData = async () => {
    try {
      const [cats, brands, modelsData, specsData] = await Promise.all([
        getCategorias(),
        getMarcas(),
        getTodosModelos(),
        getEspecificacionesExistentes(),
      ]);
      setCategorias(cats.data || []);
      setMarcas(brands.data || []);
      setModelos(modelsData.data || []);
      if (specsData.success && specsData.data) {
        setSpecsDb(specsData.data);
      }
    } catch (error) {
      console.error("Error fetching modal data:", error);
    }
  };

  // Efecto para cargar datos del producto en modo edición
  useEffect(() => {
    if (mode === "edit" && product) {
      const editData = {
        nombre: product.nombre || "",
        categoria: product.categoria || "",
        marca: product.marca || "",
        modelos: (() => {
          if (Array.isArray(product.modelos) && product.modelos.length > 0) {
            return product.modelos
              .map((m: any) => (typeof m === "string" ? m : m.nombre))
              .filter(Boolean);
          }

          if (
            Array.isArray(product.modelo_producto) &&
            product.modelo_producto.length > 0
          ) {
            return product.modelo_producto
              .map((m: any) => m.modelo?.nombre || m.nombre)
              .filter(Boolean);
          }

          if (typeof product.modelo === "string" && product.modelo !== "N/A") {
            return product.modelo
              .split(",")
              .map((m: string) => m.trim())
              .filter(Boolean);
          }

          return [];
        })(),
        diseno: typeof product.diseno === "string" ? product.diseno : product.diseno?.nombre || product.version || "",
        id_diseno: product.id_diseno || product.disenoData?.id_diseno || (typeof product.diseno === "object" ? product.diseno?.id_diseno : ""),
        ancho: product.ancho || "",
        perfil: product.perfil || "",
        rin: product.rin || "",
        lonas: product.lonas || "",
        profundidad: product.profundidad || "",
        presionMaxima: product.presionMaxima || "",
        indiceVelocidad: product.indiceVelocidad || "",
        indiceCarga: product.indiceCarga || "",
        especificacionCompleta: product.especificacionCompleta || "",
        precio: product.precio?.toString() || "",
        precioMayoreo: product.precioMayoreo?.toString() || "",
        imagen3D: product.imagen3D || "",
        nombreCarpetaModelo3D: product.nombreCarpetaModelo3D || "",
        descripcion: product.descripcion || "",
        versionVehiculo: (() => {
          if (Array.isArray(product.versiones) && product.versiones.length > 0) {
            return product.versiones[0].nombre;
          }
          if (Array.isArray(product.modelo_producto) && product.modelo_producto.length > 0) {
            const firstWithVersion = product.modelo_producto.find((mp: any) => mp.version);
            return firstWithVersion?.version?.nombre || "";
          }
          return "";
        })(),
        modelosData: (() => {
          if (Array.isArray(product.modelosData) && product.modelosData.length > 0) {
            return product.modelosData;
          }
          return [];
        })(),
      };

      setFormData({
        ...editData,
        especificacionCompleta:
          editData.especificacionCompleta || buildTireSpecification(editData),
      });

      if (product.imagenes && product.imagenes.length > 0) {
        setImages(product.imagenes);
      }

      setModel3DFiles([]);
      setInvalidModel3DFiles([]);
      setLocalModelPreviewUrl("");
      setDeletedImageIds([]);
    } else {
      const createData = {
        nombre: "",
        categoria: "",
        marca: "",
        modelos: [],
        diseno: "",
        id_diseno: "",
        ancho: "",
        perfil: "",
        rin: "",
        lonas: "",
        profundidad: "",
        presionMaxima: "",
        indiceVelocidad: "",
        indiceCarga: "",
        especificacionCompleta: "",
        precio: "",
        precioMayoreo: "",
        imagen3D: "",
        nombreCarpetaModelo3D: "",
        descripcion: "",
        versionVehiculo: "",
        modelosData: [],
      };

      setFormData({
        ...createData,
        especificacionCompleta: buildTireSpecification(createData),
      });

      setImages([]);
      setModel3DFiles([]);
      setInvalidModel3DFiles([]);
      setLocalModelPreviewUrl("");
      setDeletedImageIds([]);
    }
  }, [mode, product]);

  const selectedBrand = marcas.find((m) => m.nombre === formData.marca);
  const selectedBrandId = selectedBrand?.id_marca || "";

  const fetchDisenosByBrand = async (brandId: number | string) => {
    if (!brandId) {
      setDisenos([]);
      return;
    }

    try {
      setLoadingDisenos(true);
      const response = await getDisenos({
        id_marca: brandId,
        estado: "Activa",
      });
      setDisenos(response.data || []);
    } catch (error: any) {
      console.error("Error cargando diseños:", error);
      setDisenos([]);
      message.error(
        error?.response?.data?.message || "Error cargando diseños de la marca"
      );
    } finally {
      setLoadingDisenos(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!selectedBrandId) {
      setDisenos([]);
      return;
    }

    fetchDisenosByBrand(selectedBrandId);
  }, [isOpen, selectedBrandId]);

  useEffect(() => {
    if (!formData.diseno || formData.id_diseno || disenos.length === 0) return;

    const matchedDesign = disenos.find(
      (diseno) =>
        diseno.nombre.trim().toLowerCase() ===
        formData.diseno.trim().toLowerCase()
    );

    if (matchedDesign) {
      setFormData((prev) => ({
        ...prev,
        id_diseno: matchedDesign.id_diseno,
        diseno: matchedDesign.nombre,
      }));
    }
  }, [disenos, formData.diseno, formData.id_diseno]);

  const handleDesignSelect = (idDiseno: number) => {
    const selectedDesign = disenos.find(
      (diseno) => diseno.id_diseno === Number(idDiseno)
    );

    setFormData((prev) => ({
      ...prev,
      id_diseno: selectedDesign?.id_diseno || "",
      diseno: selectedDesign?.nombre || "",
    }));
  };

  const handleOpenDesignModal = () => {
    if (!selectedBrandId) {
      message.warning("Primero debes seleccionar una marca");
      return;
    }

    setIsDesignModalOpen(true);
  };

  const handleSaveNewDesign = async (payload: {
    nombre: string;
    descripcion: string;
    imagen: File | null;
    activo: boolean;
  }) => {
    if (!selectedBrandId) {
      message.warning("Primero debes seleccionar una marca");
      return;
    }

    try {
      const newDesign = await crearDiseno({
        nombre: payload.nombre.trim(),
        descripcion: payload.descripcion.trim(),
        id_marca: Number(selectedBrandId),
        imagen: payload.imagen,
        activo: payload.activo,
      });

      await fetchDisenosByBrand(selectedBrandId);

      setFormData((prev) => ({
        ...prev,
        id_diseno: newDesign.id_diseno,
        diseno: newDesign.nombre,
      }));

      setIsDesignModalOpen(false);
      message.success("Diseño creado correctamente");
    } catch (error: any) {
      console.error("Error creando diseño:", error);
      message.error(error?.response?.data?.message || "Error al crear el diseño");
    }
  };

  if (!isOpen) return null;
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFields = [
      { name: "nombre", label: "Nombre" },
      { name: "categoria", label: "Categoría" },
      { name: "marca", label: "Marca" },
      { name: "modelos", label: "Modelos" },
      { name: "diseno", label: "Diseño" },
      { name: "ancho", label: "Alto" },
      { name: "rin", label: "Rin" },
      { name: "lonas", label: "Lonas" },
      { name: "profundidad", label: "Profundidad" },
      { name: "presionMaxima", label: "Presión Máxima" },
      { name: "indiceVelocidad", label: "Índice de Velocidad" },
      { name: "indiceCarga", label: "Índice de Carga" },
      { name: "precio", label: "Precio" },
      { name: "descripcion", label: "Descripción" },
    ];

    const missingFields = requiredFields
      .filter((field) => {
        const value = formData[field.name as keyof typeof formData];
        if (Array.isArray(value)) return value.length === 0;
        return !value || value.toString().trim() === "";
      })
      .map((f) => f.label);

    if (missingFields.length > 0) {
      message.error(`Faltan campos obligatorios: ${missingFields.join(", ")}`);
      setSubmitting(false);
      return;
    }

    if (invalidModel3DFiles.length > 0) {
      message.error(
        `No se puede ${mode === "create" ? "crear" : "modificar"} el producto porque el modelo 3D contiene archivos con extensión no permitida: ${invalidModel3DFiles.join(", ")}`
      );
      return;
    }

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      // Campos requeridos según el controlador del backend
      formDataToSend.append("nombre", formData.nombre);

      // Encontrar IDs
      const catId =
        categorias.find((c) => c.nombre === formData.categoria)?.id_categoria ||
        "";
      const marcaId =
        marcas.find((m) => m.nombre === formData.marca)?.id_marca || "";

      formDataToSend.append("id_categoria", catId.toString());
      formDataToSend.append("id_marca", marcaId.toString());

      if (formData.modelosData && formData.modelosData.length > 0) {
        formDataToSend.append("modelos_versiones", JSON.stringify(formData.modelosData));
      } else if (formData.modelos && formData.modelos.length > 0) {
        formData.modelos.forEach((m: string) => {
          formDataToSend.append("modelo", m);
        });
      }

      if (formData.versionVehiculo) {
        formDataToSend.append("version_vehiculo", formData.versionVehiculo);
      }

      formDataToSend.append("rin", formData.rin);
      formDataToSend.append("ancho_rin", formData.ancho);
      formDataToSend.append("alto_rin", formData.perfil);
      formDataToSend.append("version", formData.diseno); // Send diseno as version for backend compatibility
      if (formData.id_diseno) {
        formDataToSend.append("id_diseno", String(formData.id_diseno));
      }
      formDataToSend.append("lonas", formData.lonas);
      formDataToSend.append("profundidad", formData.profundidad);
      formDataToSend.append("presion_maxima", formData.presionMaxima);
      formDataToSend.append("indice_velocidad", formData.indiceVelocidad);
      formDataToSend.append("indice_de_carga", formData.indiceCarga);
      formDataToSend.append("precio_detalle", formData.precio);
      formDataToSend.append("precio_mayoreo", formData.precioMayoreo);
      formDataToSend.append("precio_coste", formData.precio); // Usar precio detalle como coste por ahora
      formDataToSend.append("descripcion", formData.descripcion);
      formDataToSend.append("imagen_3d", formData.imagen3D || "");
      formDataToSend.append(
        "nombre_carpeta_modelo_3d",
        formData.nombreCarpetaModelo3D || "modelo_sin_nombre"
      );

      deletedImageIds.forEach((id) => {
        formDataToSend.append("imagenes_eliminadas", id.toString());
      });

      // Agregar archivos de imagen
      images.forEach((img) => {
        if (img.file) {
          formDataToSend.append("imagenes", img.file);
        }
      });

      model3DFiles.forEach((fileItem) => {
        if (fileItem.file) {
          formDataToSend.append("modelo_3d_files", fileItem.file);
          formDataToSend.append(
            "modelo_3d_paths",
            fileItem.relativePath || fileItem.name
          );
        }
      });

      if (mode === "create") {
        await createProducto(formDataToSend);
        message.success("Producto creado exitosamente");
      } else {
        await updateProducto(product.id, formDataToSend);
        message.success("Producto actualizado exitosamente");
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error submitting form:", error);
      const serverMessage = error?.response?.data?.message || "Ocurrió un error inesperado al guardar el producto";
      message.error(serverMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivar = async () => {
    if (!product?.id) return;
    try {
      await cambiarEstadoProducto(product.id, true);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error activating product:", error);
    }
  };

  const isNumericField = (name: string) => {
    return [
      "ancho",
      "perfil",
      "rin",
      "lonas",
      "profundidad",
      "presionMaxima",
      "indiceVelocidad",
      "indiceCarga",
      "precio",
      "precioMayoreo",
    ].includes(name);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (isNumericField(name)) {
      const cleanValue = value.replace(/[^0-9.]/g, "");
      const finalValue = cleanValue.split(".").slice(0, 2).join(".");

      setFormData((prev) => {
        const previousAutoSpecification = buildTireSpecification(prev);
        const nextData = {
          ...prev,
          [name]: finalValue,
        };

        const shouldAutoUpdateSpecification =
          tireSpecificationFields.includes(name) &&
          (prev.especificacionCompleta.trim() === "" ||
            prev.especificacionCompleta.trim() === previousAutoSpecification);

        return {
          ...nextData,
          especificacionCompleta: shouldAutoUpdateSpecification
            ? buildTireSpecification(nextData)
            : prev.especificacionCompleta,
        };
      });

      return;
    }

    if (name === "nombreCarpetaModelo3D") {
      setFormData((prev) => ({
        ...prev,
        nombreCarpetaModelo3D: value,
        imagen3D: buildModel3DUrl(value),
      }));
      return;
    }

    if (name === "nombre" && value.length >= 50) {
      // Si intentan meter 50 o más caracteres en el nombre, ignoramos el cambio
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: any) => {
    if (isNumericField(name)) {
      const cleanValue = value.toString().replace(/[^0-9.]/g, "");
      const finalValue = cleanValue.split(".").slice(0, 2).join(".");

      setFormData((prev) => {
        const previousAutoSpecification = buildTireSpecification(prev);
        const nextData = {
          ...prev,
          [name]: finalValue,
        };

        const shouldAutoUpdateSpecification =
          tireSpecificationFields.includes(name) &&
          (prev.especificacionCompleta.trim() === "" ||
            prev.especificacionCompleta.trim() === previousAutoSpecification);

        return {
          ...nextData,
          especificacionCompleta: shouldAutoUpdateSpecification
            ? buildTireSpecification(nextData)
            : prev.especificacionCompleta,
        };
      });

      return;
    }

    if (name === "modelos") {
      setFormData((prev: any) => {
        const newModelosData = value.map((nombre: string) => {
          const existing = prev.modelosData?.find((m: any) => m.nombre === nombre);
          const modelFromApi = modelos.find((m: any) => (m.name || m.nombre) === nombre);
          return {
            id_modelo: existing?.id_modelo || modelFromApi?.id || modelFromApi?.id_modelo,
            nombre,
            id_version: existing?.id_version || null,
          };
        });
        return {
          ...prev,
          modelos: value,
          modelosData: newModelosData,
        };
      });
      return;
    }

    if (name === "marca") {
      setFormData((prev) => ({
        ...prev,
        marca: value,
        diseno: "",
        id_diseno: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeleteImage = (index: number) => {
    const imageToDelete = images[index];

    const imageId =
      imageToDelete?.id_imagen ||
      imageToDelete?.id_producto_imagen ||
      imageToDelete?.id;

    if (!imageToDelete?.file && imageId) {
      setDeletedImageIds((prev) => [...prev, Number(imageId)]);
    }

    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveNewCategory = async (categoryName?: string) => {
    try {
      const cats = await getCategorias();
      setCategorias(cats.data || []);
      if (categoryName) {
        setFormData((prev) => ({ ...prev, categoria: categoryName }));
      }
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error("Error refreshing categories:", error);
    }
  };

  const handleSaveNewBrand = async (payload: {
    nombre: string;
    logo: File | null;
    banner: File | null;
    activo: boolean;
  }) => {
    try {
      if (!payload.logo || !payload.banner) {
        message.warning("Debes seleccionar logo y banner para crear la marca");
        return;
      }

      await crearMarca({
        nombre: payload.nombre.trim(),
        logo: payload.logo,
        banner: payload.banner,
        activo: payload.activo,
      });

      // Refresh brands list
      const brandsData = await getMarcas();
      setMarcas(brandsData.data || []);

      // Select the new brand
      setFormData((prev) => ({ ...prev, marca: payload.nombre.trim() }));

      setIsBrandModalOpen(false);
      message.success("Marca creada correctamente");
    } catch (error) {
      console.error("Error creating brand:", error);
      message.error("Error al crear la marca");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => ({
        name: file.name,
        file: file,
      }));
      setImages([...images, ...newImages]);
    }
  };

  const buildModel3DUrl = (folderName: string) => {
    const cleanFolderName = folderName
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");

    if (!cleanFolderName) return "";

    return `/Modelo3d/${cleanFolderName}/scene.gltf`;
  };

  const buildLocalModelPreview = async (files: any[]) => {
    try {
      const gltfFile = files.find((f) =>
        f.name.toLowerCase().endsWith(".gltf")
      )?.file;

      if (!gltfFile) {
        setLocalModelPreviewUrl("");
        return;
      }

      const fileUrlMap = new Map<string, string>();

      files.forEach((item) => {
        const relativePath = (item.relativePath || item.name).replace(/\\/g, "/");
        const normalizedPath = relativePath.split("/").slice(1).join("/");
        const objectUrl = URL.createObjectURL(item.file);
        fileUrlMap.set(normalizedPath, objectUrl);
      });

      let gltfText = await gltfFile.text();

      fileUrlMap.forEach((objectUrl, relativePath) => {
        const escapedPath = relativePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        gltfText = gltfText.replace(
          new RegExp(`"uri"\\s*:\\s*"${escapedPath}"`, "g"),
          `"uri":"${objectUrl}"`
        );
      });

      const gltfBlob = new Blob([gltfText], { type: "model/gltf+json" });
      const previewUrl = URL.createObjectURL(gltfBlob);

      setLocalModelPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return previewUrl;
      });
    } catch (error) {
      console.error("Error construyendo preview local del modelo 3D:", error);
      setLocalModelPreviewUrl("");
    }
  };

  const handleModel3DFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files);

    const hasGltf = selectedFiles.some((file) =>
      file.name.toLowerCase().endsWith(".gltf")
    );

    if (!hasGltf) {
      message.error("La carpeta debe contener al menos un archivo .gltf");
      e.target.value = "";
      setModel3DFiles([]);
      setInvalidModel3DFiles([]);
      setLocalModelPreviewUrl("");
      return;
    }

    const allowedExtensions = [".gltf", ".bin", ".png", ".jpg", ".jpeg", ".webp"];

    const invalidFiles = selectedFiles
      .filter((file) => {
        const lowerName = file.name.toLowerCase();
        return !allowedExtensions.some((ext) => lowerName.endsWith(ext));
      })
      .map((file) => file.name);

    const formattedFiles = selectedFiles.map((file: any) => ({
      name: file.name,
      file,
      relativePath: file.webkitRelativePath || file.name,
    }));

    const rootFolder =
      (selectedFiles[0] as any)?.webkitRelativePath?.split("/")[0] || "";

    setModel3DFiles(formattedFiles);
    setInvalidModel3DFiles(invalidFiles);

    const validFilesForPreview = formattedFiles.filter(
      (item) => !invalidFiles.includes(item.name)
    );

    if (invalidFiles.length === 0) {
      buildLocalModelPreview(validFilesForPreview);
    } else {
      setLocalModelPreviewUrl("");
    }

    setFormData((prev) => ({
      ...prev,
      nombreCarpetaModelo3D: rootFolder,
      imagen3D: buildModel3DUrl(rootFolder),
    }));

    if (invalidFiles.length > 0) {
      message.warning(
        `Se detectaron archivos no permitidos en la carpeta: ${invalidFiles.join(", ")}`
      );
    } else {
      message.success("Carpeta del modelo 3D cargada correctamente");
    }
  };

  const handleDeleteModel3DFile = (index: number) => {
    const removedFile = model3DFiles[index];
    const updatedFiles = model3DFiles.filter((_, i) => i !== index);
    setModel3DFiles(updatedFiles);

    const updatedInvalidFiles = invalidModel3DFiles.filter(
      (fileName) => fileName !== removedFile?.name
    );
    setInvalidModel3DFiles(updatedInvalidFiles);

    if (updatedFiles.length === 0 || updatedInvalidFiles.length > 0) {
      setLocalModelPreviewUrl("");
    } else {
      buildLocalModelPreview(updatedFiles);
    }

    setFormData((prev) => ({
      ...prev,
      imagen3D:
        updatedFiles.length > 0 ? buildModel3DUrl(prev.nombreCarpetaModelo3D) : "",
    }));
  };

  const handleSaveNewModel = async (values: any) => {
    try {
      await saveModel({
        name: values.name,
        year: parseInt(values.year),
        brand: values.brand.trim(),
        versions: values.versions || [],
      });

      message.success("Modelo creado exitosamente");

      const updatedModels = await getTodosModelos();
      setModelos(updatedModels.data || []);

      setFormData((prev: any) => ({
        ...prev,
        modelos: Array.isArray(prev.modelos)
          ? [...prev.modelos, values.name]
          : [values.name],
      }));

      setIsModeloModalOpen(false);
    } catch (error) {
      console.error("Error creating model:", error);
      message.error("Error al crear el modelo");
    }
  };

  return (
    <div className="w-full">
      {/* Header fuera del Card - Estilo Título Principal */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onClose}
          type="button"
          className="p-2 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center text-gray-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">
            {mode === "create" ? "Crear Producto" : "Editar Producto"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === "create"
              ? "Agrega un nuevo producto a tu catálogo"
              : "Modifica la información del producto"}
          </p>
        </div>
      </div>

      {/* Card del Formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <form onSubmit={handleSubmit}>
          {/* Banner de Producto Inactivo */}
          {mode === "edit" && product?.estado === "inactivo" && (
            <div className="bg-[#fef3c7] border border-[rgba(217,119,6,0.7)] rounded-[10px] p-4 mb-6 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-[rgba(217,119,6,0.7)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-['Inter:Bold',sans-serif] font-bold text-[16px] text-[rgba(217,119,6,0.7)] leading-[24px] mb-2">
                  Producto Inactivo
                </h4>
                <p className="font-['Inter:Regular',sans-serif] text-[14px] text-[#364153] leading-[21px] mb-4">
                  Este producto está actualmente desactivado. Si deseas que esté
                  disponible nuevamente, haz clic en el botón para activarlo.
                </p>
                <button
                  type="button"
                  onClick={handleActivar}
                  className="bg-[#10b981] text-white font-['Inter:Medium',sans-serif] font-medium text-[14px] px-4 py-2 rounded-[10px] hover:bg-[#059669] transition-colors"
                >
                  Activar Producto
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Izquierda - Información Básica */}
            <div className="space-y-6">
              <h3 className="font-['Arimo:Bold',sans-serif] text-[18px] font-bold text-[#101828] leading-[28px]">
                Información Básica
              </h3>

              {/* Nombre del Producto */}
              <div className="space-y-1">
                <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                  Nombre del Producto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Llanta Michelin Primacy 4"
                  className="w-full px-4 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors"
                />
              </div>

              {/* Categoría */}
              <div className="space-y-1">
                <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Select
                      value={formData.categoria}
                      onChange={(value) =>
                        handleSelectChange("categoria", value)
                      }
                      options={categorias?.map((cat: any) => ({
                        value: cat.nombre,
                        label: cat.nombre,
                      }))}
                      placeholder="Seleccionar Categoría"
                      suffixIcon={
                        <ChevronDown className="w-4 h-4 text-[#4A5565]" />
                      }
                      variant="borderless"
                      className="w-full h-[45px] bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] focus-within:border-[#027EB1] transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    title="Crear nueva categoría"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="w-[45px] h-[45px] flex items-center justify-center bg-white border-2 border-[#027EB1] rounded-[10px] hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-[#027EB1]" />
                  </button>
                </div>
              </div>

              {/* Marca */}
              <div className="space-y-1">
                <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                  Marca <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Select
                      value={formData.marca}
                      onChange={(value) => handleSelectChange("marca", value)}
                      options={marcas?.map((m: any) => ({
                        value: m.nombre,
                        label: m.nombre,
                      }))}
                      placeholder="Seleccionar Marca"
                      suffixIcon={
                        <ChevronDown className="w-4 h-4 text-[#4A5565]" />
                      }
                      variant="borderless"
                      className="w-full h-[45px] bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] focus-within:border-[#027EB1] transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    title="Crear nueva marca"
                    onClick={() => setIsBrandModalOpen(true)}
                    className="w-[45px] h-[45px] flex items-center justify-center bg-white border-2 border-[#027EB1] rounded-[10px] hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-[#027EB1]" />
                  </button>
                </div>
              </div>

              {/* Modelos */}
              <div className="space-y-1">
                <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                  Modelos de vehículos compatibles <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 custom-multi-select">
                    <Select
                      mode="multiple"
                      allowClear
                      variant="borderless"
                      className="w-full min-h-[45px] bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] focus-within:border-[#027EB1] transition-colors [&_.ant-select-selector]:!min-h-[45px] [&_.ant-select-selector]:!border-none [&_.ant-select-selector]:!bg-transparent py-0.5"
                      placeholder="Seleccionar Modelos de Vehículos"
                      value={formData.modelos}
                      onChange={(value) => handleSelectChange("modelos", value)}
                      options={modelos.map((m) => {
                        const esObjeto = typeof m === 'object' && m !== null;
                        const year = esObjeto && m.anio ? new Date(m.anio).getUTCFullYear() : '';
                        const label = esObjeto ? `${m.marca} ${m.nombre} (${year})` : m;
                        const value = esObjeto ? m.nombre : m;
                        return { value, label };
                      })}
                      suffixIcon={
                        <ChevronDown className="w-4 h-4 text-[#4A5565]" />
                      }
                    />
                  </div>
                  <button
                    type="button"
                    title="Crear nuevo modelo de vehículo"
                    onClick={() => setIsModeloModalOpen(true)}
                    className="w-[45px] h-[45px] flex items-center justify-center bg-white border-2 border-[#027EB1] rounded-[10px] hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-[#027EB1]" />
                  </button>
                </div>
              </div>

              {formData.modelosData && formData.modelosData.length > 0 && (
                <div className="space-y-3 mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <h4 className="font-['Arimo:Bold',sans-serif] text-[14px] text-gray-700">Versiones por Modelo</h4>
                  {formData.modelosData.map((mData: any, index: number) => {
                    const modelFromApi = modelos.find(m => m.id === mData.id_modelo || m.id_modelo === mData.id_modelo || m.name === mData.nombre || m.nombre === mData.nombre);
                    const modelVersions = modelFromApi?.versiones || modelFromApi?.versions || [];
                    const hasVersions = modelVersions.length > 0;
                    
                    return (
                      <div key={mData.id_modelo || mData.nombre} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <span className="text-[14px] text-gray-600 font-medium sm:w-1/3">{mData.nombre}</span>
                        {hasVersions ? (
                          <Select
                            value={mData.id_version}
                            onChange={(val) => {
                              setFormData((prev: any) => {
                                const newModelosData = [...(prev.modelosData || [])];
                                newModelosData[index] = { ...newModelosData[index], id_version: val };
                                return { ...prev, modelosData: newModelosData };
                              });
                            }}
                            className="flex-1 min-w-[150px]"
                            placeholder="Sin versión"
                            allowClear
                          >
                            <Select.Option value={null}>Sin versión</Select.Option>
                            {modelVersions.map((v: any) => (
                              <Select.Option key={v.id_version} value={v.id_version}>{v.nombre}</Select.Option>
                            ))}
                          </Select>
                        ) : (
                          <span className="text-[13px] text-gray-400 italic">No hay versiones (Aplica en general)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Diseño (antes Versión) */}
              <div className="space-y-1">
                <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                  Diseño <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Select
                      value={formData.id_diseno || undefined}
                      onChange={(value) => handleDesignSelect(Number(value))}
                      options={disenos.map((diseno) => ({
                        value: diseno.id_diseno,
                        label: diseno.nombre,
                      }))}
                      placeholder={
                        selectedBrandId
                          ? loadingDisenos
                            ? "Cargando diseños..."
                            : "Seleccionar Diseño"
                          : "Selecciona una marca primero"
                      }
                      disabled={!selectedBrandId || loadingDisenos}
                      loading={loadingDisenos}
                      suffixIcon={
                        <ChevronDown className="w-4 h-4 text-[#4A5565]" />
                      }
                      variant="borderless"
                      className="w-full h-[45px] bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] focus-within:border-[#027EB1] transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    title="Crear nuevo diseño"
                    onClick={handleOpenDesignModal}
                    className="w-[45px] h-[45px] flex items-center justify-center bg-white border-2 border-[#027EB1] rounded-[10px] hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-[#027EB1]" />
                  </button>
                </div>
              </div>

              {/* Especificaciones de llanta */}
              <h3 className="font-['Arimo:Bold',sans-serif] text-[18px] font-bold text-[#101828] leading-[28px] pt-4">
                Especificaciones de llanta
              </h3>

              {/* Ancho, Perfil, Rin */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                    Alto <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <AutoComplete
                      className="w-full"
                      value={formData.ancho}
                      onChange={(value) => handleSelectChange("ancho", value)}
                      options={
                        specsDb.anchos.length > 0
                          ? specsDb.anchos.map((val) => ({ value: val }))
                          : [
                              { value: "205" },
                              { value: "215" },
                              { value: "225" },
                            ]
                      }
                      placeholder="Ej: 205"
                    >
                      <input placeholder="Ej: 205" className="w-full px-3 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors pr-8" />
                    </AutoComplete>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5565] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                    Perfil
                  </label>
                  <div className="relative">
                    <AutoComplete
                      className="w-full"
                      value={formData.perfil === "0" ? "Sin perfil" : formData.perfil}
                      onChange={(value) => {
                        const finalValue = value === "Sin perfil" ? "0" : value;
                        handleSelectChange("perfil", finalValue);
                      }}
                      options={[
                        { label: "Sin perfil", value: "Sin perfil" },
                        ...(specsDb.perfiles.length > 0
                          ? specsDb.perfiles.filter(v => v !== "0").map((val) => ({ value: val, label: val }))
                          : [
                              { value: "55", label: "55" },
                              { value: "60", label: "60" },
                              { value: "65", label: "65" },
                            ])
                      ]}
                      placeholder="Ej: 55"
                    >
                      <input placeholder="Ej: 55" className="w-full px-3 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors pr-8" />
                    </AutoComplete>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5565] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                    Rin <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <AutoComplete
                      className="w-full"
                      value={formData.rin}
                      onChange={(value) => handleSelectChange("rin", value)}
                      options={
                        specsDb.rines.length > 0
                          ? specsDb.rines.map((val) => ({ value: val }))
                          : [
                              { value: "16" },
                              { value: "17" },
                              { value: "18" },
                            ]
                      }
                      placeholder="Ej: 16"
                    >
                      <input placeholder="Ej: 16" className="w-full px-3 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors pr-8" />
                    </AutoComplete>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5565] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Lonas, Profundidad, Presión máxima, Velocidad, Carga */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                    Lona (PR) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <AutoComplete
                      className="w-full"
                      value={formData.lonas}
                      onChange={(value) => handleSelectChange("lonas", value)}
                      options={
                        specsDb.lonas.length > 0
                          ? specsDb.lonas.map((val) => ({ value: val }))
                          : [
                              { value: "6" },
                              { value: "8" },
                              { value: "10" },
                            ]
                      }
                      placeholder="Ej: 6"
                    >
                      <input placeholder="Ej: 6" className="w-full px-3 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors pr-8" />
                    </AutoComplete>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5565] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                    Profundidad (mm) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <AutoComplete
                      className="w-full"
                      value={formData.profundidad}
                      onChange={(value) =>
                        handleSelectChange("profundidad", value)
                      }
                      options={
                        specsDb.profundidades.length > 0
                          ? specsDb.profundidades.map((val) => ({ value: val }))
                          : [
                              { value: "6" },
                              { value: "8" },
                              { value: "10" },
                            ]
                      }
                      placeholder="Ej: 8"
                    >
                      <input placeholder="Ej: 8" className="w-full px-3 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors pr-8" />
                    </AutoComplete>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5565] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                    Presión máxima (psi) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <AutoComplete
                      className="w-full"
                      value={formData.presionMaxima}
                      onChange={(value) =>
                        handleSelectChange("presionMaxima", value)
                      }
                      options={
                        specsDb.presiones.length > 0
                          ? specsDb.presiones.map((val) => ({ value: val }))
                          : [{ value: "40" }, { value: "50" }]
                      }
                      placeholder="Ej: 40"
                    >
                      <input placeholder="Ej: 40" className="w-full px-3 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors pr-8" />
                    </AutoComplete>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5565] pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                    Índice de Velocidad <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <AutoComplete
                      className="w-full"
                      value={formData.indiceVelocidad}
                      onChange={(value) =>
                        handleSelectChange("indiceVelocidad", value)
                      }
                      options={
                        specsDb.velocidades.length > 0
                          ? specsDb.velocidades.map((val) => ({ value: val }))
                          : [
                              { value: "200" },
                              { value: "210" },
                              { value: "240" },
                            ]
                      }
                      placeholder="Ej: 200"
                    >
                      <input placeholder="Ej: 200" className="w-full px-3 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors pr-8" />
                    </AutoComplete>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5565] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                    Índice de carga <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <AutoComplete
                      className="w-full"
                      value={formData.indiceCarga}
                      onChange={(value) =>
                        handleSelectChange("indiceCarga", value)
                      }
                      options={
                        specsDb.cargas.length > 0
                          ? specsDb.cargas.map((val) => ({ value: val }))
                          : [
                              { value: "110" },
                              { value: "115" },
                              { value: "120" },
                            ]
                      }
                      placeholder="Ej: 110"
                    >
                      <input placeholder="Ej: 110" className="w-full px-3 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors pr-8" />
                    </AutoComplete>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5565] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Especificación completa */}
              <div className="space-y-1">
                <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                  Especificación completa
                </label>
                <input
                  type="text"
                  name="especificacionCompleta"
                  value={formData.especificacionCompleta}
                  onChange={handleChange}
                  placeholder="Ej: 205/55R16 91V"
                  className="w-full px-4 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors"
                />
              </div>

              {/* Precio y detalles */}
              <h3 className="font-['Arimo:Bold',sans-serif] text-[18px] font-bold text-[#101828] leading-[28px] pt-4">
                Precio y detalles
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                    Precio (LPS) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="precio"
                    value={formData.precio}
                    onChange={handleChange}
                    placeholder="Ej: 1500"
                    className="w-full px-4 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                    Precio por Mayoreo (LPS)
                  </label>
                  <input
                    type="text"
                    name="precioMayoreo"
                    value={formData.precioMayoreo}
                    onChange={handleChange}
                    placeholder="Ej: 1200"
                    className="w-full px-4 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-1">
                <label className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#364153] leading-[20px]">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción detallada del producto, características, etc."
                  maxLength={255}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors resize-none"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {formData.descripcion?.length || 0} / 255 caracteres
                </div>
              </div>
            </div>

            {/* Columna Derecha - Imágenes del producto */}
            <div className="space-y-6">
              <h3 className="font-['Arimo:Bold',sans-serif] text-[18px] font-bold text-[#101828] leading-[28px]">
                Imágenes del producto
              </h3>

              {/* Área de carga de imágenes */}
              <div className="border-2 border-dashed border-[#d1d5db] rounded-xl p-8 text-center bg-[#f9fafb]">
                <Upload className="w-12 h-12 text-[#027EB1] mx-auto mb-3" />
                <p className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#6b7280] mb-1">
                  Arrastra imágenes aquí
                </p>
                <p className="font-['Arimo:Regular',sans-serif] text-[12px] text-[#9ca3af] mb-3">
                  o selecciona archivos
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="px-4 py-2 bg-[#027EB1] text-white font-['Arimo:Regular',sans-serif] text-[14px] rounded-lg hover:bg-[#026a97] transition-colors cursor-pointer"
                >
                  Agregar
                </label>
              </div>

              {/* Archivos subidos */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <p className="font-['Arimo:Bold',sans-serif] text-[14px] text-[#364153]">
                    Imágenes subidas
                  </p>
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-[#f3f4f6] rounded-lg border border-[#e5e7eb]"
                    >
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-[#027EB1]" />
                        <span className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#1a1a1a] truncate max-w-[200px]">
                          {image.name ||
                            (typeof image.url === "string"
                              ? image.url.split("/").pop()
                              : "Imagen")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(index)}
                        className="p-1 hover:bg-[#fee2e2] rounded transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-[#D61216]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <h3 className="font-['Arimo:Bold',sans-serif] text-[18px] font-bold text-[#101828] leading-[28px]">
                Modelo 3D
              </h3>

              <div className="flex items-start gap-3 p-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl">
                <Info className="w-4 h-4 text-[#2563eb] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-['Arimo:Medium',sans-serif] text-[13px] text-[#1d4ed8]">
                    Debes subir la carpeta completa del modelo 3D
                  </p>
                  <p className="font-['Arimo:Regular',sans-serif] text-[12px] text-[#475569]">
                    La carpeta debe contener al menos un archivo .gltf y puede incluir .bin y texturas válidas como .png, .jpg, .jpeg o .webp
                  </p>
                </div>
              </div>

              <div className="border-2 border-dashed border-[#d1d5db] rounded-xl p-8 text-center bg-[#f9fafb]">
                <Upload className="w-12 h-12 text-[#027EB1] mx-auto mb-3" />
                <p className="font-['Arimo:Regular',sans-serif] text-[14px] text-[#6b7280] mb-1">
                  Arrastra archivos del modelo aquí
                </p>
                <p className="font-['Arimo:Regular',sans-serif] text-[12px] text-[#9ca3af] mb-3">
                  o selecciona la carpeta del modelo 3D
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleModel3DFolderUpload}
                  className="hidden"
                  id="model3d-folder-upload"
                  {...({ webkitdirectory: "", directory: "" } as any)}
                />
                <label
                  htmlFor="model3d-folder-upload"
                  className="px-4 py-2 bg-[#027EB1] text-white font-['Arimo:Regular',sans-serif] text-[14px] rounded-lg hover:bg-[#026a97] transition-colors cursor-pointer"
                >
                  Agregar carpeta
                </label>
              </div>

              {model3DFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="font-['Arimo:Bold',sans-serif] text-[14px] text-[#364153]">
                    Archivos del modelo 3D
                  </p>
                  {model3DFiles.map((fileItem, index) => {
                    const isInvalid = invalidModel3DFiles.includes(fileItem.name);

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isInvalid
                            ? "bg-[#fef2f2] border-[#fecaca]"
                            : "bg-[#f3f4f6] border-[#e5e7eb]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-[#027EB1]" />
                          <div className="flex flex-col">
                            <span
                              className={`font-['Arimo:Regular',sans-serif] text-[14px] truncate max-w-[220px] ${
                                isInvalid ? "text-[#b91c1c]" : "text-[#1a1a1a]"
                              }`}
                            >
                              {fileItem.name}
                            </span>
                            {isInvalid && (
                              <span className="text-[12px] text-[#dc2626]">
                                Extensión no permitida
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteModel3DFile(index)}
                          className="p-1 hover:bg-[#fee2e2] rounded transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-[#D61216]" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}


              {/* URL Modelo 3D */}
              <div>
                <label className="block font-['Arimo:Medium',sans-serif] text-[14px] font-medium text-[#364153] mb-1.5">
                  Nombre carpeta modelo 3D
                </label>
                <input
                  type="text"
                  name="nombreCarpetaModelo3D"
                  value={formData.nombreCarpetaModelo3D}
                  onChange={handleChange}
                  placeholder="Ejemplo: camaro_copo_tyre"
                  className="w-full px-3 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors"
                />
              </div>

              <div>
                <label className="block font-['Arimo:Medium',sans-serif] text-[14px] font-medium text-[#364153] mb-1.5">
                  URL Modelo 3D
                </label>
                <input
                  type="text"
                  name="imagen3D"
                  value={formData.imagen3D}
                  placeholder="/Modelo3d/nombre_de_la_carpeta_del_modelo/scene.gltf"
                  className="w-full px-3 py-2.5 bg-white border border-[#a5a5a5] rounded-[10px] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] font-['Arimo:Regular',sans-serif] text-[15px] text-[rgba(26,26,26,0.8)] leading-[22.5px] focus:outline-none focus:border-[#027EB1] transition-colors"
                  readOnly
                />
              </div>

              {(localModelPreviewUrl || formData.imagen3D) && (
                <button
                  type="button"
                  onClick={() => setModal3DOpen(true)}
                  className="w-full border-2 border-[#027eb1] text-[#027eb1] font-medium text-base py-3 rounded-[10px] hover:bg-blue-50 transition-colors bg-transparent"
                >
                  Ver Modelo 3D
                </button>
              )}

            </div>
          </div>

          {/* Botones del footer */}
          <div className="flex items-center justify-start gap-3 mt-8 pt-6 border-t border-[#e5e7eb]">
            <button
              type="button"
              className="px-6 py-2.5 bg-[#e5e7eb] text-[#4a4a4a] font-['Arimo:Medium',sans-serif] text-[16px] font-medium rounded-[14px] hover:bg-[#d1d5db] transition-colors"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#027EB1] text-white font-['Arimo:Medium',sans-serif] text-[16px] font-medium rounded-[14px] hover:bg-[#026a97] transition-colors ml-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {mode === "create" ? "Creando..." : "Guardando..."}
                </>
              ) : mode === "create" ? (
                "Crear"
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </form>

        <CategoryModal
          open={isCategoryModalOpen}
          onCancel={() => setIsCategoryModalOpen(false)}
          onSuccess={handleSaveNewCategory}
        />

        <ModeloModal
          open={isModeloModalOpen}
          onCancel={() => setIsModeloModalOpen(false)}
          onSave={handleSaveNewModel}
        />

        <BrandModal
          isOpen={isBrandModalOpen}
          onClose={() => setIsBrandModalOpen(false)}
          onSave={handleSaveNewBrand}
        />

        <DesignModal
          isOpen={isDesignModalOpen}
          onClose={() => setIsDesignModalOpen(false)}
          marcaNombre={formData.marca}
          onSave={handleSaveNewDesign}
        />

        {modal3DOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Modelo 3D del producto"
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setModal3DOpen(false)}
            aria-hidden
          />
          <div
            className="relative bg-white rounded-[16px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] w-full max-w-[1024px] h-[683px] max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModal3DOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors border-0"
              aria-label="Cerrar"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div
              className="flex-1 flex flex-col min-h-0 p-6"
              style={{
                background:
                  "linear-gradient(146deg, rgba(2, 126, 177, 0.1) 0%, rgba(0, 62, 123, 0.1) 100%)",
              }}
            >
              <div className="flex-1 min-h-[200px] rounded-[10px] overflow-hidden bg-white/50 border border-[#e5e7eb] flex items-center justify-center">
                {(localModelPreviewUrl || formData.imagen3D) ? (
                  modelViewerReady ? (
                    createElement("model-viewer", {
                      src: localModelPreviewUrl
                      ? localModelPreviewUrl
                      : formData.imagen3D.startsWith("http")
                        ? formData.imagen3D
                        : `${import.meta.env.VITE_API_URL}/public/${formData.imagen3D.replace(/^\/+/, "")}`,
                      alt: "Modelo 3D del producto",
                      "camera-controls": true,
                      "auto-rotate": true,
                      "shadow-intensity": "1",
                      exposure: "0.8",
                      "environment-image": "neutral",
                      "tone-mapping": "commerce",
                      style: { width: "100%", height: "100%", minHeight: "280px" },
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 text-[#4a4a4a] p-8">
                      <CubeIcon />
                      <p className="text-sm text-center">Cargando modelo 3D…</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 text-[#4a4a4a] p-8">
                    <CubeIcon />
                    <p className="text-sm text-center">
                      No hay modelo 3D disponible para este producto.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div
              className="h-0.5 flex-shrink-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }}
            />
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

function CubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-16 h-16 text-[#027eb1]"}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M48 16L16 36v24l32 20 32-20V36L48 16z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M48 16v40M16 36l32 20 32-20M16 60l32-20 32 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
