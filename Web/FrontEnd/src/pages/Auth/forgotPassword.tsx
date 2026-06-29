import { Input } from "antd";
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/AuthLayout";
import { changePassword, recoveryRequest, verifyCode } from "../../api/auth/code";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { usePreventDuplicate } from "../../hooks/usePreventDuplicateRequest";

const CODE_LENGTH = 6;
const REQUIREMENTS = [
  { key: "min", label: "Mínimo 8 caracteres", test: (s: string) => s.length >= 8 },
  { key: "upper", label: "Al menos una mayúscula", test: (s: string) => /[A-Z]/.test(s) },
  { key: "lower", label: "Al menos una minúscula", test: (s: string) => /[a-z]/.test(s) },
  { key: "number", label: "Al menos un número", test: (s: string) => /\d/.test(s) },
  { key: "symbol", label: "Al menos un símbolo", test: (s: string) => /[^A-Za-z0-9]/.test(s) },
] as const;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromProfile = Boolean(
    (location.state as { fromProfile?: boolean } | null)?.fromProfile
  );

  const [step, setStep] = useState<"email" | "code" | "reset">("email");

  const [email, setEmail] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>(
    Array(CODE_LENGTH).fill("")
  );

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = codeDigits.join("");
  const newPasswordValid = REQUIREMENTS.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // ================= EMAIL =================
  const performSendCode = async () => {
    const result = await recoveryRequest(email.trim());

    if (!result.ok) {
      if (result.notFound) {
        setError("El correo no existe en nuestros registros.");
      } else {
        setError("No se pudo enviar el código. Intenta de nuevo más tarde.");
      }
      return;
    }

    setCodeDigits(Array(CODE_LENGTH).fill(""));
    setStep("code");

    setTimeout(() => codeRefs.current[0]?.focus(), 100);
  };

  const { execute: handleSendCode, isLoading: isSendingCode } = usePreventDuplicate(performSendCode);

  // ================= OTP =================
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value
        .replace(/\D/g, "")
        .slice(0, CODE_LENGTH)
        .split("");

      const next = [...codeDigits];

      pasted.forEach((char, i) => {
        if (index + i < CODE_LENGTH) next[index + i] = char;
      });

      setCodeDigits(next);

      const nextFocus = Math.min(
        index + pasted.length,
        CODE_LENGTH - 1
      );

      codeRefs.current[nextFocus]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...codeDigits];
    next[index] = digit;
    setCodeDigits(next);

    if (digit && index < CODE_LENGTH - 1)
      codeRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const performVerifyCode = async () => {
    const result = await verifyCode(email.trim(), code);
    if (!result.ok) {
      setError(result.msg ?? "Código incorrecto.");
      return;
    }
    setStep("reset");
  };

  const { execute: handleVerifyCode, isLoading: isVerifyingCode } = usePreventDuplicate(performVerifyCode);

  // ================= RESET PASSWORD =================
  const performResetPassword = async () => {
    const response = await changePassword(codeDigits.join(""),email,newPassword);

    if(!response) {
      setError("No se pudo actualizar la contraseña. Revisa el código y requisitos.");
      return;
    }
    navigate("/login");
  };

  const { execute: handleResetPassword, isLoading: isResettingPassword } = usePreventDuplicate(performResetPassword);

  const handleResetPasswordWrapper = () => {
    if (!newPassword || !confirmPassword) {
      setError("Debes completar ambos campos.");
      return;
    }

    if (!newPasswordValid) {
      setError("La contraseña no cumple los requisitos mínimos.");
      return;
    }

    if (!passwordsMatch) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setError("");
    handleResetPassword();
  };

  // ================= UI =================
  return (
    <AuthLayout title="Restablecer Contraseña">
      <p className="text-sm md:text-base text-gray-600 mb-6 text-center">
        {step === "email" &&
          "Ingresa tu correo y te enviaremos un código para recuperar tu cuenta."}
        {step === "code" &&
          "Revisa tu correo e ingresa el código de verificación."}
        {step === "reset" &&
          "Ingresa tu nueva contraseña para continuar."}
      </p>

          {/* EMAIL STEP */}
          {step === "email" && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onPressEnter={handleSendCode}
                placeholder="Ingrese su correo..."
                className="mt-2 h-12 rounded-xl"
              />
            </div>
          )}

              {/* CODE STEP */}
              {step === "code" && (
              <>
                  <div className="text-center">
                    <label className="text-sm font-medium text-gray-700">
                      Código de verificación
                    </label>

                    <div className="mt-4 flex justify-center gap-3">
                      {codeDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            codeRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handleCodeChange(index, e.target.value)
                          }
                          onKeyDown={(e) =>
                            handleCodeKeyDown(index, e)
                          }
                          className="
                            w-12 h-14
                            text-center
                            text-xl font-bold
                            rounded-xl
                            border
                            border-gray-300
                            bg-gray-50
                            transition-all
                            duration-200
                            focus:bg-white
                            focus:border-[#027EB1]
                            focus:ring-2
                            focus:ring-[#027EB1]/30
                          "
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="text-[#027EB1] mt-4 text-sm hover:underline"
                  >
                    Reenviar código a {email}
                  </button>
                </>
              )}

              {/* RESET STEP */}
              {step === "reset" && (
      <>
        <div>
          <label className="text-sm font-medium text-gray-700">
            Nueva contraseña
          </label>
          <Input.Password
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Ingrese nueva contraseña"
            className="mt-2 h-12 rounded-xl"
            status={error ? "error" : ""}
          />
        </div>

        {/* BLOQUE DE REQUISITOS SEPARADO */}
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

        <div className="mt-1">
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
      </>
    )}

          {error && (
            <p className="text-red-500 text-sm font-medium text-center mt-3 mb-3">
              {error}
            </p>
          )}

        {/* FOOTER BUTTONS */}
        <div className="px-6 py-5 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">

          {step === "email" && (
            <>
              <button
                onClick={handleSendCode}
                disabled={!email.trim() || isSendingCode}
                className="h-12 rounded-xl bg-[#027EB1] text-white text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingCode ? "Enviando código..." : "Enviar código"}
              </button>

              <button
                onClick={() =>
                  navigate(fromProfile ? "/profile/change-password" : "/login")
                }
                className="h-12 rounded-xl border-2 border-[#027EB1] text-[#027EB1] text-lg font-bold"
              >
                Cancelar
              </button>
            </>
          )}

          {step === "code" && (
            <>
              <button
                onClick={handleVerifyCode}
                disabled={code.length !== CODE_LENGTH || isVerifyingCode}
                className="h-12 rounded-xl bg-[#027EB1] text-white text-lg font-bold disabled:opacity-50"
              >
                {isVerifyingCode ? "Verificando..." : "Verificar código"}
              </button>

              <button
                onClick={() =>
                  navigate(fromProfile ? "/profile/change-password" : "/login")
                }
                className="h-12 rounded-xl border-2 border-[#027EB1] text-[#027EB1] text-lg font-bold"
              >
                Cancelar
              </button>
            </>
          )}

          {step === "reset" && (
            <>
              <button
                onClick={handleResetPasswordWrapper}
                disabled={!newPasswordValid || !passwordsMatch || isResettingPassword}
                className="h-12 rounded-xl bg-[#027EB1] text-white text-md font-bold disabled:opacity-50"
              >
                {isResettingPassword ? "Actualizando..." : "Actualizar"}
              </button>

              <button
                onClick={() =>
                  navigate(fromProfile ? "/profile/change-password" : "/login")
                }
                className="h-12 rounded-xl border-2 border-[#027EB1] text-[#027EB1] text-lg font-bold"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
    </AuthLayout>
  );
}
