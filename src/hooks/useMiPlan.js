import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "/api";
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

export default function useMiPlan() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const cargar = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/suscripcion/mi-plan`, auth());
      setData(res.data);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "No se pudo cargar tu plan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return { data, loading, error, cargar };
}