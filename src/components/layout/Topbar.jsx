import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import MenuIcon          from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ExpandMoreIcon    from "@mui/icons-material/ExpandMore";
import DiamondIcon       from "@mui/icons-material/Diamond";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import HelpIcon from '@mui/icons-material/Help';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

import IconButton   from "../IconButton";
import ModalPlanes  from "../ModalPlanes";
import usePermisos  from "../../hooks/usePermisos";
import "./layout.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

const Topbar = ({ onToggleSidebar, onStartTour }) => {
  const [showUserMenu,  setShowUserMenu]  = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showPlanes,    setShowPlanes]    = useState(false);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const { esPrueba, diasRestantes, esAdmin, suscripcion, vencida } = usePermisos();

  const nombreMostrar = usuario.nombre
    ? `${usuario.nombre} ${usuario.apellidos || ""}`.trim()
    : usuario.aseguradora || usuario.correo || "Usuario";

  const correoMostrar = usuario.correo || "";

  const inicialesMostrar = usuario.nombre
    ? `${usuario.nombre.charAt(0)}${usuario.apellidos?.charAt(0) || ""}`.toUpperCase()
    : usuario.correo?.substring(0, 2).toUpperCase() || "U";

  const userRef  = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // Determina el estado del plan para el botón
  const tienePlanActivo = !esPrueba && suscripcion?.estatus === "activa";
  const dias            = diasRestantes();
  const planNombre      = suscripcion?.plan || "";

  // Colores según estado
  const btnColor = vencida
    ? { bg: "rgba(192,57,43,0.2)", border: "rgba(192,57,43,0.5)", text: "#e74c3c", icon: "#e74c3c" }
    : tienePlanActivo
      ? { bg: "rgba(212,175,55,0.15)", border: "rgba(212,175,55,0.4)", text: "#D4AF37", icon: "#D4AF37" }
      : { bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.15)", text: "white", icon: "white" };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        userRef.current  && !userRef.current.contains(e.target) &&
        notifRef.current && !notifRef.current.contains(e.target)
      ) {
        setShowUserMenu(false);
        setShowNotifMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleUserMenu  = () => { setShowUserMenu(!showUserMenu);   setShowNotifMenu(false); };
  const toggleNotifMenu = () => { setShowNotifMenu(!showNotifMenu); setShowUserMenu(false);  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/logout`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      localStorage.removeItem("permisos");
      localStorage.removeItem("modulos");
      localStorage.removeItem("suscripcion");
      axios.defaults.headers.common["Authorization"] = "";
      navigate("/");
    }
  };

  const fechaActual = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div className="topbar" data-tour="topbar">

        {/* LEFT */}
        <div className="topbar-left">
          <button className="menu-toggle" onClick={onToggleSidebar}>
            <MenuIcon />
          </button>
          <div>
            <h3>Bienvenido, {nombreMostrar}</h3>
            <small style={{ textTransform: "capitalize" }}>{fechaActual}</small>
          </div>
        </div>

        {/* RIGHT */}
        <div className="topbar-right">

          <div data-tour="tour-help">
            <IconButton
              icon={<HelpIcon style={{ color: "white" }} />}
              onClick={onStartTour}
              title="Abrir recorrido guiado"
              color="#0F4C3A"
              hover="#13624b"
            />
          </div>

          {/* PLAN — solo admin */}
          {esAdmin && (
            <button
              data-tour="plan-status"
              onClick={() => setShowPlanes(true)}
              style={{
                background: btnColor.bg,
                border: `1px solid ${btnColor.border}`,
                borderRadius: 10,
                padding: "5px 10px",
                color: btnColor.text,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                transition: "all 0.2s",
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
          <div className="dropdown-container" ref={notifRef}>
            <IconButton
              icon={<NotificationsIcon style={{ color: "white" }} />}
              onClick={toggleNotifMenu}
              title="Notificaciones"
              color="#0F4C3A"
              hover="#13624b"
              data-tour="notificaciones-boton"
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
                  <div className="dropdown-avatar">
                    {inicialesMostrar}
                  </div>
                  <div className="dropdown-user-info">
                    <h4>{correoMostrar}</h4>
                    <span style={{ textTransform: "capitalize" }}>
                      {usuario.rol || "Sin rol asignado"}
                    </span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="logout-btn" onClick={handleLogout}>
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* MODAL DE PLANES */}
      <ModalPlanes
        open={showPlanes}
        onClose={() => setShowPlanes(false)}
        onLogout={handleLogout}
      />
    </>
  );
};

export default Topbar;
