import SAForm from "../../components/SAForm";

// Definición de los campos del formulario de plan.
// Igual que con aseguradoras: esto es lo único específico de esta
// entidad, el motor (SAForm) sigue siendo genérico.
const PLAN_FIELDS = [
  { name: "nombre", label: "Nombre del plan", type: "text", required: true, maxLength: 100 },
  { name: "descripcion", label: "Descripción", type: "textarea", span: 2, maxLength: 255 },
  { name: "precio", label: "Precio mensual (MXN)", type: "number", required: true },
  { name: "precio_anual", label: "Precio anual (MXN)", type: "number" },
  { name: "duracion_dias", label: "Duración (días)", type: "number", required: true, defaultValue: 30 },
  { name: "dias_prueba", label: "Días de prueba", type: "number", defaultValue: 15 },
  { name: "stripe_price_id", label: "Stripe Price ID", type: "text", placeholder: "price_..." },
  { name: "limite_polizas_vencer_dia", label: "Límite pólizas por vencer/día", type: "number", placeholder: "Sin límite" },
  { name: "limite_siniestros_mes", label: "Límite siniestros/mes", type: "number", placeholder: "Sin límite" },
  { name: "limite_bienes_por_cliente", label: "Límite bienes por cliente", type: "number", placeholder: "Sin límite" },
  {
    name: "pdf_ilimitado",
    label: "PDF ilimitado",
    type: "select",
    options: ["Sí", "No"],
    transform: (v) => v, // se traduce a boolean al armar el payload, ver onSubmit en SAPlanes
  },
  {
    name: "soporte_prioritario",
    label: "Soporte prioritario",
    type: "select",
    options: ["Sí", "No"],
  },
];

/**
 * Wrapper delgado: conecta la configuración de campos de "plan"
 * con el motor genérico SAForm.
 */
function PlanForm({ plan, onSubmit, onCancel, errorMsg, loading }) {
  return (
    <SAForm
      fields={PLAN_FIELDS}
      initialValues={
        plan
          ? {
              ...plan,
              pdf_ilimitado: plan.pdf_ilimitado ? "Sí" : "No",
              soporte_prioritario: plan.soporte_prioritario ? "Sí" : "No",
            }
          : null
      }
      onSubmit={onSubmit}
      onCancel={onCancel}
      errorMsg={errorMsg}
      loading={loading}
      submitLabel="Crear plan"
      submitLabelEdit="Guardar cambios"
    />
  );
}

export default PlanForm;
