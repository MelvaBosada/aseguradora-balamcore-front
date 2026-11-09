import { useState } from "react";
import axios from "axios";
import EmailIcon from "@mui/icons-material/Email";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import CategoryIcon from "@mui/icons-material/Category";
import EventIcon from "@mui/icons-material/Event";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import "../css/BalamCoreModal.css";
import "../css/AvisarModal.css";

function AvisarModal({ open, onClose, poliza, onEnviado }) {
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");

  if (!open || !poliza) return null;

  const showSnack = (msg, severity = "success") => {
    setSnackMsg(msg);
    setSnackSeverity(severity);
    setSnackOpen(true);
  };

  const handleEnviar = async () => {
    if (loading || enviado) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const API_URL = import.meta.env.VITE_API_URL;

      await axios.post(
        `${API_URL}/polizas-vencer/avisar`,
        { poliza_id: poliza.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEnviado(true);
      showSnack(`Correo enviado a ${poliza.correo || "cliente@correo.com"}`);
      if (onEnviado) onEnviado();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error(err);
      showSnack("Error al enviar el correo. Intenta de nuevo.", "error");
    } finally {
      setLoading(false);
    }
  };

  const items = [
    { icon: <AssignmentIcon />, label: "Póliza",  value: poliza.nPoliza },
    { icon: <PersonIcon />,     label: "Cliente", value: `${poliza.nombre} ${poliza.apellido}` },
    { icon: <CategoryIcon />,   label: "Tipo",    value: poliza.tipo },
    { icon: <EventIcon />,      label: "Vence",   value: poliza.vence },
    { icon: <EmailIcon />,      label: "Correo",  value: poliza.correo || "cliente@correo.com", full: true },
  ];

  return (
    <>
      <div className="balam-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="balam-modal avisar-modal">

          {/* HEADER */}
          <div className="avisar-header">
            <div className="avisar-avatar"><EmailIcon /></div>
            <div className="avisar-header-text">
              <h2>Avisar al cliente</h2>
              <span>Se enviará un correo de recordatorio de vencimiento</span>
            </div>
            <button className="avisar-close" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </button>
          </div>

          {/* BODY */}
          <div className="avisar-body">
            <div className="avisar-grid">
              {items.map((it) => (
                <div key={it.label} className={`avisar-item ${it.full ? "span-full" : ""}`}>
                  <div className="avisar-item-icon">{it.icon}</div>
                  <div className="avisar-item-text">
                    <span className="avisar-label">{it.label}</span>
                    <span className="avisar-value">{it.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="avisar-preview">
              <span className="avisar-preview-label">Vista previa del mensaje</span>
              <div className="avisar-preview-body">
                <p>Estimado/a <strong>{poliza.nombre} {poliza.apellido}</strong>,</p>
                <p>Su póliza <strong>{poliza.nPoliza}</strong> de tipo <strong>{poliza.tipo}</strong> vence el <strong>{poliza.vence}</strong>.</p>
                <p>Contáctese con su asesor para renovarla a tiempo.</p>
                <p>Atentamente, <strong>BalamCore</strong></p>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="balam-footer avisar-footer">
            <button className="balam-btn cancel" onClick={onClose}>Cancelar</button>
            <button
              className={`balam-btn save avisar-send-btn ${enviado ? "avisar-enviado" : ""}`}
              onClick={handleEnviar}
              disabled={loading || enviado}
            >
              {enviado
                ? <><CheckCircleIcon fontSize="small" style={{ marginRight: 6 }} /> Correo enviado</>
                : loading
                  ? "Enviando..."
                  : "Enviar correo"}
            </button>
          </div>

        </div>
      </div>

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