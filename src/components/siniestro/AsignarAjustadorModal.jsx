import { useEffect, useMemo, useState } from "react";
import "../../css/SiniestroDetalle.css";
import SelectBalam from "../SelectBalam";
import { api, mensajeError } from "../../services/siniestroApi";

const textoCasos = (n) => `${n} ${n === 1 ? "caso" : "casos"}`;

const COMPLETO = { gridColumn: "1 / -1" };

export default function AsignarAjustadorModal({ open, siniestro, ajustadores = [], onClose, onGuardado }) {
  const [idEmpleado, setIdEmpleado] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (open) {
      setIdEmpleado("");
      setMotivo("");
      setError("");
    }
  }, [open, siniestro?.id]);

  const tieneAjustador = !!siniestro?.id_empleado;

  const opciones = useMemo(
    () =>
      ajustadores
        .filter((a) => String(a.id) !== String(siniestro?.id_empleado))
        .map((a) => ({ value: String(a.id), label: `${a.nombre} (${textoCasos(a.carga)})` })),
    [ajustadores, siniestro?.id_empleado]
  );

  const confirmar = async () => {
    if (ocupado) return;
    if (!idEmpleado) return setError("Selecciona al ajustador.");
    if (motivo.trim().length < 5) return setError("El motivo es obligatorio (mínimo 5 caracteres).");

    setOcupado(true);
    setError("");
    try {
      await api.post(`/siniestros/${siniestro.id}/ajustador`, {
        id_empleado: Number(idEmpleado),
        motivo: motivo.trim(),
      });
      onGuardado();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  if (!open || !siniestro) return null;

  return (
    <div
      className="balam-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && !ocupado && onClose()}
    >
      <div className="balam-modal">
        <div className="balam-header">
          <div>
            <h2>{tieneAjustador ? "Reasignar ajustador" : "Asignar ajustador"}</h2>
            <p>Siniestro {siniestro.nSiniestro}</p>
          </div>
        </div>

        <div className="balam-body">
          {error && (
            <div className="sd-alerta error" style={COMPLETO}>
              {error}
            </div>
          )}

          <div className="balam-field" style={COMPLETO}>
            <label>Ajustador actual</label>
            <input value={siniestro.ajustador || "Sin asignar"} disabled readOnly />
          </div>

          <div className="balam-field" style={COMPLETO}>
            <label>Nuevo ajustador</label>
            <SelectBalam
              name="id_empleado"
              value={idEmpleado}
              options={opciones}
              placeholder="Selecciona un ajustador…"
              buscable
              disabled={ocupado}
              onChange={(e) => setIdEmpleado(e.target.value)}
            />
          </div>

          <div className="balam-field" style={COMPLETO}>
            <label>Motivo (obligatorio, queda en el historial)</label>
            <textarea
              className="balam-textarea"
              rows={3}
              maxLength={255}
              value={motivo}
              disabled={ocupado}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
        </div>

        <div className="balam-footer">
          <button type="button" className="balam-btn cancel" onClick={onClose} disabled={ocupado}>
            Cancelar
          </button>
          <button type="button" className="balam-btn save" onClick={confirmar} disabled={ocupado}>
            {ocupado ? "Procesando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}