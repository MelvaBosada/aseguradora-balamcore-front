import React from "react";

const ComprobantePagoModal = ({ open, onClose, pago }) => {

  if (!open || !pago) return null;

  return (
    <div className="modal-overlay">

      <div className="modal-comprobante">

        <h2>Comprobante de Pago</h2>

        <div className="comprobante-body">

          <p><strong>N° Pago:</strong> {pago.pago}</p>

          <p><strong>N° Indemnización:</strong> {pago.indemnizacion}</p>

          <p><strong>N° Siniestro:</strong> {pago.siniestro}</p>

          <p><strong>Cliente:</strong> {pago.cliente}</p>

          <p><strong>Monto Pagado:</strong> {pago.montopagado}</p>

          <p><strong>Forma de Pago:</strong> {pago.formapago}</p>

          <p><strong>Fecha de Pago:</strong> {pago.fechapago}</p>

          <p><strong>Estatus:</strong> {pago.estatus}</p>

        </div>

        <button onClick={onClose} className="btn-cerrar">
          Cerrar
        </button>

      </div>

    </div>
  );
};

export default ComprobantePagoModal;