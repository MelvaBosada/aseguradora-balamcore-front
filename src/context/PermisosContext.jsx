import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";
const POLL_INTERVAL_MS = 15000; // cada 15 segundos

const ESTATUS_ACTIVO = ["activa", "activo"];
const ESTATUS_PRUEBA = ["prueba", "trial"];

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const leer = (clave, defecto) => {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? defecto;
  } catch {
    return defecto;
  }
};

const PermisosContext = createContext(null);

export const PermisosProvider = ({ children }) => {
  const [permisos,    setPermisosState] = useState(() => leer("permisos", []));
  const [modulos,     setModulosState]  = useState(() => leer("modulos", []));
  const [usuario,     setUsuario]       = useState(() => leer("usuario", {}));
  const [suscripcion, setSuscripcion]   = useState(() => leer("suscripcion", null));

  // ── Vuelve a leer la sesión guardada (úsala tras login y logout) ──
  const sincronizarSesion = useCallback(() => {
    setPermisosState(leer("permisos", []));
    setModulosState(leer("modulos", []));
    setUsuario(leer("usuario", {}));
    setSuscripcion(leer("suscripcion", null));
  }, []);

  const refrescarPermisos = useCallback(async () => {
    const usuarioActual = leer("usuario", {});
    if (!usuarioActual.id_rol || !localStorage.getItem("token")) return;

    try {
      const res = await axios.get(
        `${API_BASE}/roles/${usuarioActual.id_rol}/permisos`,
        auth()
      );

      // Si cerraron sesión mientras la petición estaba en vuelo, no reescribir nada
      if (!localStorage.getItem("token")) return;

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

  // ── Estado del plan ─────────────────────────────────
  const estatusActivo = suscripcion && ESTATUS_ACTIVO.includes(suscripcion.estatus);

  const tienePlanActivo = (() => {
    if (!estatusActivo) return false;
    if (!suscripcion.fecha_fin_plan) return true;
    return new Date(suscripcion.fecha_fin_plan) > new Date();
  })();

  const esPrueba = !suscripcion || ESTATUS_PRUEBA.includes(suscripcion.estatus);

  // ── Días restantes ──────────────────────────────────
  const diasRestantes = () => {
    if (estatusActivo && suscripcion.fecha_fin_plan) {
      const diff = Math.ceil((new Date(suscripcion.fecha_fin_plan) - new Date()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    }

    if (suscripcion?.fecha_fin) {
      const diff = Math.ceil((new Date(suscripcion.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    }

    const fechaRegistro = usuario.fecha_registro;
    if (fechaRegistro) {
      const diasUsados = Math.floor((new Date() - new Date(fechaRegistro)) / (1000 * 60 * 60 * 24));
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

  // ── Límites del plan ────────────────────────────────
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

  // ── Refrescar la suscripción (y los módulos) desde el backend ───────
  const refrescarSuscripcion = async () => {
    try {
      const res  = await axios.get(`${API_BASE}/suscripcion/actual`, auth());
      const data = res.data;

      // Si cerraron sesión mientras la petición estaba en vuelo, no reescribir nada
      if (!localStorage.getItem("token")) return null;

      localStorage.setItem("suscripcion", JSON.stringify(data));
      setSuscripcion(data);

      if (Array.isArray(data?.modulos)) {
        localStorage.setItem("modulos", JSON.stringify(data.modulos));
        setModulosState(data.modulos);
      }
      return data;
    } catch (err) {
      console.error("Error al refrescar suscripción:", err);
      throw err;
    }
  };

  // Al montar, si hay sesión, trae la suscripción real (evita datos viejos)
  useEffect(() => {
    if (localStorage.getItem("token")) {
      refrescarSuscripcion().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Resumen del cambio antes de pagar ───────────────
  const cotizarCambio = async (idPlan, periodo = "mensual", adelantar = false) => {
    try {
      const res = await axios.post(
        `${API_BASE}/suscripcion/cotizar`,
        { id_plan: idPlan, periodo, adelantar },
        auth()
      );
      return res.data;
    } catch (err) {
      console.error("Error al cotizar cambio:", err);
      throw err;
    }
  };

  // ── Confirmar: cobra en Stripe, aplica directo o programa ─────
  const iniciarPago = async (idPlan, periodo = "mensual", adelantar = false, activarAuto = false) => {
    try {
      const res = await axios.post(
        `${API_BASE}/suscripcion/checkout`,
        { id_plan: idPlan, periodo, adelantar, activar_auto: activarAuto },
        auth()
      );

      // Sin cobro (el crédito cubrió todo): ya quedó aplicado
      if (res.data.aplicado) {
        await refrescarSuscripcion();
        return res.data;
      }

      if (res.data.url) {
        window.location.href = res.data.url;
      }
      return res.data;
    } catch (err) {
      console.error("Error al iniciar pago:", err);
      throw err;
    }
  };

  // ── Cancelar cambio programado / pago adelantado ────
  const cancelarCambio = async () => {
    try {
      const res = await axios.post(`${API_BASE}/suscripcion/cancelar-cambio`, {}, auth());
      await refrescarSuscripcion().catch(() => {});
      return res.data;
    } catch (err) {
      console.error("Error al cancelar cambio:", err);
      throw err;
    }
  };

  // ── Verificar pago al volver de Stripe ──────────────
  const verificarPagoStripe = async () => {
    const params    = new URLSearchParams(window.location.search);
    const pago      = params.get("pago");
    const sessionId = params.get("session_id");

    if (pago !== "exitoso" || !sessionId) return null;

    try {
      const res = await axios.post(
        `${API_BASE}/suscripcion/verificar-pago`,
        { session_id: sessionId },
        auth()
      );
      await refrescarSuscripcion().catch(() => {});

      // Limpiar la URL solo si se confirmó
      window.history.replaceState({}, "", window.location.pathname);

      return { ok: true, kind: "pago", ...res.data };
    } catch (err) {
      console.error("Error al verificar pago:", err);
      return {
        ok: false,
        kind: "error",
        sessionId,
        message: err.response?.data?.message || "No pudimos confirmar tu pago.",
      };
    }
  };

  const value = {
    usuario,
    permisos,
    modulos,
    tiene,
    tieneAlguno,
    tieneModulo,
    tienePermiso,   // ← agrega esta
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
    cotizarCambio,
    cancelarCambio,
    refrescarSuscripcion,
    refrescarPermisos,
    verificarPagoStripe,
    sincronizarSesion,
  };

  return <PermisosContext.Provider value={value}>{children}</PermisosContext.Provider>;
};

const usePermisos = () => {
  const ctx = useContext(PermisosContext);
  if (!ctx) throw new Error("usePermisos debe usarse dentro de <PermisosProvider>");
  return ctx;
};

export default usePermisos;