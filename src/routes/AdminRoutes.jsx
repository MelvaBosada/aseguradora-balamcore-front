import { Route } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import AdminHome from "../pages/admin/AdminHome";
import Clientes from "../pages/admin/Clientes";
import Dashboard from "../pages/admin/Dashboard";
import Polizas from "../pages/admin/Polizas";
import PolizasVencer from "../pages/admin/PolizasVencer";
import SolicitudesRenovacion from "../pages/admin/SolicitudesRenovacion";
import Indemnizaciones from "../pages/admin/Indemnizaciones";
import Perfiles from "../pages/admin/Perfiles";
import Permisos from "../pages/admin/Permisos";
import Siniestros from "../pages/admin/Siniestros";
import Evaluaciones from "../pages/admin/Evaluaciones";
import Pagos from "../pages/admin/Pagos";
import Coberturas from "../pages/admin/Coberturas";
import Bienes from "../pages/admin/Bienes";
import Reporte from "../pages/admin/Reporte";
import Empleados from "../pages/admin/Empleados";
import PrivateRoute from "../components/PrivateRoute";

export const AdminRoutes = (
  <>
    <Route path="/admin" element={
      <PrivateRoute>
        <DashboardLayout />
      </PrivateRoute>
    }>
      <Route index element={<AdminHome />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="clientes" element={<Clientes />} />
      <Route path="polizas" element={<Polizas />} />
      <Route path="polizasV" element={<PolizasVencer />} />
      <Route path="solicitudesP" element={<SolicitudesRenovacion />} />
      <Route path="indemnizaciones" element={<Indemnizaciones />} />
      <Route path="perfiles" element={<Perfiles />} />
      <Route path="permisos" element={<Permisos />} />
      <Route path="siniestros" element={<Siniestros />} />
      <Route path="evaluaciones" element={<Evaluaciones />} />
      <Route path="pagos" element={<Pagos />} />
      <Route path="coberturas" element={<Coberturas />} />
      <Route path="bienes" element={<Bienes />} />
      <Route path="reportes" element={<Reporte />} />
      <Route path="empleados" element={<Empleados />} />
    </Route>
  </>
);