import axios from "axios";

const API = import.meta.env.VITE_API_URL || "/api";

async function bajar(ruta, nombre) {
  const res = await axios.get(`${API}/${ruta}`, {
    responseType: "blob",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const folio = (id) => String(id).padStart(6, "0");

export const descargarComprobante = (id) =>
  bajar(`suscripcion/comprobante/${id}`, `comprobante_BC-${folio(id)}.pdf`);

export const descargarFacturaEjemplo = (id) =>
  bajar(`suscripcion/factura-ejemplo/${id}`, `factura_ejemplo_EJ-${folio(id)}.pdf`);