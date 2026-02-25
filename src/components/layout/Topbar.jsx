import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./layout.css";

const Topbar = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const navigate = useNavigate();

  
  const fechaActual = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const toggleUserMenu = () => {
    setShowUserMenu((prev) => !prev);
    setShowNotifMenu(false);
  };

  const toggleNotifMenu = () => {
    setShowNotifMenu((prev) => !prev);
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="topbar">
      {/* IZQUIERDA */}
      <div className="topbar-left">
        <h3>Hola bienvenido, Administrador</h3>
        <small style={{ textTransform: "capitalize" }}>
          {fechaActual}
        </small>
      </div>

      {/* DERECHA */}
      <div className="topbar-right">
        <div className="dropdown-container">
          <button className="icon-button" onClick={toggleNotifMenu}>
            🔔
          </button>

          {showNotifMenu && (
            <div className="topbar-dropdown">
              <div className="dropdown-title">Notificaciones</div>
              <div className="dropdown-item empty">
                No hay notificaciones
              </div>
            </div>
          )}
        </div>

        <div className="dropdown-container">
          <button className="user-button" onClick={toggleUserMenu}>
            Administrador
          </button>

          {showUserMenu && (
            <div className="topbar-dropdown">
              <div className="dropdown-title">Perfil actual</div>
              <div className="dropdown-item">Administrador</div>
              <hr />
              <button className="logout-btn" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;