import { useState } from "react";
import Modal, { PieAcciones } from "./Modal";
import { api, dinero, mensajeError } from "../../services/siniestroApi";

const hoy = () => new Date().toISOString().slice(0, 10);

/** Captura de forma y datos de pago: pendiente -> lista para pagar. */
export function ConfirmarPagoModal({ indemnizacion, onClose, onHecho }) {
  const [f, setF] = useState({
    forma_pago: indemnizacion?.forma_pago || "transferencia",
    banco: indemnizacion?.banco || "",
    cuenta_bancaria: indemnizacion?.cuenta_bancaria || "",
    titular_cuenta: indemnizacion?.titular_cuenta || indemnizacion?.asegurado_nombre || "",
    observaciones: "",
  });
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  if (!indemnizacion) return null;

  const necesitaCuenta = ["transferencia", "deposito"].includes(f.forma_pago);
  const cambiar = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const guardar = async () => {
    setOcupado(true);
    setError("");
    try {
      await api.post(`/indemnizaciones/${indemnizacion.id}/confirmar-pago`, f);
      onHecho && onHecho();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Modal
      open
      titulo="Confirmar datos de pago"
      subtitulo={`${indemnizacion.numero_siniestro || ""} · ${dinero(indemnizacion.monto_aprobado)}`}
      onClose={onClose}
      pie={<PieAcciones onCancelar={onClose} onConfirmar={guardar} ocupado={ocupado} textoConfirmar="Confirmar" />}
    >
      {error && <div className="sd-alerta error">{error}</div>}
      <div className="sd-form-grid">
        <div>
          <label>Forma de pago</label>
          <select name="forma_pago" value={f.forma_pago} onChange={cambiar}>
            <option value="transferencia">Transferencia</option>
            <option value="deposito">Depósito</option>
            <option value="cheque">Cheque</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </div>
        <div>
          <label>{f.forma_pago === "cheque" ? "A nombre de" : "Titular / beneficiario"}</label>
          <input name="titular_cuenta" value={f.titular_cuenta} onChange={cambiar} />
        </div>
        {necesitaCuenta && (
          <>
            <div>
              <label>Banco</label>
              <input name="banco" value={f.banco} onChange={cambiar} />
            </div>
            <div>
              <label>CLABE o cuenta (10 a 18 dígitos)</label>
              <input name="cuenta_bancaria" value={f.cuenta_bancaria} onChange={cambiar} inputMode="numeric" />
            </div>
          </>
        )}
        <div className="completo">
          <label>Observaciones (opcional)</label>
          <input name="observaciones" value={f.observaciones} onChange={cambiar} maxLength={255} />
        </div>
      </div>
    </Modal>
  );
}

/** Registro del pago real (tesorería): lista para pagar -> pagada, y el siniestro se cierra solo. */
export function RegistrarPagoModal({ indemnizacion, onClose, onHecho }) {
  const [f, setF] = useState({ fecha_pago: hoy(), referencia_pago: "" });
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  if (!indemnizacion) return null;

  const guardar = async () => {
    setOcupado(true);
    setError("");
    try {
      await api.post(`/indemnizaciones/${indemnizacion.id}/pagar`, f);
      onHecho && onHecho();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Modal
      open
      titulo="Registrar pago"
      subtitulo={`${indemnizacion.numero_siniestro || ""} · ${dinero(indemnizacion.monto_aprobado)}`}
      onClose={onClose}
      pie={<PieAcciones onCancelar={onClose} onConfirmar={guardar} ocupado={ocupado} textoConfirmar="Registrar pago" />}
    >
      {error && <div className="sd-alerta error">{error}</div>}
      <div className="sd-alerta info">
        Al registrar el pago el siniestro se marca como pagado, se cierra automáticamente y se avisa al cliente.
      </div>
      <div className="sd-form-grid">
        <div>
          <label>Fecha del pago</label>
          <input type="date" value={f.fecha_pago} max={hoy()} onChange={(e) => setF({ ...f, fecha_pago: e.target.value })} />
        </div>
        <div>
          <label>Referencia (folio, clave de rastreo o número de cheque)</label>
          <input value={f.referencia_pago} onChange={(e) => setF({ ...f, referencia_pago: e.target.value })} maxLength={100} />
        </div>
      </div>
    </Modal>
  );
}

/** Anula la indemnización (pendiente o lista para pagar). El siniestro vuelve a "autorizado". */
export function CancelarIndemnizacionModal({ indemnizacion, onClose, onHecho }) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  if (!indemnizacion) return null;

  const guardar = async () => {
    setOcupado(true);
    setError("");
    try {
      await api.post(`/indemnizaciones/${indemnizacion.id}/cancelar`, { motivo });
      onHecho && onHecho();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Modal
      open
      titulo="Cancelar indemnización"
      subtitulo={`${indemnizacion.numero_siniestro || ""} · ${dinero(indemnizacion.monto_aprobado)}`}
      onClose={onClose}
      pie={<PieAcciones onCancelar={onClose} onConfirmar={guardar} ocupado={ocupado} textoConfirmar="Cancelar indemnización" peligro />}
    >
      {error && <div className="sd-alerta error">{error}</div>}
      <div className="sd-form-grid">
        <div className="completo">
          <label>Motivo (mínimo 10 caracteres)</label>
          <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} />
        </div>
      </div>
    </Modal>
  );
}
