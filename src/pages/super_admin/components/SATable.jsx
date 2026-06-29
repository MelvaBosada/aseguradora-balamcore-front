import "../css/SATable.css"

/**
 * Tabla reutilizable para vistas de SuperAdmin.
 * Mismo patrón de props que el TablaForm del proyecto (columnas/data/campos/acciones)
 * pero con el theming dark (--sa-*) y sin dependencia de Bootstrap.
 *
 * @param {string[]} columnas   Encabezados a mostrar
 * @param {object[]} data       Filas de datos
 * @param {string[]} campos     Keys de `data` que corresponden, en orden, a cada columna
 * @param {object[]} acciones   [{ icono, titulo, clase, onClick(fila), disabled }]
 *                              icono/clase/disabled pueden ser valor directo o función (fila) => valor
 * @param {string}   emptyText  Texto cuando no hay datos
 */
function SATable({ columnas, data, campos, acciones, emptyText = "No se encontraron resultados" }) {
  return (
    <div className="sa-table-wrap">
      <table className="sa-table">
        <thead>
          <tr>
            {columnas.map((col, index) => (
              <th key={index}>{col}</th>
            ))}
            {acciones && <th style={{ textAlign: "center" }}>Acciones</th>}
          </tr>
        </thead>

        <tbody>
          {data.map((fila, index) => (
            <tr key={fila.id ?? index}>
              {campos.map((campo, i) => (
                <td key={i}>{fila[campo]}</td>
              ))}

              {acciones && (
                <td style={{ textAlign: "center" }}>
                  <div className="sa-table-acciones">
                    {acciones.map((accion, i) => {
                      const icono = typeof accion.icono === "function" ? accion.icono(fila) : accion.icono;
                      const titulo = typeof accion.titulo === "function" ? accion.titulo(fila) : accion.titulo;
                      const clase = typeof accion.clase === "function" ? accion.clase(fila) : accion.clase;
                      const disabled = typeof accion.disabled === "function" ? accion.disabled(fila) : !!accion.disabled;

                      return (
                        <button
                          key={i}
                          className={`sa-table-btn ${clase || ""}`}
                          title={titulo}
                          onClick={() => !disabled && accion.onClick(fila)}
                          disabled={disabled}
                          type="button"
                        >
                          {icono}
                        </button>
                      );
                    })}
                  </div>
                </td>
              )}
            </tr>
          ))}

          {data.length === 0 && (
            <tr>
              <td colSpan={columnas.length + (acciones ? 1 : 0)} className="sa-table-empty">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SATable;
