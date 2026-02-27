import { useState } from "react";
import { Box, TextField, Typography, InputAdornment, Snackbar, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ButtonVerdeForm from "./ButtonVerdeForm";

/* ── Íconos SVG inline ── */
const IconBuilding = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 21V9h6v12M3 9h18" />
  </svg>
);
const IconUpload = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

/* ── Mini stepper interno ── */
const COMPANY_STEPS = ["Identificación", "Contacto", "Perfil"];

function CompanyMiniStepper({ current }) {
  return (
    <div className="company-mini-stepper">
      {COMPANY_STEPS.map((label, i) => (
        <div key={i} className="company-mini-item">
          <div className={`company-mini-dot ${i < current ? "done" : ""} ${i === current ? "active" : ""}`}>
            {i < current ? "✓" : i + 1}
          </div>
          {i < COMPANY_STEPS.length - 1 && (
            <div className={`company-mini-line ${i < current ? "done" : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Sub-paso 1: Nombre + RFC ── */
function SubStepIdentidad({ data, onChange, onNext, onBack, fieldError }) {
  return (
    <div className="reg-body">
      <Typography variant="h5" className="title-bold">Datos de Empresa</Typography>

      <Box className="form-stack" sx={{ mt: 1, textAlign: "left" }}>
        <TextField
          label="Nombre de empresa *"
          name="nombre"
          fullWidth
          margin="dense"
          value={data.nombre}
          error={fieldError && !data.nombre}
          onChange={onChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ color: "#bbb" }}>
                <IconBuilding />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="RFC *"
          name="rfc"
          fullWidth
          margin="dense"
          value={data.rfc}
          error={fieldError && !data.rfc}
          onChange={onChange}
          inputProps={{ style: { textTransform: "uppercase" } }}
        />
      </Box>

      <Box className="button-group">
        <ButtonVerdeForm colorType="gold" onClick={onBack}>← Volver</ButtonVerdeForm>
        <ButtonVerdeForm colorType="green" onClick={onNext}>Siguiente →</ButtonVerdeForm>
      </Box>
    </div>
  );
}

/* ── Sub-paso 2: Teléfono + Dirección ── */
function SubStepContacto({ data, onChange, onNext, onBack }) {
  return (
    <div className="reg-body">
      <Typography variant="h5" className="title-bold">Contacto</Typography>

      <Box className="form-stack" sx={{ mt: 1, textAlign: "left" }}>
        <TextField
          label="Teléfono"
          name="telefono"
          fullWidth
          margin="dense"
          value={data.telefono}
          onChange={onChange}
          inputProps={{ inputMode: "tel" }}
        />
        <TextField
          label="Dirección"
          name="direccion"
          margin="dense"
          multiline
          value={data.direccion}
          onChange={onChange}
          sx={{ width: "100%" }}
        />
      </Box>

      <Box className="button-group">
        <ButtonVerdeForm colorType="gold" onClick={onBack}>← Volver</ButtonVerdeForm>
        <ButtonVerdeForm colorType="green" onClick={onNext}>Siguiente →</ButtonVerdeForm>
      </Box>
    </div>
  );
}

/* ── Sub-paso 3: Logo ── */
function SubStepPerfil({ onLogoChange, logoPreview, onSubmit, onBack }) {
  return (
    <div className="reg-body">
      <Typography variant="h5" className="title-bold">Perfil de Empresa</Typography>

      <Box className="form-stack" sx={{ mt: 1, textAlign: "left" }}>
        <div className="logo-upload-zone">
          <input
            id="logo-input"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onLogoChange}
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
        <ButtonVerdeForm colorType="gold" onClick={onBack}>Volver</ButtonVerdeForm>
        <ButtonVerdeForm colorType="green" onClick={onSubmit}>Finalizar</ButtonVerdeForm>
      </Box>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — StepCompany
══════════════════════════════════════════════════ */
function StepCompany({ onFinish, onBack }) {
  const navigate = useNavigate();

  const [subStep, setSubStep]       = useState(0);
  const [animKey, setAnimKey]       = useState(0);
  const [dir, setDir]               = useState("fwd");
  const [fieldError, setFieldError] = useState(false);
  const [snackOpen, setSnackOpen]   = useState(false);

  const [data, setData] = useState({
    nombre: "", rfc: "",
    telefono: "", direccion: "",
  });
  const [logoPreview, setLogoPreview] = useState(null);

  const go = (next, direction = "fwd") => {
    setDir(direction);
    setAnimKey((k) => k + 1);
    setSubStep(next);
    setFieldError(false);
  };

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
    if (fieldError) setFieldError(false);
  };

  const handleLogoChange = (e) => {
    const f = e.target.files[0];
    if (f) setLogoPreview(URL.createObjectURL(f));
  };

  const handleStep0Next = () => {
    if (!data.nombre || !data.rfc) { setFieldError(true); return; }
    go(1);
  };

  /* ── Finalizar: muestra snackbar y redirige a /admin ── */
  const handleStep2Submit = () => {
    if (onFinish) onFinish(data, logoPreview); // por si el padre quiere hacer algo
    setSnackOpen(true);
    setTimeout(() => navigate("/admin"), 4000);
  };

  const animClass = dir === "fwd" ? "step-enter-right" : "step-enter-left";

  return (
    <div>
      <CompanyMiniStepper current={subStep} />

      <div key={animKey} className={`step-anim ${animClass}`}>
        {subStep === 0 && (
          <SubStepIdentidad
            data={data}
            onChange={handleChange}
            onNext={handleStep0Next}
            onBack={onBack}
            fieldError={fieldError}
          />
        )}
        {subStep === 1 && (
          <SubStepContacto
            data={data}
            onChange={handleChange}
            onNext={() => go(2)}
            onBack={() => go(0, "back")}
          />
        )}
        {subStep === 2 && (
          <SubStepPerfil
            onLogoChange={handleLogoChange}
            logoPreview={logoPreview}
            onSubmit={handleStep2Submit}
            onBack={() => go(1, "back")}
          />
        )}
      </div>

      {/* Snackbar de éxito */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={1500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" sx={{ fontWeight: 600 }}>
          ✓ ¡Cuenta creada correctamente!
        </Alert>
      </Snackbar>
    </div>
  );
}

export default StepCompany;
