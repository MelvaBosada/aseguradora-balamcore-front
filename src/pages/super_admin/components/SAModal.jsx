import { useEffect } from "react";
import "../css/SAModal.css";

/**
 * Modal genérico reutilizable. Solo maneja overlay + contenedor + cierre;
 * el contenido (formulario, detalle, confirmación, etc.) se pasa como children.
 */
function SAModal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div
        className={`sa-modal sa-modal--${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="sa-modal__header">
          <h3 className="sa-modal__title">{title}</h3>
          <button className="sa-modal__close" onClick={onClose} type="button" aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="sa-modal__body">{children}</div>
      </div>
    </div>
  );
}

export default SAModal;
