import { Button, Card, Badge } from 'react-bootstrap'
import { Modal } from 'react-bootstrap'

function ModalForm({visible,ocultar, guardar, title, children}) {
    
    return (

        <Modal show = { visible }  backdrop = "static" onHide = { ocultar }>
          <Modal.Header closeButton>
            <Modal.Title>{title}</Modal.Title>
             </Modal.Header>
             <Modal.Body>
        {children}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={ocultar}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={guardar}>
            Guardar
            </Button>
        </Modal.Footer>
        </Modal >
    
    )
}
export default ModalForm;