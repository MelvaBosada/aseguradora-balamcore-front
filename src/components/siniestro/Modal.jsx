import "../../css/BalamCoreModal.css";
import "../../css/SiniestroDetalle.css";
import logo from "../../assets/Logo.png";

/** Modal sencillo con el mismo diseño del sistema (balam-*). */
export default function Modal({ open, titulo, subtitulo, onClose, pie, ancho, children }) {
  if (!open) return null;

  return (
    <div
      className="balam-overlay"
      style={{ zIndex: 2500 }}
      onClick={(e) => e.target === e.currentTarget && onClose && onClose()}
    >
      <div className="balam-modal sd-modal" style={ancho ? { maxWidth: ancho } : undefined}>
        <div className="balam-header">
          <img src={logo} alt="BalamCore" className="balam-logo" />
          <div>
            <h2>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
        </div>
        <div className="balam-body sd-modal-body">{children}</div>
        {pie && <div className="balam-footer">{pie}</div>}
      </div>
    </div>
  );
}

/** Botones estándar Cancelar / Confirmar para el pie del modal. */
export function PieAcciones({ onCancelar, onConfirmar, textoConfirmar = "Guardar", ocupado = false, peligro = false, deshabilitado = false }) {
  return (
    <>
      <button className="balam-btn cancel" onClick={onCancelar} disabled={ocupado}>
        Cancelar
      </button>
      <button
        className="balam-btn save"
        onClick={onConfirmar}
        disabled={ocupado || deshabilitado}
        style={peligro ? { background: "#C0392B" } : undefined}
      >
        {ocupado ? "Procesando…" : textoConfirmar}
      </button>
    </>
  );
}
