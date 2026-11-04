import ContactlessIcon from "@mui/icons-material/Contactless";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import flor1 from "../../assets/flores/diseño4.png";
import flor2 from "../../assets/flores/diseño3.png";
import flor3 from "../../assets/flores/diseño2.png";
import { fmtFecha, fmtMonto } from "../../utils/planFormat";
import "../../css/miplan-botones.css";

const MARCAS = { visa: "VISA", mastercard: "MASTERCARD", amex: "AMEX", discover: "DISCOVER", diners: "DINERS", jcb: "JCB", unionpay: "UNIONPAY" };

// Chip de tarjeta: dorado con brillo y contactos tipo EMV
const Chip = ({ ancho = 48 }) => (
  <svg
    width={ancho}
    viewBox="0 0 50 38"
    aria-hidden="true"
    style={{ display: "block", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }}
  >
    <defs>
      <linearGradient id="chip-oro" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f7e39a" />
        <stop offset="45%" stopColor="#d9b44a" />
        <stop offset="100%" stopColor="#a8821f" />
      </linearGradient>
      <linearGradient id="chip-brillo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
        <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect x="0.5" y="0.5" width="49" height="37" rx="6" fill="url(#chip-oro)" stroke="#7a5c14" strokeWidth="0.8" strokeOpacity="0.6" />
    <rect x="0.5" y="0.5" width="49" height="37" rx="6" fill="url(#chip-brillo)" />
    <g fill="none" stroke="#7a5c14" strokeWidth="0.9" strokeOpacity="0.75" strokeLinecap="round">
      <path d="M0.5 13 H17 M0.5 19 H17 M0.5 25 H17" />
      <path d="M33 13 H49.5 M33 19 H49.5 M33 25 H49.5" />
      <path d="M25 0.5 V7 M25 31 V37.5" />
      <rect x="17" y="7" width="16" height="24" rx="4" />
    </g>
  </svg>
);

const Palanca = ({ activo, onChange, disabled, busy }) => (
  <button
    className="mp-palanca"
    type="button" role="switch" aria-checked={activo} aria-busy={busy} disabled={disabled}
    onClick={() => onChange(!activo)}
    style={{
      width: 56, height: 31, borderRadius: 31, border: "none", padding: 3, flexShrink: 0,
      cursor: busy ? "wait" : disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1,
      background: activo ? "linear-gradient(90deg,#0F4C3A,#13624b)" : "#cbd5e1",
    }}
  >
    <span style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      width: 25, height: 25, borderRadius: "50%", background: "#fff",
      boxShadow: "0 2px 6px rgba(0,0,0,.3)", transform: `translateX(${activo ? 25 : 0}px)`, transition: "transform .25s",
    }}>
      {busy && <span className="mp-palanca-spinner" />}
    </span>
  </button>
);

export default function TarjetaPago({ facturacion: f, puedeGestionar, hayPlanPago, ocupado, onToggle, onCambiarTarjeta }) {
  const t = f.tarjeta;
  const proximo = f.proximo_cobro;
  const fallo = f.cobro_fallido;
  const exp = t ? `${String(t.exp_mes).padStart(2, "0")}/${String(t.exp_anio).slice(-2)}` : "";

  return (
    // Dos columnas: tarjeta a la izquierda, controles a la derecha. En pantallas angostas se apilan.
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 28, alignItems: "start" }}>

      {/* ───────── Columna izquierda: la tarjeta ───────── */}
      <div>
        {t ? (
          <div style={{
            position: "relative", overflow: "hidden", maxWidth: 380, aspectRatio: "1.586", borderRadius: 22, padding: "22px 24px", color: "#fff",
            background: "linear-gradient(135deg, #071a14 0%, #071a14 60%, #1c2a26 100%)",
            boxShadow: "0 22px 50px rgba(7,26,20,0.35)", border: "1px solid rgba(255, 255, 255, 0.03)",
          }}>
            {/* Flores (mismo diseño que las otras tarjetas, ajustado a este tamaño) */}
            <img src={flor1} alt="" style={{ position: "absolute", right: 215, bottom: -26, width: 190, opacity: 0.2, pointerEvents: "none" }} />
            <img src={flor2} alt="" style={{ position: "absolute", right: -26, bottom: -44, width: 190, opacity: 0.5, pointerEvents: "none" }} />
            <img src={flor3} alt="" style={{ position: "absolute", right: -17, bottom: 128, width: 82, opacity: 0.4, pointerEvents: "none" }} />

            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Chip />
              <ContactlessIcon style={{ fontSize: 28, color: "rgba(255,255,255,0.75)" }} />
            </div>

            <div style={{ position: "relative", marginTop: 24, fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 21, letterSpacing: ".12em", textShadow: "0 1px 2px rgba(0,0,0,.4)" }}>
              •••• •••• •••• {t.ultimos4}
            </div>

            <div style={{ position: "absolute", left: 24, right: 24, bottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: ".1em", color: "rgba(255,255,255,0.55)" }}>VENCE</div>
                <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: ".05em" }}>{exp}</div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, fontStyle: "italic", letterSpacing: ".04em" }}>
                {MARCAS[String(t.marca).toLowerCase()] || String(t.marca || "TARJETA").toUpperCase()}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            maxWidth: 380, aspectRatio: "1.586", borderRadius: 22, border: "2px dashed #b9c9c0", background: "#f6f9f7",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#52615a", textAlign: "center", padding: 20,
          }}>
            <CreditCardIcon style={{ fontSize: 40, color: "#0F4C3A" }} />
            <div style={{ fontWeight: 800, color: "#0F4C3A" }}>Aún no tienes una tarjeta guardada</div>
            <div style={{ fontSize: 12 }}>Guárdala para renovar tu plan automáticamente.</div>
          </div>
        )}
      </div>

      {/* ───────── Columna derecha: botón, avisos y palanca ───────── */}
      <div>
        <button
          className={`mp-btn mp-primario${ocupado ? " mp-busy" : ""}`}
          onClick={onCambiarTarjeta}
          disabled={!puedeGestionar || ocupado}
          style={{ borderRadius: 10, padding: "9px 14px", fontWeight: 700, fontSize: 13 }}
        >
          {ocupado
            ? <><span className="mp-spinner" /> Procesando...</>
            : t ? "Cambiar tarjeta" : "Agregar tarjeta"}
        </button>

        {t?.vence_antes && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12, fontSize: 12.5, color: "#92400e", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 10, padding: "9px 11px" }}>
            <WarningAmberIcon style={{ fontSize: 17 }} /> Tu tarjeta vence antes del próximo cobro. Cámbiala para evitar que falle.
          </div>
        )}

        {fallo && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 12px", lineHeight: 1.5 }}>
            <strong>No pudimos cobrar tu renovación</strong> (intento {fallo.intentos} de {fallo.maximo}). {fallo.error} Actualiza tu tarjeta o realiza todo el proceso manualmente antes de que venza.
          </div>
        )}

        {/* Palanca */}
        <div style={{
          display: "flex", gap: 14, alignItems: "center", marginTop: 16, padding: "14px 16px",
          background: "#fff", border: "1px solid #e3e9e5", borderRadius: 16, boxShadow: "0 6px 24px rgba(15,76,58,0.06)",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: "#0F4C3A", fontSize: 14 }}>Renovación automática</div>
            <div style={{ fontSize: 12.5, color: "#52615a", lineHeight: 1.5, marginTop: 2 }}>
              {!hayPlanPago
                ? "Disponible cuando contrates un plan."
                : f.renovacion_auto && t
                  ? `Cobraremos tu plan solo en tu tarjeta •••• ${t.ultimos4}${proximo ? ` el ${fmtFecha(proximo.fecha)} (${fmtMonto(proximo.monto)})` : ""}. Si el cobro falla, te avisamos por correo.`
                  : "Apagada: no haremos cargos automáticos. Te avisamos antes de que venza para que puedas renovarlo a tiempo."}
            </div>
          </div>
          <Palanca
            activo={Boolean(f.renovacion_auto && t)}
            onChange={onToggle}
            busy={ocupado}
            disabled={!puedeGestionar || ocupado || !hayPlanPago}
          />
        </div>
      </div>
    </div>
  );
}
