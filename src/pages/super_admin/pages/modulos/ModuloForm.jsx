import SAForm from "../../components/SAForm";

// Definición de los campos del formulario de módulo.
// El select de "módulo padre" se llena dinámicamente desde SAModulos
// (necesita la lista de módulos existentes), así que se inyecta como
// prop en vez de quedar fijo aquí.
function buildModuloFields(modulosDisponibles, moduloActualId) {
  // Un módulo no puede ser padre de sí mismo, así que se excluye de
  // las opciones cuando estamos editando.
  const opcionesPadre = modulosDisponibles
    .filter((m) => m.id !== moduloActualId)
    .map((m) => m.nombre);

  return [
    { name: "nombre", label: "Nombre del módulo", type: "text", required: true, maxLength: 100 },
    {
      name: "clave",
      label: "Clave (slug)",
      type: "text",
      required: true,
      maxLength: 50,
      placeholder: "ej. polizas",
      transform: (v) => v.toLowerCase().replace(/\s+/g, "_"),
    },
    { name: "icono", label: "Icono", type: "text", placeholder: "nombre de icono o emoji" },
    { name: "orden", label: "Orden", type: "number", required: true, defaultValue: 1 },
    {
      name: "id_modulo_padre_nombre",
      label: "Módulo padre",
      type: "select",
      options: opcionesPadre,
      placeholder: "Ninguno (módulo raíz)",
    },
  ];
}

/**
conecta la configuración de campos de "módulo"
con el motor genérico SAForm.
 */
function ModuloForm({ modulo, modulosDisponibles, onSubmit, onCancel, errorMsg, loading }) {
  const fields = buildModuloFields(modulosDisponibles, modulo?.id);

  const padreActual = modulo?.id_modulo_padre
    ? modulosDisponibles.find((m) => m.id === modulo.id_modulo_padre)?.nombre
    : "";

  return (
    <SAForm
      fields={fields}
      initialValues={
        modulo
          ? { ...modulo, id_modulo_padre_nombre: padreActual || "" }
          : null
      }
      onSubmit={onSubmit}
      onCancel={onCancel}
      errorMsg={errorMsg}
      loading={loading}
      submitLabel="Crear módulo"
      submitLabelEdit="Guardar cambios"
    />
  );
}

export default ModuloForm;
