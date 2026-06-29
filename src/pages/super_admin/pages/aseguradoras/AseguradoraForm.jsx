import SAForm from "../../components/SAForm";

const ESTADOS_MX = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
  "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "México",
  "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
  "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora",
  "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];

// Definición de los campos del formulario de aseguradora.
// Esto es lo único específico de esta entidad: el motor (SAForm) es genérico.
const ASEGURADORA_FIELDS = [
  {
    name: "logo",
    label: "Logo",
    type: "image",
    hint: "PNG o JPG, máx. 2MB",
    placeholderIcon: "🏢",
  },
  { name: "nombre", label: "Nombre comercial", type: "text", required: true, maxLength: 150 },
  { name: "razon_social", label: "Razón social", type: "text", required: true, maxLength: 200 },
  {
    name: "rfc",
    label: "RFC",
    type: "text",
    required: true,
    maxLength: 13,
    transform: (v) => v.toUpperCase(),
    validate: (v) => (v && v.trim().length < 12 ? "RFC inválido" : null),
    disabledOnEdit: true,
    disabledHint: "El RFC no se puede modificar",
  },
  { name: "correo", label: "Correo", type: "email", required: true, maxLength: 100 },
  { name: "telefono", label: "Teléfono", type: "text", required: true, maxLength: 15 },
  { name: "sitio_web", label: "Sitio web", type: "text", placeholder: "https://..." },
  { name: "domicilio", label: "Domicilio", type: "text", required: true, span: 2 },
  { name: "municipio", label: "Municipio", type: "text", required: true },
  { name: "estado", label: "Estado", type: "select", required: true, options: ESTADOS_MX },
  { name: "codigo_postal", label: "Código postal", type: "text", required: true, maxLength: 5 },
  { name: "pais", label: "País", type: "text", required: true, defaultValue: "México" },
  { name: "observaciones", label: "Observaciones", type: "textarea", span: 2 },
];

/**
 * Wrapper delgado: conecta la configuración de campos de "aseguradora"
 * con el motor genérico SAForm. Si necesitas el form en otro lado
 * (por ejemplo un wizard de alta distinto), puedes usar SAForm directo
 * con ASEGURADORA_FIELDS sin pasar por este componente.
 */
function AseguradoraForm({ aseguradora, onSubmit, onCancel, errorMsg, loading }) {
  return (
    <SAForm
      fields={ASEGURADORA_FIELDS}
      initialValues={aseguradora}
      onSubmit={onSubmit}
      onCancel={onCancel}
      errorMsg={errorMsg}
      loading={loading}
      submitLabel="Crear aseguradora"
      submitLabelEdit="Guardar cambios"
      buildImageUrl={(path) => `/storage/${path}`}
    />
  );
}

export default AseguradoraForm;
