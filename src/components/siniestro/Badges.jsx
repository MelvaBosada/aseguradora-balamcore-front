import "../../css/SiniestroDetalle.css";

const COLORES = {
  verde: { bg: "#DDF3E7", color: "#1B6B45" },
  amarillo: { bg: "#FFF4D6", color: "#9A6B00" },
  rojo: { bg: "#FBE0DC", color: "#B3281B" },
  gris: { bg: "#EEF0EF", color: "#55605B" },
  azul: { bg: "#E3EEFB", color: "#1F5FA8" },
  naranja: { bg: "#FFE8D1", color: "#B85A0B" },
};

export const Badge = ({ texto, color = "gris" }) => {
  const c = COLORES[color] || COLORES.gris;
  return (
    <span className="sd-badge" style={{ background: c.bg, color: c.color }}>
      {texto}
    </span>
  );
};

// "Activa", "ACTIVA", "En renovación" -> "activa", "en_renovacion"
const normalizar = (v) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const crear = (mapa) => ({ valor }) => {
  const [texto, color] = mapa[normalizar(valor)] || [
    valor ? String(valor).replace(/_/g, " ") : "—",
    "gris",
  ];
  return <Badge texto={texto} color={color} />;
};

export const MAPA_SINIESTRO = {
  abierto: ["Abierto", "azul"],                              // inicio, neutro
  documentacion_pendiente: ["Documentación pendiente", "amarillo"], // espera algo del cliente
  en_proceso: ["En proceso", "azul"],                        // trabajo en curso
  en_evaluacion: ["En evaluación", "naranja"],               // requiere atención del ajustador
  dictaminado: ["Dictaminado", "naranja"],                   // decisión pendiente de autorizar
  autorizado: ["Autorizado", "verde"],                       // aprobado
  en_pago: ["En pago", "verde"],                             // casi cerrado, positivo
  pagado: ["Pagado", "verde"],                               // meta cumplida
  rechazado: ["Rechazado", "rojo"],                          // negativo
  cancelado: ["Cancelado", "gris"],                          // cierre sin resolución
  cerrado: ["Cerrado", "gris"],                              // terminado
  reabierto: ["Reabierto", "amarillo"],                      // vuelve a requerir atención
  vencido: ["Vencido", "rojo"],                              // plazo incumplido
};


export const EstatusSiniestro = crear(MAPA_SINIESTRO);

export const EstadoDocumento = crear({
  pendiente: ["Pendiente", "amarillo"],
  recibido: ["Por revisar", "azul"],
  aprobado: ["Aprobado", "verde"],
  rechazado: ["Rechazado", "rojo"],
  exento: ["Exento", "gris"],
});

export const PrioridadSiniestro = crear({
  baja: ["Baja", "verde"],
  media: ["Media", "amarillo"],
  alta: ["Alta", "naranja"],
  urgente: ["Urgente", "rojo"],
});

export const EstatusEvaluacion = crear({
  borrador: ["Borrador", "gris"],
  en_revision: ["Por autorizar", "amarillo"],
  por_autorizar: ["Por autorizar", "amarillo"],
  aprobada: ["Aprobada", "verde"],
  rechazada: ["Devuelta", "rojo"],
  devuelta: ["Devuelta", "rojo"],
});

export const EstatusIndemnizacion = crear({
  pendiente: ["Pendiente", "amarillo"],
  autorizada: ["Lista para pagar", "azul"],
  pagada: ["Pagada", "verde"],
  rechazada: ["Anulada", "rojo"],
});

export const EstatusReporte = crear({
  nuevo: ["Nuevo", "azul"],
  validado: ["Validado", "verde"],
  convertido: ["Convertido en siniestro", "gris"],
  descartado: ["Descartado", "rojo"],
});

export const EstatusEvidencia = crear({
  pendiente: ["Pendiente", "amarillo"],
  validada: ["Validada", "verde"],
  rechazada: ["Rechazada", "rojo"],
});

export const EstatusPoliza = crear({
  activa: ["Activa", "verde"],
  activo: ["Activa", "verde"],
  vigente: ["Activa", "verde"],
  vencida: ["Vencida", "amarillo"],
  vencido: ["Vencida", "amarillo"],
  cancelada: ["Cancelada", "rojo"],
  cancelado: ["Cancelada", "rojo"],
  suspendida: ["Suspendida", "amarillo"],
  en_renovacion: ["En renovación", "azul"],
  borrador: ["Borrador", "gris"],
});

export const NivelAutorizacion = crear({
  auto: ["Automática", "verde"],
  supervisor: ["Supervisor", "azul"],
  gerente: ["Gerencia", "naranja"],
});

export const EstatusCliente = crear({
  activo: ["Activo", "verde"],
  inactivo: ["Inactivo", "gris"],
  suspendido: ["Suspendido", "amarillo"],
});

export const EstadoLaboral = crear({
  activo: ["Activo", "verde"],
  inactivo: ["Inactivo", "gris"],
  suspendido: ["Suspendido", "amarillo"],
  baja: ["Baja", "rojo"],
});

export const EstadoBien = crear({
  excelente: ["Excelente", "verde"],
  bueno: ["Bueno", "azul"],
  regular: ["Regular", "amarillo"],
  malo: ["Malo", "rojo"],
});

export const NivelRiesgoBien = crear({
  bajo: ["Bajo", "verde"],
  medio: ["Medio", "amarillo"],
  alto: ["Alto", "naranja"],
  muy_alto: ["Muy alto", "rojo"],
});

export const TipoBien = crear({
  vehiculo: ["Vehículo", "azul"],
  inmueble: ["Inmueble", "naranja"],
  electronico: ["Electrónico", "amarillo"],
  maquinaria: ["Maquinaria", "gris"],
});