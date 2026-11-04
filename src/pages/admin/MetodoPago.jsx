import { useEffect, useRef, useState } from "react";
import axios from "axios";
import usePermisos from "../../context/PermisosContext";
import ResultadoPagoModal from "../../components/ResultadoPagoModal";
import TarjetaPago from "../../components/miplan/TarjetaPago";
import { Encabezado, AvisoCerrable, pantallaEstado } from "../../components/miplan/ui";
import useMiPlan from "../../hooks/useMiPlan";
import "../../css/miplan-botones.css";

const API = import.meta.env.VITE_API_URL || "/api";
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

export default function MetodoPago() {
  const { refrescarSuscripcion } = usePermisos();
  const { data, loading, error, cargar } = useMiPlan();

  const [resultado, setResultado] = useState(null);
  const [aviso, setAviso]         = useState("");
  const [ocupado, setOcupado]     = useState(false);
  const yaConfirmo = useRef(false);

  // Al volver de Stripe después de guardar una tarjeta
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("tarjeta");
    const sid = p.get("session_id");

    if (t === "ok" && sid && !yaConfirmo.current) {
      yaConfirmo.current = true;
      axios.post(`${API}/suscripcion/metodo-pago/confirmar`, { session_id: sid }, auth())
        .then((r) => setResultado({ ok: true, kind: "info", titulo: "Tarjeta guardada", message: r.data.message }))
        .catch((e) => setResultado({ ok: false, kind: "error", message: e.response?.data?.message || "No se pudo guardar la tarjeta." }))
        .finally(() => {
          window.history.replaceState({}, "", window.location.pathname);
          cargar();
        });
    } else if (t === "cancelada") {
      setAviso("No se guardó ninguna tarjeta.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [cargar]);

  const abrirRegistroTarjeta = async (activarAuto) => {
    setOcupado(true);
    try {
      const r = await axios.post(`${API}/suscripcion/metodo-pago/checkout`, { activar_auto: activarAuto }, auth());
      window.location.href = r.data.url;
    } catch (e) {
      setOcupado(false);
      setResultado({ ok: false, kind: "error", message: e.response?.data?.message || "No se pudo abrir el registro de tarjeta." });
    }
  };

  const cambiarAuto = async (activo) => {
    if (activo && !data.facturacion.tarjeta) {
      abrirRegistroTarjeta(true); // guarda la tarjeta y activa la renovación al volver
      return;
    }
    setOcupado(true);
    try {
      const r = await axios.post(`${API}/suscripcion/renovacion-auto`, { activo }, auth());
      setAviso(r.data.message);
      await refrescarSuscripcion().catch(() => {});
      await cargar();
    } catch (e) {
      setResultado({ ok: false, kind: "error", message: e.response?.data?.message || "No se pudo cambiar la renovación automática." });
    } finally {
      setOcupado(false);
    }
  };

  const cerrarResultado = () => {
    setResultado(null);
    cargar();
  };

  const estadoPantalla = pantallaEstado({ loading, error, data });
  if (estadoPantalla) return estadoPantalla;

  const { facturacion: f, puede_gestionar, plan } = data;

  return (
    <div className="container py-4" style={{ maxWidth: 760 }}>
      <Encabezado titulo="Método de pago" />
      <AvisoCerrable texto={aviso} onCerrar={() => setAviso("")} />

      <TarjetaPago
        facturacion={f}
        puedeGestionar={puede_gestionar}
        hayPlanPago={plan?.estado === "activa"}
        ocupado={ocupado}
        onToggle={cambiarAuto}
        onCambiarTarjeta={() => abrirRegistroTarjeta(false)}
      />

      <ResultadoPagoModal resultado={resultado} onClose={cerrarResultado} />
    </div>
  );
}