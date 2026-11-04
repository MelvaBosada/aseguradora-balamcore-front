// URL del backend Laravel. Se toma de VITE_API_URL:
//   desarrollo → .env.development
//   producción → .env.production
// VITE_API_URL termina en /api, así que aquí se separa la raíz del backend.
const raw = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Raíz del backend, SIN /api (ej. http://localhost:8000)
export const API_BASE_URL = raw.replace(/\/api\/?$/, "");

export function logoUrl(path) {
  if (!path) return null;
  return `${API_BASE_URL}/storage/${path}`;
}