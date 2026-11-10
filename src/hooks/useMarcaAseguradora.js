import { useEffect, useState } from "react";
import { api } from "../services/siniestroApi";

// Se pide una sola vez por sesión. Si cambia el token (otro usuario/aseguradora), se vuelve a pedir.
let cache = null;
let cacheToken = null;
let pendiente = null;

/** { nombre, razon_social, logo } de la aseguradora del usuario, o null mientras carga. */
export default function useMarcaAseguradora() {
  const token = localStorage.getItem("token");
  const [marca, setMarca] = useState(cacheToken === token ? cache : null);

  useEffect(() => {
    if (cacheToken === token && cache) {
      setMarca(cache);
      return undefined;
    }

    let activo = true;
    if (cacheToken !== token) {
      cache = null;
      pendiente = null;
      cacheToken = token;
    }

    pendiente =
      pendiente ||
      api
        .get("/aseguradora/marca")
        .then((r) => (cache = r.data))
        .catch(() => (cache = { nombre: null, razon_social: null, logo: null }));

    pendiente.then((m) => activo && setMarca(m));

    return () => {
      activo = false;
    };
  }, [token]);

  return marca;
}
