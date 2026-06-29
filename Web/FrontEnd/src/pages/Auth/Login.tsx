import { Link } from "react-router";
import { AuthLayout } from "../../components/AuthLayout";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const {
    formData,
    setFormData,
    errors,
    generalError,
    isSubmitting,
    handleSubmit,
    handleSubmitPrevented
  } = useAuth();

  return (
    <AuthLayout title="Login">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "24px" }}>
          <Input
            label="Usuario"
            placeholder="Ingrese su usuario"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={errors.email}
            hasError={!!generalError}
            autoComplete="email"
          />
        </div>

        <div style={{ marginBottom: generalError ? "8px" : "16px" }}>
          <Input
            label="Contraseña"
            type="password"
            placeholder="Ingrese su contraseña"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            error={errors.password}
            hasError={!!generalError}
            withPasswordToggle
            autoComplete="current-password"
          />
        </div>

        {generalError && (
          <div
            className="text-center"
            style={{ color: "#D61216", fontSize: "13px", marginBottom: "12px" }}
          >
            {generalError}
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          <Button type="button" variant="primary" fullWidth onClick={handleSubmitPrevented} disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
        </div>

        <div
          className="text-center"
          style={{
            paddingTop: "6px",
            paddingBottom: "6px",
          }}
        >
          <Link
              to="/forgot-password"
              className=""
              style={{
                color: "#027EB1",
                fontSize: "15px",
                fontWeight: "600",
                textDecoration: "none",
                lineHeight: "1.5",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#005b8f")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#027EB1")}
            >
              ¿Olvidaste tu Contraseña?
          </Link>
        </div>

        <div
          className="text-center"
          style={{
            borderTop: "1px solid #e8e8e8",
            paddingTop: "24px",
          }}
        >
          <p
            style={{
              color: "#666666",
              fontSize: "14px",
              marginBottom: "12px",
              lineHeight: "1.5",
            }}
          >
            ¿No tienes cuenta?
          </p>
          <Link
            to="/register"
            style={{
              color: "#027EB1",
              fontSize: "15px",
              fontWeight: "600",
              textDecoration: "none",
              lineHeight: "1.5",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#005b8f")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#027EB1")}
          >
            Registrarse
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
