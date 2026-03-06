import { useState } from "react";
import { NavLink } from "react-router-dom";
import Logo from "../../assets/LogoSin.png";
import Logo2 from "../../assets/LetrasColor.png";

import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import PaymentsIcon from "@mui/icons-material/Payments";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import GroupIcon from "@mui/icons-material/Group";
import BadgeIcon from "@mui/icons-material/Badge";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ShieldIcon from "@mui/icons-material/Shield";
import StarIcon from "@mui/icons-material/Star";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BarChartIcon from "@mui/icons-material/BarChart";
import EventIcon from "@mui/icons-material/Event";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import "./layout.css";

const Sidebar = ({ open, onClose }) => {
  const [openMenu, setOpenMenu] = useState(null);

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

      <aside className={`sidebar ${open ? "open" : ""}`}>

        {/* LOGO */}
        <div className="logo">
          <img src={Logo} className="logo-icon" />
          <img src={Logo2} className="logo-text" />
        </div>

        {/* DASHBOARD */}
        <NavLink to="/admin" className="menu-item" onClick={closeAll}>
          <DashboardIcon /> Dashboard
        </NavLink>

        {/* OPERACIONES */}
        <div className="menu-section">
          <div className="menu-section-title" onClick={() => toggleMenu("operaciones")}>
            <span><DescriptionIcon /> Operaciones</span>
            <ExpandMoreIcon className={openMenu === "operaciones" ? "rotate" : ""}/>
          </div>

          <div className={`submenu ${openMenu === "operaciones" ? "open" : ""}`}>
            <NavLink to="/admin/polizas" className="submenu-item" onClick={closeAll}>Pólizas</NavLink>
            <NavLink to="/admin/siniestros" className="submenu-item" onClick={closeAll}>Siniestros</NavLink>
            <NavLink to="/admin/indemnizaciones" className="submenu-item" onClick={closeAll}>Indemnizaciones</NavLink>
            <NavLink to="/admin/pagos" className="submenu-item" onClick={closeAll}>Pagos</NavLink>
           
          </div>
        </div>

        {/* CATALOGOS */}
        <div className="menu-section">
          <div className="menu-section-title" onClick={() => toggleMenu("catalogos")}>
            <span><GroupIcon /> Catálogos</span>
            <ExpandMoreIcon className={openMenu === "catalogos" ? "rotate" : ""}/>
          </div>

          <div className={`submenu ${openMenu === "catalogos" ? "open" : ""}`}>
            <NavLink to="/admin/clientes" className="submenu-item" onClick={closeAll}>Clientes</NavLink>
            <NavLink to="/admin/empleados" className="submenu-item" onClick={closeAll}>Empleados</NavLink>
            <NavLink to="/admin/bienes" className="submenu-item" onClick={closeAll}>Bienes</NavLink>
            <NavLink to="/admin/coberturas" className="submenu-item" onClick={closeAll}>Coberturas</NavLink>
            <NavLink to="/admin/evaluaciones" className="submenu-item" onClick={closeAll}>Evaluaciones</NavLink>
            <NavLink to="/admin/perfiles" className="submenu-item" onClick={closeAll}>Perfiles</NavLink>
            <NavLink to="/admin/permisos" className="submenu-item" onClick={closeAll}>Permisos</NavLink>
          </div>
        </div>

        {/* REPORTES */}
        <div className="menu-section">
          <div className="menu-section-title" onClick={() => toggleMenu("reportes")}>
            <span><BarChartIcon /> Reportes y Avisos</span>
            <ExpandMoreIcon className={openMenu === "reportes" ? "rotate" : ""}/>
          </div>

          <div className={`submenu ${openMenu === "reportes" ? "open" : ""}`}>
            <NavLink to="/admin/reportes" className="submenu-item" onClick={closeAll}>Reportes</NavLink>
            <NavLink to="/admin/polizasV" className="submenu-item" onClick={closeAll}>Pólizas por vencer</NavLink>
             <NavLink to="/admin/solicitudesP" className="submenu-item" onClick={closeAll}>Renovaciones</NavLink>
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;