import axios from "axios";

// Estatus que significan plan pagado activo
const ESTATUS_ACTIVO  = ["activa", "activo"];
// Estatus que significan periodo de prueba
const ESTATUS_PRUEBA  = ["prueba", "trial"];
// Todos los estatus válidos
const ESTATUS_VALIDOS = [...ESTATUS_ACTIVO, ...ESTATUS_PRUEBA];

const usePermisos = () => {
  const permisos    = JSON.parse(localStorage.getItem("permisos")    || "[]");
  const modulos     = JSON.parse(localStorage.getItem("modulos")     || "[]");
  const usuario     = JSON.parse(localStorage.getItem("usuario")     || "{}");
  const suscripcion = JSON.parse(localStorage.getItem("suscripcion") || "null");

  // ── Tiene módulo y permiso ──────────────────────────
 // ✅ Pon esto
const tieneModulo  = (clave) => modulos.length === 0 || modulos.includes(clave);
const tienePermiso = (clave) => permisos.includes(clave);
const tiene        = (clave) => tienePermiso(clave) && tieneModulo(clave);

  const tieneAlguno = (...claves) => claves.some((c) => tiene(c));

  // ── Estado del plan ─────────────────────────────────
  const tienePlanActivo = suscripcion && ESTATUS_ACTIVO.includes(suscripcion.estatus);
  const esPrueba        = !suscripcion || ESTATUS_PRUEBA.includes(suscripcion.estatus);

  // ── Días restantes ──────────────────────────────────
  const diasRestantes = () => {
    // Plan pagado — usar fecha_fin_plan
    if (tienePlanActivo && suscripcion.fecha_fin_plan) {
      const fin  = new Date(suscripcion.fecha_fin_plan);
      const hoy  = new Date();
      const diff = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    }

    // Trial — usar fecha_fin si existe, si no calcular desde fecha_registro
    if (suscripcion?.fecha_fin) {
      const fin  = new Date(suscripcion.fecha_fin);
      const hoy  = new Date();
      const diff = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    }

    // Fallback: calcular desde fecha_registro de la aseguradora
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

  const vencida = diasRestantes() <= 0 && !tienePlanActivo;
  const esAdmin = usuario.rol === "Administrador" || usuario.id_rol === 1;

  // ── Límites del plan ────────────────────────────────
  const limites = {
    siniestrosMes:      suscripcion?.limite_siniestros_mes      ?? null,
    polizasVencerDia:   suscripcion?.limite_polizas_vencer_dia  ?? null,
    bienesPorCliente:   suscripcion?.limite_bienes_por_cliente  ?? null,
    pdfIlimitado:       suscripcion?.pdf_ilimitado              ?? false,
    soportePrioritario: suscripcion?.soporte_prioritario        ?? false,
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

  // ── Iniciar pago con Stripe ─────────────────────────
  const iniciarPago = async (idPlan, periodo = "mensual") => {
    try {
      const token = localStorage.getItem("token");
      const res   = await axios.post(
        "http://localhost:8000/api/suscripcion/checkout",
        { id_plan: idPlan, periodo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = res.data.url;
    } catch (err) {
      console.error("Error al iniciar pago:", err);
      throw err;
    }
  };

  // ── Verificar pago al volver de Stripe ─────────────
  const verificarPagoStripe = async () => {
    const params    = new URLSearchParams(window.location.search);
    const pago      = params.get("pago");
    const sessionId = params.get("session_id");

    if (pago !== "exitoso" || !sessionId) return null;

    try {
      const token = localStorage.getItem("token");
      const res   = await axios.post(
        "http://localhost:8000/api/suscripcion/verificar-pago",
        { session_id: sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar suscripción en localStorage
      const resSus = await axios.get(
        "http://localhost:8000/api/suscripcion/actual",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem("suscripcion", JSON.stringify(resSus.data));

      // Limpiar params de la URL sin recargar
      window.history.replaceState({}, "", window.location.pathname);

      return res.data;
    } catch (err) {
      console.error("Error al verificar pago:", err);
      return null;
    }
  };

  return {
    permisos,
    modulos,
    tiene,
    tieneAlguno,
    suscripcion,
    diasRestantes,
    esPrueba,
    tienePlanActivo,
    vencida,
    esAdmin,
    limites,
    puedeCrear,
    iniciarPago,
    verificarPagoStripe,
  tieneModulo,


    
  };
};

export default usePermisos;
