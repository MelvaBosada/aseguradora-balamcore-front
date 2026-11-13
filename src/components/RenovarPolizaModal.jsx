import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import CarIcon from "@mui/icons-material/DirectionsCar";
import ComputerIcon from "@mui/icons-material/Computer";
import BuildIcon from "@mui/icons-material/Build";
import AssignmentIcon from "@mui/icons-material/Assignment";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PersonIcon from "@mui/icons-material/Person";
import DateRangeIcon from "@mui/icons-material/DateRange";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PaymentIcon from "@mui/icons-material/Payment";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import InfoIcon from "@mui/icons-material/Info";
import "../css/BalamCoreModal.css";

const VERDE = "#14573A";

const dinero = (n) =>
  `$${Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Texto del endoso tolerante a distintos nombres de campo
const textoEndoso = (e) => e?.numero_endoso || e?.nEndoso || e?.numero || e?.endoso || `Endoso #${e?.id ?? ""}`;
const descripcionEndoso = (e) => e?.descripcion || e?.descripcion_endoso || "";

// ── Estilos ──
const estiloSeccion = { width: "100%", flex: "0 0 100%", gridColumn: "1 / -1", display: "block", marginBottom: 26 };
const estiloTituloSeccion = {
  fontSize: 13, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase",
  color: VERDE, paddingBottom: 8, marginBottom: 14, borderBottom: "2px solid #E5E7EB"
};
const estiloGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 };
const estiloTarjeta = {
  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
  background: "#F8F9FB", border: "1px solid #E5E7EB", borderRadius: 10, minWidth: 0
};
const estiloEtiqueta = { fontSize: 10, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "#9CA3AF" };
const estiloValor = { fontSize: 14, fontWeight: 600, color: "#1F2933", wordBreak: "break-word", lineHeight: 1.25 };
const estiloSub = { fontSize: 11, color: "#6B7280", marginTop: 1 };
const estiloVacio = {
  padding: 12, textAlign: "center", fontSize: 13, color: "#6B7280",
  background: "#F8F9FB", border: "1px dashed #D1D5DB", borderRadius: 10
};

// Sección: título arriba, contenido debajo
const Seccion = ({ titulo, children }) => (
  <div style={estiloSeccion}>
    <div style={estiloTituloSeccion}>{titulo}</div>
    {children}
  </div>
);

const Tarjeta = ({ icono, etiqueta, valor, sub, derecha, full }) => (
  <div style={{ ...estiloTarjeta, gridColumn: full ? "1 / -1" : undefined }}>
    <span style={{ color: VERDE, display: "flex", flexShrink: 0, fontSize: 20 }}>{icono}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={estiloEtiqueta}>{etiqueta}</div>
      <div style={estiloValor}>{valor ?? "—"}</div>
      {sub && <div style={estiloSub}>{sub}</div>}
    </div>
    {derecha && <div style={{ ...estiloValor, fontSize: 13, whiteSpace: "nowrap" }}>{derecha}</div>}
  </div>
);

function RenovarPolizaModal({
  open,
  onClose,
  onRenovar,
  poliza,
  detallePoliza,
  contexto,
  formData,
  onInputChange,
  camposNuevos
}) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onRenovar();
    } finally {
      setLoading(false);
    }
  };

  const iconoBien = (tipo) => {
    switch (tipo) {
      case "vehiculo": return <CarIcon fontSize="inherit" />;
      case "inmueble": return <HomeIcon fontSize="inherit" />;
      case "electronico": return <ComputerIcon fontSize="inherit" />;
      case "maquinaria": return <BuildIcon fontSize="inherit" />;
      default: return <AssignmentIcon fontSize="inherit" />;
    }
  };

  const renderInput = (campo) => {
    const value = formData[campo.name] ?? "";

    if (campo.type === "select") {
      return (
        <select name={campo.name} value={value} onChange={onInputChange} className="balam-select" required={campo.required}>
          <option value="">{campo.placeholder || `Selecciona ${campo.label.toLowerCase()}`}</option>
          {campo.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }

    if (campo.type === "textarea") {
      return (
        <textarea
          name={campo.name}
          value={value}
          onChange={onInputChange}
          placeholder={campo.placeholder}
          className="balam-textarea"
          rows={campo.rows || 3}
          readOnly={campo.readOnly}
        />
      );
    }

    return (
      <input
        type={campo.type || "text"}
        name={campo.name}
        value={value}
        onChange={onInputChange}
        placeholder={campo.placeholder}
        readOnly={campo.readOnly}
        className="balam-input"
      />
    );
  };

  // ── Datos de la póliza actual ──
  const p = contexto?.poliza || null;
  const endosos = p?.endosos || [];
  const coberturas = contexto?.coberturas?.length ? contexto.coberturas : (p?.coberturas || []);
  const bienes = contexto?.bienes?.length ? contexto.bienes : (detallePoliza?.bienes || []);
  const hayEndoso = endosos.length > 0 || !!p?.endoso;

  return (
    <div className="balam-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="balam-modal balam-modal-wide">

        <div className="balam-header">
          <div>
            <h2>Renovar póliza</h2>
            <p>Revisa la póliza actual y captura los datos de la renovación</p>
          </div>
          <button className="detalle-close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="balam-body">

          {/* ───── PÓLIZA ANTERIOR ───── */}
          {poliza && (
            <Seccion titulo="Póliza anterior">
              <div style={estiloGrid}>
                <Tarjeta icono={<AssignmentIcon fontSize="inherit" />} etiqueta="N° Póliza" valor={poliza.nPoliza} />
                <Tarjeta icono={<PersonIcon fontSize="inherit" />} etiqueta="Cliente" valor={`${poliza.nombre || ""} ${poliza.apellido || ""}`.trim()} />
                <Tarjeta icono={<AssignmentIcon fontSize="inherit" />} etiqueta="Ramo" valor={detallePoliza?.tipo || p?.tipo || poliza.tipo} />
                <Tarjeta icono={<InfoIcon fontSize="inherit" />} etiqueta="Estatus actual" valor={poliza.estatus} />
                {p && (
                  <>
                    <Tarjeta icono={<DateRangeIcon fontSize="inherit" />} etiqueta="Vigencia" valor={`${p.fechaInicio || "—"} al ${p.fechaFinal || "—"}`} />
                    <Tarjeta icono={<PaymentIcon fontSize="inherit" />} etiqueta="Forma de pago" valor={p.formaPago} />
                    <Tarjeta icono={<AttachMoneyIcon fontSize="inherit" />} etiqueta="Suma asegurada" valor={dinero(p.sumaAsegurada)} />
                    <Tarjeta icono={<MonetizationOnIcon fontSize="inherit" />} etiqueta="Prima neta" valor={dinero(p.prima_neta)} />
                    <Tarjeta icono={<MonetizationOnIcon fontSize="inherit" />} etiqueta="Derecho de póliza" valor={dinero(p.derecho_poliza)} />
                    <Tarjeta icono={<MonetizationOnIcon fontSize="inherit" />} etiqueta="IVA" valor={dinero(p.iva)} />
                    <Tarjeta icono={<MonetizationOnIcon fontSize="inherit" />} etiqueta="Prima total" valor={dinero(p.prima_total)} />
                  </>
                )}
              </div>
            </Seccion>
          )}

          {/* ───── ENDOSO ───── */}
          {p && (
            <Seccion titulo="Endoso">
              {hayEndoso ? (
                <div style={estiloGrid}>
                  <Tarjeta
                    icono={<AssignmentIcon fontSize="inherit" />}
                    etiqueta="Endoso vigente"
                    valor={p.endoso || textoEndoso(endosos[endosos.length - 1])}
                  />
                  {endosos.map((e, i) => (
                    <Tarjeta
                      key={e.id ?? i}
                      icono={<AssignmentIcon fontSize="inherit" />}
                      etiqueta={textoEndoso(e)}
                      valor={descripcionEndoso(e) || "Sin descripción"}
                    />
                  ))}
                </div>
              ) : (
                <div style={estiloVacio}>Esta póliza no tiene endosos</div>
              )}
            </Seccion>
          )}

          {/* ───── BIENES ASEGURADOS ───── */}
          <Seccion titulo="Bienes asegurados">
            {bienes.length > 0 ? (
              <div style={estiloGrid}>
                {bienes.map((b) => (
                  <Tarjeta
                    key={b.id}
                    icono={iconoBien(b.tipo)}
                    etiqueta={b.tipo || "Bien"}
                    valor={b.descripcion || "Sin descripción"}
                    sub={[b.marca && `Marca: ${b.marca}`, b.modelo && `Modelo: ${b.modelo}`, b.numero_serie && `Serie: ${b.numero_serie}`]
                      .filter(Boolean).join(" · ") || undefined}
                    derecha={dinero(b.valor)}
                  />
                ))}
              </div>
            ) : (
              <div style={estiloVacio}>
                Esta póliza no tiene bienes asegurados (por ejemplo, ramos de personas como vida o gastos médicos)
              </div>
            )}
          </Seccion>

          {/* ───── COBERTURAS ───── */}
          <Seccion titulo="Coberturas contratadas">
            {coberturas.length > 0 ? (
              <div style={estiloGrid}>
                {coberturas.map((c) => (
                  <Tarjeta key={c.id} icono={<VerifiedUserIcon fontSize="inherit" />} etiqueta="Cobertura" valor={c.nombre} />
                ))}
              </div>
            ) : (
              <div style={estiloVacio}>Sin coberturas asignadas</div>
            )}
          </Seccion>

          {/* ───── DATOS NUEVOS ───── */}
          <Seccion titulo="Datos nuevos de la póliza">
            <div className="balam-fields-grid">
              {camposNuevos?.map((campo, idx) => (
                <div
                  key={idx}
                  className={`balam-field${campo.type === "textarea" ? " balam-full" : ""}`}
                >
                  <label>{campo.label}</label>
                  {renderInput(campo)}
                </div>
              ))}
            </div>
          </Seccion>
        </div>

        <div className="balam-footer">
          <button className="balam-btn cancel" onClick={onClose}>Cancelar</button>
          <button className="balam-btn save" onClick={handleSubmit} disabled={loading}>
            {loading ? "Procesando..." : "Renovar póliza"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default RenovarPolizaModal;