import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBoxOpen } from "react-icons/fa";
import type { Categoria } from "../api/products/categorias";

type CategorySelectorPanelProps = {
  categories: Categoria[];
  selectedCategory?: number | null;
  onCategoryClick: (category: Categoria) => void;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  stepLabel?: string;
  className?: string;
};

export default function CategorySelectorPanel({
  categories,
  selectedCategory = null,
  onCategoryClick,
  isLoading = false,
  title = "Selecciona la categoría",
  stepLabel = "1",
  className = "",
}: CategorySelectorPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        setShowArrows(
          scrollRef.current.scrollWidth > scrollRef.current.clientWidth
        );
      }
    };

    const timeout = setTimeout(checkScroll, 100);
    window.addEventListener("resize", checkScroll);
    return () => {
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timeout);
    };
  }, [categories]);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 340;
      scrollRef.current.scrollBy({
        left: dir === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const mobilePrev = () => {
    setMobileIndex((prev) => (prev === 0 ? categories.length - 1 : prev - 1));
  };

  const mobileNext = () => {
    setMobileIndex((prev) => (prev + 1) % categories.length);
  };

  if (isLoading) {
    return (
      <section
        className={`p-8 md:p-12 flex flex-col items-center justify-center gap-4 bg-white rounded-b-3xl rounded-tr-3xl shadow-sm border border-slate-100 ${className}`}
      >
        <div className="w-10 h-10 border-4 border-[#027EB1]/10 border-t-[#027EB1] rounded-full animate-spin" />
      </section>
    );
  }

  const currentMobileCat = categories[mobileIndex];

  return (
    <section className={`relative w-full ${className}`}>
      {/* Folder Tab Header */}
      <div className="flex w-full items-end">
        <div className="bg-[#027EB1] text-white px-3 sm:px-4 md:px-8 py-2 sm:py-2.5 md:py-3.5 rounded-t-[12px] sm:rounded-t-[16px] md:rounded-t-[20px] flex items-center gap-2 sm:gap-3 md:gap-4 w-max shadow-sm relative z-10 transition-all">
          <div className="flex-shrink-0 flex items-center justify-center bg-white text-[#027EB1] rounded-full w-6 h-6 md:w-8 md:h-8 font-[900] text-sm md:text-base shadow-sm">
            {stepLabel}
          </div>
          <h2 className="font-[900] text-[11px] sm:text-[14px] md:text-2xl uppercase tracking-wider font-['Arimo'] whitespace-nowrap leading-none">
            {title}
          </h2>
        </div>
      </div>

      {/* Folder Body */}
      <div className="bg-white rounded-b-3xl rounded-tr-3xl rounded-tl-none shadow-[0_20px_50px_-15px_rgba(0,62,123,0.1)] border border-slate-100 relative z-0 flex flex-col">
        <div className="relative w-full overflow-hidden rounded-b-3xl rounded-tr-3xl rounded-tl-none">
          {/* ===== MOBILE: 1 category at a time with < cat > arrows ===== */}
          <div className="flex items-center md:hidden py-5 px-2">
            {/* Left arrow */}
            <button
              onClick={mobilePrev}
              className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-[#027EB1] active:bg-[#027EB1] active:text-white transition-all active:scale-95"
              aria-label="Categoría anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Single category */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <AnimatePresence mode="wait">
                {currentMobileCat && (
                  <motion.div
                    key={currentMobileCat.id_categoria}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => onCategoryClick(currentMobileCat)}
                      className="w-full flex flex-col items-center justify-center py-2 active:bg-slate-50 transition-all rounded-2xl"
                    >
                      <div className="w-12 h-12 flex items-center justify-center mb-3 relative">
                        {currentMobileCat.imagen_url ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}/public/${
                              currentMobileCat.imagen_url
                            }`}
                            alt={currentMobileCat.nombre}
                            className={`w-full h-full object-contain transition-all duration-500 ${
                              selectedCategory === currentMobileCat.id_categoria
                                ? "scale-110 drop-shadow-md"
                                : ""
                            }`}
                          />
                        ) : (
                          <FaBoxOpen
                            className={`w-10 h-10 transition-all duration-500 ${
                              selectedCategory === currentMobileCat.id_categoria
                                ? "text-[#027EB1]"
                                : "text-slate-300"
                            }`}
                          />
                        )}
                      </div>

                      <span
                        className={`text-[11px] font-[900] uppercase text-center tracking-widest leading-snug font-['Arimo'] px-2 transition-colors duration-300 ${
                          selectedCategory === currentMobileCat.id_categoria
                            ? "text-[#027EB1]"
                            : "text-slate-800"
                        }`}
                      >
                        {currentMobileCat.nombre}
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right arrow */}
            <button
              onClick={mobileNext}
              className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-[#027EB1] active:bg-[#027EB1] active:text-white transition-all active:scale-95"
              aria-label="Categoría siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile dots indicator */}
          {categories.length > 1 && (
            <div className="flex justify-center gap-1.5 pb-4 md:hidden">
              {categories.map((cat, i) => (
                <button
                  key={cat.id_categoria}
                  onClick={() => setMobileIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === mobileIndex
                      ? "w-5 bg-[#027EB1]"
                      : "w-1.5 bg-slate-300"
                  }`}
                  aria-label={`Ir a ${cat.nombre}`}
                />
              ))}
            </div>
          )}

          {/* ===== DESKTOP: original horizontal scroll (unchanged) ===== */}
          <div
            ref={scrollRef}
            className="hidden md:flex items-stretch w-full overflow-x-auto no-scrollbar scroll-smooth [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-slate-100/50"
          >
            <AnimatePresence>
              {categories.map((cat, index) => {
                const isActive = selectedCategory === cat.id_categoria;

                return (
                  <motion.div
                    key={cat.id_categoria}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex-1 min-w-[33.3333%] lg:min-w-[16.6666%] relative"
                  >
                    <button
                      onClick={() => onCategoryClick(cat)}
                      className={`group relative w-full h-full flex flex-col items-center justify-start px-2 py-8 transition-all duration-300 hover:bg-slate-50/80 active:bg-slate-100`}
                    >
                      <div className="h-12 flex items-center justify-center mb-4 relative">
                        {cat.imagen_url ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}/public/${
                              cat.imagen_url
                            }`}
                            alt={cat.nombre}
                            className={`w-full h-full object-contain transition-all duration-500 ${
                              isActive
                                ? "scale-110 drop-shadow-md filter-none"
                                : "grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
                            }`}
                          />
                        ) : (
                          <FaBoxOpen
                            className={`w-10 h-10 transition-all duration-500 ${
                              isActive
                                ? "text-[#027EB1] scale-110"
                                : "text-slate-300 group-hover:text-slate-400 group-hover:scale-105"
                            }`}
                          />
                        )}
                      </div>

                      <span
                        className={`text-xs font-[900] uppercase text-center tracking-widest leading-snug font-['Arimo'] w-full line-clamp-2 px-2 transition-colors duration-300 ${
                          isActive
                            ? "text-[#027EB1]"
                            : "text-slate-800 group-hover:text-[#027EB1]"
                        }`}
                      >
                        {cat.nombre}
                      </span>

                      {/* Active line indicator at the bottom */}
                      {isActive && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-[#027EB1] rounded-t-full" />
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Scroll fade borders - desktop only */}
          {showArrows && (
            <>
              <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none hidden md:block" />
              <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none hidden md:block" />
            </>
          )}
        </div>

        {/* Scroll Arrows Navigation - Desktop floating overlay (unchanged) */}
        <AnimatePresence>
          {showArrows && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/2 -translate-y-1/2 md:-left-[58px] md:-right-[58px] hidden md:flex items-center justify-between pointer-events-none z-20"
            >
              <button
                onClick={() => scroll("left")}
                className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-[#027EB1] shadow-lg pointer-events-auto hover:bg-[#027EB1] hover:text-white hover:scale-110 transition-all"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-[#027EB1] shadow-lg pointer-events-auto hover:bg-[#027EB1] hover:text-white hover:scale-110 transition-all"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
