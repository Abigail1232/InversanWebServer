import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import RelatedProductCard from "../../components/product/RelatedProductCard";
import SeoMetadata from "../../components/SeoMetadata";
import {
  getVehicleLanding,
  type VehicleLandingData,
} from "../../api/seo";
import { buildVehicleUrl, normalizeSeoSlugPart } from "../../seo/productSeo";

interface Props {
  initialData?: VehicleLandingData;
}

export default function VehicleTirePage({ initialData }: Props) {
  const { brand = "", model = "", year = "", version } = useParams();
  const [searchParams] = useSearchParams();
  const requestedPage = Number(searchParams.get("pagina") ?? "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const requestKey = `${brand}/${model}/${year}/${version ?? ""}:${page}`;
  const initialMatches =
    Boolean(initialData) &&
    initialData?.pagination.page === page &&
    initialData?.vehicle.year === Number(year) &&
    normalizeSeoSlugPart(initialData?.vehicle.brand ?? "") === brand &&
    normalizeSeoSlugPart(initialData?.vehicle.model ?? "") === model &&
    normalizeSeoSlugPart(initialData?.vehicle.version ?? "") === (version ?? "");
  const [loaded, setLoaded] = useState<{
    key: string;
    data: VehicleLandingData | null;
    notFound: boolean;
  }>(() => ({
    key: requestKey,
    data: initialMatches ? initialData ?? null : null,
    notFound: false,
  }));
  const data = loaded.key === requestKey ? loaded.data : null;
  const notFound = loaded.key === requestKey && loaded.notFound;

  useEffect(() => {
    let cancelled = false;
    if (initialMatches) return;
    void getVehicleLanding(brand, model, year, version, page)
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
  }, [brand, initialMatches, model, page, requestKey, version, year]);

  if (notFound) return <VehicleNotFound />;
  const vehicle = data?.vehicle ?? {
    brand: brand.replace(/-/g, " "),
    model: model.replace(/-/g, " "),
    year: Number(year),
    version: version?.replace(/-/g, " ") ?? null,
  };
  const name = `Llantas para ${vehicle.brand} ${vehicle.model} ${vehicle.year}${
    vehicle.version ? ` ${vehicle.version}` : ""
  }`;
  const baseCanonicalPath = buildVehicleUrl({
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    version: vehicle.version,
  });
  const canonicalPath = `${baseCanonicalPath}${page > 1 ? `?pagina=${page}` : ""}`;
  const title = `${name} | Inversan Honduras`;
  const description = `Encuentra llantas registradas como compatibles con ${vehicle.brand} ${vehicle.model} ${vehicle.year} en el catálogo de Inversan. Consulta marcas, medidas, precios y disponibilidad.`;

  return (
    <main className="mx-auto min-h-[60vh] max-w-[1280px] px-4 py-8">
      <SeoMetadata
        title={title}
        description={description}
        canonicalPath={canonicalPath}
        breadcrumbs={[
          { name: "Inicio", path: "/" },
          { name: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`, path: baseCanonicalPath },
        ]}
      />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-600">
        <Link to="/" className="hover:underline">Inicio</Link>
        <span aria-hidden="true"> / </span>
        <span>{vehicle.brand} {vehicle.model} {vehicle.year}</span>
      </nav>
      <h1 className="mb-3 text-2xl font-bold text-[#003e7b] md:text-3xl">{name}</h1>
      <p className="mb-8 max-w-3xl text-gray-700">
        Llantas registradas como compatibles con {vehicle.brand} {vehicle.model}{" "}
        {vehicle.year} en el catálogo de Inversan. Compara medidas, marcas, precios
        y disponibilidad.
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
            canonicalPath={baseCanonicalPath}
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

function VehicleNotFound() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-12">
      <SeoMetadata
        title="Vehículo no encontrado | Inversan"
        description="No encontramos productos públicos asociados a este vehículo."
        robots="noindex,follow"
      />
      <h1 className="text-2xl font-bold text-[#003e7b]">Vehículo no encontrado</h1>
      <p className="mt-3 text-gray-700">
        No encontramos productos públicos asociados a este vehículo en el catálogo.
      </p>
      <Link to="/search" className="mt-6 inline-block text-[#027eb1] hover:underline">
        Explorar catálogo
      </Link>
    </main>
  );
}
