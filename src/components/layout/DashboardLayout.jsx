import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar        from "./Sidebar";
import Topbar         from "./Topbar";
import ModalPlanes    from "../ModalPlanes";
import ModalBienvenida from "../ModalBienvenida";
import usePermisos    from "../../hooks/usePermisos";
import useTour        from "../../hooks/useTour";
import "./layout.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

const DashboardLayout = () => {
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [showPlanes,       setShowPlanes]       = useState(false);
  const [showBienvenida,   setShowBienvenida]   = useState(false);
  const { esPrueba, vencida } = usePermisos();
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const { startTour } = useTour({
    role: usuario.rol,
    usuario,
    autoStart: window.location.pathname === "/admin",
    navigate,
  });

  useEffect(() => {
    // Modal bienvenida — solo primera vez
    const bienvenidaMostrada = localStorage.getItem("bienvenida_mostrada");
    if (!bienvenidaMostrada) {
      setShowBienvenida(true);
      localStorage.setItem("bienvenida_mostrada", "true");
      return;
    }

    // Modal vencida
    if (vencida) {
      setShowPlanes(true);
      return;
    }

    // Modal prueba — una vez al día
    if (esPrueba) {
      const hoy         = new Date().toDateString();
      const ultimoAviso = localStorage.getItem("ultimo_aviso_prueba");
      if (ultimoAviso !== hoy) {
        setShowPlanes(true);
        localStorage.setItem("ultimo_aviso_prueba", hoy);
      }
    }
  }, [esPrueba, vencida]);

  const handleLogout = async () => {
    try {
      const axios = (await import("axios")).default;
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/logout`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (e) {
      console.error(e);
    }
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="layout">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onStartTour={startTour}
        />
        <div className="content">
          <Outlet />
        </div>
      </div>

      <ModalBienvenida
        open={showBienvenida}
        onClose={() => setShowBienvenida(false)}
        nombre={usuario.nombre || usuario.aseguradora || ""}
      />

      <ModalPlanes
        open={showPlanes}
        onClose={vencida ? null : () => setShowPlanes(false)}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default DashboardLayout;