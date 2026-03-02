import Table from 'react-bootstrap/Table';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import IconButton from "./IconButton";
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

            {campos.map((campo, i) => (
              <td key={i}>{fila[campo]}</td>
            ))}

          <td style={{ textAlign: "center" }}>
  <div className="tabla-acciones">
    {acciones && acciones.map((accion, i) => (
      <button
        key={i}
        className={`tabla-btn ${accion.clase}`}
        title={accion.titulo}
        onClick={() => accion.onClick(fila)}
      >
        {accion.icono}
      </button>
    ))}
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
