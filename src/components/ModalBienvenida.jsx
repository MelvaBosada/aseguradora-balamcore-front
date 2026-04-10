import CloseIcon from "@mui/icons-material/Close";
import DiamondIcon from "@mui/icons-material/Diamond";
import CheckIcon from "@mui/icons-material/Check";
import logo from "../assets/Logo.png";
import "../css/BalamCoreModal.css";
import "../css/ModalBienvenida.css";

const ModalBienvenida = ({ open, onClose, nombre }) => {
  if (!open) return null;

  const features = [
    "Dashboard con estadísticas",
    "Gestión de pólizas y siniestros",
    "Clientes, empleados y bienes",
    "Reportes y renovaciones",
    "Todos los módulos del sistema",
  ];

  return (
    <div className="balam-overlay">
      <div className="balam-welcome-modal">

        <div className="balam-welcome-top-bar" />

        <button className="balam-welcome-close" onClick={onClose}>
          <CloseIcon style={{ fontSize: 18 }} />
        </button>

        <div className="balam-welcome-body">

          <img src={logo} className="balam-welcome-logo" alt="BalamCore" />

          <h2 className="balam-welcome-title">
            ¡Bienvenido a BalamCore{nombre ? `, ${nombre}` : ""}!
          </h2>

          <p className="balam-welcome-subtitle">
            Tu cuenta ha sido creada exitosamente. Estás disfrutando de
          </p>

          <div className="balam-welcome-badge">
            <DiamondIcon style={{ color: "#0F4C3A", fontSize: 22 }} />
            <span>15 días gratis del Plan Pro</span>
          </div>

          <div className="balam-welcome-features">
            <p className="balam-welcome-features-title">
              Tu prueba incluye acceso completo a:
            </p>
            <div className="balam-welcome-features-grid">
              {features.map((item, i) => (
                <div key={i} className="balam-welcome-feature-item">
                  <CheckIcon style={{ fontSize: 15, color: "#0F4C3A", flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="balam-welcome-note">
            Después de los 15 días podrás elegir el plan que mejor se adapte a tu aseguradora.
          </p>

          <button
            onClick={onClose}
            className="balam-btn save balam-welcome-cta"
          >
            ¡Comenzar ahora!
          </button>

        </div>
      </div>
    </div>
  );
};

export default ModalBienvenida;