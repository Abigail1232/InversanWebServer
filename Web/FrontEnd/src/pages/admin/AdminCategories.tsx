import { useEffect, useMemo, useState } from "react";
import { Input, Button as AntButton, Modal, Switch, message, ConfigProvider } from "antd";
import {PlusOutlined, UploadOutlined, LeftOutlined, RightOutlined} from "@ant-design/icons";
import { Pencil } from "lucide-react";
import { FaBoxOpen } from "react-icons/fa";
import { FilterBar } from "../../components/FilterBar";

import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import DeactivateModal from "../../components/modal/DeactivateModal";

import {getCategorias,crearCategoria,modificarCategoria,eliminarCategoria,type Categoria} from "../../api/products/categorias";

const PAGE_SIZE = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png","image/jpg","image/jpeg","image/svg+xml"];

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_URL = rawApiUrl.replace(/\/$/, "");

function buildImageUrl(src: string | null): string | null {
  if (!src || src.trim() === "") return null;

  const cleanSrc = src.trim();

  if (cleanSrc.startsWith("http://") || cleanSrc.startsWith("https://")) {
    return cleanSrc;
  }

  if (cleanSrc.startsWith("/public/")) {
    return `${API_URL}${cleanSrc}`;
  }

  if (cleanSrc.startsWith("public/")) {
    return `${API_URL}/${cleanSrc}`;
  }

  if (cleanSrc.startsWith("/")) {
    return `${API_URL}${cleanSrc}`;
  }

  return `${API_URL}/public/${cleanSrc}`;
}

function CategoryImage({src,alt,}: {src: string | null;alt: string;}): React.JSX.Element {
  const [imageError, setImageError] = useState(false);
  const finalSrc = buildImageUrl(src);

  useEffect(() => {setImageError(false);}, [src]);

  if (!finalSrc || imageError) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F3F4F6]">
        <FaBoxOpen className="h-6 w-6 text-[#9CA3AF]" />
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      className="h-12 w-12 rounded-lg object-cover"
      onError={() => setImageError(true)}
    />
  );
}

export default function AdminCategories(): React.JSX.Element {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos");
  const [page, setPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryActive, setNewCategoryActive] = useState(true);
  const [newCategoryFile, setNewCategoryFile] = useState<File | null>(null);
  const [newCategoryPreview, setNewCategoryPreview] = useState<string | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryActive, setEditCategoryActive] = useState(true);
  const [editCategoryFile, setEditCategoryFile] = useState<File | null>(null);
  const [editCategoryPreview, setEditCategoryPreview] = useState<string | null>(null);

  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivatingCategory, setDeactivatingCategory] = useState(false);
  const [categoryToDeactivate, setCategoryToDeactivate] =useState<Categoria | null>(null);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const response = await getCategorias();
      setCategorias(response);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {fetchCategorias();}, []);

  useEffect(() => {
    return () => {
      if (newCategoryPreview && newCategoryPreview.startsWith("blob:")) {
        URL.revokeObjectURL(newCategoryPreview);
      }
    };
  }, [newCategoryPreview]);

  useEffect(() => {
    return () => {
      if (editCategoryPreview && editCategoryPreview.startsWith("blob:")) {
        URL.revokeObjectURL(editCategoryPreview);
      }
    };
  }, [editCategoryPreview]);

  const categoriasFiltradas = useMemo(() => {
    return categorias.filter((categoria) => {
      const matchNombre = categoria.nombre.toLowerCase().includes(search.toLowerCase().trim());

      const matchEstado = estadoFiltro === "todos"? true: estadoFiltro === "activo"? categoria.activo === true: categoria.activo === false;

      return matchNombre && matchEstado;
    });
  }, [categorias, search, estadoFiltro]);

  const totalPages = Math.max(1, Math.ceil(categoriasFiltradas.length / PAGE_SIZE));

  const categoriasPaginadas = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return categoriasFiltradas.slice(start, start + PAGE_SIZE);
  }, [categoriasFiltradas, page]);

  const desde = categoriasFiltradas.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(page * PAGE_SIZE, categoriasFiltradas.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const resetCreateForm = () => {
    setNewCategoryName("");
    setNewCategoryActive(true);
    setNewCategoryFile(null);

    if (newCategoryPreview && newCategoryPreview.startsWith("blob:")) {
      URL.revokeObjectURL(newCategoryPreview);
    }

    setNewCategoryPreview(null);
  };

  const resetEditForm = () => {
    setEditCategoryId(null);
    setEditCategoryName("");
    setEditCategoryActive(true);
    setEditCategoryFile(null);

    if (editCategoryPreview && editCategoryPreview.startsWith("blob:")) {
      URL.revokeObjectURL(editCategoryPreview);
    }

    setEditCategoryPreview(null);
  };

  const handleCreate = () => {
    resetCreateForm();
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    resetEditForm();
  };

  const closeDeactivateModal = () => {
    if (deactivatingCategory) return;
    setIsDeactivateModalOpen(false);
    setCategoryToDeactivate(null);
  };

  const handleCreateFileChange = ( event: React.ChangeEvent<HTMLInputElement> ) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      message.error("Solo se permiten imágenes PNG, JPG, JPEG o SVG.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      message.error("La imagen debe ser menor a 5 MB.");
      event.target.value = "";
      return;
    }

    setNewCategoryFile(file);

    if (newCategoryPreview && newCategoryPreview.startsWith("blob:")) {
      URL.revokeObjectURL(newCategoryPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setNewCategoryPreview(previewUrl);
  };

  const handleEditFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      message.error("Solo se permiten imágenes PNG, JPG, JPEG o SVG.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      message.error("La imagen debe ser menor a 5 MB.");
      event.target.value = "";
      return;
    }

    setEditCategoryFile(file);

    if (editCategoryPreview && editCategoryPreview.startsWith("blob:")) {
      URL.revokeObjectURL(editCategoryPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setEditCategoryPreview(previewUrl);
  };

  const create_new_category = async () => {
    try {
      const nombreLimpio = newCategoryName.trim();

      if (nombreLimpio === "") {
        message.error("El nombre de la categoría es obligatorio.");
        return;
      }

      if (nombreLimpio.length > 50) {
        message.error("El nombre no puede tener más de 50 caracteres.");
        return;
      }

      if (!newCategoryFile) {
        message.error("Debes seleccionar una imagen para la categoría.");
        return;
      }

      setCreatingCategory(true);

      await crearCategoria({
        nombre: nombreLimpio,
        imagen: newCategoryFile,
        activo: newCategoryActive,
      });

      message.success("La categoría se creó correctamente.");

      closeCreateModal();
      resetCreateForm();
      await fetchCategorias();
      setPage(1);
    } catch (error: any) {
      console.error("Error al crear categoría:", error);

      const errorMsg = error?.response?.data?.msg || "No se pudo crear la categoría. Inténtalo de nuevo.";

      message.error(errorMsg);
    } finally {
      setCreatingCategory(false);
    }
  };

  const update_category = async () => {
    try {
      const nombreLimpio = editCategoryName.trim();

      if (editCategoryId === null) {
        message.error("No se encontró la categoría a editar.");
        return;
      }

      if (nombreLimpio === "") {
        message.error("El nombre de la categoría es obligatorio.");
        return;
      }

      if (nombreLimpio.length > 50) {
        message.error("El nombre no puede tener más de 50 caracteres.");
        return;
      }

      setEditingCategory(true);

      await modificarCategoria({
        id_categoria: editCategoryId,
        nombre: nombreLimpio,
        activo: editCategoryActive,
        imagen: editCategoryFile,
      });

      message.success("La categoría se actualizó correctamente.");

      closeEditModal();
      await fetchCategorias();
    } catch (error: any) {
      console.error("Error al modificar categoría:", error);

      const errorMsg = error?.response?.data?.msg || "No se pudo actualizar la categoría. Inténtalo de nuevo.";

      message.error(errorMsg);
    } finally {
      setEditingCategory(false);
    }
  };

  const handleDeactivateCategory = async () => {
    try {
      if (!categoryToDeactivate) {
        message.error("No se encontró la categoría a desactivar.");
        return;
      }

      setDeactivatingCategory(true);

      await eliminarCategoria(categoryToDeactivate.id_categoria);

      message.success(`La categoría "${categoryToDeactivate.nombre}" fue desactivada correctamente.`);

      closeDeactivateModal();
      await fetchCategorias();
      } catch (error: any) {
      console.error("Error al desactivar categoría:", error);

      const errorMsg = error?.response?.data?.msg || "No se pudo desactivar la categoría. Inténtalo de nuevo.";

      message.error(errorMsg);
    } finally {
      setDeactivatingCategory(false);
    }
  };

  const handleToggleActive = async (categoria: Categoria, checked: boolean) => {
    if (!checked) {
      openDeactivate(categoria);
    } else {
      try {
        await modificarCategoria({
          id_categoria: categoria.id_categoria,
          nombre: categoria.nombre,
          activo: true,
        });
        message.success(`La categoría "${categoria.nombre}" fue activada correctamente.`);
        void fetchCategorias();
      } catch (error) {
        console.error("Error al activar categoría:", error);
        message.error("No se pudo activar la categoría. Inténtalo de nuevo.");
      }
    }
  };

  const openEdit = (categoria: Categoria) => {
    setEditCategoryId(categoria.id_categoria);
    setEditCategoryName(categoria.nombre);
    setEditCategoryActive(categoria.activo);
    setEditCategoryFile(null);
    setEditCategoryPreview(buildImageUrl(categoria.imagen_url));
    setIsEditModalOpen(true);
  };

  const openDeactivate = (categoria: Categoria) => {
    setCategoryToDeactivate(categoria);
    setIsDeactivateModalOpen(true);
  };

  // const badgeEstado = (activo: boolean) => {
  //   return (
  //     <span
  //       className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-medium ${ activo ? "bg-[#DDF3E4] text-[#15803D]" : "bg-[#F9DADA] text-[#DC2626]"}`}>
  //       {activo ? "Activo" : "Inactivo"}
  //     </span>
  //   );
  // };

  const columns: DataTableColumn<Categoria>[] = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      render: (value) => (
        <div className="flex w-full justify-start">
          <span className="text-sm text-[#1F2937]">
            {String(value ?? "")}
          </span>
        </div>
      ),
    },
    {
      title: "Icono",
      dataIndex: "imagen_url",
      key: "icono",
      render: (_, record) => (
        <CategoryImage src={record.imagen_url} alt={record.nombre} />
      ),
    },
    {
      title: "Estado",
      dataIndex: "activo",
      key: "estado",
      render: (_, record) => (
        <div className="flex items-center justify-center">
          <Switch
            checked={Boolean(record.activo)}
            onChange={(checked) => handleToggleActive(record, checked)}
            style={{ backgroundColor: record.activo ? "#16A34A" : "#D1D5DB" }}
          />
        </div>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-3">
          <AntButton
            size="small"
            type="text"
            className="!text-[#027EB1]"
            icon={<Pencil className="w-5 h-5" />}
            onClick={() => openEdit(record)}
          />
        </div>
      ),
    },
  ];

  return (
  <ConfigProvider>
    <div className="min-h-screen bg-[#F3F4F6] px-4 py-6 md:px-8">
      <style>{`
        .categories-table-wrapper table thead th:first-child {
          text-align: left !important;
          padding-left: 24px !important;
        }

        .categories-table-wrapper table tbody td:first-child > div {
          justify-content: flex-start !important;
          width: 100%;
          padding-left: 8px !important;
        }
      `}</style>


      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-2xl font-semibold leading-8 text-[#1A1A1A] md:text-[32px] md:leading-10">
          Administración de Categorías
        </h1>

        <p className="mt-1 mb-5 text-sm text-[#6B7280]">
          Administra las categorías disponibles en la plataforma.
        </p>

        <div className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <FilterBar
            className="items-center justify-between"
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setPage(1);
              },
              placeholder: "Buscar por nombre de categoría...",
            }}
            filters={[
              {
                placeholder: "Filtrar por Estado",
                value: estadoFiltro,
                onChange: (v) => {
                  setEstadoFiltro((v as string) || "todos");
                  setPage(1);
                },
                options: [
                  { label: "Todos", value: "todos" },
                  { label: "Activo", value: "activo" },
                  { label: "Inactivo", value: "inactivo" },
                ],
              },
            ]}
            onClear={() => {
              setSearch("");
              setEstadoFiltro("todos");
              setPage(1);
            }}
          >
            <div className="w-full md:w-auto">
              <Button
                className="h-11 rounded-xl border-0 px-5 text-sm font-bold !text-white !bg-[#027eb1] shadow-md transition-all hover:!bg-[#026a96] hover:shadow-lg active:!bg-[#025a80]"
                onClick={handleCreate}
              >
                <span className="flex items-center justify-center gap-2">
                  <PlusOutlined className="!text-white" />
                  Crear Categoria
                </span>
              </Button>
            </div>
          </FilterBar>
        </div>

        <div className="hidden md:block categories-table-wrapper">
          <DataTable<Categoria>
            rowKey="id_categoria"
            columns={columns}
            dataSource={categoriasPaginadas}
            loading={loading}
            emptyMessage="No se encontraron categorías."
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total: categoriasFiltradas.length,
              onChange: (nextPage) => setPage(nextPage),
            }}
          />
        </div>

        <div className="space-y-3 md:hidden">
          <div className="mb-3 text-sm text-[#6B7280]">
            Mostrando {desde}-{hasta} de {categoriasFiltradas.length} resultados
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-8 text-center text-sm text-[#6B7280] shadow-sm">
              Cargando categorías...
            </div>
          ) : categoriasPaginadas.length > 0 ? (
            categoriasPaginadas.map((categoria) => (
              <Card
                key={categoria.id_categoria}
                className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">
                      <CategoryImage
                        src={categoria.imagen_url}
                        alt={categoria.nombre}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[15px] font-semibold text-[#1F2937]">
                        {categoria.nombre}
                      </h3>

                      <div className="mt-2 flex items-center gap-2">
                        <Switch
                          checked={Boolean(categoria.activo)}
                          onChange={(checked) => handleToggleActive(categoria, checked)}
                          style={{ backgroundColor: categoria.activo ? "#16A34A" : "#D1D5DB", transform: "scale(0.8)" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(categoria)}
                      className="flex h-[38px] items-center justify-center gap-2 rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] text-sm font-medium text-[#16A34A] transition hover:bg-[#DCFCE7] [&_.anticon]:text-lg w-full"
                    >
                      <Pencil className="w-5 h-5" />
                      Editar
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-8 text-center text-sm text-[#6B7280] shadow-sm">
              No se encontraron categorías.
            </div>
          )}

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <AntButton
                icon={<LeftOutlined />}
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Anterior
              </AntButton>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (num) => {
                    const isActive = num === page;

                    return (
                      <button
                        key={num}
                        onClick={() => setPage(num)}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition ${
                          isActive
                            ? "bg-[#003E7B] text-white"
                            : "border border-[#D1D5DB] bg-white text-[#6B7280]"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  }
                )}
              </div>

              <AntButton
                icon={<RightOutlined />}
                iconPosition="end"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Siguiente
              </AntButton>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={isCreateModalOpen}
        onCancel={closeCreateModal}
        footer={null}
        centered
        width={480}
        closable={false}
        className="[&_.ant-modal-content]:!rounded-[18px] [&_.ant-modal-content]:!overflow-hidden [&_.ant-modal-content]:!p-0 max-md:[&_.ant-modal]:!w-[calc(100vw-24px)]"
      >
        <div className="border-b border-[#E5E7EB] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-bold text-[#1F2937]">
                Crear Categoría
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Completa los datos para crear una nueva categoría.
              </p>
            </div>

            <button
              type="button"
              onClick={closeCreateModal}
              className="text-[24px] leading-none text-[#6B7280]"
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#374151]">
                Nombre de la categoría
              </label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej. SUV, Camioneta, Sedan..."
                className="h-[42px] rounded-xl"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#374151]">
                Ícono de la categoría
              </label>

              <label className="flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-[#D1D5DB] bg-white px-4 py-4 text-center transition hover:border-[#027EB1]">
                {newCategoryPreview ? (
                  <img
                    src={newCategoryPreview}
                    alt="Preview categoría"
                    className="max-h-[60px] object-contain"
                  />
                ) : (
                  <>
                    <UploadOutlined className="mb-2 text-[26px] text-[#9CA3AF]" />
                    <span className="text-[16px] font-medium text-[#4B5563]">
                      Subir ícono
                    </span>
                    <span className="mt-1 text-sm text-[#9CA3AF]">
                      PNG, JPG o SVG
                    </span>
                  </>
                )}

                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg"
                  className="hidden"
                  onChange={handleCreateFileChange}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#E5E7EB] px-5 py-3 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            className="h-[42px] w-full border border-gray-400 px-6 sm:w-auto"
            onClick={closeCreateModal}
            disabled={creatingCategory}
          >
            Cancelar
          </Button>

          <Button
            className="h-[42px] rounded-xl border-0 px-5 text-sm font-bold !text-white !bg-[#027eb1] shadow-md transition-all hover:!bg-[#026a96] hover:shadow-lg active:!bg-[#025a80]"
            onClick={create_new_category}
            disabled={creatingCategory}
          >
            {creatingCategory ? "Creando..." : "Crear"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={isEditModalOpen}
        onCancel={closeEditModal}
        footer={null}
        centered
        width={650}
        closable={false}
        className="[&_.ant-modal-content]:!rounded-[18px] [&_.ant-modal-content]:!overflow-hidden [&_.ant-modal-content]:!p-0 max-md:[&_.ant-modal]:!w-[calc(100vw-24px)]"
      >
        <div className="border-b border-[#E5E7EB] px-5 py-4 md:px-7 md:py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-bold text-[#1F2937]">
                Editar Categoría
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Modifica los datos de la categoría
              </p>
            </div>

            <button
              type="button"
              onClick={closeEditModal}
              className="text-[24px] leading-none text-[#6B7280]"
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-5 py-4 md:px-7 md:py-6">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#374151]">
                Nombre de la categoría
              </label>
              <Input
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                className="h-[48px] rounded-xl md:h-[52px]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#374151]">
                Ícono de la categoría
              </label>

              <label className="flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-[#D1D5DB] bg-white px-4 py-5 text-center transition hover:border-[#027EB1] md:min-h-[145px]">
                {editCategoryPreview ? (
                  <img
                    src={editCategoryPreview}
                    alt="Preview categoría editada"
                    className="max-h-[90px] max-w-full object-contain"
                  />
                ) : (
                  <>
                    <UploadOutlined className="mb-2 text-[28px] text-[#9CA3AF]" />
                    <span className="text-[16px] font-medium text-[#4B5563]">
                      Subir ícono
                    </span>
                    <span className="mt-1 text-sm text-[#9CA3AF]">
                      PNG, JPG o SVG
                    </span>
                  </>
                )}

                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg"
                  className="hidden"
                  onChange={handleEditFileChange}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#E5E7EB] px-5 py-3 md:px-7 md:py-5 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            className="h-[42px] w-full border border-gray-400 px-6 sm:w-auto"
            onClick={closeEditModal}
            disabled={editingCategory}
          >
            Cancelar
          </Button>

          <Button
            className="h-[42px] rounded-xl border-0 px-5 text-sm font-bold !text-white !bg-[#027eb1] shadow-md transition-all hover:!bg-[#026a96] hover:shadow-lg active:!bg-[#025a80]"
            onClick={update_category}
            disabled={editingCategory}
          >
            {editingCategory ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </Modal>

      <DeactivateModal
        open={isDeactivateModalOpen}
        itemName={categoryToDeactivate?.nombre || ""}
        itemType="Categoría"
        isActive={categoryToDeactivate?.activo || false}
        loading={deactivatingCategory}
        onCancel={closeDeactivateModal}
        onConfirm={handleDeactivateCategory}
      />
    </div>
  </ConfigProvider>
  );
}