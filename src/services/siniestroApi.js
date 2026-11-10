import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((cfg) => {
  cfg.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
  cfg.headers.Accept = "application/json";
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

/** Mensaje legible de un error de la API (validación 422, mensaje, o genérico). */
export const mensajeError = (error, defecto = "Ocurrió un error. Intenta de nuevo.") => {
  const errores = error?.response?.data?.errors;
  if (errores) return Object.values(errores).flat().join("\n");
  return error?.response?.data?.message || defecto;
};

export const dinero = (v) =>
  `$${Number(v || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtFecha = (v) => {
  if (!v) return "—";
  const f = new Date(v);
  return Number.isNaN(f.getTime()) ? String(v) : f.toLocaleDateString("es-MX");
};

/** Descarga un archivo protegido (necesita el token, por eso no es un simple <a href>). */
export const descargarArchivo = async (url, nombre) => {
  const res = await api.get(url, { responseType: "blob" });
  const href = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = href;
  a.download = nombre || "archivo";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(href);
};
