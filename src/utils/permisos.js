// Permisos del usuario. El login (POST /login) devuelve "permisos" (lista de claves) y "usuario".
// AJUSTA las dos claves de localStorage si tu app las guarda con otro nombre.
const CLAVE_PERMISOS = "permisos";
const CLAVE_USUARIO = "usuario";

const leer = (clave, defecto) => {
  try {
    const raw = localStorage.getItem(clave);
    return raw ? JSON.parse(raw) : defecto;
  } catch {
    return defecto;
  }
};

export const obtenerUsuario = () => leer(CLAVE_USUARIO, {}) || {};

export const tienePermiso = (clave) => {
  if (obtenerUsuario().es_superadmin) return true;
  const lista = leer(CLAVE_PERMISOS, []);
  return Array.isArray(lista) && lista.includes(clave);
};

// Mismos niveles y permisos que EvaluacionService::puedeAutorizar en el backend.
// El backend decide siempre; esto solo evita mostrar botones que darían 403.
export const puedeAutorizarNivel = (nivel) => {
  switch (nivel) {
    case "supervisor":
      return tienePermiso("evaluaciones.autorizar") || tienePermiso("evaluaciones.autorizar_alto");
    case "gerente":
      return tienePermiso("evaluaciones.autorizar_alto");
    default:
      return false;
  }
};