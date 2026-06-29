import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { changePassword as resetPasswordByCode } from "../../api/auth/code";
import { changeMyPassword } from "../../api/auth/changeMyPassword";
import { usePreventDuplicate } from "../../hooks/usePreventDuplicateRequest";

const REQUIREMENTS = [
  { key: "min", label: "Mínimo 8 caracteres", test: (s: string) => s.length >= 8 },
  { key: "upper", label: "Al menos una mayúscula", test: (s: string) => /[A-Z]/.test(s) },
  { key: "lower", label: "Al menos una minúscula", test: (s: string) => /[a-z]/.test(s) },
  { key: "number", label: "Al menos un número", test: (s: string) => /\d/.test(s) },
  { key: "symbol", label: "Al menos un símbolo", test: (s: string) => /[^A-Za-z0-9]/.test(s) },
] as const;

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as { fromForgotPassword?: boolean; email?: string; code?: string }) ?? {};
  const fromForgotPassword = state.fromForgotPassword ?? false;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const newPasswordValid = REQUIREMENTS.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const canSubmit = fromForgotPassword
    ? newPasswordValid && passwordsMatch
    : !!currentPassword && newPasswordValid && passwordsMatch;

  const performSubmit = async () => {
    if (fromForgotPassword) {
      if (!state.email || !state.code) {
        setError("No se encontraron los datos de recuperación.");
        return;
      }
      const success = await resetPasswordByCode(state.code, state.email, newPassword);
      if (!success) {
        setError("No se pudo actualizar la contraseña. Revisa el código y requisitos.");
        return;
      }
      navigate("/login");
      return;
    }

    const success = await changeMyPassword(currentPassword, newPassword);
    if (!success) {
      setError("No se pudo actualizar la contraseña. Verifica la contraseña actual y los requisitos.");
      return;
    }
    navigate("/profile");
  };

  const { execute: handleSubmit, isLoading: isSubmitting } = usePreventDuplicate(performSubmit);

  const handleSubmitWrapper = () => {
    if (!canSubmit) return;
    setError("");
    handleSubmit();
  };

  return (
    <section className="bg-[#f3f4f6] min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="w-full max-w-[700px] mx-auto">
          <h2 className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10 mb-4">Cambiar contraseña</h2>
          <p className="text-sm md:text-base text-[#4a4a4a] mb-6">
            {fromForgotPassword
              ? "Ingresa tu nueva contraseña para continuar."
              : "Cambia la contraseña actual de tu cuenta por una nueva."}
          </p>

          <div className="bg-white border border-[#E5E7EB] rounded-[10px] shadow-md overflow-hidden">
          <div className="px-4 sm:px-6 py-5 space-y-4">
            {!fromForgotPassword && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Contraseña actual
                </label>
                <Input.Password
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ingrese la contraseña actual"
                  className="mt-2 h-12 rounded-xl"
                  status={error ? "error" : ""}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">
                Nueva contraseña
              </label>
              <Input.Password
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingrese la nueva contraseña"
                className="mt-2 h-12 rounded-xl"
                status={error ? "error" : ""}
              />
              <ul className="mt-3 mb-4 space-y-1 pl-1">
                {REQUIREMENTS.map(({ key, label, test }) => (
                  <li
                    key={key}
                    className="flex items-center gap-2 text-xs md:text-sm text-[#6a7282]"
                  >
                    {test(newPassword) ? (
                      <CheckCircleOutlined className="text-[#10b981]" />
                    ) : (
                      <CloseCircleOutlined className="text-[#9ca3af]" />
                    )}
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Confirmar contraseña
              </label>
              <Input.Password
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme su contraseña"
                className="mt-2 h-12 rounded-xl"
                status={error ? "error" : ""}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm font-medium text-center mt-3 mb-3">
                {error}
              </p>
            )}
          </div>

          <div className="px-4 sm:px-5 py-4 sm:py-5 border-t border-[#D1D5DB] grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSubmitWrapper}
              disabled={!canSubmit || isSubmitting}
              className="h-12 sm:h-[55px] rounded-[10px] bg-[#027EB1] text-white text-base sm:text-[20px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="h-12 sm:h-[55px] rounded-[10px] border-2 border-[#027EB1] text-[#027EB1] text-base sm:text-[20px] font-bold"
            >
              Cancelar
            </button>
          </div>

          <div className="px-4 sm:px-6 pb-5 text-center">
          {!fromForgotPassword && (
            <button
              type="button"
              onClick={() =>
                navigate("/forgot-password", {
                  state: { fromProfile: true },
                })
              }
              className="text-[#003e7b] text-base md:text-md font-normal hover:underline"
            >
              ¿Olvidaste tu contraseña actual?
            </button>
          )}
        </div>
          </div>
        </div>
      </div>
    </section>
  );
}
