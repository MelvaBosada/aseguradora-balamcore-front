import "../../css/SiniestroDetalle.css";

const COLORES = {
  verde: { bg: "#DDF3E7", color: "#1B6B45" },
  amarillo: { bg: "#FFF4D6", color: "#9A6B00" },
  rojo: { bg: "#FBE0DC", color: "#B3281B" },
  gris: { bg: "#EEF0EF", color: "#55605B" },
  azul: { bg: "#E3EEFB", color: "#1F5FA8" },
};

export const Badge = ({ texto, color = "gris" }) => {
  const c = COLORES[color] || COLORES.gris;
  return (
    <span className="sd-badge" style={{ background: c.bg, color: c.color }}>
      {texto}
    </span>
  );
};

const crear = (mapa) => ({ valor }) => {
  const [texto, color] = mapa[valor] || [valor || "—", "gris"];
  return <Badge texto={texto} color={color} />;
};

export const MAPA_SINIESTRO = {
  abierto: ["Abierto", "azul"],
  documentacion_pendiente: ["Documentación pendiente", "amarillo"],
  en_evaluacion: ["En evaluación", "azul"],
  dictaminado: ["Dictaminado", "azul"],
  autorizado: ["Autorizado", "verde"],
  en_pago: ["En pago", "verde"],
  pagado: ["Pagado", "verde"],
  rechazado: ["Rechazado", "rojo"],
  cancelado: ["Cancelado", "gris"],
  cerrado: ["Cerrado", "gris"],
  reabierto: ["Reabierto", "amarillo"],
};

export const EstatusSiniestro = crear(MAPA_SINIESTRO);

export const EstadoDocumento = crear({
  pendiente: ["Pendiente", "amarillo"],
  recibido: ["Por revisar", "azul"],
  aprobado: ["Aprobado", "verde"],
  rechazado: ["Rechazado", "rojo"],
  exento: ["Exento", "gris"],
});

export const EstatusEvaluacion = crear({
  borrador: ["Borrador", "gris"],
  en_revision: ["Por autorizar", "amarillo"],
  aprobada: ["Aprobada", "verde"],
  rechazada: ["Devuelta", "rojo"],
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
