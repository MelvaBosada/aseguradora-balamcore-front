// components/PolizaDetalleModal.jsx
import CloseIcon from "@mui/icons-material/Close";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import "../css/BalamCoreModal.css";
import "../css/ClienteDetalleModal.css";
import FichaCobertura from "./FichaCobertura";

const FULL_WIDTH = { gridColumn: "1 / -1", width: "100%", flexBasis: "100%" };

const th = {
  textAlign: "left",
  padding: "10px 14px",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#6B7280",
  backgroundColor: "#F3F4F6",
  borderBottom: "1px solid #E5E7EB",
  whiteSpace: "nowrap",
};

const td = {
  padding: "10px 14px",
  fontSize: "13px",
  color: "#111827",
  borderBottom: "1px solid #F1F5F9",
  verticalAlign: "top",
};

const btnPdf = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#1E5A44",
  backgroundColor: "#ECFDF5",
  border: "1px solid #A7F3D0",
  borderRadius: "8px",
  cursor: "pointer",
};

function PolizaDetalleModal({
  open,
  onClose,
  titulo,
  subtitulo,
  avatar,
  items,
  documento = null,          // { nombre } o null
  onVerDocumento,            // () => void
  endosos = [],
  onVerDocumentoEndoso,      // (endoso) => void
  coberturas = [],
}) {
  if (!open) return null;

  return (
    <div className="balam-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="balam-modal detalle-modal">

        {/* HEADER */}
        <div className="detalle-header">
          <div className="detalle-avatar">
            {avatar || "P"}
          </div>
          <div className="detalle-header-text">
            <h2>{titulo || "Detalle de Póliza"}</h2>
            {subtitulo && <span className="detalle-id">{subtitulo}</span>}
          </div>
          <button className="detalle-close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* BODY */}
        <div className="detalle-body">
          {items && items.map((item, i) => (
            <div
              key={i}
              className="detalle-item"
              style={item.fullWidth ? FULL_WIDTH : undefined}
            >
              <div className="detalle-icon">{item.icon}</div>
              <div className="detalle-item-text">
                <span className="detalle-label">{item.label}</span>
                <span className="detalle-value">{item.value || "—"}</span>
              </div>
            </div>
          ))}

          <div style={{ ...FULL_WIDTH, marginTop: 6 }}>
            <div className="detalle-label" style={{ marginBottom: 8, display: "block" }}>
              Resumen de coberturas ({coberturas.length})
            </div>
            {coberturas.length > 0 ? (
              coberturas.map((cobertura) => (
                <FichaCobertura key={cobertura.id} cobertura={cobertura} checked />
              ))
            ) : (
              <div className="detalle-value">Sin coberturas asignadas</div>
            )}
          </div>

          {/* DOCUMENTO DE LA PÓLIZA */}
          <div className="detalle-item" style={FULL_WIDTH}>
            <div className="detalle-icon"><PictureAsPdfIcon /></div>
            <div className="detalle-item-text">
              <span className="detalle-label">Documento de la póliza</span>
              {documento ? (
                <span className="detalle-value" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span>{documento.nombre || "documento.pdf"}</span>
                  <button type="button" style={btnPdf} onClick={onVerDocumento}>
                    <PictureAsPdfIcon style={{ fontSize: 16 }} /> Ver PDF
                  </button>
                </span>
              ) : (
                <span className="detalle-value">Sin documento</span>
              )}
            </div>
          </div>

          {/* HISTORIAL DE ENDOSOS: solo aparece si la póliza tiene endosos */}
          {endosos.length > 0 && (
            <div style={FULL_WIDTH}>
              <div
                className="detalle-label"
                style={{ margin: "6px 0 8px", display: "block" }}
              >
                Endosos ({endosos.length})
              </div>

              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <div style={{ maxHeight: "240px", overflow: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>N° Endoso</th>
                        <th style={th}>Fecha</th>
                        <th style={th}>Descripción</th>
                        <th style={th}>Documento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endosos.map((e) => (
                        <tr key={e.id}>
                          <td style={{ ...td, fontWeight: 600, whiteSpace: "nowrap" }}>
                            {e.numero_endoso}
                          </td>
                          <td style={{ ...td, whiteSpace: "nowrap" }}>{e.fecha}</td>
                          <td style={td}>{e.descripcion || "—"}</td>
                          <td style={{ ...td, whiteSpace: "nowrap" }}>
                            {e.tiene_documento ? (
                              <button type="button" style={btnPdf} onClick={() => onVerDocumentoEndoso && onVerDocumentoEndoso(e)}>
                                <PictureAsPdfIcon style={{ fontSize: 16 }} /> Ver PDF
                              </button>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="balam-footer" style={{ borderTop: "1px solid #E5E7EB" }}>
          <button className="balam-btn cancel" onClick={onClose}>Cerrar</button>
        </div>

      </div>
    </div>
  );
}

export default PolizaDetalleModal;