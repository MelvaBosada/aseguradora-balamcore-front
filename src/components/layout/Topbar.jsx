import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DiamondIcon from "@mui/icons-material/Diamond";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ExploreIcon from "@mui/icons-material/Explore";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import LogoutIcon from "@mui/icons-material/Logout";

import IconButton from "../IconButton";
import usePermisos from "../../context/PermisosContext";
import "./layout.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Cambia por tu número real (código de país + número, sin + ni espacios)
const SOPORTE_WHATSAPP = "529994207396";

// Ícono de panel lateral estilo Jira: la flecha se voltea según el estado del menú
const SidebarToggleIcon = ({ collapsed }) => (
  <svg
    width="5"
    height="5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#C9A24D" /* <-- Aquí está el dorado para todo el ícono */
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* Marco del panel */}
    <rect x="3" y="3.5" width="18" height="17" rx="3" />

    {/* Línea que separa el panel lateral */}
    <line x1="9.5" y1="3.5" x2="9.5" y2="20.5" />

    {/* Flecha: "<" con el menú abierto, ">" con el menú retraído */}
    {collapsed ? (
      <path d="M5.3 9.5 L7.6 12 L5.3 14.5" />
    ) : (
      <path d="M7.6 9.5 L5.3 12 L7.6 14.5" />
    )}
  </svg>
);

const Topbar = ({ onToggleSidebar, onStartTour, collapsed }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const {
    usuario,
    esPrueba,
    diasRestantes,
    esAdmin,
    suscripcion,
    vencida,
    sincronizarSesion,
    tiene,
  } = usePermisos();

  const nombreMostrar = usuario.nombre
  ? `${usuario.nombre} ${usuario.apellidos || ""}`.trim()
  : esAdmin
    ? usuario.aseguradora || usuario.correo || "Usuario"
    : usuario.correo || "Usuario";

  const correoMostrar = usuario.correo || "";

  const inicialesMostrar = usuario.nombre
    ? `${usuario.nombre.charAt(0)}${usuario.apellidos?.charAt(0) || ""}`.toUpperCase()
    : usuario.correo?.substring(0, 2).toUpperCase() || "U";

  const userRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const tienePlanActivo = !esPrueba && suscripcion?.estatus === "activa";
  const dias = diasRestantes();
  const planNombre = suscripcion?.plan || "";

  const btnColor = vencida
    ? { bg: "rgba(192,57,43,0.2)", border: "rgba(192,57,43,0.5)", text: "#e74c3c", icon: "#e74c3c" }
    : tienePlanActivo
      ? { bg: "rgba(212,175,55,0.15)", border: "rgba(212,175,55,0.4)", text: "#D4AF37", icon: "#D4AF37" }
      : { bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.15)", text: "white", icon: "white" };

  useEffect(() => {
    const handleClickOutside = (e) => {
      const fueraUser = userRef.current && !userRef.current.contains(e.target);
      const fueraNotif = notifRef.current && !notifRef.current.contains(e.target);
      if (fueraUser && fueraNotif) {
        setShowUserMenu(false);
        setShowNotifMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cerrarMenus = () => {
    setShowUserMenu(false);
    setShowNotifMenu(false);
  };

  const toggleUserMenu = () => { setShowUserMenu(!showUserMenu); setShowNotifMenu(false); };
  const toggleNotifMenu = () => { setShowNotifMenu(!showNotifMenu); setShowUserMenu(false); };

  const irA = (ruta) => {
    cerrarMenus();
    navigate(ruta);
  };

  const irAMiPlan = () => irA("/admin/mi-plan");

  const abrirGuia = () => {
    cerrarMenus();
    setTimeout(() => onStartTour?.(), 150);
  };

  const abrirSoporte = () => {
    cerrarMenus();
    window.open(
      `https://wa.me/${SOPORTE_WHATSAPP}?text=${encodeURIComponent("Hola, necesito ayuda con BalamCore")}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const gruposMenu = [
    {
      titulo: "Cuenta",
      items: [
        { label: "Mi perfil", icon: PersonIcon, onClick: () => irA("/admin/perfil") },
        ...(esAdmin && tiene("empleados")
          ? [{ label: "Gestión de usuarios", icon: GroupIcon, onClick: () => irA("/admin/empleados") }]
          : []),
      ],
    },
    ...(esAdmin
      ? [
          {
            titulo: "Suscripción",
            items: [
              { label: "Administrar mi suscripción", icon: WorkspacePremiumIcon, onClick: () => irA("/admin/mi-plan") },
            ],
          },
          {
            titulo: "Pagos",
            items: [
              { label: "Método de pago", icon: CreditCardIcon, onClick: () => irA("/admin/metodo-pago") },
              { label: "Historial y facturación", icon: ReceiptLongIcon, onClick: () => irA("/admin/historial-pagos") },
            ],
          },
        ]
      : []),
    {
      titulo: "Ayuda",
      items: [
        { label: "Guía de uso", icon: ExploreIcon, onClick: abrirGuia },
        { label: "Soporte y ayuda", icon: SupportAgentIcon, onClick: abrirSoporte },
      ],
    },
  ];

  const handleLogout = async () => {
    const token = localStorage.getItem("token");

    ["token", "usuario", "permisos", "modulos", "suscripcion"]
      .forEach((k) => localStorage.removeItem(k));
    delete axios.defaults.headers.common["Authorization"];
    sincronizarSesion();
    navigate("/", { replace: true });

    if (token) {
      try {
        await axios.post(`${API_BASE}/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Error al cerrar sesión:", err);
      }
    }
  };

  const fechaActual = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="topbar" data-tour="topbar">

      {/* LEFT */}
      <div className="topbar-left">
        <button
          className="menu-toggle"
          onClick={onToggleSidebar}
          title={collapsed ? "Mostrar menú" : "Ocultar menú"}
          aria-label={collapsed ? "Mostrar menú" : "Ocultar menú"}
        >
          <SidebarToggleIcon collapsed={collapsed} />
        </button>
        <div className="topbar-title">
          <h3>Bienvenido, {nombreMostrar}</h3>
          <small style={{ textTransform: "capitalize" }}>{fechaActual}</small>
        </div>
      </div>

      {/* RIGHT */}
      <div className="topbar-right">

        {/* PLAN — solo admin */}
        {esAdmin && (
          <button
            data-tour="plan-status"
            className="topbar-plan-btn"
            onClick={irAMiPlan}
            style={{
              background: btnColor.bg,
              border: `1px solid ${btnColor.border}`,
              color: btnColor.text,
            }}
          >
            {tienePlanActivo
              ? <WorkspacePremiumIcon style={{ fontSize: 16, color: btnColor.icon }} />
              : <DiamondIcon style={{ fontSize: 16, color: btnColor.icon }} />
            }
            {vencida
              ? <span>Plan vencido</span>
              : tienePlanActivo
                ? <span>{planNombre} · {dias}d</span>
                : <span>Prueba · {dias}d</span>
            }
          </button>
        )}

        {/* NOTIFICACIONES */}
        <div className="dropdown-container icon-slot" ref={notifRef} data-tour="notificaciones-boton">
          <IconButton
            icon={<NotificationsIcon style={{ color: "white" }} />}
            onClick={toggleNotifMenu}
            title="Notificaciones"
            color="#0F4C3A"
            hover="#13624b"
          />
          {showNotifMenu && (
            <div className="topbar-dropdown">
              <div>No hay notificaciones</div>
            </div>
          )}
        </div>

        {/* USUARIO */}
        <div className="dropdown-container" ref={userRef}>
          <button className="user-button" data-tour="perfil-usuario" onClick={toggleUserMenu}>
            <AccountCircleIcon style={{ marginRight: 6 }} />
            <ExpandMoreIcon
              style={{
                marginLeft: 4,
                transition: "0.3s",
                transform: showUserMenu ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {showUserMenu && (
            <div className="topbar-dropdown">
              <div className="dropdown-user">
                <div className="dropdown-avatar">{inicialesMostrar}</div>
                <div className="dropdown-user-info">
                  <h4>{correoMostrar}</h4>
                  <span style={{ textTransform: "capitalize" }}>
                    {usuario.rol || "Sin rol asignado"}
                  </span>
                </div>
              </div>
              <div className="dropdown-divider"></div>

              {gruposMenu.map((grupo) => (
                <div key={grupo.titulo}>
                  <div className="dropdown-section-title">{grupo.titulo}</div>
                  {grupo.items.map(({ label, icon: Icon, onClick }) => (
                    <button key={label} className="dropdown-item" onClick={onClick}>
                      <Icon style={{ fontSize: 18 }} />
                      <span>{label}</span>
                    </button>
                  ))}
                  <div className="dropdown-divider"></div>
                </div>
              ))}

              <button className="logout-btn" onClick={handleLogout}>
                <LogoutIcon style={{ fontSize: 18 }} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Topbar;