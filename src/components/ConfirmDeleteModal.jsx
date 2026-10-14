import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

import "../css/BalamCoreModal.css";
import useAccionAsync from "../hooks/useAccionAsync";

function ConfirmDeleteModal({ open, onClose, onConfirm, title, subtitle, children }) {
  const [handleConfirm, deleting] = useAccionAsync(onConfirm);

  if (!open) return null;

  return (
    <div className="modal-overlay-balam" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-balam-delete">

        <div className="modal-balam-delete-inner">

          <div className="modal-balam-icon">
            <DeleteRoundedIcon />
          </div>

          <h2 className="modal-balam-title">{title}</h2>
          <p className="modal-balam-subtitle">{subtitle}</p>

          <div className="modal-balam-body">
            {children}
            <p className="modal-balam-warning">
               Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="modal-balam-footer">
            <button className="balam-btn balam-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button className="balam-btn balam-btn-danger" onClick={handleConfirm} disabled={deleting}>
              {deleting ? "Procesando..." : "Sí, eliminar"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
