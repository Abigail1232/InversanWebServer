import { useState, useRef, useEffect } from "react";
import { Typography, message } from "antd";
import RelatedProductCard from "../../components/product/RelatedProductCard";
import type { RelatedProduct } from "../../types/product";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaBoxOpen } from "react-icons/fa";
import RinFilterModal from "../../components/search/RinFilterModal";
import BrandFilterModal from "../../components/search/BrandFilterModal";
import ProductBrandFilterModal from "../../components/search/ProductBrandFilterModal";
import { buscarProductos } from "../../api/products/busqueda";
import { getProductos } from "../../api/products/productos";
import { getCategorias, type Categoria } from "../../api/products/categorias";
import {
  getFiltrosLlantas,
  type ProductoFiltroLlanta,
} from "../../api/products/rines";
import { type BrandItem } from "../../api/products/brands";
import CategorySelectorPanel from "../../components/CategorySelectorPanel";
import { FilterX, ChevronLeft, ChevronRight } from "lucide-react"; // Añade los Chevrons

const toText = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "object" && "nombre" in (value as any)) {
    return String((value as any).nombre ?? "");
  }
  return String(value);
};

const getImageUrl = (imagenes: unknown): string => {
  if (!imagenes) return "";
  if (Array.isArray(imagenes)) {
    const first = imagenes[0];
    if (!first) return "";
    if (typeof first === "string") return first;
    return (
      (first as any).url ??
      (first as any).imagen_url ??
      (first as any).url_imagen ??
      ""
    );
  }
  if (typeof imagenes === "string") return imagenes;
  return (
    (imagenes as any).url ??
    (imagenes as any).imagen_url ??
    (imagenes as any).url_imagen ??
    ""
  );
};
const PAGE_SIZE = 8;

type LastQuery =
  | { mode: "search"; term: string }
  | {
      mode: "brand";
      params: {
        brandName: string;
        year?: number;
        model?: string;
        version?: string;
      };
    }
  | { mode: "category"; catId: number; catName: string }
  | {
      mode: "rin";
      filtros: { rin: number; alto_rin: number; ancho_rin: number };
    }
  | { mode: "productBrand"; brandId: number; brandName: string }
  | { mode: "default" };

export default function SearchPage() {
  const [isRinModalOpen, setIsRinModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isProductBrandModalOpen, setIsProductBrandModalOpen] = useState(false);
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    location.state?.selectedCategory ?? null,
  );
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [searchTerm, setSearchTerm] = useState(
    location.state?.searchTerm || "",
  );
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalProductos, setTotalProductos] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const lastQueryRef = useRef<LastQuery>({ mode: "default" });
  const [branchId, setBranchId] = useState<number | undefined>(() => {
    const saved = localStorage.getItem("selectedBranch");
    return saved ? Number(saved) : undefined;
  });
  const navigate = useNavigate();
  const noStockMessageShown = useRef(false);

  useEffect(() => {
    if (location.state?.noStockInBranch && !noStockMessageShown.current) {
      noStockMessageShown.current = true;
      message.warning("No hay producto de este stock en tu ubicación.");
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (!location.state?.noStockInBranch) {
      noStockMessageShown.current = false;
    }
  }, [location.state?.noStockInBranch, location.pathname, navigate]);

  const mapToRelatedProduct = (item: any): RelatedProduct => ({
    id: String(item.id_producto ?? item.id ?? ""),
    brand: toText(item.marca?.nombre ?? item.marca),
    name: toText(item.nombre ?? item.nombre_producto),
    price: item.precio_detalle ?? item.precio ?? 0,
    originalPrice: item.precio_original,
    discountPercent: item.descuento ?? 0,
    promotionDisplayMode: item.promotionDisplayMode ?? "precio_tachado",
    imageUrl: getImageUrl(
      item.imageUrl ??
        item.url_imagen ??
        item.imagen_url ??
        item.producto_imagen ??
        item.imagenes,
    ),
    stock: item.stock_total ?? item.stock ?? item.existencias ?? 0,
  });

  const handleSearch = async (term?: string, page = 1) => {
    const query = (term ?? searchTerm).trim();
    if (!query) {
      setProducts([]);
      setTotalProductos(0);
      setTotalPages(1);
      setCurrentPage(1);
      return;
    }
    try {
      setIsLoading(true);
      lastQueryRef.current = { mode: "search", term: query };
      const res = await buscarProductos({
        busqueda: query,
        id_sucursal: branchId,
        page,
        pageSize: PAGE_SIZE,
      });
      const items = res?.data ?? [];
      const mapped: RelatedProduct[] = items.map(mapToRelatedProduct);
      setProducts(mapped);
      setTotalProductos(res?.pagination?.totalProductos ?? mapped.length);
      setTotalPages(res?.pagination?.totalPages ?? 1);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error buscando productos en SearchPage:", error);
      setProducts([]);
      setTotalProductos(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, totalProductos);

  const handleBrandFilterComplete = async (
    params: {
      brandId: number;
      brandName: string;
      year?: number;
      model?: string;
      version?: string;
    },
    page = 1,
  ) => {
    try {
      setIsLoading(true);

      lastQueryRef.current = {
        mode: "brand",
        params: {
          brandName: params.brandName,
          year: params.year,
          model: params.model,
          version: params.version,
        },
      };

      const res = await buscarProductos({
        busqueda: "",
        marca_vehiculo: params.brandName,
        id_sucursal: branchId,
        model: params.model,
        year: params.year,
        version: params.version,
        page,
        pageSize: PAGE_SIZE,
      });

      const items = res?.data ?? [];
      const mapped: RelatedProduct[] = items.map(mapToRelatedProduct);

      setProducts(mapped);
      setTotalProductos(res?.pagination?.totalProductos ?? mapped.length);
      setTotalPages(res?.pagination?.totalPages ?? 1);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error filtrando por vehículo:", error);
      setProducts([]);
      setTotalProductos(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductBrandFilterComplete = async (brand: BrandItem, page = 1) => {
    try {
      setIsLoading(true);
      lastQueryRef.current = {
        mode: "productBrand",
        brandId: brand.id,
        brandName: brand.name,
      };

      const res = await buscarProductos({
        busqueda: "",
        marca: brand.name,
        id_sucursal: branchId,
        id_categoria: selectedCategory || undefined,
        page,
        pageSize: PAGE_SIZE,
      });

      const items = res?.data ?? [];
      const mapped: RelatedProduct[] = items.map(mapToRelatedProduct);

      setProducts(mapped);
      setTotalProductos(res?.pagination?.totalProductos ?? mapped.length);
      setTotalPages(res?.pagination?.totalPages ?? 1);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error filtrando por marca de llanta:", error);
      setProducts([]);
      setTotalProductos(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRinFilterComplete = (
    productos: ProductoFiltroLlanta[],
    filtros: { rin: number; alto_rin: number; ancho_rin: number },
  ) => {
    lastQueryRef.current = { mode: "rin", filtros };

    const mapped: RelatedProduct[] = productos.map(mapToRelatedProduct);

    setProducts(mapped);
    setTotalProductos(mapped.length);
    setTotalPages(1);
    setCurrentPage(1);
  };

  const reloadRinFilter = async (filtros: {
    rin: number;
    alto_rin: number;
    ancho_rin: number;
  }) => {
    try {
      setIsLoading(true);

      const res = await getFiltrosLlantas({
        ...(selectedCategory ? { id_categoria: selectedCategory } : {}),
        ...(branchId ? { id_sucursal: branchId } : {}),
        rin: filtros.rin,
        alto_rin: filtros.alto_rin,
        ancho_rin: filtros.ancho_rin,
      });

      const mapped: RelatedProduct[] = (res.productos ?? []).map(
        mapToRelatedProduct,
      );

      setProducts(mapped);
      setTotalProductos(mapped.length);
      setTotalPages(1);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error recargando filtro por rin:", error);
      setProducts([]);
      setTotalProductos(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaultProducts = async (page = 1) => {
    try {
      setIsLoading(true);
      lastQueryRef.current = { mode: "default" };
      const res = await getProductos(page, branchId);
      const items = res?.data ?? [];
      const mapped: RelatedProduct[] = items.map(mapToRelatedProduct);
      setProducts(mapped);
      const total = res?.total ?? mapped.length;
      setTotalProductos(total);
      setTotalPages(
        res?.totalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE)),
      );
      setCurrentPage(page);
    } catch (error) {
      console.error(
        "Error cargando productos por defecto en SearchPage:",
        error,
      );
      setProducts([]);
      setTotalProductos(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = async (
    catId: number | null,
    catName: string,
    page = 1,
  ) => {
    setSelectedCategory(catId);
    if (!catId) {
      void loadDefaultProducts(page);
      return;
    }
    try {
      setIsLoading(true);
      lastQueryRef.current = { mode: "category", catId, catName };
      const res = await buscarProductos({
        busqueda: "",
        categoria: catName,
        id_categoria: catId,
        id_sucursal: branchId,
        page,
        pageSize: PAGE_SIZE,
      });
      const items = res?.data ?? [];
      const mapped: RelatedProduct[] = items.map(mapToRelatedProduct);
      setProducts(mapped);
      setTotalProductos(res?.pagination?.totalProductos ?? mapped.length);
      setTotalPages(res?.pagination?.totalPages ?? 1);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error filtrando por categoría:", error);
      setProducts([]);
      setTotalProductos(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSearchTerm("");
    setCurrentPage(1);
    lastQueryRef.current = { mode: "default" };
    void loadDefaultProducts(1);
  };

  const goToPage = (page: number) => {
    const q = lastQueryRef.current;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (q.mode === "search") {
      void handleSearch(q.term, page);
    } else if (q.mode === "brand") {
      void handleBrandFilterComplete(
        {
          brandId: 0,
          brandName: q.params.brandName,
          year: q.params.year,
          model: q.params.model,
          version: q.params.version,
        },
        page,
      );
    } else if (q.mode === "category") {
      void handleCategorySelect(q.catId, q.catName, page);
    } else if (q.mode === "rin") {
      void reloadRinFilter(q.filtros);
    } else if (q.mode === "productBrand") {
      void handleProductBrandFilterComplete({ id: q.brandId, name: q.brandName }, page);
    } else {
      void loadDefaultProducts(page);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    setIsCategoriesLoading(true);
    getCategorias()
      .then((cats) => setCategories(cats.filter((cat) => cat.activo)))
      .catch(() => setCategories([]))
      .finally(() => setIsCategoriesLoading(false));

    const onBranchChange = () => {
      const saved = localStorage.getItem("selectedBranch");
      const newId = saved ? Number(saved) : undefined;
      setBranchId(newId);
    };

    window.addEventListener("branchChanged", onBranchChange);
    return () => window.removeEventListener("branchChanged", onBranchChange);
  }, []);

  useEffect(() => {
    const term = location.state?.searchTerm;
    if (term && typeof term === "string") {
      setSearchTerm(term);
      void handleSearch(term);
    } else if (!selectedCategory) {
      void loadDefaultProducts();
    }
  }, [location.state?.searchTerm]);

  useEffect(() => {
    const last = lastQueryRef.current;
    if (last.mode === "rin") {
      void reloadRinFilter(last.filtros);
      return;
    }
    if (searchTerm) {
      void handleSearch(searchTerm);
    } else if (selectedCategory) {
      const catName =
        categories.find((c) => c.id_categoria === selectedCategory)?.nombre ||
        "";
      void handleCategorySelect(selectedCategory, catName);
    } else {
      void loadDefaultProducts();
    }
  }, [branchId]);

  const selectedLabelRaw =
    categories.find((c) => c.id_categoria === selectedCategory)?.nombre ?? "";
  const selectedLabel = toText(selectedLabelRaw);

  return (
    <div className="w-full bg-[#f3f4f6] min-h-screen py-5">
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-4 animate-page-enter">
        <div className="min-h-[220px] md:min-h-[300px]">
          <CategorySelectorPanel
            categories={categories}
            isLoading={isCategoriesLoading}
            title="Selecciona la categoría"
            stepLabel="1"
            selectedCategory={selectedCategory || undefined}
            onCategoryClick={(cat) => {
              const isNew = selectedCategory !== cat.id_categoria;
              void handleCategorySelect(
                isNew ? cat.id_categoria : null,
                cat.nombre,
              );
            }}
          />
        </div>

        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-4 bg-white border border-[#e5e7eb] rounded-xl px-5 py-5 animate-page-enter-delay-2">
          <div className="flex flex-col md:flex-row flex-1 gap-4 w-full lg:w-auto">
            <button
              id="btn-buscar-vehiculo"
              onClick={() => setIsBrandModalOpen(true)}
              className="flex-1 md:min-w-[200px] py-4 bg-[#027eb1] hover:bg-[#026a96] active:bg-[#025a80] text-white font-bold text-base rounded-xl transition-all border-0 shadow-md hover:shadow-lg"
            >
              Buscar por Marca de Vehículo
            </button>
            <button
              id="btn-buscar-marca-llanta"
              onClick={() => setIsProductBrandModalOpen(true)}
              className="flex-1 md:min-w-[200px] py-4 bg-[#027eb1] hover:bg-[#026a96] active:bg-[#025a80] text-white font-bold text-base rounded-xl transition-all border-0 shadow-md hover:shadow-lg"
            >
              Buscar por Marca de Llanta
            </button>
            <button
              id="btn-buscar-rin"
              onClick={() => setIsRinModalOpen(true)}
              className="flex-1 md:min-w-[200px] py-4 bg-[#027eb1] hover:bg-[#026a96] active:bg-[#025a80] text-white font-bold text-base rounded-xl transition-all border-0 shadow-md hover:shadow-lg"
            >
              Buscar por Medida / Rin
            </button>
          </div>

          <button
            id="btn-limpiar-filtros"
            onClick={handleClearFilters}
            className="flex items-center justify-center py-4 px-5 text-[#6b7280] hover:text-[#D61216] hover:border-[#D61216] transition-all border-2 border-[#e5e7eb] rounded-xl bg-[#f9fafb] hover:bg-white active:scale-95 w-full lg:w-[68px] mt-2 lg:mt-0 group shadow-sm hover:shadow"
            title="Limpiar todos los filtros"
          >
            <FilterX className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div
          className="mb-0 animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          <Typography.Title level={2} style={{ marginBottom: 4 }}>
            {selectedLabel === ""
              ? "Catálogo de Llantas"
              : "Llantas para " + selectedLabel}
          </Typography.Title>
          <div className="flex items-center gap-2 py-2 text-sm text-[#4a5565]">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#027EB1] border-t-transparent rounded-full animate-spin" />
                <span>Cargando productos...</span>
              </>
            ) : (
              totalProductos > 0 && (
                <div>
                  Mostrando{" "}
                  <span className="font-semibold text-[#1e2939]">
                    {start}-{end}
                  </span>{" "}
                  de{" "}
                  <span className="font-semibold text-[#1e2939]">
                    {totalProductos}
                  </span>{" "}
                  resultados
                </div>
              )
            )}
          </div>
        </div>

        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-4"
              >
                <div className="w-12 h-12 border-4 border-[#027EB1]/10 border-t-[#027EB1] rounded-full animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">
                  Buscando los mejores productos...
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedCategory || "all"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="grid grid-cols-1 gap-6 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2"
              >
                {products.length > 0 ? (
                  products.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <RelatedProductCard
                        product={product}
                        displayMode={product.promotionDisplayMode ?? "precio_tachado"}
                        onViewDetails={(id) => navigate(`/product/${id}`)}
                      />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200"
                  >
                    <FaBoxOpen className="w-16 h-16 text-slate-200 mb-4" />
                    <p className="text-slate-500 font-bold">
                      No se encontraron productos
                    </p>
                    <p className="text-slate-400 text-sm">
                      Intenta con otros filtros o categoría
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isLoading && totalPages > 1 && (
          <div className="mt-6 overflow-hidden rounded-2xl  bg-white shadow-sm">
            <div className="flex flex-row items-center justify-center sm:justify-between gap-2 sm:gap-4 border-t border-[rgba(139,90,43,0.04)] bg-[rgba(139,90,43,0.03)] p-4">
              {/* Botón Anterior */}
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
                className="flex items-center justify-center h-10 w-10 sm:w-auto sm:px-4 rounded-lg border border-[#d1d5dc] bg-white text-sm font-medium text-[#364153] transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-5 h-5 sm:hidden" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {/* Números de Página */}
              <div className="flex flex-wrap justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => goToPage(p)}
                      className={`h-10 w-10 rounded-lg text-sm font-medium transition-all ${
                        p === currentPage
                          ? "bg-[#0B4E86] text-white shadow-md"
                          : "border border-[#d1d5dc] bg-white text-[#364153] hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              </div>

              {/* Botón Siguiente */}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className="flex items-center justify-center h-10 w-10 sm:w-auto sm:px-4 rounded-lg border border-[#d1d5dc] bg-white text-sm font-medium text-[#364153] transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="w-5 h-5 sm:hidden" />
              </button>
            </div>
          </div>
        )}

        <RinFilterModal
          isOpen={isRinModalOpen}
          onClose={() => setIsRinModalOpen(false)}
          categoryId={selectedCategory}
          branchId={branchId}
          onFilterComplete={handleRinFilterComplete}
        />

        <BrandFilterModal
          isOpen={isBrandModalOpen}
          onClose={() => setIsBrandModalOpen(false)}
          onComplete={(result) => void handleBrandFilterComplete(result)}
        />

        <ProductBrandFilterModal
          isOpen={isProductBrandModalOpen}
          onClose={() => setIsProductBrandModalOpen(false)}
          onComplete={(brand) => void handleProductBrandFilterComplete(brand)}
        />
      </div>

      <a
        href="https://wa.me/50425501234"
        id="btn-whatsapp"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contáctanos por WhatsApp"
        className="fixed bottom-6 right-6 w-13 h-13 bg-[#25d366] hover:bg-[#1ebe5d] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all z-50"
        style={{ width: 52, height: 52 }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
}
