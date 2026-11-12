// components/PolizaDetalleModal.jsx
import CloseIcon from "@mui/icons-material/Close";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import "../css/BalamCoreModal.css";
import "../css/ClienteDetalleModal.css";
import FichaCobertura, { dinero0 } from "./FichaCobertura";

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

// ───── Endosos ─────
const TIPOS_ENDOSO = {
  A: { texto: "A · Aumento", ayuda: "Aumenta la prima (se cobra la diferencia)", fondo: "#FEF3C7", color: "#92400E" },
  B: { texto: "B · Disminución", ayuda: "Disminuye la prima (se devuelve la diferencia)", fondo: "#DBEAFE", color: "#1E40AF" },
  D: { texto: "D · Sin prima", ayuda: "No modifica la prima", fondo: "#F3F4F6", color: "#374151" },
};

// ───── Historial ─────
const ACCIONES = {
  creada: { texto: "Emisión", color: "#047857" },
  endoso: { texto: "Endoso", color: "#B45309" },
  modificada: { texto: "Modificación", color: "#1D4ED8" },
  coberturas: { texto: "Coberturas", color: "#6D28D9" },
  bienes: { texto: "Bienes", color: "#0E7490" },
  documento: { texto: "Documento", color: "#4B5563" },
  estatus: { texto: "Estatus", color: "#BE123C" },
  eliminada: { texto: "Eliminación", color: "#B91C1C" },
};

const ETIQUETAS_CAMPO = {
  suma_asegurada: "Suma asegurada",
  fecha_inicio: "Inicio de vigencia",
  fecha_fin: "Fin de vigencia",
  prima_neta: "Prima neta",
  derecho_poliza: "Derecho de póliza",
  iva: "IVA",
  prima_total: "Prima total",
  forma_pago: "Forma de pago",
  bienes: "Bienes asegurados",
  coberturas: "Coberturas",
  observaciones: "Observaciones",
  estatus: "Estatus",
};

const CAMPOS_DINERO = ["suma_asegurada", "prima_neta", "derecho_poliza", "iva", "prima_total"];

const valorLegible = (campo, v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (campo === "bienes") return `${Object.keys(v || {}).length} bien(es)`;
  if (campo === "coberturas") return `${(v || []).length} cobertura(s)`;
  if (typeof v === "object") return JSON.stringify(v);
  if (CAMPOS_DINERO.includes(campo)) return dinero0(v);
  return String(v);
};

const ajusteTexto = (monto) => {
  const n = Number(monto);
  if (!n) return "—";
  return `${n > 0 ? "+" : "−"}${dinero0(Math.abs(n))}`;
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
  historial = [],            // [{ id, accion, resumen, usuario, fecha, cambios }]
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

          {/* ENDOSOS: solo aparece si la póliza tiene endosos */}
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
                <div style={{ maxHeight: "260px", overflow: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>N° Endoso</th>
                        <th style={th}>Fecha</th>
                        <th style={th}>Efecto desde</th>
                        <th style={th}>Realizado por</th>
                        <th style={th}>Tipo</th>
                        <th style={th}>Ajuste de prima</th>
                        <th style={th}>Descripción</th>
                        <th style={th}>Documento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endosos.map((e) => {
                        const tipo = TIPOS_ENDOSO[e.tipo_endoso];
                        return (
                          <tr key={e.id}>
                            <td style={{ ...td, fontWeight: 600, whiteSpace: "nowrap" }}>
                              {e.numero_endoso}
                            </td>
                            <td style={{ ...td, whiteSpace: "nowrap" }}>{e.fecha}</td>
                            <td style={{ ...td, whiteSpace: "nowrap" }}>{e.fecha_efecto || "—"}</td>
                            <td style={{ ...td, whiteSpace: "nowrap" }}>{e.usuario || "—"}</td>
                            <td style={{ ...td, whiteSpace: "nowrap" }}>
                              {tipo ? (
                                <span
                                  title={tipo.ayuda}
                                  style={{
                                    background: tipo.fondo, color: tipo.color, padding: "2px 8px",
                                    borderRadius: 999, fontSize: 11, fontWeight: 600,
                                  }}
                                >
                                  {tipo.texto}
                                </span>
                              ) : "—"}
                            </td>
                            <td style={{ ...td, whiteSpace: "nowrap", fontWeight: 600 }}>{ajusteTexto(e.ajuste_prima)}</td>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 6 }}>
                El ajuste de prima se calcula a prorrata: solo por los días que faltan desde la fecha de efecto hasta el fin de la vigencia.
              </div>
            </div>
          )}

          {/* HISTORIAL: quién hizo qué y cuándo */}
          <div style={FULL_WIDTH}>
            <div className="detalle-label" style={{ margin: "10px 0 8px", display: "block" }}>
              Historial de movimientos ({historial.length})
            </div>

            {historial.length === 0 ? (
              <div className="detalle-value">Sin movimientos registrados</div>
            ) : (
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  maxHeight: 300,
                  overflowY: "auto",
                  padding: "4px 14px",
                }}
              >
                {historial.map((h) => {
                  const accion = ACCIONES[h.accion] || { texto: h.accion, color: "#374151" };
                  const campos = h.cambios ? Object.entries(h.cambios) : [];

                  return (
                    <div key={h.id} style={{ padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
                        <span
                          style={{
                            color: accion.color, border: `1px solid ${accion.color}`, borderRadius: 999,
                            padding: "1px 8px", fontWeight: 600, fontSize: 11,
                          }}
                        >
                          {accion.texto}
                        </span>
                        <span style={{ color: "#6B7280" }}>{h.fecha}</span>
                        <span style={{ color: "#374151" }}>· {h.usuario}</span>
                      </div>

                      <div style={{ fontSize: 13, color: "#111827", marginTop: 4 }}>{h.resumen}</div>

                      {campos.length > 0 && (
                        <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12, color: "#4B5563" }}>
                          {campos.map(([campo, v]) => (
                            <li key={campo}>
                              <strong>{ETIQUETAS_CAMPO[campo] || campo}:</strong>{" "}
                              {valorLegible(campo, v?.antes)} → {valorLegible(campo, v?.despues)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="balam-footer" style={{ borderTop: "1px solid #E5E7EB" }}>
          <button className="balam-btn cancel" onClick={onClose}>Cerrar</button>
        </div>

      </div>
    </div>
  );
}

export default PolizaDetalleModal;
