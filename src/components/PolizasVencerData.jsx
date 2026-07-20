import axios from "axios";


export const PolizasVencerData = async (dias = 999) => {
  const token = localStorage.getItem("token");
  // 1. Mandas a llamar tu variable de entorno (.env)
  const API_URL = import.meta.env.VITE_API_URL; 
  
  // 2. La concatenas con la ruta (asegúrate de que empiece con /)
  const { data } = await axios.get(
    `${API_URL}/polizas-vencer?dias=${dias}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};