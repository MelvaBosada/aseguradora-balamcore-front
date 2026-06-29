import SADetalle from "../../components/SADetalle";

const ESTATUS_VARIANT = {
  activo: "success",
  activa: "success",
  prueba: "warning",
  trial: "warning",
  renovada: "std",
  cancelado: "danger",
  cancelada: "danger",
};

function moneyMXN(value) {
  if (value === null || value === undefined) return null;
  return `$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`;
}

function formatFecha(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Wrapper delgado de solo lectura para el detalle de una suscripción.
 */
function SuscripcionDetalle({ suscripcion }) {
  if (!suscripcion) return null;

  return (
    <SADetalle
      header={{
        fallbackIcon: "↻",
        title: suscripcion.aseguradora,
        subtitle: `Plan ${suscripcion.plan}`,
        badge: {
          text: suscripcion.estatus,
          variant: ESTATUS_VARIANT[suscripcion.estatus] || "neutral",
        },
      }}
      items={[
        { label: "Plan", value: suscripcion.plan },
        { label: "Precio", value: moneyMXN(suscripcion.precio) },
        { label: "Fecha de inicio", value: formatFecha(suscripcion.fecha_inicio) },
        { label: "Fecha de fin", value: formatFecha(suscripcion.fecha_fin) },
        { label: "Es prueba", value: suscripcion.es_trial ? "Sí" : "No" },
        { label: "Fin de prueba", value: formatFecha(suscripcion.fecha_fin_trial), hideIfEmpty: true },
        { label: "Inicio de plan pagado", value: formatFecha(suscripcion.fecha_inicio_plan), hideIfEmpty: true },
        { label: "Fin de plan pagado", value: formatFecha(suscripcion.fecha_fin_plan), hideIfEmpty: true },
        { label: "Fecha de cancelación", value: formatFecha(suscripcion.fecha_cancelacion), hideIfEmpty: true },
        { label: "Stripe Subscription ID", value: suscripcion.stripe_subscription_id, hideIfEmpty: true },
        { label: "Observaciones", value: suscripcion.observaciones, span: 2, hideIfEmpty: true },
      ]}
    />
  );
}

export default SuscripcionDetalle;
