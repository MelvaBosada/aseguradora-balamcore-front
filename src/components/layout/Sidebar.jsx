import { NavLink } from "react-router-dom";
import Logo from "../../assets/Logo.png";
import "./layout.css";


const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="logo">
        <img src={Logo} alt="logo" />
        <h2>BalamCore</h2>
      </div>

      <p className="menu-title">Administrador</p>

      <nav className="menu">
        <NavLink to="/admin" className="menu-item">
          Dashboard
        </NavLink>

        <NavLink to="/admin/poliza" className="menu-item">
          Póliza
        </NavLink>

        <NavLink to="/admin/bienes" className="menu-item">
          Bienes Asegurados
        </NavLink>

        <NavLink to="/admin/reportes" className="menu-item">
          Reportes
        </NavLink>

        <NavLink to="/admin/siniestros" className="menu-item">
          Siniestros
        </NavLink>

        <NavLink to="/admin/clientes" className="menu-item">
          Clientes
        </NavLink>

        <NavLink to="/admin/indemnizaciones" className="menu-item">
          Indemnizaciones
        </NavLink>

        <NavLink to="/admin/polizasV" className="menu-item">
          Polizas por vencer
        </NavLink>

        <NavLink to="/admin/empleados" className="menu-item">
          Empleados
        </NavLink>

        <NavLink to="/admin/pagos" className="menu-item">
          Pagos
        </NavLink>

        <NavLink to="/admin/solicitudesP" className="menu-item">
          Solicitudes de renovacion de poliza
        </NavLink>

        <NavLink to="/admin/coberturas" className="menu-item">
          Coberturas
        </NavLink>

        <NavLink to="/admin/evaluaciones" className="menu-item">
          Evaluaciones
        </NavLink>

        <NavLink to="/admin/perfiles" className="menu-item">
          Perfiles
        </NavLink>



      </nav>
    </div>
  );
};

export default Sidebar;