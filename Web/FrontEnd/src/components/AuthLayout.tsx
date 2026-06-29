import type { ReactNode } from "react";
import { Link } from "react-router";
import inversanLogo from "../assets/images/logo.png";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout = ({ children, title }: AuthLayoutProps) => {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f5f5f5" }}
    >
      {/* Header with Waves */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #027EB1 0%, #003E7B 100%)",
          height: "180px",
          position: "relative",
        }}
      >
        {/* Wave SVG Background */}
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
      </div>

      {/* Main Content */}
      <div
        className="flex-1 flex items-center justify-center px-6"
        style={{ marginTop: "-100px", paddingBottom: "80px" }}
      >
        <div
          className="w-full flex-col items-center"
          style={{
            maxWidth: "500px", // Aumentado para que no se vea como celular en PC
            width: "100%",
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "48px 64px", // Mayor padding en los lados
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.1)",
            position: "relative",
            zIndex: 10,
            display: "flex",
          }}
        >
          <div style={{ width: "100%", maxWidth: "480px" }}>
            {/* Logo */}
            <div
              className="flex justify-center"
              style={{ marginBottom: "24px" }}
            >
              <Link to="/" style={{ display: "inline-block" }}>
                <img
                  src={inversanLogo}
                  alt="INVERSAN Logo"
                  style={{
                    width: "180px",
                    height: "auto",
                    display: "block",
                    cursor: "pointer",
                  }}
                />
              </Link>
            </div>

            {/* Gradient Line */}
            <div
              style={{
                height: "3px",
                background:
                  "linear-gradient(90deg, #027EB1 0%, #003E7B 50%, #D61216 100%)",
                borderRadius: "2px",
                marginBottom: "32px",
              }}
            />

            {/* Title */}
            <h2
              className="text-center"
              style={{
                fontSize: "28px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "32px",
                letterSpacing: "-0.3px",
              }}
            >
              {title}
            </h2>

            {/* Form Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
