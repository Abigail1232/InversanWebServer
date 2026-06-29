/**
 * Cliente HTTP Axios centralizado para la aplicación.
 *
 * Configura la URL base de la API y añade automáticamente los tokens
 * necesarios a cada petición saliente.
 */
import axios from 'axios';
import { safeLocalStorage } from '../utils/storage';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = safeLocalStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;