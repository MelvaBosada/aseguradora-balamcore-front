import Table from 'react-bootstrap/Table';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "./IconButton";

function TablaForm({ columna, data, campos, onEditar, onEliminar }) {
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

            {/* SOLO LOS CAMPOS QUE QUIERES */}
            {campos.map((campo, i) => (
              <td key={i}>{fila[campo]}</td>
            ))}

            {/* ACCIONES */}
            <td>
              <IconButton
                icon={<EditIcon />}
                onClick={() => onEditar(fila)}
                title="Editar"
              />

              <IconButton
                icon={<DeleteIcon />}
                onClick={() => onEliminar(fila)}
                title="Eliminar"
                hover="#8B1E1E"
              />
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