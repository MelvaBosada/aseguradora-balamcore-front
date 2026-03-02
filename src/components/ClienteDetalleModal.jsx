import CloseIcon from "@mui/icons-material/Close";
import "../css/BalamCoreModal.css";
import "../css/ClienteDetalleModal.css";

function ClienteDetalleModal({ open, onClose, titulo, subtitulo, avatar, items }) {
  if (!open) return null;

  return (
    <div className="balam-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="balam-modal detalle-modal">

        {/* HEADER */}
        <div className="detalle-header">
          <div className="detalle-avatar">{avatar}</div>
          <div>
            <h2>{titulo}</h2>
            <span className="detalle-id">{subtitulo}</span>
          </div>
          <button className="detalle-close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* BODY */}
        <div className="detalle-body">
          {items?.map((item, i) => (
            <div key={i} className="detalle-item">
              <div className="detalle-icon">{item.icon}</div>
              <div>
                <span className="detalle-label">{item.label}</span>
                <span className="detalle-value">{item.value || "—"}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="balam-footer" style={{ borderTop: "1px solid #E5E7EB" }}>
          <button className="balam-btn cancel" onClick={onClose}>Cerrar</button>
        </div>

      </div>
    </div>
  );
}

export default ClienteDetalleModal;
