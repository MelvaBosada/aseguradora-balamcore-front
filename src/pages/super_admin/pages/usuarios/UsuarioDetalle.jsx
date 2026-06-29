import SADetalle from "../../components/SADetalle";

/**
 * Wrapper delgado de solo lectura para el detalle de un usuario.
 */
function UsuarioDetalle({ usuario }) {
  if (!usuario) return null;

  return (
    <SADetalle
      header={{
        fallbackIcon: "👤",
        title: usuario.correo,
        subtitle: usuario.rol,
        badge: usuario.es_superadmin
          ? { text: "Super Admin", variant: "pro" }
          : { text: usuario.rol || "Usuario", variant: "neutral" },
      }}
      items={[
        { label: "Correo", value: usuario.correo },
        { label: "Rol", value: usuario.rol },
        { label: "Aseguradora", value: usuario.aseguradora, hint: usuario.aseguradora ? null : "(usuario interno)" },
        { label: "Super Admin", value: usuario.es_superadmin ? "Sí" : "No" },
      ]}
    />
  );
}

export default UsuarioDetalle;
