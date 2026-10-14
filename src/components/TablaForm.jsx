import Table from "react-bootstrap/Table";
import "../css/TablaForm.css";
import useAccionAsync from "../hooks/useAccionAsync";

function BotonAccion({ accion, fila, icono, clase, disabled }) {
  const [handleClick, busy] = useAccionAsync(() => accion.onClick(fila));

  return (
    <button
      type="button"
      className={`tabla-btn ${clase}${busy ? " tabla-btn-busy" : ""}`}
      title={accion.titulo}
      data-tour={
        accion.titulo
          ? `tabla-accion-${accion.titulo.toLowerCase().replace(/\s+/g, "-")}`
          : "tabla-accion"
      }
      onClick={() => {
        if (!disabled) {
          handleClick();
        }
      }}
      disabled={disabled}
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
              const esImagen = typeof valor === "string" && valor.startsWith("data:image");

              return (
                <td key={i} className={esImagen ? "tabla-celda-foto" : ""}>
                  {esImagen ? (
                    valor ? (
                      <img src={valor} alt="Foto" className="tabla-foto-thumb" />
                    ) : (
                      <div className="tabla-foto-placeholder">Sin foto</div>
                    )
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