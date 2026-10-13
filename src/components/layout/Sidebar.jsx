import { useState } from "react";
import { NavLink } from "react-router-dom";
import Logo from "../../assets/LogoSin.png";
import Logo2 from "../../assets/LetrasColor.png";
import usePermisos from "../../hooks/usePermisos";

import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";

import GroupIcon from "@mui/icons-material/Group";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BarChartIcon from "@mui/icons-material/BarChart";
import EventIcon from "@mui/icons-material/Event";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import "./layout.css";

const Sidebar = ({ open, onClose }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const { tiene, tieneModulo } = usePermisos();

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const closeAll = () => {
    setOpenMenu(null);
    onClose();
  };


  return (
    <>
      <div className={`sidebar-overlay ${open ? "show" : ""}`} onClick={onClose} />

      <aside className={`sidebar ${open ? "open" : ""}`} data-tour="sidebar">

        {/* LOGO */}
        <div className="logo">
          <img src={Logo} className="logo-icon" />
          <img src={Logo2} className="logo-text" />
        </div>

        {/* DASHBOARD */}
        {tieneModulo("dashboard") && (
          <NavLink to="/admin/dashboard" className="menu-item" data-tour="menu-dashboard" onClick={closeAll}>
            <DashboardIcon /> Dashboard
          </NavLink>
        )}

        {/* OPERACIONES */}
        {["polizas", "siniestros", "evaluaciones", "indemnizaciones", "pagos", "evidencias"].some(p => tiene(p)) && (
          <div className="menu-section" data-tour="menu-operaciones">
            <div className="menu-section-title" onClick={() => toggleMenu("operaciones")}>
              <span><DescriptionIcon /> Operaciones</span>
              <ExpandMoreIcon className={openMenu === "operaciones" ? "rotate" : ""}/>
            </div>
            <div className={`submenu ${openMenu === "operaciones" ? "open" : ""}`}>
              {tiene("polizas")         && <NavLink to="/admin/polizas"         className="submenu-item" data-tour="menu-polizas" onClick={onClose}>Pólizas</NavLink>}
              {tiene("siniestros")      && <NavLink to="/admin/siniestros"      className="submenu-item" data-tour="menu-siniestros" onClick={onClose}>Siniestros</NavLink>}
              {tiene("evidencias")      && <NavLink to="/admin/evidencias"      className="submenu-item" data-tour="menu-evidencias" onClick={onClose}>Evidencias</NavLink>}
              {tiene("evaluaciones")    && <NavLink to="/admin/evaluaciones"    className="submenu-item" data-tour="menu-evaluaciones" onClick={onClose}>Evaluaciones</NavLink>}
              {tiene("indemnizaciones") && <NavLink to="/admin/indemnizaciones" className="submenu-item" data-tour="menu-indemnizaciones" onClick={onClose}>Indemnizaciones</NavLink>}
              {tiene("pagos")           && <NavLink to="/admin/pagos"           className="submenu-item" data-tour="menu-pagos" onClick={onClose}>Pagos</NavLink>}
            </div>
          </div>
        )}

        {/* CATALOGOS */}
        {tieneModulo("clientes", "empleados", "bienes", "coberturas", "evaluaciones", "perfiles", "permisos") && (
          <div className="menu-section" data-tour="menu-catalogos">
            <div className="menu-section-title" onClick={() => toggleMenu("catalogos")}>
              <span><GroupIcon /> Catálogos</span>
              <ExpandMoreIcon className={openMenu === "catalogos" ? "rotate" : ""}/>
            </div>
            <div className={`submenu ${openMenu === "catalogos" ? "open" : ""}`}>
              {tiene("clientes")     && <NavLink to="/admin/clientes"      className="submenu-item" data-tour="menu-clientes" onClick={onClose}>Clientes</NavLink>}
              {tiene("empleados")    && <NavLink to="/admin/empleados"     className="submenu-item" data-tour="menu-empleados" onClick={onClose}>Empleados</NavLink>}
              {tiene("bienes")       && <NavLink to="/admin/bienes"        className="submenu-item" data-tour="menu-bienes" onClick={onClose}>Bienes</NavLink>}
              {tiene("coberturas")   && <NavLink to="/admin/coberturas"    className="submenu-item" data-tour="menu-coberturas" onClick={onClose}>Coberturas</NavLink>}
              {tiene("perfiles")     && <NavLink to="/admin/perfiles"      className="submenu-item" data-tour="menu-perfiles" onClick={onClose}>Perfiles</NavLink>}
              {/* {tiene("permisos")     && <NavLink to="/admin/permisos"      className="submenu-item" onClick={onClose}>Permisos</NavLink>}*/}
            </div>
          </div>
        )}

        {/* REPORTES */}
        {tieneModulo("reportes", "polizasV", "renovaciones") && (
          <div className="menu-section" data-tour="menu-reportes">
            <div className="menu-section-title" onClick={() => toggleMenu("reportes")}>
              <span><BarChartIcon /> Reportes y Avisos</span>
              <ExpandMoreIcon className={openMenu === "reportes" ? "rotate" : ""}/>
            </div>
            <div className={`submenu ${openMenu === "reportes" ? "open" : ""}`}>
              {tiene("reportes")     && <NavLink to="/admin/reportes"      className="submenu-item" data-tour="menu-reportes-listado" onClick={onClose}>Reportes</NavLink>}
              {tiene("polizasV")     && <NavLink to="/admin/polizasV"      className="submenu-item" data-tour="menu-polizas-vencer" onClick={onClose}>Pólizas por vencer</NavLink>}
              {tiene("renovaciones") && <NavLink to="/admin/solicitudesP"  className="submenu-item" data-tour="menu-renovaciones" onClick={onClose}>Renovaciones</NavLink>}
            </div>
          </div>
        )}

      </aside>
    </>
  );
};

export default Sidebar;