import { useState } from "react";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AvisoCobroFallido from "../../components/miplan/AvisoCobroFallido";
import { caja, Encabezado, AvisoCerrable, pantallaEstado } from "../../components/miplan/ui";
import useMiPlan from "../../hooks/useMiPlan";
import { fmtFecha, fmtMonto } from "../../utils/planFormat";
import "../../css/miplan-botones.css";
import { descargarComprobante, descargarFacturaEjemplo } from "../../utils/comprobante";

export default function HistorialPagos() {
  const { data, loading, error } = useMiPlan();
  const [bajando, setBajando] = useState(null);
  const [aviso, setAviso]     = useState("");

  const bajarDoc = async (tipo, id) => {
    setBajando(`${tipo}-${id}`);
    try {
      if (tipo === "factura") await descargarFacturaEjemplo(id);
      else await descargarComprobante(id);
    } catch {
      setAviso("No se pudo descargar el documento. Intenta de nuevo.");
    } finally {
      setBajando(null);
    }
  };

  const estadoPantalla = pantallaEstado({ loading, error, data });
  if (estadoPantalla) return estadoPantalla;

  const { historial, facturacion: f } = data;

  return (
    <div className="container py-4" style={{ maxWidth: 1120 }}>
      <Encabezado titulo="Historial y facturación de pagos" />
      <AvisoCerrable texto={aviso} onCerrar={() => setAviso("")} tipo="error" />
      <AvisoCobroFallido cobro={f.cobro_fallido} />

      <div style={caja}>
        {historial?.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  <th style={{ padding: "6px 8px" }}>Folio</th>
                  <th style={{ padding: "6px 8px" }}>Fecha</th>
                  <th style={{ padding: "6px 8px" }}>Plan</th>
                  <th style={{ padding: "6px 8px" }}>Pagado</th>
                  <th style={{ padding: "6px 8px" }}>Estatus</th>
                  <th style={{ padding: "6px 8px" }}>Documentos</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => (
                  <tr key={h.id} style={{ borderTop: "1px solid #eef2ef" }}>
                    <td style={{ padding: "9px 8px", fontWeight: 700 }}>{h.folio}</td>
                    <td style={{ padding: "9px 8px", whiteSpace: "nowrap" }}>{fmtFecha(h.fecha)}</td>
                    <td style={{ padding: "9px 8px" }}>{h.plan} <span style={{ color: "#94a3b8", textTransform: "capitalize" }}>· {h.periodo || "—"}</span></td>
                    <td style={{ padding: "9px 8px" }}>
                      {fmtMonto(h.monto_cobrado)}
                      {h.reembolsado > 0 && <span style={{ color: "#C0392B" }}> (reembolsado {fmtMonto(h.reembolsado)})</span>}
                    </td>
                    <td style={{ padding: "9px 8px", textTransform: "capitalize" }}>{h.estatus}</td>
                    <td style={{ padding: "9px 8px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button onClick={() => bajarDoc("comprobante", h.id)} disabled={bajando === `comprobante-${h.id}`} style={{
                          display: "flex", alignItems: "center", gap: 5, background: "#f1f6f3", border: "1px solid #cfe0d6", color: "#0F4C3A",
                          borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                        }}>
                          <ReceiptLongIcon style={{ fontSize: 15 }} /> {bajando === `comprobante-${h.id}` ? "..." : "Comprobante"}
                        </button>
                        <button onClick={() => bajarDoc("factura", h.id)} disabled={bajando === `factura-${h.id}`} style={{
                          display: "flex", alignItems: "center", gap: 5, background: "#fff7ed", border: "1px solid #fdba74", color: "#9a3412",
                          borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                        }}>
                          <ReceiptLongIcon style={{ fontSize: 15 }} /> {bajando === `factura-${h.id}` ? "..." : "Factura (ejemplo)"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Todavía no hay pagos registrados.</p>
        )}
      </div>
    </div>
  );
}
