import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import HomeIcon from "@mui/icons-material/Home";
import BadgeIcon from "@mui/icons-material/Badge";
import CakeIcon from "@mui/icons-material/Cake";
import WcIcon from "@mui/icons-material/Wc";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PublicIcon from "@mui/icons-material/Public";
import WorkIcon from "@mui/icons-material/Work";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import MapIcon from "@mui/icons-material/Map";
import LocalPostOfficeIcon from "@mui/icons-material/LocalPostOffice";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DateRangeIcon from "@mui/icons-material/DateRange";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PaymentIcon from "@mui/icons-material/Payment";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import NotesIcon from "@mui/icons-material/Notes";
import InfoIcon from "@mui/icons-material/Info";
import "../css/BalamCoreModal.css";
import "../css/ClienteDetalleModal.css";

function ClienteDetalleModal({ open, onClose, titulo, subtitulo, avatar, items, cliente }) {
  if (!open) return null;

  // Si es una póliza (tiene items de póliza)
  const isPoliza = items && items.some(item => 
    item.label === "N° Póliza" || item.label === "Suma asegurada"
  );

  // Si es un cliente (tiene propiedades de cliente)
  const isCliente = cliente && (cliente.nombre || cliente.apellidos);

  // Construir items para cliente
  const getItemsFromCliente = () => {
    if (!cliente) return [];
    
    return [
      { icon: <PersonIcon />, label: "NOMBRE COMPLETO", value: `${cliente.nombre || ''} ${cliente.apellido || cliente.apellidos || ''}`.trim() },
      { icon: <PhoneIcon />, label: "TELÉFONO", value: cliente.telefono || cliente.numero_de_telefono || "—" },
      { icon: <EmailIcon />, label: "CORREO", value: cliente.correo || "—" },
      { icon: <HomeIcon />, label: "DOMICILIO", value: cliente.domicilio || "—" },
      { icon: <BadgeIcon />, label: "CURP", value: cliente.curp || "—" },
      { icon: <BadgeIcon />, label: "RFC", value: cliente.rfc || "—" },
      { icon: <CakeIcon />, label: "FECHA DE NACIMIENTO", value: cliente.fecha_nacimiento || "—" },
      { icon: <WcIcon />, label: "GÉNERO", value: cliente.genero || "—" },
      { icon: <FavoriteIcon />, label: "ESTADO CIVIL", value: cliente.estado_civil || "—" },
      { icon: <PublicIcon />, label: "NACIONALIDAD", value: cliente.nacionalidad || "Mexicana" },
      { icon: <WorkIcon />, label: "OCUPACIÓN", value: cliente.ocupacion || "—" },
      { icon: <LocationCityIcon />, label: "MUNICIPIO", value: cliente.municipio || "—" },
      { icon: <MapIcon />, label: "ESTADO", value: cliente.estado || "—" },
      { icon: <LocalPostOfficeIcon />, label: "CÓDIGO POSTAL", value: cliente.codigo_postal || "—" },
    ];
  };

  // Determinar qué mostrar
  let displayItems = items;
  let displayTitulo = titulo;
  let displaySubtitulo = subtitulo;
  let displayAvatar = avatar;

  if (isCliente) {
    displayItems = getItemsFromCliente();
    displayTitulo = displayTitulo || `${cliente.nombre || ''} ${cliente.apellido || cliente.apellidos || ''}`.trim();
    displaySubtitulo = displaySubtitulo || `ID #${cliente.id}`;
    displayAvatar = displayAvatar || (cliente.nombre?.charAt(0) || 'C');
  }

  if (isPoliza) {
    displayAvatar = displayAvatar || "P";
  }

  return (
    <div className="balam-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="balam-modal detalle-modal">

        {/* HEADER */}
        <div className="detalle-header">
          <div className="detalle-avatar">{displayAvatar}</div>
          <div className="detalle-header-text">
            <h2>{displayTitulo}</h2>
            <span className="detalle-id">{displaySubtitulo}</span>
          </div>
          <button className="detalle-close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* BODY */}
        <div className="detalle-body">
          {displayItems?.map((item, i) => (
            <div key={i} className="detalle-item">
              <div className="detalle-icon">{item.icon}</div>
              <div className="detalle-item-text">
                <span className="detalle-label">{item.label}</span>
                <span className="detalle-value">{item.value || "—"}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="balam-footer" style={{ borderTop: "1px solid #E5E7EB" }}>
          <button className="balam-btn cancel" onClick={onClose}>Cerrar</button>
        </div>

      </div>
    </div>
  );
}

export default ClienteDetalleModal;