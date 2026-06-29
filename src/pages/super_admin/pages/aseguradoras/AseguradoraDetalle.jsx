import SADetalle from "../../components/SADetalle";
import { logoUrl } from "../../config";

const ESTATUS_VARIANT = {
  activo: "success",
  inactivo: "neutral",
  suspendido: "danger",
};

/**
 * Wrapper delgado: traduce el objeto "aseguradora" al formato genérico
 * que espera SADetalle (header + items). Toda la lógica de layout vive
 * en SADetalle; aquí solo se decide QUÉ campos mostrar.
 */
function AseguradoraDetalle({ aseguradora }) {
  if (!aseguradora) return null;

  const fecha = aseguradora.fecha_registro
    ? new Date(aseguradora.fecha_registro).toLocaleDateString("es-MX", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  return (
    <SADetalle
      header={{
        image: logoUrl(aseguradora.logo),
        fallbackIcon: "🏢",
        title: aseguradora.nombre,
        subtitle: aseguradora.razon_social,
        badge: {
          text: aseguradora.estatus,
          variant: ESTATUS_VARIANT[aseguradora.estatus] || "neutral",
        },
      }}
      items={[
        { label: "RFC", value: aseguradora.rfc },
        { label: "Correo", value: aseguradora.correo },
        { label: "Teléfono", value: aseguradora.telefono },
        { label: "Sitio web", value: aseguradora.sitio_web },
        {
          label: "Domicilio",
          value: `${aseguradora.domicilio}, ${aseguradora.municipio}, ${aseguradora.estado}, ${aseguradora.codigo_postal}, ${aseguradora.pais}`,
          span: 2,
        },
        { label: "Fecha de registro", value: fecha },
        {
          label: "Plan",
          value: aseguradora.plan ?? "Trial",
          hint: aseguradora.plan ? null : "(se administra en la vista de Planes)",
        },
        { label: "Observaciones", value: aseguradora.observaciones, span: 2, hideIfEmpty: true },
      ]}
    />
  );
}

export default AseguradoraDetalle;
