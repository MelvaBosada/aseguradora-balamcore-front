import { useEffect, useState } from "react";
import Modal, { PieAcciones } from "./siniestro/Modal";
import { api, mensajeError } from "../services/siniestroApi";

const NOMBRES_TIPO = {
  robo: "Robo", accidente: "Accidente", incendio: "Incendio", inundacion: "Inundación",
  responsabilidad_civil: "Resp. civil", fallecimiento: "Fallecimiento", invalidez: "Invalidez", otro: "Otro",
};

/**
 * Asigna a una póliza las coberturas contratadas. Sin esto, los dictámenes se calculan sin deducible
 * ni topes y requieren supervisor.
 * Uso:  <PolizaCoberturasModal open={...} poliza={{ id, nPoliza }} onClose={...} />
 */
export default function PolizaCoberturasModal({ open, poliza, onClose, onGuardado }) {
  const [lista, setLista] = useState([]);
  const [marcadas, setMarcadas] = useState([]);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!open || !poliza?.id) return;
    setError("");
    api
      .get(`/polizas/${poliza.id}/coberturas`)
      .then((r) => {
        setLista(r.data.coberturas);
        setMarcadas(r.data.coberturas.filter((c) => c.asignada).map((c) => c.id));
      })
      .catch((e) => setError(mensajeError(e)));
  }, [open, poliza?.id]);

  if (!open) return null;

  const alternar = (id) => setMarcadas((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  const guardar = async () => {
    setOcupado(true);
    setError("");
    try {
      await api.put(`/polizas/${poliza.id}/coberturas`, { ids: marcadas });
      onGuardado && onGuardado();
      onClose();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Modal
      open
      titulo="Coberturas de la póliza"
      subtitulo={poliza?.nPoliza}
      onClose={onClose}
      pie={<PieAcciones onCancelar={onClose} onConfirmar={guardar} ocupado={ocupado} />}
    >
      {error && <div className="sd-alerta error">{error}</div>}
      {lista.length === 0 && !error && <div className="sd-vacio">No hay coberturas activas. Créalas primero en el módulo Coberturas.</div>}
      {lista.map((c) => (
        <label key={c.id} className="sd-check" style={{ padding: "8px 0", borderBottom: "1px solid #f0f3f1", alignItems: "flex-start" }}>
          <input type="checkbox" checked={marcadas.includes(c.id)} onChange={() => alternar(c.id)} style={{ marginTop: 4 }} />
          <span>
            <strong>{c.nombre}</strong>
            <div className="sd-gris">
              {c.tipos_siniestro?.length ? `Aplica a: ${c.tipos_siniestro.map((t) => NOMBRES_TIPO[t] || t).join(", ")}` : "Aplica a todos los tipos de siniestro"}
            </div>
          </span>
        </label>
      ))}
    </Modal>
  );
}
