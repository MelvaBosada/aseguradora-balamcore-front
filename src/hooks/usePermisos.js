import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

const ESTATUS_ACTIVO  = ["activa", "activo"];
const ESTATUS_PRUEBA  = ["prueba", "trial"];

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const usePermisos = () => {
  const permisos    = JSON.parse(localStorage.getItem("permisos")    || "[]");
  const modulos     = JSON.parse(localStorage.getItem("modulos")     || "[]");
  const usuario     = JSON.parse(localStorage.getItem("usuario")     || "{}");
  const suscripcion = JSON.parse(localStorage.getItem("suscripcion") || "null");

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

  // ── Refrescar la suscripción desde el backend ───────
  const refrescarSuscripcion = async () => {
    const res = await axios.get(`${API_BASE}/suscripcion/actual`, auth());
    localStorage.setItem("suscripcion", JSON.stringify(res.data));
    return res.data;
  };

  // ── Resumen del cambio antes de pagar ───────────────
  const cotizarCambio = async (idPlan, periodo = "mensual", adelantar = false) => {
    const res = await axios.post(
      `${API_BASE}/suscripcion/cotizar`,
      { id_plan: idPlan, periodo, adelantar },
      auth()
    );
    return res.data;
  };

  // ── Confirmar: cobra en Stripe, aplica directo o programa ─────
  const iniciarPago = async (idPlan, periodo = "mensual", adelantar = false) => {
    const res = await axios.post(
      `${API_BASE}/suscripcion/checkout`,
      { id_plan: idPlan, periodo, adelantar },
      auth()
    );

    if (res.data.url) {
      window.location.href = res.data.url;
    }
    return res.data;
  };

  // ── Cancelar cambio programado / pago adelantado ────
  const cancelarCambio = async () => {
    const res = await axios.post(`${API_BASE}/suscripcion/cancelar-cambio`, {}, auth());
    await refrescarSuscripcion().catch(() => {});
    return res.data;
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
      return { ok: true, kind: "pago", ...res.data };
    } catch (err) {
      return {
        ok: false,
        kind: "error",
        sessionId,
        message: err.response?.data?.message || "No pudimos confirmar tu pago.",
      };
    }
  };

  return {
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
    cotizarCambio,
    cancelarCambio,
    refrescarSuscripcion,
    verificarPagoStripe,
  };
};

export default usePermisos;