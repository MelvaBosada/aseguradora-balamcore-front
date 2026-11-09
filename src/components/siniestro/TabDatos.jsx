import { useState } from "react";
import "../../css/SiniestroDetalle.css";
import Modal, { PieAcciones } from "./Modal";
import { EstatusSiniestro } from "./Badges";
import { api, dinero, mensajeError } from "../../services/siniestroApi";

const TIPOS = [
  ["robo", "Robo"], ["accidente", "Accidente"], ["incendio", "Incendio"], ["inundacion", "Inundación"],
  ["responsabilidad_civil", "Responsabilidad civil"], ["fallecimiento", "Fallecimiento"], ["invalidez", "Invalidez"], ["otro", "Otro"],
];
const PRIORIDADES = [["baja", "Baja"], ["media", "Media"], ["alta", "Alta"], ["urgente", "Urgente"]];
const NO_EDITABLES = ["autorizado", "en_pago", "pagado", "cerrado", "cancelado"];

const Dato = ({ titulo, children }) => (
  <div className="sd-dato">
    <span>{titulo}</span>
    <div>{children || "—"}</div>
  </div>
);

export default function TabDatos({ detalle, onCambio }) {
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState({});
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const editable = !NO_EDITABLES.includes(detalle.estatus_valor);

  const abrir = () => {
    setF({
      tipo: detalle.tipo_raw || "",
      prioridad: detalle.prioridad_raw || "",
      monto_reclamado: detalle.monto_reclamado ?? "",
    });
    setError("");
    setAbierto(true);
  };

  const guardar = async () => {
    setOcupado(true);
    setError("");
    try {
      await api.put(`/siniestros/${detalle.id}`, {
        tipo: f.tipo,
        prioridad: f.prioridad,
        monto_reclamado: parseFloat(f.monto_reclamado),
      });
      setAbierto(false);
      onCambio && onCambio();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <>
      <div className="sd-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Datos del siniestro</h3>
          {editable && (
            <button className="sd-btn mini" onClick={abrir}>
              Editar
            </button>
          )}
        </div>
        <div className="sd-grid">
          <Dato titulo="N° de siniestro">{detalle.numero_siniestro}</Dato>
          <Dato titulo="Estatus">
            <EstatusSiniestro valor={detalle.estatus_valor} />
          </Dato>
          <Dato titulo="Tipo">{detalle.tipo}</Dato>
          <Dato titulo="Prioridad">{detalle.prioridad}</Dato>
          <Dato titulo="Monto reclamado">{dinero(detalle.monto_reclamado)}</Dato>
          <Dato titulo="Deducible aplicado (lo calcula el sistema)">
            {detalle.deducible_aplicado != null ? dinero(detalle.deducible_aplicado) : "Aún sin calcular"}
          </Dato>
          <Dato titulo="Fecha de apertura">{detalle.fecha_creacion}</Dato>
          <Dato titulo="Ajustador">{detalle.ajustador}</Dato>
          {detalle.fecha_cierre && <Dato titulo="Fecha de cierre">{detalle.fecha_cierre}</Dato>}
          {detalle.motivo_cierre && <Dato titulo="Motivo de cierre">{detalle.motivo_cierre}</Dato>}
        </div>
      </div>

      <div className="sd-card">
        <h3>Asegurado y póliza</h3>
        <div className="sd-grid">
          <Dato titulo="Cliente">{detalle.cliente}</Dato>
          <Dato titulo="Póliza">{detalle.poliza}</Dato>
          <Dato titulo="Reporte">{detalle.id_reporte ? `REP-${String(detalle.id_reporte).padStart(6, "0")}` : ""}</Dato>
        </div>
      </div>

      <Modal
        open={abierto}
        titulo="Editar datos del siniestro"
        subtitulo="El deducible y el monto a pagar los calcula el sistema en el dictamen."
        onClose={() => setAbierto(false)}
        pie={<PieAcciones onCancelar={() => setAbierto(false)} onConfirmar={guardar} ocupado={ocupado} />}
      >
        {error && <div className="sd-alerta error">{error}</div>}
        <div className="sd-form-grid">
          <div>
            <label>Tipo</label>
            <select value={f.tipo || ""} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
              {TIPOS.map(([v, t]) => (
                <option key={v} value={v}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Prioridad</label>
            <select value={f.prioridad || ""} onChange={(e) => setF({ ...f, prioridad: e.target.value })}>
              {PRIORIDADES.map(([v, t]) => (
                <option key={v} value={v}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Monto reclamado</label>
            <input type="number" min="0" step="0.01" value={f.monto_reclamado ?? ""} onChange={(e) => setF({ ...f, monto_reclamado: e.target.value })} />
          </div>
        </div>
      </Modal>
    </>
  );
}
