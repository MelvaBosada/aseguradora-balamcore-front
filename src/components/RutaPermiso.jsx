import { Navigate } from "react-router-dom";
import usePermisos from "../context/PermisosContext";

// Si el rol no tiene el permiso, redirige al panel principal
const RutaPermiso = ({ permiso, children }) => {
  const { tiene } = usePermisos();
  return tiene(permiso) ? children : <Navigate to="/admin" replace />;
};

export default RutaPermiso;