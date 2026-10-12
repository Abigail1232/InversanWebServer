import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import RelatedProductCard from "../../components/product/RelatedProductCard";
import SeoMetadata from "../../components/SeoMetadata";
import {
  getTireSizeLanding,
  type TireSizeLandingData,
} from "../../api/seo";
import {
  buildTireSizeSlug,
  buildTireSizeUrl,
  formatProductMeasure,
  parseTireSizeSlug,
} from "../../seo/productSeo";

interface Props {
  initialData?: TireSizeLandingData;
}

export default function TireSizePage({ initialData }: Props) {
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const requestedPage = Number(searchParams.get("pagina") ?? "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const size = useMemo(() => parseTireSizeSlug(slug), [slug]);
  const requestKey = `${slug}:${page}`;
  const initialProduct = initialData?.products[0];
  const initialSlug = initialProduct
    ? buildTireSizeSlug(
        initialProduct.width,
        initialProduct.profile,
        initialProduct.rim,
      )
    : "";
  const initialMatches =
    Boolean(initialData) &&
    initialSlug === slug &&
    initialData?.pagination.page === page;
  const [loaded, setLoaded] = useState<{
    key: string;
    data: TireSizeLandingData | null;
    notFound: boolean;
  }>(() => ({
    key: requestKey,
    data: initialMatches ? initialData ?? null : null,
    notFound: false,
  }));
  const data = loaded.key === requestKey ? loaded.data : null;
  const notFound =
    loaded.key === requestKey && loaded.notFound;

  useEffect(() => {
    let cancelled = false;
    if (!size || initialMatches) return;
    void getTireSizeLanding(size.width, size.profile, size.rim, page)
      .then((response) => {
        if (!cancelled) {
          setLoaded({ key: requestKey, data: response, notFound: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded({ key: requestKey, data: null, notFound: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [initialMatches, page, requestKey, size]);

  if (!size || notFound) {
    return <TireSizeNotFound />;
  }

  const measure = formatProductMeasure(size.width, size.profile, size.rim);
  const canonicalPath = `${buildTireSizeUrl(size.width, size.profile, size.rim)}${
    page > 1 ? `?pagina=${page}` : ""
  }`;
  const title = `Llantas ${measure} en Honduras | Inversan`;
  const description = `Compra llantas ${measure} en Honduras. Compara marcas, precios y disponibilidad en Inversan.`;

  return (
    <main className="mx-auto min-h-[60vh] max-w-[1280px] px-4 py-8">
      <SeoMetadata
        title={title}
        description={description}
        canonicalPath={canonicalPath}
        breadcrumbs={[
          { name: "Inicio", path: "/" },
          { name: `Llantas ${measure}`, path: buildTireSizeUrl(size.width, size.profile, size.rim) },
        ]}
      />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-600">
        <Link to="/" className="hover:underline">Inicio</Link>
        <span aria-hidden="true"> / </span>
        <span>Llantas {measure}</span>
      </nav>
      <h1 className="mb-3 text-2xl font-bold text-[#003e7b] md:text-3xl">
        Llantas {measure} en Honduras
      </h1>
      <p className="mb-8 max-w-3xl text-gray-700">
        Encuentra llantas {measure} disponibles en Inversan. Compara marcas,
        precios y disponibilidad.
      </p>
      {!data ? (
        <p role="status" className="py-12 text-center text-gray-600">
          Cargando productos...
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.products.map((product) => (
              <RelatedProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination
            currentPage={data.pagination.page}
            totalPages={data.pagination.totalPages}
            canonicalPath={buildTireSizeUrl(size.width, size.profile, size.rim)}
          />
        </>
      )}
    </main>
  );
}

function Pagination({
  currentPage,
  totalPages,
  canonicalPath,
}: {
  currentPage: number;
  totalPages: number;
  canonicalPath: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Paginación de llantas" className="mt-8 flex justify-center gap-4">
      {currentPage > 1 && (
        <Link
          rel="prev"
          to={`${canonicalPath}?pagina=${currentPage - 1}`}
          className="rounded border px-4 py-2 text-[#027eb1] hover:bg-blue-50"
        >
          Anterior
        </Link>
      )}
      <span className="py-2 text-sm text-gray-600">
        Página {currentPage} de {totalPages}
      </span>
      {currentPage < totalPages && (
        <Link
          rel="next"
          to={`${canonicalPath}?pagina=${currentPage + 1}`}
          className="rounded border px-4 py-2 text-[#027eb1] hover:bg-blue-50"
        >
          Siguiente
        </Link>
      )}
    </nav>
  );
}

function TireSizeNotFound() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-12">
      <SeoMetadata
        title="Medida no encontrada | Inversan"
        description="No encontramos productos públicos disponibles para esta medida."
        robots="noindex,follow"
      />
      <h1 className="text-2xl font-bold text-[#003e7b]">Medida no encontrada</h1>
      <p className="mt-3 text-gray-700">
        No encontramos productos públicos para esta medida.
      </p>
      <Link to="/search" className="mt-6 inline-block text-[#027eb1] hover:underline">
        Explorar catálogo
      </Link>
    </main>
  );
}
