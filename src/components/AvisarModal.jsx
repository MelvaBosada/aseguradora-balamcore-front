import { useState } from "react";
import EmailIcon        from "@mui/icons-material/Email";
import CloseIcon        from "@mui/icons-material/Close";
import SendIcon         from "@mui/icons-material/Send";
import CheckCircleIcon  from "@mui/icons-material/CheckCircle";
import Snackbar         from "@mui/material/Snackbar";
import Alert            from "@mui/material/Alert";
import "../css/BalamCoreModal.css";
import "../css/AvisarModal.css";

function AvisarModal({ open, onClose, poliza }) {
  const [loading,       setLoading]       = useState(false);
  const [snackOpen,     setSnackOpen]     = useState(false);
  const [snackMsg,      setSnackMsg]      = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");

  if (!open || !poliza) return null;

  const showSnack = (msg, severity = "success") => {
    setSnackMsg(msg);
    setSnackSeverity(severity);
    setSnackOpen(true);
  };

  const handleEnviar = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showSnack(`Correo enviado a ${poliza.correo || "cliente@correo.com"}`);
      onClose();
    }, 1500);
  };

  return (
    <>
      <div className="balam-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="balam-modal avisar-modal">

          {/* HEADER */}
          <div className="avisar-header">
            <div className="avisar-header-icon"><EmailIcon /></div>
            <div className="avisar-header-info">
              <h2>Avisar al cliente</h2>
              <p>Se enviará un correo de recordatorio de vencimiento</p>
            </div>
            <button className="detalle-close" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </button>
          </div>

          {/* BODY con scroll */}
          <div className="avisar-body">

            <div className="avisar-poliza-info">
              <div className="avisar-info-row">
                <span className="avisar-info-label">Póliza</span>
                <span className="avisar-info-value">{poliza.nPoliza}</span>
              </div>
              <div className="avisar-info-row">
                <span className="avisar-info-label">Cliente</span>
                <span className="avisar-info-value">{poliza.nombre} {poliza.apellido}</span>
              </div>
              <div className="avisar-info-row">
                <span className="avisar-info-label">Tipo</span>
                <span className="avisar-info-value">{poliza.tipo}</span>
              </div>
              <div className="avisar-info-row">
                <span className="avisar-info-label">Vence</span>
                <span className="avisar-info-value avisar-vence">{poliza.vence}</span>
              </div>
              <div className="avisar-info-row">
                <span className="avisar-info-label">Correo</span>
                <span className="avisar-info-value avisar-email">
                  {poliza.correo || "cliente@correo.com"}
                </span>
              </div>
            </div>

            <div className="avisar-preview">
              <span className="avisar-preview-label">Vista previa del mensaje</span>
              <div className="avisar-preview-body">
                <p>Estimado/a <strong>{poliza.nombre} {poliza.apellido}</strong>,</p>
                <p>Su póliza <strong>{poliza.nPoliza}</strong> de tipo <strong>{poliza.tipo}</strong> vence el <strong>{poliza.vence}</strong>.</p>
                <p>Contáctese con su asesor para renovarla a tiempo.</p>
                <p style={{ marginBottom: 0 }}>Atentamente, <strong>BalamCore</strong></p>
              </div>
            </div>

          </div>

          {/* FOOTER */}
          <div className="balam-footer" style={{ borderTop: "1px solid #E5E7EB" }}>
            <button className="balam-btn cancel" onClick={onClose}>Cancelar</button>
            <button className="balam-btn save avisar-send-btn" onClick={handleEnviar} disabled={loading}>
              {loading ? "Enviando..." : <> Enviar correo</>}
            </button>
          </div>

        </div>
      </div>

      {/* SNACKBAR */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackSeverity} variant="filled" onClose={() => setSnackOpen(false)}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </>
  );
}

export default AvisarModal;
