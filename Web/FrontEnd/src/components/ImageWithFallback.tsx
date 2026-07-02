import React, { useEffect, useMemo, useState } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczaW5zLm9yZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiB5PSIzNSIgcj0iNyIvPjwvc3ZnPgo=";

const FALLBACK_API_BASE = "https://api.grupoinversan.com";

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getFileName(value: string) {
  try {
    const url = value.startsWith("http://") || value.startsWith("https://")
      ? new URL(value)
      : null;

    const pathValue = url ? url.pathname : value;
    const clean = pathValue.split("?")[0].split("#")[0];
    const parts = clean.split("/").filter(Boolean);

    return decodeURIComponent(parts[parts.length - 1] || "");
  } catch {
    const clean = value.split("?")[0].split("#")[0];
    const parts = clean.split("/").filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] || "");
  }
}

function buildCandidates(src?: string | null) {
  if (!src) return [];

  const cleanSrc = String(src).trim();
  if (!cleanSrc) return [];

  if (cleanSrc.startsWith("data:")) return [cleanSrc];

  const apiBase = ((import.meta.env.VITE_API_URL as string | undefined) || FALLBACK_API_BASE)
    .replace(/\/$/, "");

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const fileName = getFileName(cleanSrc);

  const candidates = [cleanSrc];

  if (fileName) {
    candidates.push(`${apiBase}/assets/${encodeURIComponent(fileName)}`);
    candidates.push(`${apiBase}/public/${encodeURIComponent(fileName)}`);

    if (currentOrigin) {
      candidates.push(`${currentOrigin}/assets/${encodeURIComponent(fileName)}`);
      candidates.push(`${currentOrigin}/public/${encodeURIComponent(fileName)}`);
    }
  }

  return unique(candidates);
}

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { src, alt, style, className, ...rest } = props;

  const candidates = useMemo(() => buildCandidates(src), [src]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [didError, setDidError] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setDidError(false);
  }, [src]);

  const currentSrc = candidates[candidateIndex] || "";

  const handleError = () => {
    const nextIndex = candidateIndex + 1;

    if (nextIndex < candidates.length) {
      setCandidateIndex(nextIndex);
      return;
    }

    setDidError(true);
  };

  if (didError || !currentSrc) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`}
        style={style}
        data-original-url={src}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img src={ERROR_IMG_SRC} alt="Imagen no disponible" {...rest} />
        </div>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={handleError}
    />
  );
}
