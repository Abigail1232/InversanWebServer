import { Input } from "antd";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { recoveryRequest } from "../../api/auth/code";
import { usePreventDuplicate } from "../../hooks/usePreventDuplicateRequest";

const CODE_LENGTH = 6;
const inputClassName = "mt-1 h-11 rounded-[10px] border-[#A5A5A5] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)]";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [serverCode, setServerCode] = useState("");
  const [error, setError] = useState("");
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = codeDigits.join("");

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

    setServerCode(result.code?.trim() ?? "");
    setStep("code");
    setCodeDigits(Array(CODE_LENGTH).fill(""));
    setTimeout(() => codeRefs.current[0]?.focus(), 100);
  };

  const { execute: handleSendCode, isLoading: isSendingCode } = usePreventDuplicate(performSendCode);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
      const next = [...codeDigits];
      pasted.forEach((char, i) => {
        if (index + i < CODE_LENGTH) next[index + i] = char;
      });
      setCodeDigits(next);
      const nextFocus = Math.min(index + pasted.length, CODE_LENGTH - 1);
      codeRefs.current[nextFocus]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...codeDigits];
    next[index] = digit;
    setCodeDigits(next);
    if (digit && index < CODE_LENGTH - 1) codeRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = () => {
    if (code.length !== CODE_LENGTH) return;
    if (code !== serverCode) {
      setError("El código ingresado no coincide.");
      return;
    }
    setError("");
    navigate("/profile/change-password", { state: { fromForgotPassword: true, email, code } });
  };

  return (
    <section className="bg-[#f3f4f6] min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="w-full max-w-[700px] mx-auto">
          <h2 className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10 mb-4">Restablecer contraseña</h2>
          <p className="text-sm md:text-base text-[#4a4a4a] mb-6">
            {step === "email"
              ? "Ingresa tu correo y te enviaremos un código para recuperar tu cuenta."
              : "Revisa tu correo e ingresa el código de verificación para continuar."}
          </p>

          <div className="bg-white border border-[#E5E7EB] rounded-[10px] shadow-md overflow-hidden">
            <div className="px-4 sm:px-6 py-5 space-y-4">
              {step === "email" ? (
                <>
                  <div>
                    <label className="text-sm sm:text-base text-black">Correo electrónico</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ingrese su correo aquí..."
                      className={inputClassName}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm sm:text-base text-black">Código de verificación</label>
                    <div className="mt-3 flex justify-center gap-2 sm:gap-3">
                      {codeDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { codeRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleCodeChange(index, e.target.value)}
                          onKeyDown={(e) => handleCodeKeyDown(index, e)}
                          className="w-11 h-11 sm:w-12 sm:h-11 text-center text-base bg-white font-semibold rounded-[10px] border border-[#A5A5A5] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)] focus:border-[#027EB1] focus:outline-none"
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="text-[#003e7b] text-base md:text-md font-normal hover:underline"
                  >
                    Reenviar código a {email || "mi correo"}
                  </button>
                </>
              )}

              {error && (
                <p className="text-red-500 text-sm font-medium">
                  {error}
                </p>
              )}
            </div>

            <div className="px-4 sm:px-5 py-4 sm:py-5 border-t border-[#D1D5DB] grid grid-cols-1 sm:grid-cols-2 gap-2">
              {step === "email" ? (
                <>
                  <button
                    type="button"
                    onClick={handleSendCode}
                  disabled={!email?.trim() || isSendingCode}
                  className="h-12 sm:h-[55px] rounded-[10px] bg-[#027EB1] text-white text-base sm:text-[20px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                  {isSendingCode ? "Enviando código..." : "Enviar código"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/profile/change-password")}
                    className="h-12 sm:h-[55px] rounded-[10px] border-2 border-[#027EB1] text-[#027EB1] text-base sm:text-[20px] font-bold"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={code.length !== CODE_LENGTH}
                    className="h-12 sm:h-[55px] rounded-[10px] bg-[#027EB1] text-white text-base sm:text-[20px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verificar y continuar
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/profile/change-password")}
                    className="h-12 sm:h-[55px] rounded-[10px] border-2 border-[#027EB1] text-[#027EB1] text-base sm:text-[20px] font-bold"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
