import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ConfigProvider, Switch, message } from "antd";
import {
  Eye,
  Pencil,
  Warehouse,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import ProductModal from '../../components/modal/ProductModal';
import ProductViewModal from '../../components/modal/ProductViewModal';
import { FilterBar } from '../../components/FilterBar';
import { getProductosAdmin, cambiarEstadoProducto, getCategorias, getMarcas } from "../../api/products/productos";
import { ProductStockModal } from "../../components/modal/ProductStockModal";
import DeactivateModal from "../../components/modal/DeactivateModal";

interface Producto {
  id: number;
  nombre: string;
  marca: string;
  modelo: string;
  modelos: string[];
  precio: number;
  stock: number;
  especificaciones: string;
  estado: 'activo' | 'inactivo';
  descripcion?: string;
  categoria?: string;
  año?: string;
  version?: string;
  ancho?: string;
  perfil?: string;
  rin?: string;
  lonas?: string;
  profundidad?: string;
  presionMaxima?: string;
  indiceVelocidad?: string;
  indiceCarga?: string;
  especificacionCompleta?: string;
  precioMayoreo?: number;
  imagenes?: { url: string; id: number }[];
  sucursales?: {
    id_sucursal: number;
    nombre_sucursal: string;
    bodega: string;
    existencias: number;
  }[];
  modelo3D?: {
    nombre: string;
    tamaño: string;
    url: string;
  };
}

export default function ProductosPage() {
  const [searchParams, setSearchParams] = useSearchParams();

const sortBy = searchParams.get("sortBy") || "";
const order = searchParams.get("order") || "";
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const toggleSort = (field: string) => {
    const newOrder = sortBy === field && order === "asc" ? "desc" : "asc";
    const currentParams = Object.fromEntries(searchParams.entries());
    setSearchParams({
      ...currentParams,
      sortBy: field,
      order: newOrder,
    });
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Producto | undefined>(undefined);
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [productToDeactivate, setProductToDeactivate] = useState<Producto | undefined>(undefined);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [paginasTotales, setPaginasTotales] = useState(0);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [productos, setProductos] = useState<Producto[]>([]);

  const [isCajaModalOpen, setIsCajaModalOpen] = useState(false);
  const [productCaja, setProductCaja] = useState<Producto | undefined>(undefined);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setTimeout(() => setShowLoading(true), 300);
    } else {
      setShowLoading(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

 useEffect(() => {
  fetchProductos();
}, [currentPage, selectedMarca, selectedEstado, selectedCategoria, searchQuery, sortBy, order]);
  
const fetchInitialData = async () => {
    try {
      const [cats, brands] = await Promise.all([getCategorias(), getMarcas()]);
      setCategorias(cats.data || []);
      setMarcas(brands.data || []);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const filters = {
  search: searchQuery,
  marca: selectedMarca,
  categoria: selectedCategoria,
  estado: selectedEstado,
  sortBy,
  order
};
      const response = await getProductosAdmin(currentPage, itemsPerPage, filters);
      if (response.success) {
        const mappedProducts = response.data.map((p: any) => ({
          id: p.id_producto,
          nombre: p.nombre,
          marca: p.marca,
          categoria: p.categoria,
          modelos: p.modelos || [],

          rin: p.rin?.toString() || "",
          ancho: p.ancho_rin?.toString() || "",
          perfil: p.alto_rin?.toString() || "",
          version: p.version || "",
          lonas: p.lonas?.toString() || "",
          profundidad: p.profundidad?.toString() || "",
          presionMaxima: p.presion_maxima?.toString() || "",
          indiceVelocidad: p.indice_velocidad?.toString() || "",
          indiceCarga: p.indice_de_carga?.toString() || "",
          precio: p.precio,
          precioMayoreo: p.precioMayoreo,
          stock: p.stock || 0,
          descripcion: p.descripcion || "",
          modelo3D: p.imagen_3d
            ? {
                nombre: "Modelo 3D",
                tamaño: "",
                url: p.imagen_3d,
              }
            : undefined,
          estado: p.estado ? 'activo' : 'inactivo',
          imagenes: p.imagenes?.map((img: any) => ({ url: img.url, id: img.id })) || [],
          sucursales: p.sucursales || []
        }));
        setProductos(mappedProducts);
        setPaginasTotales(response.pagination.totalPages);
        setTotalItems(response.pagination.totalItems || response.pagination.totalProductos || mappedProducts.length);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | string | undefined) => {
    if (price === undefined || price === null) return "Lps. 0.00";
    const num = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(num)) return "Lps. 0.00";
    return `Lps. ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, paginasTotales));
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleOpenModal = (mode: 'create' | 'edit', product?: Producto) => {
    setModalMode(mode);
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(undefined);
  };

  const handleOpenDeactivateModal = (product: Producto) => {
    setProductToDeactivate(product);
    setIsDeactivateModalOpen(true);
  };

  const handleCloseDeactivateModal = () => {
    setIsDeactivateModalOpen(false);
    setProductToDeactivate(undefined);
  };

  const handleOpenViewModal = (product: Producto) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedProduct(undefined);
  };

  const handleOpenCajaModal = (product: Producto) => {
    setProductCaja(product);
    setIsCajaModalOpen(true);
  };

  const handleCloseCajaModal = () => {
    setIsCajaModalOpen(false);
    setProductCaja(undefined);
  };

  const handleToggleActive = async (product: Producto, checked: boolean) => {
    if (!checked) {
      handleOpenDeactivateModal(product);
    } else {
      try {
        await cambiarEstadoProducto(product.id, true);
        message.success(`El producto "${product.nombre}" fue activado correctamente.`);
        fetchProductos();
      } catch (error) {
        console.error("Error al activar producto:", error);
        message.error("No se pudo activar el producto. Inténtalo de nuevo.");
      }
    }
  };

  return (
  <ConfigProvider>
    <div className="w-full bg-[#F5F7FB] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {!isModalOpen ? (
            <>
              {/* Título Principal */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A]">
                  Administración de Productos
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Gestiona tus productos disponibles en tu bodega
                </p>
              </div>

              {/* Barra de Búsqueda y Filtros */}
              <div className="bg-white rounded-xl shadow-sm px-4 md:px-6 py-5 mb-4">
                <FilterBar
                  search={{
                    value: searchQuery,
                    onChange: (v) => {
                      setSearchQuery(v);
                      setCurrentPage(1);
                    },
                    placeholder: "Buscar por Nombre, Modelo de Vehículo, Marca, Diseño o Precio..."
                  }}
                  filters={[
                    {
                      placeholder: "Filtrar por Marca",
                      value: selectedMarca,
                      onChange: (v) => {
                        setSelectedMarca(v as string || "");
                        setCurrentPage(1);
                      },
                      options: marcas.map(m => ({ label: m.nombre, value: m.nombre }))
                    },
                    {
                      placeholder: "Filtrar por Categoría",
                      value: selectedCategoria,
                      onChange: (v) => {
                        setSelectedCategoria(v as string || "");
                        setCurrentPage(1);
                      },
                      options: categorias.map(c => ({ label: c.nombre, value: c.nombre }))
                    },
                    {
                      placeholder: "Filtrar por Estado",
                      value: selectedEstado,
                      onChange: (v) => {
                        setSelectedEstado(v as string || "");
                        setCurrentPage(1);
                      },
                      options: [
                        { label: "Activo", value: "activo" },
                        { label: "Inactivo", value: "inactivo" }
                      ]
                    }
                  ]}
                  onClear={() => {
                    setSearchQuery("");
                    setSelectedMarca("");
                    setSelectedCategoria("");
                    setSelectedEstado("");
                    setCurrentPage(1);
                  }}
                >
                  <button
                    className="w-full xl:w-32 py-3 md:py-2.5 bg-[#027EB1] text-white rounded-lg flex items-center justify-center hover:bg-[#026085] transition-colors font-semibold text-sm md:text-[15px]"
                    onClick={() => handleOpenModal('create')}
                  >
                    + Crear
                  </button>
                </FilterBar>
              </div>

              {/* Contenedor de Tabla y Resultados */}
              <div className="">
                {/* Resultados count */}
                <div className="py-2 text-sm text-[#4a5565]">
                  Mostrando <span className="font-semibold text-[#1e2939]">{((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}</span> de <span className="font-semibold text-[#1e2939]">{totalItems}</span> resultados
                </div>

                {/* Vista Mobile - Tarjetas */}
                <div className="md:hidden space-y-4 mb-6 relative min-h-[200px]">
                  {/* Barra de progreso de carga sutil para mobile */}
                  {showLoading && productos.length > 0 && (
                    <div className="absolute top-0 left-0 right-0 h-1 z-10 overflow-hidden rounded-full bg-[#027EB1]/10">
                      <div className="h-full bg-[#027EB1] animate-pulse"></div>
                    </div>
                  )}

                  {showLoading && productos.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#027EB1]"></div>
                      <p className="mt-2 text-sm text-gray-500">Cargando productos...</p>
                    </div>
                  ) : productos.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 text-sm">
                      No se encontraron productos.
                    </div>
                  ) : (
                    <div className={showLoading ? 'opacity-50 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300'}>
                      {productos.map((producto) => (
                        <div
                          key={producto.id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4"
                        >
                          <div className="px-4 py-4 border-b border-gray-100 flex items-start justify-between">
                            <h3 className="flex-1 font-semibold text-sm text-gray-900 leading-tight pr-2">
                              {producto.nombre}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={producto.estado === 'activo'}
                                onChange={(checked) => handleToggleActive(producto, checked)}
                                style={{ backgroundColor: producto.estado === 'activo' ? "#16A34A" : "#D1D5DB", transform: "scale(0.8)" }}
                              />
                              <span className="text-xs text-gray-600">
                                {producto.estado === 'activo' ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                          </div>

                          <div className="px-4 py-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Marca</span>
                              <span className="text-sm font-medium text-gray-900">{producto.marca}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Diseño</span>
                              <span className="text-sm font-medium text-gray-900">{producto.version}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Precio</span>
                              <span className="text-sm font-medium text-gray-900">{formatPrice(producto.precio)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Stock</span>
                              <span className="text-sm font-medium text-gray-900">{producto.stock}</span>
                            </div>
                          </div>

                          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
                            <button
                              className="px-3 py-2 bg-white rounded-md shadow-sm border border-gray-200 text-[#0B4E87] text-xs font-medium hover:bg-gray-50 flex items-center gap-1.5"
                              onClick={() => handleOpenCajaModal(producto)}
                            >
                              <Warehouse className="w-5 h-5" />
                            </button>
                            <button
                              className="p-2 bg-white rounded-md shadow-sm border border-gray-200 text-[#6b7280] hover:text-[#4b5563]"
                              onClick={() => handleOpenViewModal(producto)}
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              className="p-2 bg-white rounded-md shadow-sm border border-gray-200 text-[#027EB1]"
                              onClick={() => handleOpenModal('edit', producto)}
                            >
                              <Pencil className="w-5 h-5" />
                            </button>

                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vista Desktop - Tabla */}
                <div className="hidden md:block overflow-hidden rounded-[10px] border border-[#d1d5dc] bg-white shadow-sm mb-6 relative">
                  {/* Barra de progreso de carga sutil para desktop */}
                  {showLoading && productos.length > 0 && (
                    <div className="absolute top-0 left-0 right-0 h-1 z-20 overflow-hidden bg-[#027EB1]/10">
                      <div className="h-full bg-[#027EB1] animate-pulse"></div>
                    </div>
                  )}

                  <div className="relative overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#0B4E87]">
                          <th className="px-4 py-4 text-center text-sm uppercase tracking-wide text-white">NOMBRE</th>
                          <th className="px-4 py-4 text-center text-sm uppercase tracking-wide text-white">MARCA</th>
                          <th className="px-4 py-4 text-center text-sm uppercase tracking-wide text-white">DISEÑO</th>
                          <th className="px-4 py-4 text-center text-sm uppercase tracking-wide text-white">PRECIO</th>
                          <th 
                            className="px-4 py-4 text-center text-sm uppercase tracking-wide text-white cursor-pointer"
                            onClick={() => toggleSort("stock")}
                          >
                            <div className="flex items-center justify-center gap-2">
                              STOCK
                              {sortBy === "stock" ? (
                                order === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ArrowUpDown className="w-4 h-4 opacity-70" />
                              )}
                            </div>
                          </th>
                          <th className="px-4 py-4 text-center text-sm uppercase tracking-wide text-white">ESTADO</th>
                          <th className="px-4 py-4 text-center text-sm uppercase tracking-wide text-white">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className={`bg-white transition-opacity duration-300 ${showLoading ? 'opacity-50' : 'opacity-100'}`}>
                        {showLoading && productos.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-10">
                              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#027EB1]"></div>
                              <p className="mt-2 text-sm text-gray-500">Cargando productos...</p>
                            </td>
                          </tr>
                        ) : productos.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center text-gray-400 py-10 text-sm">
                              No se encontraron productos.
                            </td>
                          </tr>
                        ) : (
                          productos.map((producto) => (
                            <tr key={producto.id} className="border-b border-[#e5e7eb] hover:bg-[#f9fafb]">
                              <td className="px-4 py-3 text-center text-sm text-[#1e2939]">
                                <div className="flex justify-center items-center">
                                  <div className="flex w-full justify-start text-left">
                                    <span className="text-sm text-[#1F2937]">{producto.nombre}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-[#1e2939]">{producto.marca}</td>
                              <td className="px-4 py-3 text-center text-sm text-[#1e2939]">{producto.version}</td>
                              <td className="px-4 py-3 text-center text-sm text-[#1e2939]">{formatPrice(producto.precio)}</td>
                              <td className="px-4 py-3 text-center text-sm text-[#1e2939]">{producto.stock}</td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center">
                                  <Switch
                                    checked={producto.estado === 'activo'}
                                    onChange={(checked) => handleToggleActive(producto, checked)}
                                    style={{ backgroundColor: producto.estado === 'activo' ? "#16A34A" : "#D1D5DB" }}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex justify-center items-center gap-3">
                                  <button
                                    className="text-[#0B4E87] hover:text-[#003E7B] transition-colors p-1"
                                    onClick={() => handleOpenCajaModal(producto)}
                                  >
                                    <Warehouse className="w-5 h-5" />
                                  </button>
                                  <button
                                    className="text-[#6b7280] hover:text-[#4b5563] transition-colors p-1"
                                    onClick={() => handleOpenViewModal(producto)}
                                  >
                                    <Eye className="w-5 h-5" />
                                  </button>
                                  <button
                                    className="text-[#027EB1] hover:text-[#026085] transition-colors p-1"
                                    onClick={() => handleOpenModal('edit', producto)}
                                  >
                                    <Pencil className="w-5 h-5" />
                                  </button>

                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación - Drawer Style (Solo Desktop) */}
                  <div className="flex h-[50px] items-center justify-between border-t border-[rgba(139,90,43,0.04)] bg-[rgba(139,90,43,0.03)] px-4">
                    <button
                      type="button"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || loading}
                      className="rounded-lg border border-[#d1d5dc] bg-white px-3 py-1.5 text-sm font-medium text-[#364153] hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      Anterior
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: paginasTotales }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => handlePageClick(page)}
                          className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${page === currentPage
                            ? "bg-[#0B4E86] text-white"
                            : "border border-[#d1d5dc] bg-white text-[#364153] hover:bg-gray-50"
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={currentPage === paginasTotales || loading}
                      className="rounded-lg border border-[#d1d5dc] bg-white px-3 py-1.5 text-sm font-medium text-[#364153] hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>

                {/* Paginación Mobile (Mantiene estilo estándar para mejor usabilidad) */}
                <div className="md:hidden flex flex-col items-center justify-between gap-4 mt-2 mb-6">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: paginasTotales }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageClick(page)}
                        className={`w-9 h-9 rounded-lg text-sm transition-colors ${page === currentPage
                          ? "bg-[#003E7B] text-white"
                          : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <div className="flex w-full gap-3">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || loading}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 bg-white active:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === paginasTotales || loading}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 bg-white active:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>

              </div>
            </>
          ) : (
            <ProductModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              mode={modalMode}
              product={selectedProduct}
              onSuccess={fetchProductos}
            />
          )}

          {/* Modales Overlays */}
          {isDeactivateModalOpen && productToDeactivate && (
            <DeactivateModal
              open={isDeactivateModalOpen}
              itemName={productToDeactivate.nombre}
              itemType="Producto"
              isActive={productToDeactivate.estado === 'activo'}
              loading={false}
              onCancel={handleCloseDeactivateModal}
              onConfirm={async () => {
                try {
                  await cambiarEstadoProducto(productToDeactivate.id, false);
                  fetchProductos();
                  handleCloseDeactivateModal();
                } catch (error) {
                  console.error("Error deactivating product:", error);
                }
              }}
            />
          )}

          <ProductViewModal
            isOpen={isViewModalOpen}
            onClose={handleCloseViewModal}
            product={selectedProduct}
          />

          {isCajaModalOpen && productCaja && (
            <ProductStockModal
              product={productCaja}
              onClose={handleCloseCajaModal}
            />
          )}
        </div>
      </div>
    </div>
  </ConfigProvider>
  );
}

