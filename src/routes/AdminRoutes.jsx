import { Route } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import AdminHome from "../pages/admin/AdminHome";
import Clientes from "../pages/admin/Clientes";

export const AdminRoutes = (
  <>
    <Route path="/admin" element={<DashboardLayout />}>
      <Route index element={<AdminHome />} />
      <Route path="clientes" element={<Clientes />} />
    </Route>
  </>
);