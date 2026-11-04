import { useState } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { fmtFecha, fmtMonto } from "../utils/planFormat";
import { descargarComprobante } from "../utils/comprobante";

const TITULOS = {
  nueva: "¡Tu plan está activo!",
  inmediato: "¡Mejora aplicada!",
  adelantado: "¡Pago recibido!",
  renovar: "¡Renovación asegurada!",
};

const Fila = ({ label, valor, color }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", gap: 16, padding: "9px 0",
    borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: 13,
  }}>
    <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
    <span style={{ color: color || "#fff", fontWeight: 600, textAlign: "right" }}>{valor}</span>
  </div>
);

export default function ResultadoPagoModal({ resultado, onClose }) {
  const [bajando, setBajando] = useState(false);
  const [errorPdf, setErrorPdf] = useState("");

  if (!resultado) return null;

  const { kind } = resultado;
  let icono = <CheckCircleIcon style={{ fontSize: 58, color: "#4ade80" }} />;
  let titulo = "";
  let sub = "";
  let filas = [];
  let boton = "Continuar";

  if (kind === "verificando") {
    icono = (
      <div style={{
        width: 46, height: 46, margin: "6px auto", borderRadius: "50%",
        border: "4px solid rgba(255,255,255,0.15)", borderTopColor: "#D4AF37",
        animation: "resSpin .8s linear infinite",
      }} />
    );
    titulo = "Verificando tu pago...";
    sub = "Esto toma unos segundos. No cierres esta ventana.";
    boton = null;
  } else if (kind === "pago") {
    titulo = TITULOS[resultado.tipo] || "¡Pago exitoso!";
    const encadenado = ["adelantado", "renovar"].includes(resultado.tipo);
    sub = encadenado
      ? `Tu plan ${resultado.plan} empezará cuando termine el actual. No pierdes ningún día.`
      : `Ya puedes usar BalamCore con tu plan ${resultado.plan}.`;
    filas = [
      ["Plan", `${resultado.plan} · ${resultado.periodo}`],
      ["Empieza", fmtFecha(resultado.inicia)],
      ["Vence", fmtFecha(resultado.vence)],
    ];
    if (resultado.credito > 0) filas.push(["Crédito aplicado", `- ${fmtMonto(resultado.credito)}`, "#4ade80"]);
    if (resultado.dias_extra > 0) filas.push(["Días adicionales", `+${resultado.dias_extra}`, "#4ade80"]);
    filas.push(["Total pagado", fmtMonto(resultado.monto_cobrado)]);
  } else if (kind === "programado") {
    icono = <EventAvailableIcon style={{ fontSize: 58, color: "#D4AF37" }} />;
    titulo = "Cambio programado";
    sub = "No se cobró nada hoy. Tu plan actual sigue activo con todo incluido.";
    filas = [
      ["Nuevo plan", `${resultado.plan} · ${resultado.periodo}`],
      ["Entra en vigor", fmtFecha(resultado.entra_el)],
      ["Se cobrará", fmtMonto(resultado.precio_plan)],
    ];
  } else if (kind === "info") {
    titulo = resultado.titulo || "Listo";
    sub = resultado.message || "";
  } else if (kind === "abandonado") {
    icono = <ErrorOutlineIcon style={{ fontSize: 58, color: "#fbbf24" }} />;
    titulo = "Pago cancelado";
    sub = "No se hizo ningún cobro. Puedes elegir un plan cuando quieras.";
  } else {
    icono = <ErrorOutlineIcon style={{ fontSize: 58, color: "#f87171" }} />;
    titulo = "No pudimos completar la operación";
    sub = resultado.message || "Ocurrió un error. Intenta de nuevo.";
    if (resultado.sessionId) {
      sub += " Si ya se te cobró, tu plan se activará solo en unos minutos; también puedes actualizar la página para reintentar.";
    }
    boton = "Entendido";
  }

  const bajarComprobante = async () => {
    setBajando(true);
    setErrorPdf("");
    try {
      await descargarComprobante(resultado.id);
    } catch {
      setErrorPdf("No se pudo descargar el comprobante. Puedes bajarlo después desde Historial de pagos.");
    } finally {
      setBajando(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10001, padding: 20,
      background: "rgba(4,30,23,0.88)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <style>{`@keyframes resSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: "100%", maxWidth: 440, textAlign: "center", padding: "30px 26px 26px",
        background: "linear-gradient(160deg, #0a1f18, #0F2E22)", borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
      }}>
        {icono}
        <h3 style={{ color: "#fff", fontWeight: 900, fontSize: "1.4rem", margin: "12px 0 6px" }}>{titulo}</h3>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: "0 0 14px" }}>{sub}</p>

        {filas.length > 0 && (
          <div style={{ textAlign: "left", margin: "6px 0 14px" }}>
            {filas.map(([l, v, c]) => <Fila key={l} label={l} valor={v} color={c} />)}
          </div>
        )}

        {kind === "pago" && resultado.id && (
          <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <button onClick={bajarComprobante} disabled={bajando} style={{
              background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.45)", color: "#D4AF37",
              borderRadius: 10, padding: "8px 14px", fontSize: 12.5, fontWeight: 700,
              cursor: bajando ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              <ReceiptLongIcon style={{ fontSize: 16 }} />
              {bajando ? "Descargando..." : "Descargar comprobante"}
            </button>
            {resultado.recibo_url && (
              <a href={resultado.recibo_url} target="_blank" rel="noreferrer"
                 style={{ color: "rgba(255,255,255,0.6)", fontSize: 12.5, textDecoration: "underline" }}>
                Recibo de Stripe
              </a>
            )}
          </div>
        )}
        {errorPdf && <p style={{ color: "#fbbf24", fontSize: 12, margin: "0 0 12px" }}>{errorPdf}</p>}

        {boton && (
          <button onClick={onClose} style={{
            width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
            background: "#fff", color: "#0F4C3A", fontWeight: 800, fontSize: 14, cursor: "pointer",
          }}>
            {boton}
          </button>
        )}
      </div>
    </div>
  );
}