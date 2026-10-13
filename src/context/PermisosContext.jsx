import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";
const POLL_INTERVAL_MS = 15000; // cada 15 segundos

const ESTATUS_ACTIVO  = ["activa", "activo"];
const ESTATUS_PRUEBA  = ["prueba", "trial"];

const PermisosContext = createContext(null);

export const PermisosProvider = ({ children }) => {
  const [permisos,    setPermisosState]    = useState(() => JSON.parse(localStorage.getItem("permisos")    || "[]"));
  const [modulos,     setModulosState]     = useState(() => JSON.parse(localStorage.getItem("modulos")     || "[]"));
  const [usuario,     setUsuario]          = useState(() => JSON.parse(localStorage.getItem("usuario")     || "{}"));
  const [suscripcion, setSuscripcion]      = useState(() => JSON.parse(localStorage.getItem("suscripcion") || "null"));

  const refrescarPermisos = useCallback(async () => {
    const usuarioActual = JSON.parse(localStorage.getItem("usuario") || "{}");
    if (!usuarioActual.id_rol) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_BASE}/roles/${usuarioActual.id_rol}/permisos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const clavesPermisos = res.data.map((p) => p.clave);

      localStorage.setItem("permisos", JSON.stringify(clavesPermisos));
      setPermisosState(clavesPermisos);
    } catch (err) {
      console.error("Error al refrescar permisos:", err);
    }
  }, []);

  useEffect(() => {
    refrescarPermisos();
    const interval = setInterval(refrescarPermisos, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refrescarPermisos]);

  const tieneModulo  = (clave) => modulos.length === 0 || modulos.includes(clave);
  const tienePermiso = (clave) => permisos.includes(clave);
  const tiene        = (clave) => tienePermiso(clave) && tieneModulo(clave);
  const tieneAlguno  = (...claves) => claves.some((c) => tiene(c));

  const estatusActivo = suscripcion && ESTATUS_ACTIVO.includes(suscripcion.estatus);

  const tienePlanActivo = (() => {
    if (!estatusActivo) return false;
    if (!suscripcion.fecha_fin_plan) return true;
    return new Date(suscripcion.fecha_fin_plan) > new Date();
  })();

  const esPrueba = !suscripcion || ESTATUS_PRUEBA.includes(suscripcion.estatus);

  const diasRestantes = () => {
    if (estatusActivo && suscripcion.fecha_fin_plan) {
      const fin  = new Date(suscripcion.fecha_fin_plan);
      const hoy  = new Date();
      const diff = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    }

    if (suscripcion?.fecha_fin) {
      const fin  = new Date(suscripcion.fecha_fin);
      const hoy  = new Date();
      const diff = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    }

    const fechaRegistro = usuario.fecha_registro;
    if (fechaRegistro) {
      const registro   = new Date(fechaRegistro);
      const hoy        = new Date();
      const diasUsados = Math.floor((hoy - registro) / (1000 * 60 * 60 * 24));
      const restantes  = 15 - diasUsados;
      return restantes > 0 ? restantes : 0;
    }

    return 15;
  };

  const planPagadoVencido =
    estatusActivo &&
    suscripcion?.fecha_fin_plan &&
    new Date(suscripcion.fecha_fin_plan) <= new Date();

  const vencida = (diasRestantes() <= 0 && !estatusActivo) || planPagadoVencido;

  const esAdmin = usuario.rol === "Administrador";

  const limites = {
    siniestrosMes:      suscripcion?.limite_siniestros_mes      ?? null,
    polizasVencerDia:   suscripcion?.limite_polizas_vencer_dia   ?? null,
    bienesPorCliente:   suscripcion?.limite_bienes_por_cliente   ?? null,
    pdfIlimitado:       suscripcion?.pdf_ilimitado               ?? false,
    soportePrioritario: suscripcion?.soporte_prioritario         ?? false,
  };

  const puedeCrear = (tipo, countActual) => {
    if (vencida) return false;
    switch (tipo) {
      case "siniestros":
        return limites.siniestrosMes === null || countActual < limites.siniestrosMes;
      case "bienes":
        return limites.bienesPorCliente === null || countActual < limites.bienesPorCliente;
      default:
        return true;
    }
  };

  const iniciarPago = async (idPlan, periodo = "mensual") => {
    try {
      const token = localStorage.getItem("token");
      const res   = await axios.post(
        `${API_BASE}/suscripcion/checkout`,
        { id_plan: idPlan, periodo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = res.data.url;
    } catch (err) {
      console.error("Error al iniciar pago:", err);
      throw err;
    }
  };

  const verificarPagoStripe = async () => {
    const params    = new URLSearchParams(window.location.search);
    const pago      = params.get("pago");
    const sessionId = params.get("session_id");

    if (pago !== "exitoso" || !sessionId) return null;

    try {
      const token = localStorage.getItem("token");
      const res   = await axios.post(
        `${API_BASE}/suscripcion/verificar-pago`,
        { session_id: sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const resSus = await axios.get(
        `${API_BASE}/suscripcion/actual`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem("suscripcion", JSON.stringify(resSus.data));
      setSuscripcion(resSus.data);

      window.history.replaceState({}, "", window.location.pathname);
      return res.data;
    } catch (err) {
      console.error("Error al verificar pago:", err);
      return null;
    }
  };

  const value = {
    permisos,
    modulos,
    tiene,
    tieneAlguno,
    tieneModulo,
    suscripcion,
    diasRestantes,
    esPrueba,
    tienePlanActivo,
    vencida,
    planPagadoVencido,
    esAdmin,
    limites,
    puedeCrear,
    iniciarPago,
    verificarPagoStripe,
    refrescarPermisos,
  };

  return <PermisosContext.Provider value={value}>{children}</PermisosContext.Provider>;
};

const usePermisos = () => {
  const ctx = useContext(PermisosContext);
  if (!ctx) throw new Error("usePermisos debe usarse dentro de <PermisosProvider>");
  return ctx;
};

export default usePermisos;