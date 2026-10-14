import { Button, Card, Badge } from 'react-bootstrap'
import { Modal } from 'react-bootstrap'
import useAccionAsync from "../hooks/useAccionAsync";

function ModalForm({visible,ocultar, guardar, title, children}) {
    const [handleSave, saving] = useAccionAsync(guardar);
    
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
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Procesando..." : "Guardar"}
            </Button>
        </Modal.Footer>
        </Modal >
    
    )
}
export default ModalForm;