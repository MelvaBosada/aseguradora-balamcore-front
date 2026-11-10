import { useEffect, useState } from "react";
import usePermisos from "../context/PermisosContext";
import DiamondIcon from "@mui/icons-material/Diamond";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import BlockIcon from "@mui/icons-material/Block";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import axios from "axios";
import ResultadoPagoModal from "./ResultadoPagoModal";
import { POLITICAS } from "../constants/politicasPlan";
import { fmtFecha, fmtMonto } from "../utils/planFormat";

const API = import.meta.env.VITE_API_URL || '/api';
const DIAS_AVISO = 7;
const ACTIVOS = ["activa", "activo"];

const ModalPlanes = ({ open, onClose, onLogout }) => {
  const [planes, setPlanes]         = useState([]);
  const [hovered, setHovered]       = useState(null);
  const [anual, setAnual]           = useState(false);
  const [pagando, setPagando]       = useState(false);
  const [cotizando, setCotizando]   = useState(null);
  const [cotizacion, setCotizacion] = useState(null);
  const [aviso, setAviso]           = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [resultado, setResultado]   = useState(null);
  const [activarAuto, setActivarAuto] = useState(false);
  const [verPoliticas, setVerPoliticas] = useState(false);
  const [, setTick]                 = useState(0);

  const {
    vencida,
    planPagadoVencido,
    diasRestantes,
    suscripcion,
    iniciarPago,
    cotizarCambio,
    cancelarCambio,
    refrescarSuscripcion,
  } = usePermisos();

  const dias          = diasRestantes();
  const esPago        = ACTIVOS.includes(suscripcion?.estatus);
  const planVigente   = esPago && !planPagadoVencido;
  const cancelado     = suscripcion?.estatus === "cancelada";
  const periodoSel    = anual ? "anual" : "mensual";
  const periodoActual = suscripcion?.periodo || "mensual";
  const cambio        = planVigente ? suscripcion?.cambio_pendiente : null;
  const adelantado    = planVigente ? suscripcion?.programada : null;
  const sinAuto       = !suscripcion?.renovacion_auto;
  const duracionTotal =
    suscripcion?.fecha_inicio_plan && suscripcion?.fecha_fin_plan
      ? Math.round(
          (new Date(suscripcion.fecha_fin_plan) - new Date(suscripcion.fecha_inicio_plan)) /
          (1000 * 60 * 60 * 24)
        )
      : 30;
  const progreso = planVigente
    ? Math.max(0, Math.min(100, (dias / duracionTotal) * 100))
    : 0;

  // Al abrir: limpia estados, refresca la suscripción y carga los planes
  useEffect(() => {
    if (!open) return;
    setCotizacion(null);
    setCotizando(null);
    setPagando(false);
    setAviso("");
    setResultado(null);
    setActivarAuto(false);

    refrescarSuscripcion().then(() => setTick((t) => t + 1)).catch(() => {});

    const cargar = async () => {
      try {
        const token = localStorage.getItem("token");
        const res   = await axios.get(`${API}/planes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const planesConModulos = await Promise.all(
          res.data.map(async (plan) => {
            const resMod = await axios.get(
             `${API}/planes/${plan.id}/modulos`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return { ...plan, modulos: resMod.data };
          })
        );
        setPlanes(planesConModulos);
      } catch (err) {
        console.error("Error al cargar planes:", err);
      }
    };
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  // Si está vencido (trial o plan pagado), X = logout; si no, X = cerrar
  const handleClose = () => {
    if (vencida) onLogout();
    else onClose();
  };

  const esMejora = (plan) =>
    suscripcion?.id_plan === plan.id
      ? periodoActual === "mensual" && periodoSel === "anual"
      : Number(plan.precio || 0) > Number(suscripcion?.precio || 0);

  // Qué hace el botón de cada plan
  const accionPlan = (plan) => {
    if (!planVigente) {
      const eraEste = planPagadoVencido && suscripcion?.id_plan === plan.id;
      return { texto: `${eraEste ? "Renovar" : "Contratar"} ${periodoSel}`, deshabilitado: false };
    }

    if (adelantado) return { texto: "Pago adelantado activo", deshabilitado: true };

    const mismoPlan    = suscripcion?.id_plan === plan.id;
    const mismoPeriodo = periodoActual === periodoSel;

    if (mismoPlan && mismoPeriodo) {
      if (dias <= DIAS_AVISO) return { texto: "Renovar por adelantado", deshabilitado: false };
      return { texto: `✓ Plan actual · ${dias}d restantes`, deshabilitado: true };
    }

    if (esMejora(plan)) return { texto: "Mejorar ahora", deshabilitado: false };

    if (cambio && cambio.id_plan === plan.id && cambio.periodo === periodoSel) {
      return { texto: "✓ Cambio programado", deshabilitado: true };
    }

    return { texto: "Cambiar al vencer mi plan", deshabilitado: false };
  };

  // Paso 1: pedir el resumen al backend
  const handleElegir = async (plan) => {
    setAviso("");
    setCotizando(plan.id);
    try {
      setCotizacion(await cotizarCambio(plan.id, periodoSel));
      setActivarAuto(false);
    } catch (err) {
      setAviso(err.response?.data?.message || "No se pudo calcular el cambio. Intenta de nuevo.");
    } finally {
      setCotizando(null);
    }
  };

  // Desde "programar": ver el resumen de pagarlo por adelantado
  const handlePagarAhora = async () => {
    setAviso("");
    setPagando(true);
    try {
      setCotizacion(await cotizarCambio(cotizacion.plan.id, cotizacion.periodo, true));
    } catch (err) {
      setAviso(err.response?.data?.message || "No se pudo calcular el pago.");
    } finally {
      setPagando(false);
    }
  };

  // Paso 2: confirmar (cobra en Stripe, aplica directo o programa)
  const handleConfirmar = async () => {
    if (!cotizacion) return;
    setPagando(true);
    let redirigiendo = false;

    try {
      const adelantar = ["adelantado", "renovar"].includes(cotizacion.tipo);
      const quiereAuto = cotizacion.requiere_pago && sinAuto && activarAuto;
      const r = await iniciarPago(cotizacion.plan.id, cotizacion.periodo, adelantar, quiereAuto);

      if (r?.url) {
        redirigiendo = true;
      } else if (r?.programado) {
        await refrescarSuscripcion().catch(() => {});
        setCotizacion(null);
        setResultado({ ok: true, kind: "programado", ...r });
      } else if (r?.aplicado) {
        setCotizacion(null);
        setResultado({ ok: true, kind: "pago", ...r.resultado });
      }
    } catch (err) {
      setCotizacion(null);
      setAviso(err.response?.data?.message || "No se pudo completar. Intenta de nuevo.");
    } finally {
      if (!redirigiendo) setPagando(false);
    }
  };

  const handleCancelarCambio = async (conReembolso) => {
    const msg = conReembolso
      ? "¿Cancelar tu pago adelantado? Se te reembolsa el 100%."
      : "¿Cancelar el cambio programado? No se había cobrado nada.";
    if (!window.confirm(msg)) return;

    setCancelando(true);
    setAviso("");
    try {
      const r = await cancelarCambio();
      setAviso(r?.message || "Cambio cancelado.");
      setTick((t) => t + 1);
    } catch (err) {
      setAviso(err.response?.data?.message || "No se pudo cancelar el cambio.");
    } finally {
      setCancelando(false);
    }
  };

  const renderLimites = (plan) => {
    const limites = [];
    if (plan.limite_polizas_vencer_dia)
      limites.push({ texto: `Hasta ${plan.limite_polizas_vencer_dia} pólizas a vencer por día`, limitado: true });
    else
      limites.push({ texto: "Pólizas a vencer sin límite", limitado: false });

    if (plan.limite_siniestros_mes)
      limites.push({ texto: `Hasta ${plan.limite_siniestros_mes} siniestros al mes`, limitado: true });
    else
      limites.push({ texto: "Siniestros ilimitados", limitado: false });

    if (plan.limite_bienes_por_cliente)
      limites.push({ texto: `Hasta ${plan.limite_bienes_por_cliente} bienes por cliente`, limitado: true });
    else
      limites.push({ texto: "Bienes por cliente sin límite", limitado: false });

    limites.push({
      texto: plan.pdf_ilimitado ? "Descargas PDF ilimitadas" : "Descargas PDF limitadas",
      limitado: !plan.pdf_ilimitado,
    });

    if (plan.soporte_prioritario)
      limites.push({ texto: "Soporte prioritario", limitado: false });

    return limites;
  };

  const headerTexto = (() => {
    if (cotizacion) return { titulo: "Confirma tu cambio", subtitulo: null };
    if (cancelado) {
      return { titulo: "Tu plan fue cancelado", subtitulo: "Elige un plan para volver a usar BalamCore" };
    }
    if (planPagadoVencido) {
      return {
        titulo:    "Tu plan ha vencido",
        subtitulo: `Tu plan ${suscripcion?.plan ?? ""} expiró. Renuévalo para seguir usando BalamCore.`,
      };
    }
    if (vencida) {
      return {
        titulo:    "Tu periodo de prueba ha terminado",
        subtitulo: "Selecciona un plan para seguir usando BalamCore",
      };
    }
    if (planVigente) return { titulo: "Gestiona tu plan", subtitulo: null };
    return {
      titulo:    "Elige tu plan",
      subtitulo: `Te quedan ${dias} día${dias === 1 ? "" : "s"} de tu prueba gratuita`,
    };
  })();

  const filaResumen = (label, valor, extra = {}) => (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 16,
      padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.07)",
      fontSize: 13, ...extra,
    }}>
      <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
      <span style={{ color: extra.color || "#fff", fontWeight: 600, textAlign: "right" }}>{valor}</span>
    </div>
  );

  const bannerStyle = {
    margin: "0 auto 18px", maxWidth: 460, textAlign: "left",
    background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)",
    borderRadius: 14, padding: "14px 16px",
  };

  const botonBanner = {
    padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
    border: "1px solid rgba(248,113,113,0.5)", background: "rgba(220,38,38,0.12)",
    color: "#f87171", cursor: cancelando ? "default" : "pointer", opacity: cancelando ? 0.6 : 1,
  };

  return (
    <>
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(4, 30, 23, 0.82)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div
        className="modal-planes-inner"
        style={{
          background: "linear-gradient(160deg, #0a1f18, #0F2E22)",
          maxWidth: 980, width: "100%",
          maxHeight: "92vh", overflowY: "auto", overflowX: "hidden",
          position: "relative",
          boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.15) transparent",
        }}
      >
        <style>{`
          .modal-planes-inner::-webkit-scrollbar { width: 4px; }
          .modal-planes-inner::-webkit-scrollbar-track { background: transparent; }
          .modal-planes-inner::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        `}</style>

        {/* BOTÓN X */}
        <button
          onClick={handleClose}
          style={{
            position: "sticky", top: 16, float: "right", marginRight: 16,
            width: 36, height: 36, borderRadius: "50%",
            border: vencida ? "2px solid #C0392B" : "2px solid rgba(255,255,255,0.15)",
            background: vencida ? "rgba(192,57,43,0.15)" : "rgba(255,255,255,0.07)",
            color: vencida ? "#C0392B" : "rgba(255,255,255,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.2s", zIndex: 10,
          }}
        >
          <CloseIcon style={{ fontSize: 18 }} />
        </button>

        {/* HEADER */}
        <div style={{ textAlign: "center", padding: "32px 28px 20px" }}>
          <h2 style={{
            fontSize: "1.7rem", fontWeight: 900, color: "#fff",
            margin: "0 0 8px", letterSpacing: "-0.03em",
          }}>
            {headerTexto.titulo}
          </h2>

          {!cotizacion && planVigente ? (
            <div style={{ margin: "0 auto 20px", maxWidth: 340 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
                <WorkspacePremiumIcon style={{ fontSize: 16, color: "#D4AF37" }} />
                <span style={{ color: "#D4AF37", fontSize: 14, fontWeight: 700 }}>Plan {suscripcion?.plan}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>activo</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 6, overflow: "hidden", marginBottom: 6 }}>
                <div style={{
                  width: `${progreso}%`, height: "100%", borderRadius: 99,
                  background: dias <= 7
                    ? "linear-gradient(90deg, #e74c3c, #c0392b)"
                    : "linear-gradient(90deg, #D4AF37, #f0d060)",
                  transition: "width 0.5s ease",
                }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <AccessTimeIcon style={{ fontSize: 12, color: dias <= 7 ? "#e74c3c" : "rgba(255,255,255,0.4)" }} />
                <span style={{ color: dias <= 7 ? "#e74c3c" : "rgba(255,255,255,0.45)", fontSize: 11 }}>
                  {dias <= 0 ? "Vence hoy" : `Vence en ${dias} día${dias === 1 ? "" : "s"}`}
                </span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "10px 0 0" }}>
                Mejorar es inmediato y descontamos lo que no usaste. Bajar de plan se aplica al terminar tu periodo.{" "}
                {suscripcion?.renovacion_auto ? "Tu renovación automática está activada." : "Tu plan no se renueva solo."}
              </p>
            </div>
          ) : (
            headerTexto.subtitulo && (
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, margin: "0 0 20px" }}>{headerTexto.subtitulo}</p>
            )
          )}

          {!cotizacion && cambio && (
            <div style={bannerStyle}>
              <div style={{ color: "#D4AF37", fontSize: 12, fontWeight: 800, marginBottom: 4 }}>CAMBIO PROGRAMADO</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 10 }}>
                Pasarás a {cambio.plan} ({cambio.periodo}) el {fmtFecha(suscripcion?.fecha_fin_plan)}. No se ha cobrado nada.
              </div>
              <button onClick={() => handleCancelarCambio(false)} disabled={cancelando} style={botonBanner}>
                {cancelando ? "Cancelando..." : "Cancelar cambio"}
              </button>
            </div>
          )}

          {!cotizacion && adelantado && (
            <div style={bannerStyle}>
              <div style={{ color: "#D4AF37", fontSize: 12, fontWeight: 800, marginBottom: 4 }}>PAGO ADELANTADO</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 10 }}>
                Plan {adelantado.plan} ({adelantado.periodo}) empieza el {fmtFecha(adelantado.fecha_inicio_plan)}.
              </div>
              <button onClick={() => handleCancelarCambio(true)} disabled={cancelando} style={botonBanner}>
                {cancelando ? "Cancelando..." : "Cancelar y reembolsar"}
              </button>
            </div>
          )}

          {aviso && (
            <div style={{
              margin: "0 auto 16px", maxWidth: 460,
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.35)",
              color: "#fbbf24", borderRadius: 10, padding: "10px 14px", fontSize: 13,
            }}>
              {aviso}
            </div>
          )}

          {!cotizacion && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.07)", borderRadius: 30, padding: "5px 6px",
            }}>
              <button onClick={() => setAnual(false)} style={{
                padding: "6px 18px", borderRadius: 24, border: "none",
                background: !anual ? "#fff" : "transparent",
                color: !anual ? "#0F4C3A" : "rgba(255,255,255,0.55)",
                fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s",
              }}>
                Mensual
              </button>
              <button onClick={() => setAnual(true)} style={{
                padding: "6px 18px", borderRadius: 24, border: "none",
                background: anual ? "#fff" : "transparent",
                color: anual ? "#0F4C3A" : "rgba(255,255,255,0.55)",
                fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                Anual
                <span style={{
                  background: "#4ade80", color: "#0F4C3A",
                  fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 10,
                }}>
                  Ahorra
                </span>
              </button>
            </div>
          )}
        </div>

        {/* RESUMEN DEL CAMBIO */}
        {cotizacion && (
          <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 24px 36px" }}>
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1.5px solid rgba(255,255,255,0.12)",
              borderRadius: 18, padding: "10px 20px 16px",
            }}>
              {filaResumen("Plan", `${cotizacion.plan.nombre} · ${cotizacion.periodo}`)}
              {filaResumen("Empieza", fmtFecha(cotizacion.inicia))}
              {filaResumen("Vence", fmtFecha(cotizacion.vence))}
              {cotizacion.credito > 0 &&
                filaResumen("Crédito por tiempo no usado", `- ${fmtMonto(cotizacion.credito)}`, { color: "#4ade80" })}
              {cotizacion.dias_extra > 0 &&
                filaResumen("Días adicionales por tu saldo", `+${cotizacion.dias_extra}`, { color: "#4ade80" })}
              {filaResumen(
                "Total a pagar hoy",
                cotizacion.requiere_pago ? fmtMonto(cotizacion.cargo) : "$0.00",
                { fontSize: 16, borderBottom: "none", paddingTop: 14 }
              )}

              <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.6 }}>
                {cotizacion.mensajes?.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>

            {cotizacion.requiere_pago && sinAuto && (
              <label style={{
                display: "flex", gap: 10, alignItems: "flex-start", marginTop: 14, cursor: "pointer",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, padding: "11px 13px", color: "rgba(255,255,255,0.75)", fontSize: 12.5, lineHeight: 1.5,
              }}>
                <input type="checkbox" checked={activarAuto} onChange={(e) => setActivarAuto(e.target.checked)} style={{ marginTop: 3 }} />
                <span>
                  <strong style={{ color: "#fff" }}>Renovar automáticamente.</strong> Guardamos tu tarjeta y cobramos tu plan
                  al vencer. Te avisamos antes y por correo si el cobro falla. Lo apagas cuando quieras en Mi plan.
                </span>
              </label>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <button
                onClick={() => setCotizacion(null)}
                disabled={pagando}
                style={{
                  flex: 1, minWidth: 90, padding: "11px 0", borderRadius: 10,
                  border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)",
                  color: "#fff", fontWeight: 700, fontSize: 13,
                  cursor: pagando ? "default" : "pointer", opacity: pagando ? 0.5 : 1,
                }}
              >
                Volver
              </button>

              {cotizacion.tipo === "programar" && cotizacion.puede_adelantar && (
                <button
                  onClick={handlePagarAhora}
                  disabled={pagando}
                  style={{
                    flex: 1.4, minWidth: 140, padding: "11px 0", borderRadius: 10,
                    border: "1.5px solid rgba(212,175,55,0.5)", background: "rgba(212,175,55,0.1)",
                    color: "#D4AF37", fontWeight: 700, fontSize: 13,
                    cursor: pagando ? "default" : "pointer", opacity: pagando ? 0.5 : 1,
                  }}
                >
                  Pagar por adelantado
                </button>
              )}

              <button
                onClick={handleConfirmar}
                disabled={pagando}
                style={{
                  flex: 2, minWidth: 160, padding: "11px 0", borderRadius: 10, border: "none",
                  background: "#fff", color: "#0F4C3A", fontWeight: 800, fontSize: 13,
                  cursor: pagando ? "default" : "pointer", opacity: pagando ? 0.6 : 1,
                }}
              >
                {pagando
                  ? "Procesando..."
                  : cotizacion.tipo === "programar"
                    ? "Programar cambio (sin cobro)"
                    : cotizacion.requiere_pago ? "Confirmar y pagar" : "Confirmar cambio"}
              </button>
            </div>
          </div>
        )}

        {/* PLANES */}
        {!cotizacion && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16, padding: "0 24px 20px", alignItems: "stretch",
          }}>
            {planes.map((plan) => {
              const precioMostrar = anual ? plan.precio_anual : plan.precio;
              const periodoLabel  = anual ? "/año" : "/mes";
              const esPlanActual  = planVigente && suscripcion?.id_plan === plan.id && periodoActual === periodoSel;
              const accion   = accionPlan(plan);
              const ocupado  = pagando || cotizando !== null;
              const activo   = !accion.deshabilitado && !ocupado;
              const esCambio = cambio && cambio.id_plan === plan.id && cambio.periodo === periodoSel;

              return (
                <div
                  key={plan.id}
                  onMouseEnter={() => setHovered(plan.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: esPlanActual
                      ? "rgba(212,175,55,0.06)"
                      : hovered === plan.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                    border: esPlanActual
                      ? "1.5px solid rgba(212,175,55,0.35)"
                      : hovered === plan.id ? "1.5px solid rgba(255,255,255,0.35)" : "1.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 18, padding: "22px 20px",
                    display: "flex", flexDirection: "column",
                    transition: "all 0.25s",
                    transform: hovered === plan.id ? "translateY(-4px)" : "translateY(0)",
                    boxShadow: hovered === plan.id ? "0 20px 40px rgba(0,0,0,0.3)" : "none",
                  }}
                >
                  {esPlanActual && (
                    <div style={{
                      background: "linear-gradient(90deg, #D4AF37, #f0d060)", color: "#0F2E22",
                      fontSize: 10, fontWeight: 800, padding: "3px 10px",
                      borderRadius: 10, alignSelf: "flex-start", marginBottom: 8,
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <WorkspacePremiumIcon style={{ fontSize: 11 }} />
                      Plan actual
                    </div>
                  )}

                  {esCambio && (
                    <div style={{
                      background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.4)",
                      color: "#D4AF37", fontSize: 10, fontWeight: 800, padding: "3px 10px",
                      borderRadius: 10, alignSelf: "flex-start", marginBottom: 8,
                    }}>
                      Cambio programado
                    </div>
                  )}

                  {planPagadoVencido && suscripcion?.id_plan === plan.id && (
                    <div style={{
                      background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.4)",
                      color: "#f87171", fontSize: 10, fontWeight: 800, padding: "3px 10px",
                      borderRadius: 10, alignSelf: "flex-start", marginBottom: 8,
                    }}>
                      Plan vencido — Renueva
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: esPlanActual
                        ? "rgba(212,175,55,0.15)"
                        : hovered === plan.id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <DiamondIcon style={{ fontSize: 16, color: esPlanActual ? "#D4AF37" : "#fff" }} />
                    </div>
                    <h3 style={{ margin: 0, fontWeight: 800, color: esPlanActual ? "#D4AF37" : "#fff", fontSize: "1rem" }}>
                      {plan.nombre}
                    </h3>
                  </div>

                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 14 }}>{plan.descripcion}</p>

                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: "1.9rem", fontWeight: 900, color: esPlanActual ? "#D4AF37" : "#fff" }}>
                      ${Number(precioMostrar).toLocaleString("es-MX")}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{periodoLabel}</span>
                    {anual && (
                      <div style={{ color: "#4ade80", fontSize: 11, marginTop: 2 }}>
                        Equivale a ${Math.round(plan.precio_anual / 12).toLocaleString("es-MX")}/mes
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
                      Módulos incluidos
                    </p>
                    {plan.modulos?.map(m => (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 5 }}>
                        <CheckIcon style={{ fontSize: 14, color: "#4ade80" }} />
                        {m.nombre}
                      </div>
                    ))}
                  </div>

                  <div style={{ flex: 1, marginBottom: 18 }}>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "10px 0 8px" }}>
                      Características
                    </p>
                    {renderLimites(plan).map((l, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: l.limitado ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.75)", marginBottom: 5 }}>
                        {l.limitado
                          ? <BlockIcon style={{ fontSize: 13, color: "#f59e0b" }} />
                          : <CheckIcon style={{ fontSize: 13, color: "#4ade80" }} />
                        }
                        {l.texto}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => activo && handleElegir(plan)}
                    disabled={!activo}
                    style={{
                      width: "100%", padding: "11px 0", borderRadius: 10,
                      border: esPlanActual ? "1.5px solid rgba(212,175,55,0.5)" : "1.5px solid rgba(255,255,255,0.2)",
                      background: esPlanActual
                        ? "rgba(212,175,55,0.12)"
                        : hovered === plan.id && activo ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.08)",
                      color: esPlanActual ? "#D4AF37" : hovered === plan.id && activo ? "#0F4C3A" : "#fff",
                      fontWeight: 700, fontSize: 13,
                      cursor: activo ? "pointer" : "not-allowed",
                      transition: "all 0.25s", marginTop: "auto",
                      opacity: cotizando === plan.id ? 0.6 : (!activo && !esPlanActual ? 0.55 : 1),
                    }}
                  >
                    {cotizando === plan.id ? "Calculando..." : accion.texto}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* POLÍTICAS */}
        {!cotizacion && (
          <div style={{ padding: "0 24px 28px" }}>
            <button
              onClick={() => setVerPoliticas((v) => !v)}
              style={{
                background: "none", border: "none", color: "rgba(255,255,255,0.55)",
                fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0,
              }}
            >
              {verPoliticas ? "Ocultar" : "Ver"} políticas de cambios y reembolsos
            </button>

            {verPoliticas && (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {POLITICAS.map((p) => (
                  <div key={p.titulo} style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: "12px 14px",
                  }}>
                    <div style={{ color: "#fff", fontSize: 12, fontWeight: 800, marginBottom: 3 }}>{p.titulo}</div>
                    <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.55 }}>{p.texto}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    <ResultadoPagoModal resultado={resultado} onClose={() => window.location.reload()} />
    </>
  );
};

export default ModalPlanes;