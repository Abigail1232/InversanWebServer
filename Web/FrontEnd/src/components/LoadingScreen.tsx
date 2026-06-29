import { Spin } from "antd";
import Logo from "/logo.svg";

interface LoadingScreenProps {
  tip?: string;
  description?: string;
  size?: "small" | "default" | "large";
}

const LoadingScreen = ({ 
  tip = "Cargando...", 
  description = "Líderes en distribución de llantas para todo tipo de vehículos.",
  size = "large" 
}: LoadingScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <div className="flex flex-col items-center justify-center w-full max-w-xs">
        <img 
          src={Logo} 
          alt="Logo" 
          className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain" 
        />
      </div>
      <Spin
        size={size}
        className="!text-[#027EB1]"
        tip={tip}
      />
      <p className="text-center text-sm text-[#027EB1] max-w-xs">
        {description}
      </p>
    </div>
  );
};

export default LoadingScreen;
