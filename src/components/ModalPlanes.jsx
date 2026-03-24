import { useEffect, useState } from "react";
import axios from "axios";
import usePermisos from "../hooks/usePermisos";
import DiamondIcon from "@mui/icons-material/Diamond";
import CheckIcon   from "@mui/icons-material/Check";
import CloseIcon   from "@mui/icons-material/Close";
import logo from "../assets/LogoA.png";

const ModalPlanes = ({ open, onClose, onLogout }) => {
  const [planes,  setPlanes]  = useState([]);
  const [hovered, setHovered] = useState(null);
  const { esPrueba, vencida, diasRestantes, suscripcion } = usePermisos();

  useEffect(() => {
    if (!open) return;
    const cargar = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/planes");
        const planesConModulos = await Promise.all(
          res.data.map(async (plan) => {
            const resMod = await axios.get(`http://localhost:8000/api/planes/${plan.id}/modulos`);
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

  const handleClose = () => {
    if (vencida) onLogout();
    else onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(4, 30, 23, 0.82)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "linear-gradient(160deg, #0a1f18, #0F2E22)",
        maxWidth: 980,
        width: "100%",
        maxHeight: "92vh",
        overflowY: "auto",
        overflowX: "hidden",
        position: "relative",
        boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.07)",
        // scrollbar bonito
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.15) transparent",
      }}>

        {/* WEBKIT SCROLLBAR */}
        <style>{`
          .modal-planes-inner::-webkit-scrollbar { width: 4px; }
          .modal-planes-inner::-webkit-scrollbar-track { background: transparent; }
          .modal-planes-inner::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
          .modal-planes-inner::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
        `}</style>

        {/* BOTON X */}
        <button
          onClick={handleClose}
          style={{
            position: "sticky", top: 16,
            float: "right", marginRight: 16,
            width: 36, height: 36,
            borderRadius: "50%",
            border: vencida ? "2px solid #C0392B" : "2px solid rgba(255,255,255,0.15)",
            background: vencida ? "rgba(192,57,43,0.15)" : "rgba(255,255,255,0.07)",
            color: vencida ? "#C0392B" : "rgba(255,255,255,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.2s",
            zIndex: 10,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = vencida ? "rgba(192,57,43,0.35)" : "rgba(255,255,255,0.15)";
            e.currentTarget.style.color = vencida ? "#e74c3c" : "#fff";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = vencida ? "rgba(192,57,43,0.15)" : "rgba(255,255,255,0.07)";
            e.currentTarget.style.color = vencida ? "#C0392B" : "rgba(255,255,255,0.6)";
          }}
        >
          <CloseIcon style={{ fontSize: 18 }} />
        </button>

        {/* HEADER */}
        <div style={{ textAlign: "center", padding: "32px 28px 24px" }}>
          <img src={logo} style={{ width: 80, marginBottom: 14, opacity: 0.95 }} alt="BalamCore" />
          <h2 style={{
            fontSize: "1.7rem", fontWeight: 900,
            color: "#fff", margin: "0 0 8px",
            letterSpacing: "-0.03em",
          }}>
            {vencida ? "Tu periodo de prueba ha terminado" : "Elige tu plan"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, margin: 0 }}>
            {vencida
              ? "Selecciona un plan para seguir usando BalamCore"
              : esPrueba
                ? `Te quedan ${diasRestantes()} días de tu prueba gratuita del Plan Pro`
                : `Plan actual: ${suscripcion?.plan}`
            }
          </p>
        </div>

        {/* PLANES */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          padding: "0 24px 32px",
          alignItems: "stretch",
        }}>
          {planes.map((plan) => (
            <div
              key={plan.id}
              onMouseEnter={() => setHovered(plan.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: hovered === plan.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                border: hovered === plan.id ? "1.5px solid rgba(255,255,255,0.35)" : "1.5px solid rgba(255,255,255,0.1)",
                borderRadius: 18,
                padding: "22px 20px",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.25s",
                transform: hovered === plan.id ? "translateY(-4px)" : "translateY(0)",
                boxShadow: hovered === plan.id ? "0 20px 40px rgba(0,0,0,0.3)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: hovered === plan.id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.25s",
                }}>
                  <DiamondIcon style={{ fontSize: 16, color: "#fff" }} />
                </div>
                <h3 style={{ margin: 0, fontWeight: 800, color: "#fff", fontSize: "1rem" }}>
                  {plan.nombre}
                </h3>
              </div>

              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 14 }}>
                {plan.descripcion}
              </p>

              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: "1.9rem", fontWeight: 900, color: "#fff" }}>
                  ${plan.precio}
                </span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>/mes</span>
              </div>

              <div style={{ flex: 1, marginBottom: 18 }}>
                {plan.modulos?.map(m => (
                  <div key={m.id} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 6,
                  }}>
                    <CheckIcon style={{ fontSize: 14, color: "#4ade80" }} />
                    {m.nombre}
                  </div>
                ))}
              </div>

              <button
                onClick={() => alert(`Por implementar con Stripe — Plan: ${plan.nombre}`)}
                style={{
                  width: "100%", padding: "11px 0",
                  borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.2)",
                  background: hovered === plan.id ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.08)",
                  color: hovered === plan.id ? "#0F4C3A" : "#fff",
                  fontWeight: 700, fontSize: 13,
                  cursor: "pointer", transition: "all 0.25s",
                  marginTop: "auto",
                }}
              >
                Contratar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModalPlanes;