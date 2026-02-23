import Table from 'react-bootstrap/Table';


function TablaForm({columna, data}) {
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
          <tr key={index}>
            {fila.map((celda, i) => (
              <td key={i}>{celda}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
export default TablaForm;