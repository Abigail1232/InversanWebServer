import { useState } from "react";
import { useNavigate } from "react-router";
import { login } from "../api/auth/login";
import { syncCarts } from "../api/cart/cart";
import { getUserToken } from "../api/user/user";
import { getPrivilegesUser } from "../api/auth/privileges";
import { usePreventDuplicate } from "./usePreventDuplicateRequest";

export function useAuth() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [generalError, setGeneralError] = useState("");

  const performLogin = async () => {
    const { success, message } = await login(formData.email, formData.password);
    if (success) {
      // Al loguearnos exitosamente, disparamos la migración de Tokens Locales a la DB
      await syncCarts();

      try {
        const [user, privileges] = await Promise.all([
          getUserToken(),
          getPrivilegesUser(),
        ]);
        const roleName = (user?.rol?.nombre || "").toLowerCase();
        const hasAdminRoleByName = roleName.includes("admin");
        const hasAdminPrivileges = privileges.some((priv) =>
          [
            "ALL_ACCESS",
            "ADM_USUARIOS",
            "ADM_SUCURSALES",
            "ADM_ROLES",
            "ADM_PERMISOS",
            "ADM_PRODUCTOS",
            "ADM_BODEGAS"
          ].includes(priv.nombre)
        );

        const isAdmin =
          hasAdminRoleByName || hasAdminPrivileges;
        if (isAdmin) {
          localStorage.setItem("adminSidebarOpen", "true");
        }
        navigate(isAdmin ? "/admin" : "/");
      } catch {
        navigate("/");
      }
    } else {
      setGeneralError(message || "Correo o contraseña incorrectos");
    }
  };

  const { execute: handleSubmitPrevented, isLoading: isSubmitting } =
    usePreventDuplicate(performLogin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setGeneralError("");

    const newErrors = {
      email: "",
      password: "",
    };

    if (!formData.email) {
      newErrors.email = "El correo electrónico es requerido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    }

    setErrors(newErrors);

    if (newErrors.email || newErrors.password) {
      return;
    }

    await handleSubmitPrevented();
  };

  return {
    formData,
    setFormData,
    errors,
    generalError,
    isSubmitting,
    handleSubmit,
    handleSubmitPrevented
  };
}
