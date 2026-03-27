import CloseIcon   from "@mui/icons-material/Close";
import DiamondIcon from "@mui/icons-material/Diamond";
import CheckIcon   from "@mui/icons-material/Check";
import logo from "../assets/Logo.png";
import "../css/BalamCoreModal.css";

const ModalBienvenida = ({ open, onClose, nombre }) => {
  if (!open) return null;

  return (
    <div className="balam-overlay">
      <div style={{
        background: "#fff",
        borderRadius: 20,
        maxWidth: 500,
        width: "100%",
        position: "relative",
        boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
        animation: "balamFade 0.28s cubic-bezier(0.34,1.3,0.64,1)",
        overflow: "hidden",
      }}>

        {/* BARRA VERDE TOP */}
        <div style={{
          height: 4,
          background: "linear-gradient(90deg, #0F4C3A, #295E4E)",
        }} />

        {/* X */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "#F3F4F6", border: "none",
            borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#6B7280",
          }}
        >
          <CloseIcon style={{ fontSize: 18 }} />
        </button>

        {/* BODY */}
        <div style={{ padding: "32px 28px", textAlign: "center" }}>

          <img src={logo} style={{ width: 70, marginBottom: 16 }} alt="BalamCore" />

          <h2 style={{
            fontSize: "1.4rem", fontWeight: 900,
            color: "#1f2d2a", margin: "0 0 8px",
          }}>
            ¡Bienvenido a BalamCore{nombre ? `, ${nombre}` : ""}!
          </h2>

          <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 24 }}>
            Tu cuenta ha sido creada exitosamente. Estás disfrutando de
          </p>

          {/* BADGE PRO */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(15,76,58,0.08)", borderRadius: 50,
            padding: "10px 24px", marginBottom: 24,
          }}>
            <DiamondIcon style={{ color: "#0F4C3A", fontSize: 22 }} />
            <span style={{ fontWeight: 800, color: "#0F4C3A", fontSize: 16 }}>
              15 días gratis del Plan Pro
            </span>
          </div>

          {/* LO QUE INCLUYE */}
          <div style={{
            background: "#F9FAFB", borderRadius: 12,
            padding: "16px 20px", marginBottom: 24,
            border: "1px solid #E5E7EB", textAlign: "left",
          }}>
            <p style={{ margin: "0 0 10px", fontWeight: 700, color: "#1f2d2a", fontSize: 13 }}>
              Tu prueba incluye acceso completo a:
            </p>
            {[
              "Dashboard con estadísticas",
              "Gestión de pólizas y siniestros",
              "Clientes, empleados y bienes",
              "Reportes y renovaciones",
              "Todos los módulos del sistema",
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, color: "#1f2d2a", marginBottom: 6,
              }}>
                <CheckIcon style={{ fontSize: 15, color: "#0F4C3A" }} />
                {item}
              </div>
            ))}
          </div>

          <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 24 }}>
            Después de los 15 días podrás elegir el plan que mejor se adapte a tu aseguradora.
          </p>

          <button
            onClick={onClose}
            className="balam-btn save"
            style={{ width: "100%", padding: "12px 0", fontSize: 15 }}
          >
            ¡Comenzar ahora!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalBienvenida;