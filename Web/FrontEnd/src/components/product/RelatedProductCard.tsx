import type { RelatedProduct } from "../../types/product";
import DiscountBadge from "../ui/DiscountBadge";
import { buildProductImageUrl } from "../../config/api";
import { Link } from "react-router-dom";
import { buildProductSeo, buildProductUrl } from "../../seo/productSeo";

interface Props {
  product: RelatedProduct;
  displayMode?: "porcentaje" | "precio_tachado";
}

export default function RelatedProductCard({
  product,
  displayMode = "precio_tachado",
}: Props) {
  const discountPercent = Number(product.discountPercent ?? 0);
  const currentPrice = Number(product.price ?? 0);
  const fallbackOriginalPrice =
    discountPercent > 0 && currentPrice > 0 && discountPercent < 100
      ? currentPrice / (1 - discountPercent / 100)
      : undefined;
  const originalPriceCandidate = Number(
    product.originalPrice ??
    product.precio_anterior ??
      fallbackOriginalPrice,
  );
  const originalPrice =
    Number.isFinite(originalPriceCandidate) &&
    originalPriceCandidate > currentPrice
      ? originalPriceCandidate
      : undefined;

  const hasDiscount = discountPercent > 0;
  const showStrikethrough =
    hasDiscount &&
    typeof originalPrice === "number" &&
    displayMode === "precio_tachado";
  const showPercentage =
    hasDiscount &&
    displayMode === "porcentaje";
  const productUrl = buildProductUrl(product);
  const productHeading = buildProductSeo(product).heading;

  // Formateador de moneda común para consistencia
  const formatPrice = (value: number) =>
    value.toLocaleString("es-HN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="bg-white border border-[#c7cad0] rounded-[14px] overflow-hidden flex flex-col h-full shadow-sm">
      {/* Contenedor de Imagen */}
      <div className="bg-[#f9fafb] rounded-[10px] m-3 overflow-hidden aspect-[4/3] w-auto flex-shrink-0 flex items-center justify-center">
        {product.imageUrl ? (
          <Link
            to={productUrl}
            aria-label={`Ver ${productHeading}`}
            className="flex h-full w-full items-center justify-center"
          >
            <img
              src={buildProductImageUrl(product.imageUrl)}
              alt={productHeading}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain"
            />
          </Link>
        ) : (
          <svg
            className="w-10 h-10 text-[#9ca3af]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m21 8-9-5-9 5v8l9 5 9-5V8Z" />
            <path d="m3.3 7.8 8.7 5 8.7-5M12 22V13" />
          </svg>
        )}
      </div>

      <div className="p-3 md:px-6 md:pb-6 flex flex-col flex-1">
        {/* Marca */}
        <p className="text-sm md:text-lg font-bold text-[#027eb1] uppercase tracking-wide">
          {product.brand}
        </p>

        {/* Nombre del producto con altura mínima para evitar saltos */}
        <div className="min-h-[2.5rem] md:min-h-[3rem] mb-1">
          <Link
            to={productUrl}
            className="text-sm md:text-base text-[#6a7282] md:text-[#1a1a1a] line-clamp-2 hover:underline"
          >
            {productHeading}
          </Link>
        </div>

        {/* Bloque de Precios - Empujado al fondo para alineación horizontal */}
        <div className="flex flex-col justify-end mt-auto">
          {/* Espacio para Descuento (Altura fija para mantener simetría) */}
          <div className="h-5 md:h-7 flex items-center gap-2 mb-1">
            {showStrikethrough ? (
              <span className="text-xs md:text-base text-[#9ca3af] line-through">
                Lps {formatPrice(originalPrice!)}
              </span>
            ) : showPercentage ? (
              <DiscountBadge percent={parseFloat(discountPercent.toFixed(0))} />
            ) : (
              /* Div invisible para mantener el espacio cuando no hay oferta */
              <div className="invisible text-xs md:text-base">&nbsp;</div>
            )}
          </div>

          {/* Precio Principal con 2 decimales siempre */}
          <p className="text-lg md:text-2xl font-semibold text-[#1a1a1a] leading-none">
            Lps {formatPrice(currentPrice)}
          </p>
        </div>

        {/* Información de Stock */}
        <div className="mt-4">
          <p
            className={`text-[10px] md:text-xs min-h-[1.25rem] ${
              product.stock > 0
                ? "text-[#6a7282]"
                : "text-[#d61216] font-semibold"
            }`}
          >
            {product.stock > 0
              ? `${product.stock} elementos en stock`
              : "Sin stock en esta sucursal"}
          </p>
        </div>

        {/* Botón de acción */}
        <Link
          to={productUrl}
          className={`w-full mt-2 md:mt-3 border-2 font-bold text-sm md:text-lg py-1.5 md:py-2.5 rounded-[10px] transition-colors text-center
            ${
              product.stock > 0
                ? "border-[#027eb1] text-[#027eb1] hover:bg-blue-50 bg-white"
                : "border-[#9ca3af] text-[#9ca3af] bg-[#f3f4f6]"
            }`}
        >
          {product.stock > 0 ? "Ver detalles" : "Ver producto agotado"}
        </Link>
      </div>
    </div>
  );
}
