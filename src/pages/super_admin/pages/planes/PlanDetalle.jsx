import SADetalle from "../../components/SADetalle";

const ESTATUS_VARIANT = {
  activo: "success",
  inactivo: "neutral",
};

function moneyMXN(value) {
  if (value === null || value === undefined) return null;
  return `$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`;
}

/**
 * Wrapper delgado de solo lectura para el detalle de un plan.
 * Toda la lógica de layout vive en SADetalle; aquí solo se decide
 * QUÉ campos mostrar y cómo formatearlos.
 */
function PlanDetalle({ plan }) {
  if (!plan) return null;

  return (
    <SADetalle
      header={{
        fallbackIcon: "💳",
        title: plan.nombre,
        subtitle: plan.descripcion,
        badge: {
          text: plan.estatus,
          variant: ESTATUS_VARIANT[plan.estatus] || "neutral",
        },
      }}
      items={[
        { label: "Precio mensual", value: moneyMXN(plan.precio) },
        { label: "Precio anual", value: moneyMXN(plan.precio_anual) },
        { label: "Duración", value: plan.duracion_dias ? `${plan.duracion_dias} días` : null },
        { label: "Días de prueba", value: plan.dias_prueba ? `${plan.dias_prueba} días` : null },
        { label: "Stripe Price ID", value: plan.stripe_price_id, hideIfEmpty: true },
        {
          label: "Límite pólizas por vencer/día",
          value: plan.limite_polizas_vencer_dia ?? "Sin límite",
        },
        {
          label: "Límite siniestros/mes",
          value: plan.limite_siniestros_mes ?? "Sin límite",
        },
        {
          label: "Límite bienes por cliente",
          value: plan.limite_bienes_por_cliente ?? "Sin límite",
        },
        { label: "PDF ilimitado", value: plan.pdf_ilimitado ? "Sí" : "No" },
        { label: "Soporte prioritario", value: plan.soporte_prioritario ? "Sí" : "No" },
        {
          label: "Módulos asignados",
          value: plan.modulos?.length
            ? plan.modulos.map((m) => m.nombre).join(", ")
            : "Ninguno asignado",
          span: 2,
        },
      ]}
    />
  );
}

export default PlanDetalle;
