import { Route } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import AdminHome from "../pages/admin/AdminHome";
import Clientes from "../pages/admin/Clientes";
import Dashboard from "../pages/admin/Dashboard";
import PolizasVencer   from "../pages/admin/PolizasVencer";
import SolicitudesRenovacion from "../pages/admin/SolicitudesRenovacion";
import Indemnizaciones from "../pages/admin/Indemnizaciones";
import Perfiles from "../pages/admin/Perfiles";
import Permisos from "../pages/admin/Permisos";
export const AdminRoutes = (
  <>
     <Route path="/admin" element={<DashboardLayout />}>
      <Route index element={<Dashboard />} />
      <Route path="clientes" element={<Clientes />} />
      <Route path="polizasV" element={<PolizasVencer />}  />
      <Route path="solicitudesP" element={<SolicitudesRenovacion />}  />
       <Route path="indemnizaciones" element={<Indemnizaciones />}  />
       <Route path="perfiles" element={<Perfiles />}  />
        <Route path="permisos" element={<Permisos />}  />
    </Route>
  </>
);