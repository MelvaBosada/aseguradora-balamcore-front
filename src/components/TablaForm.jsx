// components/TablaForm.jsx
import Table from 'react-bootstrap/Table';

function TablaForm({columna, data, onEditar, onEliminar}) {
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
            {Object.keys(columna).map((key, i) => {
              // Mapeamos las propiedades del objeto a las celdas
              if (i < columna.length - 1) { // Última columna es Acciones
                const propiedad = Object.keys(fila)[i];
                return <td key={i}>{fila[propiedad]}</td>;
              }
              return null;
            })}
            <td key="acciones">
              <button 
                className="btn btn-link p-0 me-2 text-decoration-none text-dark"
                onClick={() => onEditar(fila)}
                title="Editar"
              >
                ✏️
              </button>
              <button 
                className="btn btn-link p-0 text-decoration-none text-dark"
                onClick={() => onEliminar(fila)}
                title="Eliminar"
              >
                🗑️
              </button>
            </td>
          </tr>
        ))}
        {data.length === 0 && (
          <tr>
            <td colSpan={columna.length} className="text-center py-3">
              No se encontro a nadie
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}

export default TablaForm;