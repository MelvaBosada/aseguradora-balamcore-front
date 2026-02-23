

import { useState } from 'react'

import { Button, Card, Badge, Table } from 'react-bootstrap'
import ModalForm from '../components/ModalForm'
import TablaForm from '../components/TablaForm'



function App() {
  const [count, setCount] = useState(0)
  const [visible, setVisible] = useState(false)

  const handleVisible =() => setVisible(true)
  const handleOcultar =() => setVisible(false)
  const handleGuardar =() => {
    alert('Guardar datos')
    setVisible(false)
  }


const columnas = ["ID", "Nombre", "Acciones"]

const data = [
  [1, "Juan", "Editar | Eliminar"],
  [2, "Roberto","Editar | Eliminar"],
  [3, "Ana", "Editar | Eliminar"]
]
  
  /*         */
  return (
    <>

      <h1>Vite + React</h1>
      <Card variant='top'>
        <Button variant='dark' onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </Button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
        <Button variant='primary' onClick={handleVisible}>
          Show Modal
        </Button>
        <ModalForm
        title='Productos'
        visible={visible}
        ocultar={handleOcultar}
        guardar={handleGuardar}

        >
          <p>datos</p>
        </ModalForm>

      </Card>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

       <TablaForm columna={columnas} data={data}>
        
      </TablaForm>


      

    </>



  )
}

export default App
