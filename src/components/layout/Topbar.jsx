import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import MenuIcon          from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ExpandMoreIcon    from "@mui/icons-material/ExpandMore";
import DiamondIcon       from "@mui/icons-material/Diamond";

import IconButton   from "../IconButton";
import ModalPlanes  from "../ModalPlanes";
import usePermisos  from "../../hooks/usePermisos";
import "./layout.css";

const Topbar = ({ onToggleSidebar }) => {
  const [showUserMenu,  setShowUserMenu]  = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showPlanes,    setShowPlanes]    = useState(false);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const { esPrueba, diasRestantes, esAdmin } = usePermisos();

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
      await axios.post("http://localhost:8000/api/logout");
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
      <div className="topbar">

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

          {/* DIAMANTE — solo admin */}
          {esAdmin && (
            <button
              onClick={() => setShowPlanes(true)}
              style={{
                background: "rgba(221, 183, 183, 0.15)",
                border: "none",
                borderRadius: 10,
                padding: "6px 10px",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <DiamondIcon style={{ fontSize: 18 }} />
              {esPrueba && <span>Prueba · {diasRestantes()} días</span>}
            </button>
          )}

          {/* NOTIFICACIONES */}
          <div className="dropdown-container" ref={notifRef}>
            <IconButton
              icon={<NotificationsIcon style={{ color: "white" }} />}
              onClick={toggleNotifMenu}
            />
            {showNotifMenu && (
              <div className="topbar-dropdown">
                <div>No hay notificaciones</div>
              </div>
            )}
          </div>

          {/* USUARIO */}
          <div className="dropdown-container" ref={userRef}>
            <button className="user-button" onClick={toggleUserMenu}>
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