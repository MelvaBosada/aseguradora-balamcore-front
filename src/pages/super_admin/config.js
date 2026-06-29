// URL base del backend Laravel. Cámbiala aquí una sola vez si tu backend
// corre en otro puerto/dominio (producción, staging, etc.)
export const API_BASE_URL = "http://localhost:8000";

export function logoUrl(path) {
  if (!path) return null;
  return `${API_BASE_URL}/storage/${path}`;
}
