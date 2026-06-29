import { useNavigate, useParams } from "react-router-dom";
import { PictureOutlined } from "@ant-design/icons";
import { Typography, Pagination } from "antd";
import { useEffect, useState } from "react";
import {
  getProductsFromPromotion,
  PAGE_SIZE,
  type Promotion,
} from "../../api/promotions/promotion";
import type { RelatedProduct } from "../../types/product";
import RelatedProductCard from "../../components/product/RelatedProductCard";

export default function PromocionesPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [promo, setPromo] = useState<Promotion>();
  const [promotions, setPromotions] = useState<RelatedProduct[]>([]);
  const [branchId, setBranchId] = useState<number | undefined>(() => {
    const saved = localStorage.getItem("selectedBranch");
    return saved ? Number(saved) : undefined;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPromos = async (page = 1) => {
    setIsLoading(true);
    const response = await getProductsFromPromotion(Number(id), branchId, page, PAGE_SIZE);
    setIsLoading(false);

    if (!response) return;
    setPromo(response.promocion);
    setPromotions(response.productos);
    
    if (response.pagination) {
      setTotalProductos(response.pagination.totalProductos);
      setTotalPages(response.pagination.totalPages);
    }
  };

  useEffect(() => {
    const onBranchChange = () => {
      const saved = localStorage.getItem("selectedBranch");
      const newId = saved ? Number(saved) : undefined;
      setBranchId(newId);
      setCurrentPage(1);
    };

    window.addEventListener("branchChanged", onBranchChange);

    return () => {
      window.removeEventListener("branchChanged", onBranchChange);
    };
  }, []);
  
  useEffect(() => {
    setCurrentPage(1);
    void fetchPromos(1);
  }, [branchId, id]);

  const goToPage = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentPage(page);
    void fetchPromos(page);
  };

  return (
    <div className="w-full bg-[#f3f4f6] min-h-screen py-6">
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-6">
        {/* ── Título ── */}
        <div className="py-4 border-l-8 border-[#027EB1] pl-6 bg-white rounded-r-2xl shadow-sm">
          <Typography.Title
            level={2}
            style={{ marginBottom: 0, color: "#1f2937" }}
            className="!text-2xl md:!text-3xl !font-bold"
          >
            {promo?.titulo || "Promoción disponible"}
          </Typography.Title>
          <Typography.Text className="text-gray-500 !text-sm md:!text-base italic">
            {promo?.descripcion ||
              "Descubre los productos incluidos en esta promoción."}
          </Typography.Text>
        </div>

        {/* ── Banner Principal*/}
        <div className="relative w-full rounded-2xl overflow-hidden shadow-sm bg-gray-100 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 min-h-[150px] md:min-h-[300px]">
          <PictureOutlined style={{ fontSize: "64px" }} />
          <span className="text-sm font-medium">Banner Promocional</span>

          {promo?.banner_url && (
            <img
              src={`${import.meta.env.VITE_API_URL}/public/${promo.banner_url}`}
              alt="Banner Promocional"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>

        {/* ── Contenedor Blanco Principal ── */}
        <div className="bg-white rounded-[20px] p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="mb-5">
            <Typography.Title
              level={3}
              style={{ marginBottom: 4, color: "#1f2937" }}
              className="!text-xl md:!text-2xl !font-bold"
            >
              Productos incluidos en la promoción
            </Typography.Title>
            <Typography.Text className="text-gray-500 !text-sm md:!text-base">
              Consulta los productos participantes y entra al detalle para ver disponibilidad.
            </Typography.Text>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Cargando productos...
            </div>
          ) : promotions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No hay productos disponibles para esta promoción.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 mb-6">
                {promotions.map((product) => (
                  <RelatedProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={(productId) => navigate(`/product/${productId}`)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center pt-6 pb-2">
                  <Pagination
                    current={currentPage}
                    total={totalProductos}
                    pageSize={PAGE_SIZE}
                    showSizeChanger={false}
                    onChange={goToPage}
                    showTotal={(total) => `Total ${total} productos`}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
