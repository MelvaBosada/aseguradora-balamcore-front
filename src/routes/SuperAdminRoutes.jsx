import { Route, Navigate } from "react-router-dom";
import SuperAdminLayout from "../pages/super_admin/layout/SuperAdminLayout";
import SuperAdminDashboard from "../pages/super_admin/dashboard/SuperAdminDashboard"

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
    {/* Agrega aquí más rutas de superadmin:
    <Route path="aseguradoras" element={<SAAseguradoras />} />
    <Route path="planes"       element={<SAPlanes />} />
    */}
  </Route>
);
