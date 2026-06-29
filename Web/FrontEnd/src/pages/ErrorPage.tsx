import { useNavigate } from "react-router";
import { Home, ArrowLeft, Shield, AlertCircle } from "lucide-react";
import inversanLogo from "../assets/images/logo.png";

interface ErrorPageProps {
  errorCode?: string;
  errorTitle?: string;
  errorMessage?: string;
}

export default function ErrorPage({
  errorCode,
  errorTitle,
  errorMessage,
}: ErrorPageProps) {
  const navigate =  useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: "#f5f5f5",
        fontFamily:
          "'Arimo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Header con Olas - Igual que Login */}
      <header
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #027EB1 0%, #003E7B 100%)",
          height: "180px",
          position: "relative",
        }}
      >
        {/* Logo - Posicionado arriba */}
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "clamp(24px, 4vh, 40px) clamp(24px, 5vw, 48px)",
            position: "relative",
            zIndex: 10,
          }}
        >
          <img
            src={inversanLogo}
            alt="INVERSAN Logo"
            style={{
              height: "clamp(36px, 5vw, 52px)",
              width: "auto",
              display: "block",
              filter: "brightness(0) invert(1)", // Convierte a blanco
              opacity: 0.95,
            }}
          />
        </div>

        {/* Wave SVG Background - Igual que AuthLayout */}
        <svg
          className="absolute bottom-0 w-full"
          style={{ height: "120px" }}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C150,100 350,0 600,50 C850,100 1050,0 1200,50 L1200,120 L0,120 Z"
            style={{
              fill: "#f5f5f5",
              opacity: 0.3,
            }}
          />
        </svg>
        <svg
          className="absolute bottom-0 w-full"
          style={{ height: "100px" }}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,20 C200,80 400,20 600,60 C800,100 1000,40 1200,80 L1200,120 L0,120 Z"
            style={{
              fill: "#f5f5f5",
            }}
          />
        </svg>
      </header>

      {/* Main Content con Layout Sofisticado */}
      <main
        className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8"
        style={{
          paddingTop: "clamp(32px, 6vh, 80px)",
          paddingBottom: "clamp(32px, 6vh, 80px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Elementos Decorativos de Fondo - Ocultos en mobile */}
        <div
          className="hidden lg:block"
          style={{
            position: "absolute",
            top: "10%",
            left: "5%",
            width: "120px",
            height: "120px",
            border: "2px solid #027EB1",
            borderRadius: "24px",
            opacity: 0.1,
            transform: "rotate(15deg)",
          }}
        />
        <div
          className="hidden lg:block"
          style={{
            position: "absolute",
            bottom: "15%",
            right: "8%",
            width: "160px",
            height: "160px",
            border: "2px solid #D61216",
            borderRadius: "50%",
            opacity: 0.08,
          }}
        />
        <div
          className="hidden lg:block"
          style={{
            position: "absolute",
            top: "25%",
            right: "15%",
            width: "80px",
            height: "80px",
            background: "linear-gradient(135deg, #027EB1 0%, #003E7B 100%)",
            borderRadius: "16px",
            opacity: 0.05,
            transform: "rotate(-20deg)",
          }}
        />

        <div
          className="w-full"
          style={{ maxWidth: "1200px", position: "relative", zIndex: 1 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
            {/* Columna Izquierda - Visual/Ilustración */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                padding: "0 16px",
              }}
            >
              {/* Container de Ilustración */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "min(400px, 90vw)",
                }}
              >
                {/* Círculo Principal de Fondo */}
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, rgba(2, 126, 177, 0.1) 0%, rgba(0, 62, 123, 0.05) 100%)",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Anillos Concéntricos */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "10%",
                      borderRadius: "50%",
                      border: "2px solid rgba(2, 126, 177, 0.2)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: "20%",
                      borderRadius: "50%",
                      border: "2px solid rgba(2, 126, 177, 0.15)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: "30%",
                      borderRadius: "50%",
                      border: "2px solid rgba(2, 126, 177, 0.1)",
                    }}
                  />

                  {/* Error Code Central - Elemento Principal */}
                  <div
                    style={{
                      position: "relative",
                      zIndex: 2,
                      textAlign: "center",
                      padding: "0 16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "clamp(72px, 15vw, 140px)",
                        fontWeight: "800",
                        background:
                          "linear-gradient(135deg, #027EB1 0%, #003E7B 70%, #D61216 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        lineHeight: "1",
                        letterSpacing: "clamp(-3px, -0.5vw, -2px)",
                        filter:
                          "drop-shadow(0 4px 20px rgba(2, 126, 177, 0.3))",
                      }}
                    >
                      {errorCode}
                    </div>

                    {/* Badge Decorativo */}
                    <div
                      style={{
                        marginTop: "clamp(12px, 3vw, 16px)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "clamp(6px, 2vw, 8px) clamp(14px, 4vw, 20px)",
                        backgroundColor: "white",
                        borderRadius: "24px",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                        border: "1px solid rgba(2, 126, 177, 0.2)",
                      }}
                    >
                      <AlertCircle
                        style={{
                          width: "clamp(16px, 4vw, 18px)",
                          height: "clamp(16px, 4vw, 18px)",
                          color: "#D61216",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "clamp(12px, 3vw, 14px)",
                          fontWeight: "600",
                          color: "#1a1a1a",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Error del sistema
                      </span>
                    </div>
                  </div>

                  {/* Elementos Flotantes - Más pequeños en mobile */}
                  <div
                    className="hidden sm:flex"
                    style={{
                      position: "absolute",
                      top: "15%",
                      right: "10%",
                      width: "clamp(45px, 10vw, 60px)",
                      height: "clamp(45px, 10vw, 60px)",
                      backgroundColor: "white",
                      borderRadius: "12px",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      animation: "float 3s ease-in-out infinite",
                    }}
                  >
                    <Shield
                      style={{
                        width: "clamp(22px, 5vw, 28px)",
                        height: "clamp(22px, 5vw, 28px)",
                        color: "#027EB1",
                      }}
                    />
                  </div>

                  <div
                    className="hidden sm:flex"
                    style={{
                      position: "absolute",
                      bottom: "20%",
                      left: "12%",
                      width: "clamp(40px, 9vw, 50px)",
                      height: "clamp(40px, 9vw, 50px)",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      animation: "float 3s ease-in-out infinite 0.5s",
                    }}
                  >
                    <div
                      style={{
                        width: "clamp(16px, 4vw, 20px)",
                        height: "clamp(16px, 4vw, 20px)",
                        borderRadius: "4px",
                        background:
                          "linear-gradient(135deg, #027EB1 0%, #003E7B 100%)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha - Contenido Textual */}
            <div>
              {/* Card de Contenido */}
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "16px",
                  padding: "clamp(24px, 5vw, 48px)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                  border: "1px solid rgba(0, 0, 0, 0.05)",
                }}
              >
                {/* Título */}
                <h1
                  style={{
                    fontSize: "clamp(24px, 5vw, 42px)",
                    fontWeight: "700",
                    color: "#1a1a1a",
                    marginBottom: "16px",
                    letterSpacing: "-0.5px",
                    lineHeight: "1.2",
                  }}
                >
                  {errorTitle}
                </h1>

                {/* Línea Decorativa */}
                <div
                  style={{
                    height: "3px",
                    width: "60px",
                    background:
                      "linear-gradient(90deg, #027EB1 0%, #003E7B 50%, #D61216 100%)",
                    marginBottom: "20px",
                    borderRadius: "3px",
                  }}
                />

                {/* Descripción */}
                <p
                  style={{
                    fontSize: "clamp(14px, 3.5vw, 17px)",
                    color: "#6b7280",
                    lineHeight: "1.6",
                    marginBottom: "clamp(28px, 6vw, 40px)",
                  }}
                >
                  {errorMessage}
                </p>

                {/* Botones de Acción */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate("/")}
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      padding: "clamp(14px, 3vw, 16px) clamp(24px, 5vw, 32px)",
                      fontSize: "clamp(15px, 3.5vw, 16px)",
                      fontWeight: "600",
                      color: "white",
                      background:
                        "linear-gradient(135deg, #027EB1 0%, #003E7B 100%)",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      outline: "none",
                      boxShadow: "0 4px 16px rgba(2, 126, 177, 0.3)",
                      minHeight: "48px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 6px 20px rgba(2, 126, 177, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 16px rgba(2, 126, 177, 0.3)";
                    }}
                  >
                    <Home
                      style={{ width: "20px", height: "20px", flexShrink: 0 }}
                    />
                    <span>Ir al inicio</span>
                  </button>

                  <button
                    onClick={() => navigate(-1)}
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      padding: "clamp(14px, 3vw, 16px) clamp(24px, 5vw, 32px)",
                      fontSize: "clamp(15px, 3.5vw, 16px)",
                      fontWeight: "600",
                      color: "#003E7B",
                      backgroundColor: "white",
                      border: "2px solid #D1D5DB",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      outline: "none",
                      minHeight: "48px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#F9FAFB";
                      e.currentTarget.style.borderColor = "#027EB1";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                      e.currentTarget.style.borderColor = "#D1D5DB";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <ArrowLeft
                      style={{ width: "20px", height: "20px", flexShrink: 0 }}
                    />
                    <span>Volver atrás</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Estilos CSS (incluye fuente Arimo + animaciones) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Arimo:wght@400;500;600;700&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
