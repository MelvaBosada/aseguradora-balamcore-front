import { useEffect, useState } from "react";
import usePermisos from "../hooks/usePermisos";
import DiamondIcon from "@mui/icons-material/Diamond";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import BlockIcon from "@mui/icons-material/Block";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import axios from "axios";
import logo from "../assets/LogoA.png";

const API = import.meta.env.VITE_API_URL || '/api';

const ModalPlanes = ({ open, onClose, onLogout }) => {
  const [planes, setPlanes]   = useState([]);
  const [hovered, setHovered] = useState(null);
  const [anual, setAnual]     = useState(false);
  const [pagando, setPagando] = useState(null);

  const {
    esPrueba,
    vencida,
    planPagadoVencido,
    diasRestantes,
    suscripcion,
    iniciarPago,
  } = usePermisos();

  const dias         = diasRestantes();
  const tienePlan    = !esPrueba && suscripcion?.estatus === "activa";
  const duracionTotal =
    suscripcion?.fecha_inicio_plan && suscripcion?.fecha_fin_plan
      ? Math.round(
          (new Date(suscripcion.fecha_fin_plan) - new Date(suscripcion.fecha_inicio_plan)) /
          (1000 * 60 * 60 * 24)
        )
      : 30;
  const progreso = tienePlan
    ? Math.max(0, Math.min(100, (dias / duracionTotal) * 100))
    : 0;

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  if (!open) return null;

  // Si está vencido (trial o plan pagado), X = logout; si no, X = cerrar
  const handleClose = () => {
    if (vencida) onLogout();
    else onClose();
  };

const handleContratar = async (plan) => {
  setPagando(plan.id);
  try {
    await iniciarPago(plan.id, anual ? "anual" : "mensual");
  } catch {
    setPagando(null);
    alert("Error al procesar el pago. Intenta de nuevo.");
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

  // ── Textos del header según el contexto ──────────────
  const headerTexto = (() => {
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
    if (tienePlan) {
      return {
        titulo:    "Gestiona tu plan",
        subtitulo: null, // se muestra la barra de progreso en su lugar
      };
    }
    return {
      titulo:    "Elige tu plan",
      subtitulo: `Te quedan ${dias} día${dias === 1 ? "" : "s"} de tu prueba gratuita`,
    };
  })();

  
  return (
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
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
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

          {/* Barra de progreso si tiene plan activo vigente */}
          {tienePlan && !planPagadoVencido ? (
            <div style={{ margin: "0 auto 20px", maxWidth: 320 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
                <WorkspacePremiumIcon style={{ fontSize: 16, color: "#D4AF37" }} />
                <span style={{ color: "#D4AF37", fontSize: 14, fontWeight: 700 }}>
                  Plan {suscripcion?.plan}
                </span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>activo</span>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.08)", borderRadius: 99,
                height: 6, overflow: "hidden", marginBottom: 6,
              }}>
                <div style={{
                  width: `${progreso}%`,
                  height: "100%",
                  borderRadius: 99,
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
            </div>
          ) : (
            headerTexto.subtitulo && (
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, margin: "0 0 20px" }}>
                {headerTexto.subtitulo}
              </p>
            )
          )}

          {/* TOGGLE MENSUAL / ANUAL */}
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
        </div>

        {/* PLANES */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16, padding: "0 24px 32px", alignItems: "stretch",
        }}>
          {planes.map((plan) => {
            const precioMostrar = anual ? plan.precio_anual : plan.precio;
            const periodoLabel  = anual ? "/año" : "/mes";
            const esPlanActual  =
              suscripcion?.id_plan === plan.id &&
              suscripcion?.periodo === (anual ? "anual" : "mensual") &&
              !planPagadoVencido; // si venció, ninguno es "actual" para forzar la compra

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
                    background: "linear-gradient(90deg, #D4AF37, #f0d060)",
                    color: "#0F2E22",
                    fontSize: 10, fontWeight: 800, padding: "3px 10px",
                    borderRadius: 10, alignSelf: "flex-start", marginBottom: 8,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <WorkspacePremiumIcon style={{ fontSize: 11 }} />
                    Plan actual
                  </div>
                )}

                {/* Badge "Vencido" para el plan que expiró */}
                {planPagadoVencido && suscripcion?.id_plan === plan.id && (
                  <div style={{
                    background: "rgba(220,38,38,0.15)",
                    border: "1px solid rgba(220,38,38,0.4)",
                    color: "#f87171",
                    fontSize: 10, fontWeight: 800, padding: "3px 10px",
                    borderRadius: 10, alignSelf: "flex-start", marginBottom: 8,
                    display: "flex", alignItems: "center", gap: 4,
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

                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 14 }}>
                  {plan.descripcion}
                </p>

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

                {/* MÓDULOS */}
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

                {/* LÍMITES */}
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

                {/* BOTÓN */}
                <button
                  onClick={() => !esPlanActual && handleContratar(plan)}
                  disabled={esPlanActual || pagando === plan.id}
                  style={{
                    width: "100%", padding: "11px 0",
                    borderRadius: 10,
                    border: esPlanActual
                      ? "1.5px solid rgba(212,175,55,0.5)"
                      : "1.5px solid rgba(255,255,255,0.2)",
                    background: esPlanActual
                      ? "rgba(212,175,55,0.12)"
                      : hovered === plan.id ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.08)",
                    color: esPlanActual ? "#D4AF37" : hovered === plan.id ? "#0F4C3A" : "#fff",
                    fontWeight: 700, fontSize: 13,
                    cursor: esPlanActual ? "default" : "pointer",
                    transition: "all 0.25s", marginTop: "auto",
                    opacity: pagando === plan.id ? 0.6 : 1,
                  }}
                >
                  {pagando === plan.id
                    ? "Procesando..."
                    : esPlanActual
                      ? `✓ Plan activo · ${dias}d restantes`
                      : planPagadoVencido && suscripcion?.id_plan === plan.id
                        ? `Renovar ${anual ? "anual" : "mensual"}`
                        : suscripcion?.id_plan === plan.id
                          ? `Cambiar a ${anual ? "anual" : "mensual"}`
                          : `Contratar ${anual ? "anual" : "mensual"}`
                  }
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ModalPlanes;