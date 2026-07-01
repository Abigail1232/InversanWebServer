import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HeadphonesIcon,
  ShieldCheck,
  Truck,
  ArrowRight,
} from "lucide-react";
import BodyWrapper from "../../imports/BodyWrapper";
import { useEffect, useState } from "react";
import { type Promotion, getPromotions } from "../../api/promotions/promotion";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function HomePage() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fetchPromotions = async () => {
    const res = await getPromotions();
    console.log(res);
    const now = new Date();
    const data = res.filter(promo => {
      return new Date(promo.fecha_finalizacion) >= now;
    });
    console.log(data);
    setPromotions(data);
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  useEffect(() => {
    if (promotions.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [promotions]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? promotions.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
  };

  const currentPromotion = promotions.length > 0 ? promotions[currentIndex] : null;

  const goToCurrentPromotion = () => {
    if (!currentPromotion?.id_promocion) return;
    navigate(`/promotion/${currentPromotion.id_promocion}`);
  };

  return (
    <div className="min-h-[100vh] bg-[#f9fafb] pb-8">
      {/* Announcement Panel - Full Width */}
      <section className="w-full relative overflow-hidden mb-6 md:mb-8 group">
        <div className="h-[400px] sm:h-[450px] md:h-[600px] w-full relative overflow-hidden">
          <img
            src="/inversan_pure_banner.png"
            alt="Anuncio Principal Inversan"
            className="w-full h-full object-cover transition-transform duration-[20s] ease-linear group-hover:scale-105"
          />

          <div className="absolute inset-y-0 left-0 flex items-center px-3 sm:px-6 md:px-20 max-w-[1400px] mx-auto w-full pointer-events-none">
            {/* Pedestal de Marca - Tamaño Equilibrado y Profesional */}
            <motion.div
              initial={{ opacity: 0, x: -100, rotateY: -20 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{
                duration: 1,
                delay: 0.2,
                type: "spring",
                damping: 20,
              }}
              className="bg-white md:bg-white/95 backdrop-blur-md p-4 sm:p-6 md:p-12 rounded-[24px] sm:rounded-[32px] md:rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] border border-white/20 space-y-4 sm:space-y-6 md:space-y-8 max-w-[88%] sm:max-w-[80%] md:max-w-xl"
            >
              {/* Logo Inversan Protegido y Destacado */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.6,
                  type: "spring",
                  stiffness: 200,
                }}
                whileHover={{ scale: 1.05 }}
                className="flex justify-start relative group/logo cursor-pointer"
              >
                {/* Destello sutil al pasar el mouse */}
                <div className="absolute -inset-6 bg-[#027EB1]/5 blur-3xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <img
                  src="/logo.svg"
                  alt="Inversan Logo"
                  className="h-12 sm:h-16 md:h-24 w-auto filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.15)] relative z-10 transition-transform duration-500"
                />
              </motion.div>

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="inline-block px-5 py-2 bg-[#027EB1] text-white text-[10px] md:text-sm font-black rounded-full uppercase tracking-[0.3em] shadow-xl"
                >
                  Líderes en el Mercado
                </motion.div>

                <div className="overflow-hidden">
                  <motion.h1
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="text-xl sm:text-2xl md:text-5xl font-black text-[#003e7b] font-['Arimo'] uppercase leading-[1.05]"
                  >
                    Calidad que <br />{" "}
                    <span className="text-[#027EB1]">mueve tu mundo</span>
                  </motion.h1>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3, duration: 1 }}
                  className="text-gray-500 text-xs sm:text-sm md:text-lg max-w-md font-medium leading-relaxed"
                >
                  Encuentra las mejores llantas premium con garantía
                  total de fábrica.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, type: "spring" }}
                  className="pt-4 flex gap-4"
                >
                  <button
                    onClick={() => navigate("/search")}
                    className="group px-5 py-3 sm:px-8 sm:py-4 bg-[#003e7b] text-white text-xs sm:text-sm font-black rounded-2xl shadow-2xl shadow-blue-900/20 hover:bg-[#027EB1] transition-all pointer-events-auto active:scale-90 flex items-center gap-2 sm:gap-3"
                  >
                    <span>Explorar Catálogo</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Scroll Down Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block opacity-30">
            <div className="w-7 h-11 rounded-full border-2 border-[#003e7b] flex justify-center pt-2">
              <div className="w-1.5 h-2.5 bg-[#003e7b] rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <div className="max-w-[1400px] mx-auto px-4 animate-page-enter">
        {promotions.length > 0 && (<section className="pb-8">
          {/* Banner Promocional */}
          <div
            className="group relative bg-gradient-to-r from-[#027EB1] to-[#0098D4]  overflow-hidden shadow-lg h-[220px] sm:h-[300px] md:h-[300px] cursor-pointer transition-all duration-300 hover:shadow-2xl"
            role="button"
            tabIndex={0}
            onClick={goToCurrentPromotion}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                goToCurrentPromotion();
              }
            }}
            aria-label="Ver promoción actual"
          >
            <img
              src={`${import.meta.env.VITE_API_URL}/public/${currentPromotion?.banner_url
                }`}
              alt={
                String(currentPromotion?.id_promocion) || "Banner promocional"
              }
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-white/25 blur-2xl opacity-0 transition-all duration-700 ease-out group-hover:left-[120%] group-hover:opacity-100" />

            <button
              onClick={(event) => {
                event.stopPropagation();
                goToCurrentPromotion();
              }}
              className="absolute bottom-3 right-3 md:bottom-5 md:right-5 px-3 py-1.5 md:px-4 md:py-2 bg-white/95 text-[#027EB1] text-xs md:text-sm font-semibold rounded-full shadow-md transition-all duration-300 z-20 hover:bg-white hover:scale-105"
            >
              Ver promoción
            </button>

            {/* Flecha Izquierda */}
            <button
              onClick={(event) => {
                event.stopPropagation();
                prevSlide();
              }}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors z-10"
            >
              <ChevronLeft className="w-4 h-4 md:w-6 md:h-6 text-gray-700" />
            </button>

            {/* Flecha Derecha */}
            <button
              onClick={(event) => {
                event.stopPropagation();
                nextSlide();
              }}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors z-10"
            >
              <ChevronRight className="w-4 h-4 md:w-6 md:h-6 text-gray-700" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {promotions.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentIndex
                      ? "bg-white scale-110"
                      : "bg-white/50 hover:bg-white/80"
                    }`}
                />
              ))}
            </div>
          </div>
        </section>)}

        {/* Vehicle Selection and Brands */}
        <div className="w-full animate-page-enter-delay-1">
          <BodyWrapper />
        </div>
      </div>

      {/* Por qué comprar con nosotros - Adaptado al nuevo Layout */}
      <section className="py-12 sm:py-16 md:py-20 bg-slate-50/50 w-full relative z-10 border-y border-slate-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1 bg-blue-100 text-[#027EB1] text-[10px] font-black rounded-full uppercase tracking-widest mb-4"
            >
              Nuestros Valores
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl md:text-5xl font-black font-['Arimo'] text-[#003e7b] uppercase tracking-tight"
            >
              ¿Por qué elegir <span className="text-[#027EB1]">Inversan</span>?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 mt-5 text-base md:text-lg max-w-3xl mx-auto font-medium"
            >
              Te ofrecemos la mejor experiencia técnica y humana en la compra de
              llantas.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: (
                  <Truck className="w-8 h-8 text-[#027EB1] group-hover:text-white transition-colors duration-500" />
                ),
                title: "Envíos Nacionales",
                description:
                  "Logística optimizada para entregas rápidas y seguras en todo Honduras.",
              },
              {
                icon: (
                  <ShieldCheck className="w-8 h-8 text-[#027EB1] group-hover:text-white transition-colors duration-500" />
                ),
                title: "Garantía Real",
                description:
                  "Respaldo total en cada producto. Compras con la tranquilidad de un líder.",
              },
              {
                icon: (
                  <CreditCard className="w-8 h-8 text-[#027EB1] group-hover:text-white transition-colors duration-500" />
                ),
                title: "Financiamiento",
                description:
                  "Opciones de pago flexibles y seguras adaptadas a tus necesidades.",
              },
              {
                icon: (
                  <HeadphonesIcon className="w-8 h-8 text-[#027EB1] group-hover:text-white transition-colors duration-500" />
                ),
                title: "Asesoría Técnica",
                description:
                  "Expertos certificados listos para recomendarte la mejor opción para tu vehículo.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  y: -15,
                  transition: { duration: 0.3 },
                }}
                className="bg-white rounded-[32px] p-8 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-[0_25px_60px_-15px_rgba(2,126,177,0.15)] hover:border-[#027EB1]/40 transition-all duration-500 group flex flex-col items-center text-center relative overflow-hidden"
              >
                {/* Decorative element background */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#027EB1]/5 rounded-full blur-3xl group-hover:bg-[#027EB1]/10 transition-colors" />

                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-[#027EB1] group-hover:rotate-[360deg] shadow-sm group-hover:shadow-[0_10px_20px_rgba(2,126,177,0.4)] transition-all duration-700 ease-in-out">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black text-[#003e7b] mb-4 uppercase font-['Arimo'] tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-[15px] font-medium leading-relaxed">
                  {feature.description}
                </p>

                {/* Active bar bottom */}
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-[#027EB1] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
