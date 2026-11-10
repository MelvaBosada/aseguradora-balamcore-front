import Table from "react-bootstrap/Table";
import "../css/TablaForm.css";
import useAccionAsync from "../hooks/useAccionAsync";

// Convierte "Documentación pendiente" -> "documentacion-pendiente"
const slug = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");

// Nombres de campo (en `campos`) que se pintan como badge.
// Ajusta a como se llamen en tus módulos.
const CAMPOS_BADGE = ["estatus", "status", "prioridad"];

function BotonAccion({ accion, fila, icono, clase, disabled }) {
  const [handleClick, busy] = useAccionAsync(() => accion.onClick(fila));

  // `titulo` puede ser texto fijo o una función de la fila (p. ej. "Asignar" / "Reasignar")
  const titulo =
    typeof accion.titulo === "function" ? accion.titulo(fila) : accion.titulo;

  return (
    <button
      type="button"
      className={`tabla-btn ${clase}${busy ? " tabla-btn-busy" : ""}`}
      title={titulo}
      data-tour={
        titulo
          ? `tabla-accion-${String(titulo).toLowerCase().replace(/\s+/g, "-")}`
          : "tabla-accion"
      }
      onClick={() => {
        if (!disabled && !busy) {
          handleClick();
        }
      }}
      disabled={disabled || busy}
      aria-busy={busy}
    >
      {busy ? <span className="tabla-spinner" /> : icono}
    </button>
  );
}

function TablaForm({ columna, data, campos, acciones }) {
  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          {columna.map((col, index) => (
            <th key={index}>{col}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((fila, index) => (
          <tr key={fila.id || index}>
            {campos.map((campo, i) => {
              const valor = fila[campo];
              const esImagen =
                typeof valor === "string" && valor.startsWith("data:image");

              return (
                <td key={i} className={esImagen ? "tabla-celda-foto" : ""}>
                  {esImagen ? (
                    valor ? (
                      <img
                        src={valor}
                        alt="Foto"
                        className="tabla-foto-thumb"
                      />
                    ) : (
                      <div className="tabla-foto-placeholder">Sin foto</div>
                    )
                  ) : CAMPOS_BADGE.includes(campo) && valor ? (
                    <span className={`badge-tabla badge-${slug(valor)}`}>
                      {valor}
                    </span>
                  ) : (
                    valor
                  )}
                </td>
              );
            })}

            <td style={{ textAlign: "center" }}>
              <div className="tabla-acciones">
                {acciones?.map((accion, i) => {
                  const oculto =
                    typeof accion.oculto === "function"
                      ? accion.oculto(fila)
                      : Boolean(accion.oculto);

                  if (oculto) {
                    return null;
                  }

                  const icono =
                    typeof accion.icono === "function"
                      ? accion.icono(fila)
                      : accion.icono;

                  const clase =
                    typeof accion.clase === "function"
                      ? accion.clase(fila)
                      : accion.clase;

                  const disabled =
                    typeof accion.disabled === "function"
                      ? accion.disabled(fila)
                      : Boolean(accion.disabled);

                  return (
                    <BotonAccion
                      key={i}
                      accion={accion}
                      fila={fila}
                      icono={icono}
                      clase={clase}
                      disabled={disabled}
                    />
                  );
                })}
              </div>
            </td>
          </tr>
        ))}

        {data.length === 0 && (
          <tr>
            <td colSpan={columna.length} className="text-center py-3">
              No se encontraron registros
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}

export default TablaForm;
