import Table from 'react-bootstrap/Table';
import "../css/TablaForm.css";

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
                {acciones && acciones.map((accion, i) => {
                  const icono    = typeof accion.icono    === "function" ? accion.icono(fila)    : accion.icono;
                  const clase    = typeof accion.clase    === "function" ? accion.clase(fila)    : accion.clase;
                  const disabled = typeof accion.disabled === "function" ? accion.disabled(fila) : !!accion.disabled;

                  return (
                    <button
                      key={i}
                      className={`tabla-btn ${clase}`}
                      title={accion.titulo}
                      onClick={() => !disabled && accion.onClick(fila)}
                      disabled={disabled}
                    >
                      {icono}
                    </button>
                  );
                })}
              </div>
            </td>

          </tr>
        ))}

        {data.length === 0 && (
          <tr>
            <td colSpan={columna.length} className="text-center py-3">
              No se encontró a nadie
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}

export default TablaForm;