import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductGallery from '../../components/product/ProductGallery';
import ProductSpecs from '../../components/product/ProductSpecs';
import WholesaleBanner from '../../components/product/WholesaleBanner';
import ProductDescription from '../../components/product/ProductDescription';
import RelatedProducts from '../../components/product/RelatedProducts';
import QuantitySelector from '../../components/ui/QuantitySelector';
import type { RelatedSection } from '../../api/products/productos';
import type { Product } from '../../types/product';
import { usePreventDuplicate } from '../../hooks/usePreventDuplicateRequest';
import { formatPrice } from '../../utils/formatPrice';
import {
  buildProductSeo,
  buildTireSizeUrl,
  extractProductIdFromSlug,
  getCanonicalProductRedirect,
} from '../../seo/productSeo';
import { PUBLIC_SITE_URL } from '../../config/site';
import { API_BASE_URL, buildProductImageUrl } from '../../config/api';
import {
  buildProductStructuredData,
  serializeForScript,
} from '../../seo/productStructuredData';
import { buildBreadcrumbStructuredData } from '../../seo/globalStructuredData';

interface ProductDetailPageProps {
  initialProduct?: Product;
}

function getSelectedBranchId(): number | undefined {
  if (typeof window === "undefined") return undefined;
  const branchId = Number(window.localStorage.getItem("selectedBranch"));
  return Number.isSafeInteger(branchId) && branchId > 0
    ? branchId
    : undefined;
}

export default function ProductDetailPage({ initialProduct }: ProductDetailPageProps) {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const productId = id ?? extractProductIdFromSlug(slug ?? "") ?? undefined;
  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [publicAvailability, setPublicAvailability] = useState(() =>
    initialProduct
      ? { productId: String(initialProduct.id), stock: initialProduct.stock }
      : null,
  );
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWholesaleClient, setIsWholesaleClient] = useState(false);
  const [relatedSections, setRelatedSections] = useState<RelatedSection[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isCurrentProduct = Boolean(
    product &&
    productId &&
    String(product.id) === String(productId),
  );

  useEffect(() => {
    if (!productId) return;

    let cancelled = false;

    const fetchProduct = async (
      id_sucursal?: number,
      availabilityOnly = false,
    ) => {
      try {
        const { getProductoById } = await import('../../api/products/productos');
        const data = await getProductoById(Number(productId), id_sucursal);
        if (cancelled || String(data.id) !== String(productId)) return;
        if (availabilityOnly) {
          setPublicAvailability({ productId: String(data.id), stock: data.stock });
        } else {
          setProduct(data);
          setError(null);
          if (id_sucursal === undefined) {
            setPublicAvailability({ productId: String(data.id), stock: data.stock });
          }
        }
      } catch (error) {
        if (!cancelled) {
          if (availabilityOnly) {
            console.error(
              "Error al actualizar disponibilidad general del producto:",
              error,
            );
          } else {
            setError('Error al cargar el producto.');
          }
        }
      } finally {
        if (!cancelled && !availabilityOnly) setLoading(false);
      }
    };

    const checkWholesaleStatus = async () => {
      try {
        const { getPrivilegesUser } = await import('../../api/auth/privileges');
        const privileges = await getPrivilegesUser();
        if (cancelled) return;
        const wholesale = privileges.some((p) =>
          p.nombre === 'IS_MAYORIST' || p.nombre === 'ALL_ACCESS'
        );
        setIsWholesaleClient(wholesale);
      } catch (err) {
        if (!cancelled) console.error("Error checking wholesale status:", err);
      }
    };

    if (
      initialProduct &&
      String(initialProduct.id) === String(productId)
    ) {
      setProduct(initialProduct);
      setError(null);
      setLoading(false);
    } else {
      setLoading(true);
    }
    const selectedBranchId = getSelectedBranchId();
    if (selectedBranchId === undefined) {
      void fetchProduct();
    } else {
      void fetchProduct(undefined, true);
      void fetchProduct(selectedBranchId);
    }
    void checkWholesaleStatus();
    return () => {
      cancelled = true;
    };
  }, [productId, initialProduct]);

  useEffect(() => {
    if (!isCurrentProduct || !productId) return;
    let cancelled = false;
    const id_sucursal = getSelectedBranchId();

    const fetchRelated = async () => {
      setRelatedLoading(true);
      setRelatedError(null);
      setRelatedSections([]);
      try {
        const { getRelatedProducts } = await import('../../api/products/productos');
        const data = await getRelatedProducts(Number(productId), id_sucursal);
        if (!cancelled) setRelatedSections(data);
      } catch {
        if (!cancelled) {
          setRelatedError('No se pudieron cargar los productos relacionados.');
          setRelatedSections([]);
        }
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    };
    void fetchRelated();
    return () => {
      cancelled = true;
    };
  }, [isCurrentProduct, productId]);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    const onBranchChange = async () => {
      const id_sucursal = getSelectedBranchId();
      try {
        const { getProductoById, getRelatedProducts } = await import('../../api/products/productos');
        const data = await getProductoById(Number(productId), id_sucursal);
        if (cancelled || String(data.id) !== String(productId)) return;
        setProduct(data);
        setQuantity((q) => Math.min(Math.max(1, q), data.stock || 1));
        const related = await getRelatedProducts(Number(productId), id_sucursal);
        if (cancelled) return;
        setRelatedSections(related);
        setRelatedError(null);
      } catch {
        if (!cancelled) setError('Error al actualizar producto.');
      }
    };
    window.addEventListener("branchChanged", onBranchChange);
    return () => {
      cancelled = true;
      window.removeEventListener("branchChanged", onBranchChange);
    };
  }, [productId]);

  useEffect(() => {
    const canonicalRedirect = getCanonicalProductRedirect(
      product,
      productId,
      slug,
    );
    if (canonicalRedirect) {
      navigate(canonicalRedirect, { replace: true });
    }
  }, [navigate, product, productId, slug]);

  useEffect(() => {
    if (!isCurrentProduct || !product?.id) return;

    startTimeRef.current = Date.now();

    return () => {
      if (startTimeRef.current !== null) {
        const tiempoMs = Date.now() - startTimeRef.current;
        // Convertir a segundos para que el backend lo guarde correctamente
        const tiempoSegundos = Math.floor(tiempoMs / 1000);

        const id_sucursal = getSelectedBranchId();

        const visitaProd = {
          id_producto: parseInt(product.id),
          duracion_visita: tiempoSegundos,
          fecha: new Date().toISOString(),
          id_sucursal,
        };

        void import('../../api/products/visitas').then(({ crearVisita }) =>
          crearVisita(visitaProd),
        );
      }
    };

  }, [isCurrentProduct, productId, product?.id]);

  useEffect(() => {
    if (!isCurrentProduct || !product) return;
    const seo = buildProductSeo(product);
    const canonical = new URL(seo.canonicalPath, PUBLIC_SITE_URL).toString();
    const image = buildProductImageUrl(product.images[0]?.url);
    document.title = seo.title;
    document.documentElement.lang = "es-HN";

    const setMeta = (
      attribute: "name" | "property",
      key: string,
      content: string,
    ) => {
      let element = document.head.querySelector<HTMLMetaElement>(
        `meta[data-inversan-product-seo="true"][${attribute}="${key}"]`,
      );
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        element.dataset.inversanProductSeo = "true";
        document.head.appendChild(element);
      }
      element.content = content;
    };
    setMeta("name", "description", seo.description);
    setMeta("property", "og:type", "product");
    setMeta("property", "og:title", seo.title);
    setMeta("property", "og:description", seo.description);
    setMeta("property", "og:url", canonical);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", seo.title);
    setMeta("name", "twitter:description", seo.description);
    if (image) {
      setMeta("property", "og:image", image);
      setMeta("name", "twitter:image", image);
    }

    let canonicalLink = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"][data-inversan-product-seo="true"]',
    );
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      canonicalLink.dataset.inversanProductSeo = "true";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;
    return () => {
      document.head
        .querySelectorAll('[data-inversan-product-seo="true"]')
        .forEach((element) => element.remove());
      document.title = "Inversan";
    };
  }, [isCurrentProduct, product, productId]);

  useEffect(() => {
    if (
      !isCurrentProduct ||
      !product ||
      publicAvailability?.productId !== String(productId)
    ) {
      return;
    }

    const structuredData = buildProductStructuredData(product, {
      siteUrl: PUBLIC_SITE_URL,
      apiBaseUrl: API_BASE_URL,
      availabilityStock: publicAvailability.stock,
      isTireProduct: true,
    });
    const existingScripts = document.head.querySelectorAll<HTMLScriptElement>(
      'script[type="application/ld+json"][data-inversan-product-jsonld="true"]',
    );
    const script =
      existingScripts[0] ?? document.createElement("script");
    existingScripts.forEach((existing, index) => {
      if (index > 0) existing.remove();
    });
    script.type = "application/ld+json";
    script.dataset.inversanProductJsonld = "true";
    script.textContent = serializeForScript(structuredData);
    if (!script.isConnected) document.head.appendChild(script);

    return () => {
      document.head
        .querySelectorAll(
          'script[type="application/ld+json"][data-inversan-product-jsonld="true"]',
        )
        .forEach((existing) => existing.remove());
    };
  }, [isCurrentProduct, product, productId, publicAvailability]);

  useEffect(() => {
    if (!isCurrentProduct || !product) return;
    const seo = buildProductSeo(product);
    const dimensionValue = (label: string) =>
      product.specs.find(
        (spec) => spec.label.toLowerCase() === label.toLowerCase(),
      )?.value;
    const sizePath = buildTireSizeUrl(
      dimensionValue("Alto"),
      dimensionValue("Perfil"),
      dimensionValue("Rin"),
    );
    const items = [
      { name: "Inicio", path: "/" },
      ...(sizePath
        ? [{ name: `Llantas ${seo.measure}`, path: sizePath }]
        : []),
      { name: seo.heading, path: seo.canonicalPath },
    ];
    const scripts = document.head.querySelectorAll<HTMLScriptElement>(
      'script[type="application/ld+json"][data-inversan-client-breadcrumbs="true"]',
    );
    const script = scripts[0] ?? document.createElement("script");
    scripts.forEach((existing, index) => {
      if (index > 0) existing.remove();
    });
    script.type = "application/ld+json";
    script.dataset.inversanClientBreadcrumbs = "true";
    script.textContent = serializeForScript(
      buildBreadcrumbStructuredData(items, PUBLIC_SITE_URL),
    );
    if (!script.isConnected) document.head.append(script);
    return () => {
      document.head
        .querySelectorAll(
          'script[type="application/ld+json"][data-inversan-client-breadcrumbs="true"]',
        )
        .forEach((existing) => existing.remove());
    };
  }, [isCurrentProduct, product, productId]);

  const handleAddToCart = async () => {
    if (product) {
      if (product.stock <= 0) {
        const { message } = await import('antd');
        message.warning('Este producto no tiene unidades disponibles en este momento.');
        return;
      }

      try {
        const [{ addToCart }, { message }] = await Promise.all([
          import('../../api/cart/cart'),
          import('antd'),
        ]);
        const branchStr = localStorage.getItem("selectedBranch");
        const id_branch = branchStr ? Number(branchStr) : 1;

        const success = await addToCart(id_branch, Number(product.id), quantity);

        if (success) {
          message.success(`${quantity} ${product.name} agregado(s) al carrito.`);
        } else {
          message.error('No se pudo agregar el producto al carrito. Verifique la disponibilidad en su sucursal.');
        }
      } catch {
        const { message } = await import('antd');
        message.error('Ocurrió un error al intentar agregar al carrito.');
      }
    }
  };

  const { execute: handleAddToCartPrevented, isLoading: isAddingToCart } = usePreventDuplicate(handleAddToCart);

  if (loading || (product !== null && !isCurrentProduct)) {
    return <div className="flex items-center justify-center min-h-screen bg-[#f3f4f6]">Cargando...</div>;
  }

  if (error || !product) {
    return <div className="flex items-center justify-center min-h-screen bg-[#f3f4f6] text-red-500">{error || 'Producto no encontrado'}</div>;
  }

  const hasPromotionDiscount = Number(product.discountPercent) > 0;
  const showStrikethroughPrice =
    hasPromotionDiscount &&
    Boolean(product.originalPrice);
  const productHeading = buildProductSeo(product).heading;

  return (
    <>
      <div className="w-full max-w-[100vw] bg-[#f3f4f6] min-h-screen overflow-x-hidden">
        <div className="max-w-[1280px] mx-auto px-4 py-4 md:py-8 flex flex-col gap-8 md:gap-12 animate-page-enter">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
            <Link to="/" className="hover:underline">Inicio</Link>
            {buildTireSizeUrl(
              product.specs.find((spec) => spec.label.toLowerCase() === "alto")?.value,
              product.specs.find((spec) => spec.label.toLowerCase() === "perfil")?.value,
              product.specs.find((spec) => spec.label.toLowerCase() === "rin")?.value,
            ) && (
              <>
                <span aria-hidden="true"> / </span>
                <Link
                  to={buildTireSizeUrl(
                    product.specs.find((spec) => spec.label.toLowerCase() === "alto")?.value,
                    product.specs.find((spec) => spec.label.toLowerCase() === "perfil")?.value,
                    product.specs.find((spec) => spec.label.toLowerCase() === "rin")?.value,
                  )}
                  className="hover:underline"
                >
                  Llantas {buildProductSeo(product).measure}
                </Link>
              </>
            )}
            <span aria-hidden="true"> / </span>
            <span>{productHeading}</span>
          </nav>

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
                  <h1 style={{ marginBottom: 4, fontFamily: 'Arimo, sans-serif', fontWeight: 400 }} className="text-2xl md:text-3xl">
                    {productHeading}
                  </h1>
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
                  {product.stock > 0 ? `${product.stock} unidades disponibles` : 'Agotado temporalmente'}
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
