import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { AuthLayout } from "../../components/AuthLayout";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { X } from "lucide-react";
import { register, type RegisterResult } from "../../api/auth/registro";
import { usePreventDuplicate } from "../../hooks/usePreventDuplicateRequest";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    general: "",
  });

  const passwordValidation = {
    minLength: formData.password.length >= 8,
    hasLowerCase: /[a-z]/.test(formData.password),
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSymbol: /[^A-Za-z0-9]/.test(formData.password),
  };

  const performRegister = async () => {
    const nameParts = formData.fullName.trim().split(/\s+/).filter(Boolean);
    const primer_nombre = nameParts[0] ?? "";
    const segundo_nombre = nameParts.length > 2 ? nameParts[1] : "";
    const primer_apellido = nameParts.length > 2 ? nameParts[2] : nameParts[1] ?? "";
    const segundo_apellido = nameParts.length > 3 ? nameParts.slice(3).join(" ") : "";

    const result: RegisterResult = await register(
      formData.username.trim(),
      primer_nombre,
      primer_apellido,
      formData.email.trim().toLowerCase(),
      formData.password,
      segundo_nombre,
      segundo_apellido
    );

    if (result.success) {
      navigate("/login");
      return;
    }

    if (result.errorField === "username") {
      setErrors((prev) => ({
        ...prev,
        username: result.errorMessage || "El usuario ya existe.",
      }));
    } else if (result.errorField === "email") {
      setErrors((prev) => ({
        ...prev,
        email: result.errorMessage || "El correo ya está registrado.",
      }));
    } else if (result.errorField === "fullName") {
      setErrors((prev) => ({
        ...prev,
        fullName: result.errorMessage || "Debe ingresar al menos un nombre y un apellido.",
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        general: result.errorMessage || "Error al crear la cuenta. Intente de nuevo.",
      }));
    }
  };

  const { execute: handleSubmitPrevented, isLoading: isSubmitting } = usePreventDuplicate(performRegister);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors = {
      username: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      general: "",
    };

    if (!formData.username) {
      newErrors.username = "El usuario es requerido";
    } else if (formData.username.length < 3) {
      newErrors.username = "El usuario debe tener al menos 3 caracteres";
    }

    if (!formData.fullName) {
      newErrors.fullName = "El nombre completo es requerido";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "El nombre debe tener al menos 2 caracteres";
    } else if (formData.fullName.trim().split(/\s+/).filter(Boolean).length < 2) {
      newErrors.fullName = "Debe ingresar al menos un nombre y un apellido";
    }

    if (!formData.email) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Ingrese un correo electrónico válido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (!Object.values(passwordValidation).every((v) => v)) {
      newErrors.password = "La contraseña no cumple con todos los requisitos";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Debes confirmar la contraseña";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);

    if (!Object.values(newErrors).some((error) => error !== "")) {
      await handleSubmitPrevented();
    }
  };

  return (
    <AuthLayout title="Registro">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <Input
            label="Usuario"
            type="text"
            placeholder="Ingrese su usuario"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            error={errors.username}
            autoComplete="username"
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <Input
            label="Nombre Completo"
            type="text"
            placeholder="Ingrese su nombre completo"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            error={errors.fullName}
            autoComplete="name"
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="Ingrese su correo electrónico"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={errors.email}
            autoComplete="email"
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <Input
            label="Contraseña"
            type="password"
            placeholder="Ingrese su contraseña"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            error={errors.password}
            autoComplete="new-password"
            withPasswordToggle
          />
        </div>

        {formData.password && (
          <div style={{ marginBottom: "16px", marginTop: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <X
                size={14}
                style={{
                  color: passwordValidation.minLength ? "#10B981" : "#D61216",
                }}
              />
              <span style={{ fontSize: "13px", color: "#666666" }}>
                Mínimo 8 caracteres
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <X
                size={14}
                style={{
                  color: passwordValidation.hasLowerCase
                    ? "#10B981"
                    : "#D61216",
                }}
              />
              <span style={{ fontSize: "13px", color: "#666666" }}>
                Al menos una minúscula
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <X
                size={14}
                style={{
                  color: passwordValidation.hasUpperCase
                    ? "#10B981"
                    : "#D61216",
                }}
              />
              <span style={{ fontSize: "13px", color: "#666666" }}>
                Al menos una mayúscula
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <X
                size={14}
                style={{
                  color: passwordValidation.hasNumber ? "#10B981" : "#D61216",
                }}
              />
              <span style={{ fontSize: "13px", color: "#666666" }}>
                Al menos un número
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <X
                size={14}
                style={{
                  color: passwordValidation.hasSymbol ? "#10B981" : "#D61216",
                }}
              />
              <span style={{ fontSize: "13px", color: "#666666" }}>
                Al menos un símbolo
              </span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          <Input
            label="Confirmar Contraseña"
            type="password"
            placeholder="Confirme su contraseña"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            error={errors.confirmPassword}
            autoComplete="new-password"
            withPasswordToggle
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Creando cuenta..." : "Crear Cuenta"}
          </Button>
        </div>

        {errors.general && (
          <div style={{ marginBottom: "16px", color: "#D61216", fontSize: "14px" }}>
            {errors.general}
          </div>
        )}

        <div className="text-center">
          <p style={{ color: "#666666", fontSize: "14px", lineHeight: "1.5" }}>
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              style={{
                color: "#027EB1",
                fontWeight: "600",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#005b8f")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#027EB1")}
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
