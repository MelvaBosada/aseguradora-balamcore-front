import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar        from "./Sidebar";
import Topbar         from "./Topbar";
import ModalPlanes    from "../ModalPlanes";
import ModalBienvenida from "../ModalBienvenida";
import usePermisos    from "../../context/PermisosContext";
import useTour        from "../../hooks/useTour";
import "./layout.css";

const API_BASE = import.meta.env.VITE_API_URL || "";
const BREAKPOINT_DESKTOP = 1024;

const DashboardLayout = () => {
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [showPlanes,       setShowPlanes]       = useState(false);
  const [showBienvenida,   setShowBienvenida]   = useState(false);

  // Menú retraído en escritorio (decisión del usuario, se recuerda)
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar_collapsed") === "true"
  );

  const { esPrueba, vencida } = usePermisos();
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const { startTour } = useTour({
    role: usuario.rol,
    usuario,
    autoStart: window.location.pathname === "/admin",
    navigate,
  });

  const guardarCollapsed = (valor) => {
    setCollapsed(valor);
    localStorage.setItem("sidebar_collapsed", String(valor));
  };

  // Móvil/tablet: abre/cierra el drawer. Escritorio: retrae/expande.
  const toggleSidebar = () => {
    if (window.innerWidth <= BREAKPOINT_DESKTOP) {
      setSidebarOpen((o) => !o);
    } else {
      guardarCollapsed(!collapsed);
    }
  };

  // Si el menú está retraído, lo expande antes de iniciar el tour
  const handleStartTour = () => {
    if (window.innerWidth > BREAKPOINT_DESKTOP && collapsed) {
      guardarCollapsed(false);
      setTimeout(startTour, 350);
    } else {
      startTour();
    }
  };

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
    <div className={`layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main">
        <Topbar
          onToggleSidebar={toggleSidebar}
          onStartTour={handleStartTour}
          collapsed={collapsed}
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