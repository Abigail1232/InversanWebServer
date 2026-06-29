import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductGallery from '../../components/product/ProductGallery';
import ProductSpecs from '../../components/product/ProductSpecs';
import WholesaleBanner from '../../components/product/WholesaleBanner';
import ProductDescription from '../../components/product/ProductDescription';
import RelatedProducts from '../../components/product/RelatedProducts';
import QuantitySelector from '../../components/ui/QuantitySelector';
import { Typography, message } from 'antd';

import { getProductoById, getRelatedProducts, type RelatedSection } from '../../api/products/productos';
import { addToCart } from '../../api/cart/cart';
import { getPrivilegesUser, type Privilegio } from '../../api/auth/privileges';
import type { Product } from '../../types/product';
import { crearVisita } from '../../api/products/visitas';
import { usePreventDuplicate } from '../../hooks/usePreventDuplicateRequest';
import { formatPrice } from '../../utils/formatPrice';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWholesaleClient, setIsWholesaleClient] = useState(false);
  const [relatedSections, setRelatedSections] = useState<RelatedSection[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const navigate = useNavigate();
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;

    const branchStr = localStorage.getItem("selectedBranch");
    const id_sucursal = branchStr ? Number(branchStr) : undefined;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductoById(Number(id), id_sucursal);
        if (data.stock <= 0) {
          navigate("/search", { replace: true, state: { noStockInBranch: true } });
          return;
        }
        setProduct(data);
      } catch (err) {
        setError('Error al cargar el producto.');
      } finally {
        setLoading(false);
      }
    };

    const checkWholesaleStatus = async () => {
      try {
        const privileges = await getPrivilegesUser();
        const wholesale = privileges.some((p: Privilegio) => 
          p.nombre === 'IS_MAYORIST' || p.nombre === 'ALL_ACCESS'
        );
        setIsWholesaleClient(wholesale);
      } catch (err) {
        console.error("Error checking wholesale status:", err);
      }
    };

    void fetchProduct();
    void checkWholesaleStatus();
  }, [id, navigate]);

  useEffect(() => {
    if (!id || !product) return;
    const branchStr = localStorage.getItem("selectedBranch");
    const id_sucursal = branchStr ? Number(branchStr) : undefined;

    const fetchRelated = async () => {
      setRelatedLoading(true);
      setRelatedError(null);
      try {
        const data = await getRelatedProducts(Number(id), id_sucursal);
        setRelatedSections(data);
      } catch {
        setRelatedError('No se pudieron cargar los productos relacionados.');
        setRelatedSections([]);
      } finally {
        setRelatedLoading(false);
      }
    };
    void fetchRelated();
  }, [id, product?.id]);

  useEffect(() => {
    if (!id) return;
    const onBranchChange = async () => {
      const branchStr = localStorage.getItem("selectedBranch");
      const id_sucursal = branchStr ? Number(branchStr) : undefined;
      try {
        const data = await getProductoById(Number(id), id_sucursal);
        setProduct(data);
        if (data.stock <= 0) {
          navigate("/search", { replace: true, state: { noStockInBranch: true } });
        } else {
          setQuantity((q) => Math.min(Math.max(1, q), data.stock));
        }
        const related = await getRelatedProducts(Number(id), id_sucursal);
        setRelatedSections(related);
        setRelatedError(null);
      } catch {
        setError('Error al actualizar producto.');
      }
    };
    window.addEventListener("branchChanged", onBranchChange);
    return () => window.removeEventListener("branchChanged", onBranchChange);
  }, [id, navigate]);

  useEffect(() => {
    if (!product?.id) return;

    startTimeRef.current = Date.now();

    return () => {
      if (startTimeRef.current !== null) {
        const tiempoMs = Date.now() - startTimeRef.current;
        // Convertir a segundos para que el backend lo guarde correctamente
        const tiempoSegundos = Math.floor(tiempoMs / 1000);

        const branchStr = localStorage.getItem("selectedBranch");
        const id_sucursal = branchStr ? Number(branchStr) : undefined;

        const visitaProd = {
          id_producto: parseInt(product.id),
          duracion_visita: tiempoSegundos,
          fecha: new Date().toISOString(),
          id_sucursal,
        };

        crearVisita(visitaProd);
      }
    };

  }, [id, product?.id]);

  const handleAddToCart = async () => {
    if (product) {
      if (product.stock <= 0) {
        message.warning('Este producto no tiene unidades disponibles en este momento.');
        return;
      }

      try {
        const branchStr = localStorage.getItem("selectedBranch");
        const id_branch = branchStr ? Number(branchStr) : 1;

        const success = await addToCart(id_branch, Number(product.id), quantity);

        if (success) {
          message.success(`${quantity} ${product.name} agregado(s) al carrito.`);
        } else {
          message.error('No se pudo agregar el producto al carrito. Verifique la disponibilidad en su sucursal.');
        }
      } catch (err) {
        message.error('Ocurrió un error al intentar agregar al carrito.');
      }
    }
  };

  const { execute: handleAddToCartPrevented, isLoading: isAddingToCart } = usePreventDuplicate(handleAddToCart);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#f3f4f6]">Cargando...</div>;
  }

  if (error || !product) {
    return <div className="flex items-center justify-center min-h-screen bg-[#f3f4f6] text-red-500">{error || 'Producto no encontrado'}</div>;
  }

  const hasPromotionDiscount = Number(product.discountPercent) > 0;
  const showStrikethroughPrice =
    hasPromotionDiscount &&
    Boolean(product.originalPrice);

  return (
    <>
      <div className="w-full max-w-[100vw] bg-[#f3f4f6] min-h-screen overflow-x-hidden">
        <div className="max-w-[1280px] mx-auto px-4 py-4 md:py-8 flex flex-col gap-8 md:gap-12 animate-page-enter">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            {/* En móvil: galería arriba; en desktop: galería a la izquierda */}
            <div className="order-1 md:order-none">
              <ProductGallery images={product.images} model3DUrl={product.model3DUrl} />
            </div>

            {/*info del producto*/}
            <div className="flex flex-col gap-4 order-2 md:order-none">
              {/*los primeros 3 campos*/}
              <div className="flex flex-col gap-1">
                <p className="text-xs md:text-sm text-[#9ca3af] uppercase font-semibold tracking-wider">
                  {product.brand || 'Marca no especificada'}
                </p>
                <div className="flex items-start justify-between gap-2">
                  <Typography.Title level={2} style={{ marginBottom: 4, fontFamily: 'Arimo, sans-serif', fontWeight: 400 }}>
                    {product.name}
                  </Typography.Title>
                  <InfoTooltip />
                </div>
                <p className="text-sm md:text-base text-[#4a4a4a]">{product.category}</p>
              </div>

              <hr className="border-[#e5e7eb]" />

              {/*el precio*/}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xl md:text-3xl font-bold text-[#027eb1]">
                    Lps. {formatPrice(product.price)} c/u
                  </span>
                </div>
                {showStrikethroughPrice && (
                  <p className="text-base md:text-lg text-[#9ca3af] line-through">
                    Lps. {formatPrice(product.originalPrice!)} c/u
                  </p>
                )}
                {product.promotionText && (
                  <p className="text-xs md:text-sm text-[#4a4a4a]">{product.promotionText}</p>
                )}
                {product.includesVat && (
                  <p className="text-xs md:text-sm text-[#00a65a]">ISV incluido</p>
                )}
              </div>

              {/*ficha tecnica*/}
              <ProductSpecs specs={product.specs} />

              <hr className="border-[#e5e7eb] mt-3" />

              {/*stock*/}
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${product.stock > 0 ? "bg-[#00a65a]" : "bg-[#d61216]"}`} />
                <span className={`text-base md:text-lg ${product.stock > 0 ? "text-[#4a4a4a]" : "text-[#d61216] font-medium"}`}>
                  {product.stock > 0 ? `${product.stock} unidades disponibles` : 'Sin unidades disponibles'}
                </span>
              </div>

              {/*cantidad*/}
              <QuantitySelector value={quantity} onChange={setQuantity} max={product.stock} />

              {/*banner mayoreo*/}
              {product.hasWholesalePrice && isWholesaleClient && <WholesaleBanner isWholesaleClient={true} />}

              {/*Boton agregar al carrito*/}
              <button
                onClick={handleAddToCartPrevented}
                disabled={product.stock <= 0 || isAddingToCart}
                className={`w-full font-semibold text-sm md:text-base py-3.5 rounded-[10px] flex items-center justify-center gap-2 transition-colors border-0 ${product.stock > 0 && !isAddingToCart
                  ? "bg-[#027eb1] hover:bg-[#026a96] text-white cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
              >
                <CartIcon />
                {isAddingToCart ? "Agregando..." : "Agregar al carrito"}
              </button>
            </div>
          </div>

          {/*descripcion*/}
          <ProductDescription
            description={product.description}
          //features={product.descriptionFeatures}
          //closing={product.descriptionClosing}
          />

          {/*productos relacionados por ficha técnica*/}
          {relatedLoading && (
            <div className="text-center py-8 text-[#6b7280]">Cargando productos relacionados...</div>
          )}
          {relatedError && (
            <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[12px] px-4 py-3 text-[#b91c1c] text-sm">
              {relatedError}
            </div>
          )}
          {!relatedLoading && !relatedError && relatedSections
            .filter((s) => s.products.length > 0)
            .map((section, idx) => (
              <RelatedProducts
                key={`${section.spec}-${section.value}-${idx}`}
                sectionTitle={`Productos con la misma ${section.spec}: ${section.value}`}
                products={section.products}
                onViewDetails={(productId) => {
                navigate(`/product/${productId}`);
                window.scrollTo(0, 0); // Scroll al inicio de la página
    }}
              />
            ))}
        </div>
      </div>
    </>
  );
}

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function InfoTooltip() {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative flex-shrink-0 mt-1"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="bg-transparent border-0 p-0 flex items-center justify-center"
        aria-label="Política de devoluciones"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="8" strokeWidth="2" />
          <line x1="12" y1="11" x2="12" y2="17" />
        </svg>
      </button>

      {/*cuadro de informacion de la politica de devoluciones*/}
      {visible && (
        <div className="absolute right-0 top-8 z-50 w-[min(360px,calc(100vw-2rem))] max-w-[360px] bg-[#dbeafe] border-2 border-[#1d4ed8] rounded-[10px] p-4 flex gap-3 shadow-lg">
          <div className="flex-shrink-0 mt-0.5">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="9" stroke="#1d4ed8" strokeWidth="2" />
              <path d="M10 9v5" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" />
              <circle cx="10" cy="6.5" r="1" fill="#1d4ed8" />
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-bold text-[#1d4ed8]" style={{ fontFamily: 'Arimo, sans-serif' }}>
              Política de Devoluciones
            </p>
            <p className="text-sm text-[#6a7282] leading-snug">
              Solo se <strong>aceptan devoluciones por error de entrega o facturación</strong>.
              Se anulará y refacturará únicamente dentro del mismo mes. Fuera de ese período no aplica devolución.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
