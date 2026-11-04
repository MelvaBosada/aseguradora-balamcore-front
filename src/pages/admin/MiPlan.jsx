import { useState } from "react";
import axios from "axios";
import usePermisos from "../../context/PermisosContext";
import ModalPlanes from "../../components/ModalPlanes";
import ResultadoPagoModal from "../../components/ResultadoPagoModal";
import AvisoCobroFallido from "../../components/miplan/AvisoCobroFallido";
import { caja, btn, cls, Cargando, Nota, Encabezado, AvisoCerrable, pantallaEstado } from "../../components/miplan/ui";
import useMiPlan from "../../hooks/useMiPlan";
import { POLITICAS } from "../../constants/politicasPlan";
import { fmtFecha, fmtMonto } from "../../utils/planFormat";
import logoMarca from "../../assets/flores/diseño2.png";
import "../../css/miplan-botones.css";

const API = import.meta.env.VITE_API_URL || "/api";
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const ESTADOS = {
  activa:    { texto: "ACTIVO",        color: "#4ade80", fondo: "rgba(74,222,128,0.14)" },
  prueba:    { texto: "PRUEBA GRATIS", color: "#fbbf24", fondo: "rgba(251,191,36,0.14)" },
  vencida:   { texto: "VENCIDO",       color: "#f87171", fondo: "rgba(248,113,113,0.14)" },
  cancelada: { texto: "CANCELADO",     color: "#f87171", fondo: "rgba(248,113,113,0.14)" },
};

// Flores decorativas de la tarjeta (traslucidas, de distintos tamaños)
const FLORES = [
  { size: 340, right: -80, bottom: -100, rotate: 15,  opacity: 0.02 },
  { size: 170, right: 150, top: -100,    rotate: -20, opacity: 0.03 },
  { size: 90,  left: 10,   bottom: -50,  rotate: 35,  opacity: 0.02 },
];

const Anillo = ({ progreso, dias }) => {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg width="130" height="130" viewBox="0 0 130 130" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="gAnillo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0d060" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="9" />
      <circle
        cx="65" cy="65" r={r} fill="none" stroke="url(#gAnillo)" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - progreso / 100)} transform="rotate(-90 65 65)"
        style={{ transition: "stroke-dashoffset .8s ease" }}
      />
      <text x="65" y="64" textAnchor="middle" fill="#fff" fontSize="30" fontWeight="900">{dias}</text>
      <text x="65" y="82" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="11">{dias === 1 ? "día" : "días"}</text>
    </svg>
  );
};

export default function MiPlan() {
  const { refrescarSuscripcion, cancelarCambio } = usePermisos();
  const { data, loading, error, cargar } = useMiPlan();

  const [openPlanes, setOpenPlanes]     = useState(false);
  const [resultado, setResultado]       = useState(null);
  const [aviso, setAviso]               = useState("");
  const [ocupado, setOcupado]           = useState(false);
  const [quitando, setQuitando]         = useState(null); // null | "cambio" | "adelantado"
  const [dialogo, setDialogo]           = useState(false);
  const [opcion, setOpcion]             = useState("fin");
  const [entiendo, setEntiendo]         = useState(false);
  const [verPoliticas, setVerPoliticas] = useState(false);

  const quitarCambio = async (conReembolso) => {
    if (!window.confirm(conReembolso ? "¿Cancelar tu pago adelantado? Se te reembolsa el 100%." : "¿Cancelar el cambio programado?")) return;
    setQuitando(conReembolso ? "adelantado" : "cambio");
    try {
      const r = await cancelarCambio();
      setAviso(r.message);
      await cargar();
    } catch (e) {
      setResultado({ ok: false, kind: "error", message: e.response?.data?.message || "No se pudo cancelar el cambio." });
    } finally {
      setQuitando(null);
    }
  };

  const reanudar = async () => {
    setOcupado(true);
    try {
      const r = await axios.post(`${API}/suscripcion/reanudar`, {}, auth());
      setAviso(r.data.message);
      await refrescarSuscripcion().catch(() => {});
      await cargar();
    } catch (e) {
      setResultado({ ok: false, kind: "error", message: e.response?.data?.message || "No se pudo reanudar." });
    } finally {
      setOcupado(false);
    }
  };

  const confirmarCancelacion = async () => {
    setOcupado(true);
    try {
      const ruta = opcion === "reembolso" ? "reembolso" : "cancelar-fin-periodo";
      const r = await axios.post(`${API}/suscripcion/${ruta}`, {}, auth());
      await refrescarSuscripcion().catch(() => {});
      setDialogo(false);
      setEntiendo(false);
      setResultado({
        ok: true,
        kind: "info",
        titulo: r.data.soporte ? "Solicitud enviada a soporte" : r.data.cancelada_ahora ? "Plan cancelado" : "Cancelación programada",
        message: r.data.message,
        cortaAcceso: Boolean(r.data.cancelada_ahora),
      });
    } catch (e) {
      setDialogo(false);
      setResultado({ ok: false, kind: "error", message: e.response?.data?.message || "No se pudo completar la cancelación." });
    } finally {
      setOcupado(false);
    }
  };

  const cerrarResultado = () => {
    const corta = resultado?.cortaAcceso;
    setResultado(null);
    if (corta) window.location.href = "/admin/dashboard";
    else cargar();
  };

  const estadoPantalla = pantallaEstado({ loading, error, data });
  if (estadoPantalla) return estadoPantalla;

  const { plan, politica, cambio_programado: cambio, pago_adelantado: adelantado, cancelacion, facturacion: f, puede_gestionar } = data;
  const estado = ESTADOS[plan?.estado] || ESTADOS.vencida;
  const hayPlanPago = plan?.estado === "activa";
  const sinPlanVigente = !plan || ["prueba", "vencida", "cancelada"].includes(plan.estado);
  const bloqueoCancelar = ocupado || (opcion === "reembolso" && politica?.reembolso_automatico && !entiendo);

  return (
    <div className="container py-4" style={{ maxWidth: 1120 }}>
      <Encabezado titulo="Mi plan" />

      <AvisoCerrable texto={aviso} onCerrar={() => setAviso("")} />
      <AvisoCobroFallido cobro={f.cobro_fallido} />

      {/* ───────── PLAN + ACCIONES ───────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 20, alignItems: "start" }}>
        <div style={{
          position: "relative", overflow: "hidden", borderRadius: 26, padding: "28px 30px", color: "#fff",
          background: "#071a14", boxShadow: "0 24px 60px rgba(7,26,20,0.35)", border: "1px solid rgba(255,255,255,0.08)",
        }}>
          {FLORES.map((fl, i) => (
            <img key={i} src={logoMarca} alt="" style={{
              position: "absolute", width: fl.size, top: fl.top, bottom: fl.bottom, left: fl.left, right: fl.right,
              opacity: fl.opacity, transform: `rotate(${fl.rotate}deg)`, filter: "brightness(0) invert(1)", pointerEvents: "none",
            }} />
          ))}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg,#D4AF37,#f0d060,#D4AF37)" }} />

          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, letterSpacing: ".14em", color: "rgba(255,255,255,0.55)", fontWeight: 700 }}>
              {plan?.estado === "prueba" ? "PERIODO DE PRUEBA" : "TU PLAN"}
            </span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {cancelacion && <span style={{ background: "rgba(251,191,36,0.14)", color: "#fbbf24", fontSize: 10, fontWeight: 800, letterSpacing: ".08em", padding: "5px 11px", borderRadius: 20 }}>CANCELACIÓN PROGRAMADA</span>}
              <span style={{ background: estado.fondo, color: estado.color, fontSize: 10, fontWeight: 800, letterSpacing: ".08em", padding: "5px 11px", borderRadius: 20 }}>{estado.texto}</span>
            </div>
          </div>

          {plan ? (
            <>
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{
                    fontSize: "2.8rem", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05,
                    background: "linear-gradient(90deg,#f0d060,#D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>{plan.nombre}</div>
                  {plan.periodo && (
                    <div style={{ marginTop: 8, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
                      {plan.periodo === "anual" ? "Anual" : "Mensual"} · {fmtMonto(plan.precio_lista)}{plan.periodo === "anual" ? "/año" : "/mes"}
                    </div>
                  )}
                  <div style={{ marginTop: 6, fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>
                    {plan.fin ? `${plan.estado === "activa" || plan.estado === "prueba" ? "Vence" : "Venció"} el ${fmtFecha(plan.fin)}` : ""}
                  </div>
                </div>
                <Anillo progreso={plan.progreso} dias={plan.dias_restantes ?? 0} />
              </div>

              <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 6, margin: "22px 0 16px" }}>
                {plan.modulos?.map((m) => (
                  <span key={m} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.12)" }}>{m}</span>
                ))}
              </div>

              <div style={{ position: "relative", fontSize: 12, color: "rgba(255,255,255,0.65)", display: "grid", gap: 3 }}>
                <span>{plan.limites.siniestros_mes ? `Hasta ${plan.limites.siniestros_mes} siniestros al mes` : "Siniestros ilimitados"}</span>
                <span>{plan.limites.bienes_por_cliente ? `Hasta ${plan.limites.bienes_por_cliente} bienes por cliente` : "Bienes por cliente sin límite"}</span>
                <span>{plan.limites.polizas_vencer_dia ? `Hasta ${plan.limites.polizas_vencer_dia} pólizas a vencer por día` : "Pólizas a vencer sin límite"}</span>
                <span>{plan.limites.pdf_ilimitado ? "Descargas PDF ilimitadas" : "Descargas PDF limitadas"}{plan.limites.soporte_prioritario ? " · Soporte prioritario" : ""}</span>
              </div>
            </>
          ) : (
            <p style={{ position: "relative", color: "rgba(255,255,255,0.75)" }}>Todavía no tienes un plan. Elige uno para empezar.</p>
          )}
        </div>

        {/* ACCIONES */}
        <div style={{ ...caja, display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 800, color: "#0F4C3A", fontSize: 16 }}>Pagos y plan</div>

          {!puede_gestionar && (
            <Nota color="#475569" fondo="#f1f5f9" borde="#cbd5e1">Solo el administrador de la agencia puede cambiar, pagar o cancelar el plan.</Nota>
          )}

          {f.proximo_cobro && (
            <div style={{ background: "#f6f9f7", border: "1px solid #dfe9e3", borderRadius: 14, padding: "13px 15px" }}>
              <div style={{ fontSize: 11, letterSpacing: ".08em", fontWeight: 800, color: "#64748b" }}>PRÓXIMO COBRO</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#0F4C3A" }}>{fmtMonto(f.proximo_cobro.monto)}</span>
                <span style={{ fontSize: 12.5, color: "#475569" }}>{fmtFecha(f.proximo_cobro.fecha)}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#475569", marginTop: 2 }}>
                Plan {f.proximo_cobro.plan} ({f.proximo_cobro.periodo}) ·{" "}
                <strong style={{ color: f.proximo_cobro.automatico ? "#16a34a" : "#b45309" }}>
                  {f.proximo_cobro.automatico ? "cobro automático" : " "}
                </strong>
              </div>
            </div>
          )}

          {cancelacion && (
            <Nota>
              <strong>Cancelación programada:</strong> tu suscripción termina el {fmtFecha(cancelacion)}. Hasta entonces sigues con todo incluido y no habrá más cobros.
              {puede_gestionar && (
                <div style={{ marginTop: 8 }}>
                  <button className={cls("secundario", ocupado)} onClick={reanudar} disabled={ocupado}
                    style={{ ...btn(), width: "auto", padding: "7px 14px", fontSize: 12.5 }}>
                    {ocupado ? <Cargando>Reanudando...</Cargando> : "Reanudar suscripción"}
                  </button>
                </div>
              )}
            </Nota>
          )}

          {cambio && (
            <Nota>
              <strong>Cambio programado:</strong> pasarás a {cambio.plan} ({cambio.periodo}) el {fmtFecha(cambio.entra_el)}. Hoy no se cobró nada; ese día se cobrarán {fmtMonto(cambio.precio_estimado)}.
              {puede_gestionar && (
                <div style={{ marginTop: 8 }}>
                  <button className={cls("peligro", quitando === "cambio")} onClick={() => quitarCambio(false)} disabled={Boolean(quitando)}
                    style={{ ...btn(), width: "auto", padding: "6px 12px", fontSize: 12 }}>
                    {quitando === "cambio" ? <Cargando>Cancelando...</Cargando> : "Cancelar cambio"}
                  </button>
                </div>
              )}
            </Nota>
          )}

          {adelantado && (
            <Nota>
              <strong>Pago adelantado:</strong> {adelantado.plan} ({adelantado.periodo}) empieza el {fmtFecha(adelantado.empieza)}. Ya pagaste {fmtMonto(adelantado.monto_cobrado)}.
              {puede_gestionar && (
                <div style={{ marginTop: 8 }}>
                  <button className={cls("peligro", quitando === "adelantado")} onClick={() => quitarCambio(true)} disabled={Boolean(quitando)}
                    style={{ ...btn(), width: "auto", padding: "6px 12px", fontSize: 12 }}>
                    {quitando === "adelantado" ? <Cargando>Reembolsando...</Cargando> : "Cancelar y reembolsar"}
                  </button>
                </div>
              )}
            </Nota>
          )}

          <button className={cls("primario")} style={btn()} disabled={!puede_gestionar} onClick={() => setOpenPlanes(true)}>
            {sinPlanVigente ? "Elegir y pagar un plan" : "Mejorar o cambiar de plan"}
          </button>

          {politica?.puede_adelantar && !adelantado && !cancelacion && (
            <button className={cls("secundario")} style={btn()} disabled={!puede_gestionar} onClick={() => setOpenPlanes(true)}>
              Renovar ahora (sin perder días)
            </button>
          )}

          {/* CANCELAR */}
          {hayPlanPago && !cancelacion && (
            <div style={{ borderTop: "1px dashed #e3b4ae", paddingTop: 14, marginTop: 2 }}>
              <button className={cls("peligro")} style={btn()} disabled={!puede_gestionar}
                onClick={() => { setOpcion("fin"); setEntiendo(false); setDialogo(true); }}>
                Cancelar suscripción
              </button>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginTop: 8 }}>
                {politica?.puede_reembolso
                  ? `Tienes hasta el ${fmtFecha(politica.reembolso_hasta)} para pedir reembolso de ${fmtMonto(politica.reembolso_estimado)}.`
                  : politica?.es_anual
                    ? "Los planes anuales se pueden cancelar, pero no se reembolsan."
                    : "Se cancela al terminar tu periodo, sin más cobros ni reembolso."}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ───────── POLÍTICAS ───────── */}
      <div style={{ ...caja, marginTop: 60 }}>
        <button className="mp-link" onClick={() => setVerPoliticas((v) => !v)} style={{
          width: "100%", display: "flex", justifyContent: "space-between", background: "none", border: "none",
          fontWeight: 800, color: "#0F4C3A", fontSize: 16, cursor: "pointer", padding: 0,
        }}>
          Políticas de cambios, cancelación y reembolsos <span>{verPoliticas ? "−" : "+"}</span>
        </button>
        {verPoliticas && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 14 }}>
            {POLITICAS.map((p) => (
              <div key={p.titulo} style={{ background: "#f6f9f7", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontWeight: 800, fontSize: 12.5, color: "#0F4C3A", marginBottom: 3 }}>{p.titulo}</div>
                <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.55 }}>{p.texto}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ───────── DIÁLOGO DE CANCELACIÓN ───────── */}
      {dialogo && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, padding: 20, background: "rgba(4,30,23,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...caja, maxWidth: 480, width: "100%", padding: 26 }}>
            <h4 style={{ margin: "0 0 12px", color: "#C0392B", fontWeight: 800 }}>Cancelar suscripción</h4>

            <label className="mp-opcion" style={{ display: "flex", gap: 10, padding: "12px 13px", border: `1.5px solid ${opcion === "fin" ? "#0F4C3A" : "#e3e9e5"}`, borderRadius: 12, cursor: "pointer", marginBottom: 10 }}>
              <input type="radio" checked={opcion === "fin"} onChange={() => setOpcion("fin")} style={{ marginTop: 3 }} />
              <span style={{ fontSize: 13, color: "#334155", lineHeight: 1.55 }}>
                <strong>Cancelar al terminar el periodo</strong> ({fmtFecha(plan?.fin)}). Sigues con todo incluido hasta esa fecha y no hay más cobros. {politica?.es_anual ? "Los planes anuales no se reembolsan." : "No incluye reembolso."}
              </span>
            </label>

            {politica?.puede_reembolso && (
              <label className="mp-opcion" style={{ display: "flex", gap: 10, padding: "12px 13px", border: `1.5px solid ${opcion === "reembolso" ? "#C0392B" : "#e3e9e5"}`, borderRadius: 12, cursor: "pointer", marginBottom: 10 }}>
                <input type="radio" checked={opcion === "reembolso"} onChange={() => setOpcion("reembolso")} style={{ marginTop: 3 }} />
                <span style={{ fontSize: 13, color: "#334155", lineHeight: 1.55 }}>
                  <strong>Cancelar ahora y pedir reembolso</strong> de {fmtMonto(politica.reembolso_estimado)} (la parte no usada).{" "}
                  {politica.reembolso_automatico
                    ? "Se reembolsa a tu tarjeta en 5 a 10 días hábiles y tu acceso se pausa de inmediato."
                    : "Como ya usaste tu reembolso automático, lo revisa soporte (máximo 48 horas) y tu plan sigue activo mientras tanto."}
                </span>
              </label>
            )}

            {!politica?.puede_reembolso && politica?.reembolso_motivo && (
              <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px" }}>{politica.reembolso_motivo}</p>
            )}

            {opcion === "reembolso" && politica?.reembolso_automatico && (
              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "#334155", margin: "4px 0 12px", cursor: "pointer" }}>
                <input type="checkbox" checked={entiendo} onChange={(e) => setEntiendo(e.target.checked)} style={{ marginTop: 3 }} />
                Entiendo que mi acceso se pausará ahora.
              </label>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className={cls("primario")} style={btn()} disabled={ocupado} onClick={() => setDialogo(false)}>Volver</button>
              <button className={cls("peligro", ocupado)} style={btn()} disabled={bloqueoCancelar} onClick={confirmarCancelacion}>
                {ocupado ? <Cargando>Procesando...</Cargando> : opcion === "reembolso" ? "Cancelar y reembolsar" : "Cancelar al vencer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalPlanes open={openPlanes} onClose={() => setOpenPlanes(false)} onLogout={() => setOpenPlanes(false)} />
      <ResultadoPagoModal resultado={resultado} onClose={cerrarResultado} />
    </div>
  );
}