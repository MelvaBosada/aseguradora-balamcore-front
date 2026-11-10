import { Navigate } from "react-router-dom";
import usePermisos from "../context/PermisosContext";

function RutaProtegida({ children }) {
  const { usuario } = usePermisos();

  // Sin token o sin usuario cargado: de vuelta al login
  if (!localStorage.getItem("token") || !usuario?.id) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RutaProtegida;