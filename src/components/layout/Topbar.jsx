import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";

import IconButton from "../IconButton";
import "./layout.css";

const Topbar = ({ onToggleSidebar }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const userRef = useRef(null);
  const notifRef = useRef(null);

  const navigate = useNavigate();

  /* 👉 CERRAR AL HACER CLICK FUERA */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        userRef.current &&
        !userRef.current.contains(e.target) &&
        notifRef.current &&
        !notifRef.current.contains(e.target)
      ) {
        setShowUserMenu(false);
        setShowNotifMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifMenu(false);
  };

  const toggleNotifMenu = () => {
    setShowNotifMenu(!showNotifMenu);
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    navigate("/");
  };

  const fechaActual = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="topbar">

      {/* LEFT */}
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onToggleSidebar}>
          <MenuIcon />
        </button>

        <div>
          <h3>Hola bienvenido, Administrador</h3>
          <small style={{ textTransform: "capitalize" }}>
            {fechaActual}
          </small>
        </div>
      </div>

      {/* RIGHT */}
      <div className="topbar-right">

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
                transform: showUserMenu
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
              }}
            />
          </button>

          {showUserMenu && (
            <div className="topbar-dropdown">
              <div className="dropdown-user">
                <div className="dropdown-avatar">
                  <AccountCircleIcon />
                </div>
                <div className="dropdown-user-info">
                  <h4>Administrador</h4>
                  <span>Ocupación: Recursos Humanos</span>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <button className="logout-btn" onClick={handleLogout}>
                <LogoutIcon style={{ marginRight: 6 }} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Topbar;