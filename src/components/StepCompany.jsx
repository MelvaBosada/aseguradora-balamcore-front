import { useState } from "react";
import { Box, TextField, Typography, Snackbar, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ButtonVerdeForm from "./ButtonVerdeForm";

const IconUpload = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

function StepCompany({ onFinish, onBack }) {
  const navigate = useNavigate();

  const [data, setData] = useState({
    nombre: "", rfc: "", telefono: "", direccion: "",
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [fieldError,  setFieldError]  = useState(false);
  const [snackOpen,   setSnackOpen]   = useState(false);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
    if (fieldError) setFieldError(false);
  };

  const handleLogoChange = (e) => {
    const f = e.target.files[0];
    if (f) setLogoPreview(URL.createObjectURL(f));
  };

  const handleSubmit = () => {
    if (!data.nombre || !data.rfc) { setFieldError(true); return; }
    if (onFinish) onFinish(data, logoPreview);
    setSnackOpen(true);
    setTimeout(() => navigate("/"), 4000);
  };

  return (
    <>
      {/* ── Overlay que agranda el modal cuando llega a este paso ── */}
      <style>{`
        .reg-paper {
          max-width: 680px !important;
          width: 100% !important;
          transition: max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (max-width: 720px) {
          .reg-paper { max-width: 100% !important; }
        }
      `}</style>

      <div className="reg-body" >
        <Typography variant="h5" className="title-bold">
          Datos de Empresa
        </Typography>
        <Typography variant="body2" className="subtitle-slim">
          Ingresa la información de tu empresa para finalizar
        </Typography>

        <Box sx={{ mt: 1, textAlign: "left" }}>

          {/* Fila 1: Nombre + RFC */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
            <TextField
              label="Nombre de empresa *"
              name="nombre"
              fullWidth
              margin="dense"
              value={data.nombre}
              error={fieldError && !data.nombre}
              helperText={fieldError && !data.nombre ? "Campo requerido" : ""}
              onChange={handleChange}
            />
            <TextField
              label="RFC *"
              name="rfc"
              fullWidth
              margin="dense"
              value={data.rfc}
              error={fieldError && !data.rfc}
              helperText={fieldError && !data.rfc ? "Campo requerido" : ""}
              onChange={handleChange}
              inputProps={{ style: { textTransform: "uppercase" } }}
            />
          </Box>

          {/* Fila 2: Teléfono + Dirección */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
            <TextField
              label="Teléfono"
              name="telefono"
              fullWidth
              margin="dense"
              value={data.telefono}
              onChange={handleChange}
              inputProps={{ inputMode: "tel" }}
            />
            <TextField
              label="Dirección"
              name="direccion"
              fullWidth
              margin="dense"
              value={data.direccion}
              onChange={handleChange}
            />
          </Box>

          {/* Upload logo */}
          <div className="logo-upload-zone" style={{ marginTop: 10 }}>
            <input
              id="logo-input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleLogoChange}
            />
            <label htmlFor="logo-input" className="logo-upload-label">
              {logoPreview ? (
                <>
                  <img src={logoPreview} alt="logo empresa" className="logo-preview-img" />
                  <span className="upload-hint" style={{ marginTop: 6 }}>Clic para cambiar</span>
                </>
              ) : (
                <>
                  <span className="upload-icon-wrap"><IconUpload /></span>
                  <span className="upload-text">Subir logo de empresa</span>
                  <span className="upload-hint">PNG, JPG · máx 2MB · opcional</span>
                </>
              )}
            </label>
          </div>

        </Box>

        <Box className="button-group">
          <ButtonVerdeForm colorType="gold"  onClick={onBack}>Volver</ButtonVerdeForm>
          <ButtonVerdeForm colorType="green" onClick={handleSubmit}>Finalizar</ButtonVerdeForm>
        </Box>
      </div>

      <Snackbar
        open={snackOpen}
        autoHideDuration={1500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" sx={{ fontWeight: 600 }}>
          ¡Cuenta creada correctamente!
        </Alert>
      </Snackbar>
    </>
  );
}

export default StepCompany;
