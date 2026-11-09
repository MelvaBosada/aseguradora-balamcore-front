import { Route, Navigate } from "react-router-dom";
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
import SiniestroDetalle from "../pages/admin/SiniestroDetalle";
import ConfiguracionSiniestros from "../pages/admin/ConfiguracionSiniestros";
import Evaluaciones from "../pages/admin/Evaluaciones";
import Pagos from "../pages/admin/Pagos";
import Coberturas from "../pages/admin/Coberturas";
import Bienes from "../pages/admin/Bienes";
import Reporte from "../pages/admin/Reporte";
import Empleados from "../pages/admin/Empleados";
import Evidencias from "../pages/admin/Evidencias";
import PrivateRoute from "../components/PrivateRoute";
import RutaPermiso from "../components/RutaPermiso";
import RutaAdmin from "../components/RutaAdmin";
import MiPlan from "../pages/admin/MiPlan";
import MetodoPago from "../pages/admin/MetodoPago";
import HistorialPagos from "../pages/admin/HistorialPagos";
import Papelera from "../pages/admin/Papelera";
import Perfil from "../pages/admin/Perfil";

// Atajo: envuelve una página con el guard de su permiso
const protegida = (permiso, Pagina) => (
  <RutaPermiso permiso={permiso}>
    <Pagina />
  </RutaPermiso>
);

export const AdminRoutes = (
  <>
    <Route path="/admin" element={
      <PrivateRoute>
        <DashboardLayout />
      </PrivateRoute>
    }>
      <Route index element={<AdminHome />} />

      <Route path="perfil"          element={<Perfil />} />
      <Route path="mi-plan"         element={<MiPlan />} />
      <Route path="metodo-pago"     element={<RutaAdmin><MetodoPago /></RutaAdmin>} />
      <Route path="historial-pagos" element={<RutaAdmin><HistorialPagos /></RutaAdmin>} />
      <Route path="papelera"        element={<RutaAdmin><Papelera /></RutaAdmin>} />

      <Route path="dashboard"       element={protegida("dashboard", Dashboard)} />
      <Route path="clientes"        element={protegida("clientes", Clientes)} />
      <Route path="polizas"         element={protegida("polizas", Polizas)} />
      <Route path="polizasV"        element={protegida("polizasV", PolizasVencer)} />
      <Route path="solicitudesP"    element={protegida("renovaciones", SolicitudesRenovacion)} />
      <Route path="indemnizaciones" element={protegida("indemnizaciones", Indemnizaciones)} />
      <Route path="perfiles"        element={protegida("perfiles", Perfiles)} />
      <Route path="permisos"        element={protegida("permisos", Permisos)} />
      <Route path="siniestros"      element={protegida("siniestros", Siniestros)} />
      {/* Expediente: mismo permiso que el listado. La configuración se puede ver con "siniestros",
          pero solo se edita con el permiso "siniestros.configurar" (lo controla la propia pantalla). */}
      <Route path="siniestros/:id"  element={protegida("siniestros", SiniestroDetalle)} />
      <Route path="configuracion-siniestros" element={protegida("siniestros", ConfiguracionSiniestros)} />
      <Route path="evaluaciones"    element={protegida("evaluaciones", Evaluaciones)} />
      <Route path="pagos"           element={protegida("pagos", Pagos)} />
      <Route path="coberturas"      element={protegida("coberturas", Coberturas)} />
      <Route path="bienes"          element={protegida("bienes", Bienes)} />
      <Route path="reportes"        element={protegida("reportes", Reporte)} />
      <Route path="empleados"       element={protegida("empleados", Empleados)} />
      <Route path="evidencias"      element={protegida("evidencias", Evidencias)} />
    </Route>
  </>
);
