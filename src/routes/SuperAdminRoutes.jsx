import { Route, Navigate } from "react-router-dom";
import SuperAdminLayout from "../pages/super_admin/layout/SuperAdminLayout";
import SuperAdminDashboard from "../pages/super_admin/dashboard/SuperAdminDashboard"
import SAAseguradoras from "../pages/super_admin/pages/aseguradoras/SAAseguradoras";
import SAPlanes from "../pages/super_admin/pages/planes/SAPlanes";
import SAModulos from "../pages/super_admin/pages/modulos/SAModulos";
import SAUsuarios from "../pages/super_admin/pages/usuarios/SAUsuarios";
import SASuscripciones from "../pages/super_admin/pages/suscripciones/SASuscripciones";


// Guard: solo pasa si el usuario tiene es_superadmin = 1
function SuperAdminRoute({ children }) {
  const token   = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  if (!token) return <Navigate to="/login" replace />;
  if (!usuario.es_superadmin) return <Navigate to="/admin" replace />;

  return children;
}

export const SuperAdminRoutes = (
  <Route
    path="/superadmin"
    element={
      <SuperAdminRoute>
        <SuperAdminLayout />
      </SuperAdminRoute>
    }
  >
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<SuperAdminDashboard />} />
    <Route path="aseguradoras" element={<SAAseguradoras />} />
    <Route path="planes" element={<SAPlanes />} />
    <Route path="modulos" element={<SAModulos />} />
    <Route path="usuarios" element={<SAUsuarios />} />
    <Route path="suscripciones" element={<SASuscripciones />} />
   
  </Route>
);
