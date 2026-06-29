import SAForm from "../../components/SAForm";

/**
 * Construye los campos del form de usuario. Los selects de rol y
 * aseguradora se llenan dinámicamente porque dependen de datos que
 * vive en otras tablas — se inyectan como listas ya cargadas desde
 * SAUsuarios (igual que con "módulo padre" en ModuloForm).
 */
function buildUsuarioFields(roles, aseguradoras, isEdit) {
  return [
    { name: "correo", label: "Correo", type: "email", required: true, maxLength: 150 },
    {
      name: "password",
      label: isEdit ? "Nueva contraseña" : "Contraseña",
      type: "password",
      required: !isEdit,
      hint: isEdit ? "Déjalo en blanco para no cambiarla" : undefined,
    },
    {
      name: "rol_nombre",
      label: "Rol",
      type: "select",
      required: true,
      options: roles.map((r) => r.nombre),
    },
    {
      name: "aseguradora_nombre",
      label: "Aseguradora",
      type: "select",
      options: aseguradoras.map((a) => a.nombre),
      placeholder: "Ninguna (usuario interno)",
    },
    {
      name: "es_superadmin_label",
      label: "Es Super Admin",
      type: "select",
      options: ["No", "Sí"],
      defaultValue: "No",
    },
  ];
}

/**
 * Wrapper delgado: conecta la configuración de campos de "usuario"
 * con el motor genérico SAForm. La traducción rol/aseguradora (nombre
 * → id) y booleano (Sí/No → 1/0) se hace en SAUsuarios al armar el payload,
 * igual que con PlanForm/ModuloForm.
 */
function UsuarioForm({ usuario, roles, aseguradoras, onSubmit, onCancel, errorMsg, loading }) {
  const isEdit = !!usuario;
  const fields = buildUsuarioFields(roles, aseguradoras, isEdit);

  const initialValues = usuario
    ? {
        correo: usuario.correo,
        rol_nombre: usuario.rol || "",
        aseguradora_nombre: usuario.aseguradora || "",
        es_superadmin_label: usuario.es_superadmin ? "Sí" : "No",
      }
    : null;

  return (
    <SAForm
      fields={fields}
      initialValues={initialValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
      errorMsg={errorMsg}
      loading={loading}
      submitLabel="Crear usuario"
      submitLabelEdit="Guardar cambios"
    />
  );
}

export default UsuarioForm;
