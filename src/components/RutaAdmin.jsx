import { Navigate } from "react-router-dom";
import usePermisos from "../context/PermisosContext";

// Solo el administrador de la aseguradora
const RutaAdmin = ({ children }) => {
  const { esAdmin } = usePermisos();
  return esAdmin ? children : <Navigate to="/admin" replace />;
};

export default RutaAdmin;