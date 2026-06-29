import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PictureOutlined } from '@ant-design/icons';
import { Typography, Pagination } from 'antd';
import RelatedProductCard from '../../components/product/RelatedProductCard';
import type { RelatedProduct } from '../../types/product';
import { getProductsByBrand, PAGE_SIZE } from '../../api/products/brands';

export default function MarcaProductosPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [brandName, setBrandName] = useState('Marca');
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [products, setProducts] = useState<RelatedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalProductos, setTotalProductos] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [branchId, setBranchId] = useState<number | undefined>(() => {
            const saved = localStorage.getItem("selectedBranch");
            return saved ? Number(saved) : undefined;
    });

    useEffect(() => {
        const onBranchChange = () => {
            const saved = localStorage.getItem("selectedBranch");
            const newId = saved ? Number(saved) : undefined;
            setBranchId(newId);
        };

        window.addEventListener("branchChanged", onBranchChange);
        return () => window.removeEventListener("branchChanged", onBranchChange);
    },[]);

    const loadProducts = useCallback(async (page: number) => {
        if (!id || Number.isNaN(Number(id))) {
            setIsLoading(false);
            setErrorMessage('Marca inválida.');
            return;
        }
        setIsLoading(true);
        setErrorMessage('');
        try {
            const response = await getProductsByBrand(branchId, Number(id), page);
            setBrandName(response.brandName || `Marca ${id}`);
            setBannerUrl(response.bannerUrl ?? null);
            setProducts(
                response.products.map((product) => ({
                    id: product.id,
                    brand: product.brand,
                    name: product.name,
                    price: product.price,
                    originalPrice: product.originalPrice,
                    discountPercent: product.discountPercent,
                    promotionDisplayMode: product.promotionDisplayMode ?? "precio_tachado",
                    imageUrl: product.imageUrl,
                    stock: product.stock,
                }))
            );
            setTotalProductos(response.totalProductos);
            setTotalPages(response.totalPages);
            setCurrentPage(page);
        } catch (error) {
            console.error('No se pudieron cargar los productos por marca', error);
            setErrorMessage('No se pudieron cargar los productos de esta marca.');
            setProducts([]);
            setBrandName(`Marca ${id}`);
            setBannerUrl(null);
        } finally {
            setIsLoading(false);
        }
    }, [id, branchId]);

    useEffect(() => {
        setCurrentPage(1);
        void loadProducts(1);
    }, [id, branchId, loadProducts]);

    const goToPage = (page: number) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        void loadProducts(page);
    };

    return (
        <div className="w-full bg-[#f3f4f6] min-h-screen py-6">
            <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-6">
                <div className="relative w-full rounded-2xl overflow-hidden shadow-sm min-h-[150px] md:min-h-[250px] bg-gray-100">
                    {bannerUrl ? (
                        <img
                            src={`${import.meta.env.VITE_API_URL || ''}/public/${bannerUrl}`}
                            alt={`Banner ${brandName}`}
                            className="w-full h-full min-h-[150px] md:min-h-[250px] object-cover object-center"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-400 min-h-[150px] md:min-h-[250px] border-2 border-dashed border-gray-200">
                            <PictureOutlined style={{ fontSize: '64px' }} />
                            <span className="text-sm font-medium">Marca: {brandName.toUpperCase()}</span>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
                    <div className="mb-8">
                        <Typography.Title level={2} style={{ marginBottom: 4 }}>
                            Productos <span className="text-[#027EB1]">{brandName.toUpperCase()}</span>
                        </Typography.Title>
                        <Typography.Text type="secondary">Explora nuestro catálogo de llantas de alta calidad.</Typography.Text>
                    </div>

                    {isLoading && (
                        <p className="text-sm text-gray-500">Cargando productos...</p>
                    )}

                    {!isLoading && errorMessage && (
                        <p className="text-sm text-red-600">{errorMessage}</p>
                    )}

                    {!isLoading && !errorMessage && products.length === 0 && (
                        <p className="text-sm text-gray-500">No hay productos disponibles para esta marca.</p>
                    )}

                    {!isLoading && products.length > 0 && (
                        <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <RelatedProductCard
                                    key={product.id}
                                    product={product}
                                    displayMode={product.promotionDisplayMode ?? "precio_tachado"}
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