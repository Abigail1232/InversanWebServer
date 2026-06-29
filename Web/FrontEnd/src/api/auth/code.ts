import axios from "../axios";

export interface RecoveryRequestResult {
  ok: boolean;
  code?: string;
  notFound?: boolean;
}

export async function recoveryRequest(email: string): Promise<RecoveryRequestResult> {
  try {
    const response = await axios.post("api/auth/solicitar-recuperacion", { correo: email });

    if (response.status === 200 && response.data?.ok) {
      return {
        ok: true,
        code: response.data?.code,
      };
    }

    return { ok: false };
  } catch (error: any) {
    const status = error?.response?.status;

    if (status === 404) {
      return { ok: false, notFound: true };
    }

    return { ok: false };
  }
}

export async function changePassword(code: string, email:string, newPassword: string): Promise<boolean>{
    try {
        const response = await axios.post("api/auth/verificar-codigo",{correo: email, nuevaClave: newPassword, codigo: code})
        return response.status === 200 && !!response.data?.ok;
    } catch (error) {
        return false;
    }
}

export async function verifyCode(email: string, code: string): Promise<{ ok: boolean; msg?: string }> {
  try {
    const response = await axios.post("api/auth/verificar-codigo-solo", { correo: email, codigo: code });
    return response.status === 200 && response.data?.ok ? { ok: true } : { ok: false, msg: response.data?.msg };
  } catch (error: any) {
    const msg = error?.response?.data?.msg;
    return { ok: false, msg: msg || "Error al verificar el código" };
  }
}
