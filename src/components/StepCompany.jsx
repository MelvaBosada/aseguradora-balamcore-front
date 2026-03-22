import { useState } from "react";
import { Box, TextField, Typography, Snackbar, Alert, CircularProgress, InputAdornment } from "@mui/material";
import axios from "axios";
import ButtonVerdeForm from "./ButtonVerdeForm";

const IconUpload = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// Validaciones
const validar = (data) => {
  const errores = {};
  if (!data.nombre.trim()) errores.nombre = "Requerido";
  if (!data.razon_social.trim()) errores.razon_social = "Requerido";

  const rfcLimpio = data.rfc.trim().toUpperCase();
  if (!rfcLimpio) {
    errores.rfc = "Requerido";
  } else if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfcLimpio)) {
    errores.rfc = "Formato inválido (ej. XAXX010101000)";
  }

  if (!data.telefono.trim()) errores.telefono = "Requerido";
  if (data.telefono.trim() && !/^\d{10}$/.test(data.telefono.trim()))
    errores.telefono = "Debe tener 10 dígitos";
  if (!data.domicilio.trim()) errores.domicilio = "Requerido";
  if (!data.municipio.trim()) errores.municipio = "Requerido";
  if (!data.estado.trim()) errores.estado = "Requerido";
  if (!data.codigo_postal.trim()) errores.codigo_postal = "Requerido";
  if (data.codigo_postal.trim() && !/^\d{5}$/.test(data.codigo_postal.trim()))
    errores.codigo_postal = "Debe tener 5 dígitos";

  if (data.sitio_web.trim() && !/^https?:\/\/.+/.test(data.sitio_web.trim()))
    errores.sitio_web = "Debe iniciar con http:// o https://";

  return errores;
};

function StepCompany({ onFinish, onBack, correo, password }) {
  const [data, setData] = useState({
    nombre: "", razon_social: "", rfc: "", telefono: "",
    sitio_web: "", domicilio: "", municipio: "",
    estado: "", codigo_postal: "", pais: "México",
    observaciones: "",
  });
  const [errores, setErrores] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCP, setLoadingCP] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", type: "success" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    // Limpia el error del campo al escribir
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: null }));
  };

  const handleCodigoPostal = async (e) => {
    const cp = e.target.value;
    setData((prev) => ({ ...prev, codigo_postal: cp }));
    if (errores.codigo_postal) setErrores((prev) => ({ ...prev, codigo_postal: null }));

    if (cp.length === 5) {
      setLoadingCP(true);
      try {
        const res = await axios.get(`https://api.zippopotam.us/mx/${cp}`);
        const lugar = res.data.places[0];
        setData((prev) => ({
          ...prev,
          municipio: lugar["place name"] || prev.municipio,
          estado: lugar["state"] || prev.estado,
          pais: "México",
        }));
        // Limpia errores de campos autocompletados
        setErrores((prev) => ({ ...prev, municipio: null, estado: null }));
      } catch {
        console.error("CP no encontrado");
      } finally {
        setLoadingCP(false);
      }
    }
  };

  const handleLogoChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setLogoFile(f);
      setLogoPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async () => {
    // Validar frontend primero
    const erroresValidacion = validar(data);
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => formData.append(key, val));
      formData.append("correo", correo);
      formData.append("password", password);
      if (logoFile) formData.append("logo", logoFile);

      await axios.post("http://localhost:8000/api/registro", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSnack({ open: true, msg: "¡Cuenta creada correctamente!", type: "success" });
      setTimeout(() => onFinish(), 1500);
    } catch (error) {
      // Errores de validación del backend (422)
      if (error.response?.status === 422) {
        const backendErrors = error.response.data.errors;
        if (backendErrors) {
          //errores del backend a los campos
          const nuevosErrores = {};
          Object.keys(backendErrors).forEach((campo) => {
            nuevosErrores[campo] = backendErrors[campo][0];
          });
          setErrores(nuevosErrores);
        }
      } else {
        // Error general
        setSnack({
          open: true,
          msg: error.response?.data?.message || "Error al registrar. Intenta de nuevo.",
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .reg-paper { max-width: 680px !important; width: 100% !important; transition: max-width 0.4s cubic-bezier(0.4,0,0.2,1); }
        @media (max-width: 720px) { .reg-paper { max-width: 100% !important; } }
      `}</style>

      <div className="reg-body">
        <Typography variant="h5" className="title-bold">Datos de Empresa</Typography>
        <Typography variant="body2" className="subtitle-slim">
          Ingresa la información de tu empresa para finalizar
        </Typography>

        <Box sx={{ mt: 1, textAlign: "left" }}>

          {/* Fila 1: Nombre + Razón Social */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
            <TextField label="Nombre de empresa *" name="nombre" fullWidth margin="dense"
              value={data.nombre} onChange={handleChange}
              error={!!errores.nombre} helperText={errores.nombre} />
            <TextField label="Razón Social *" name="razon_social" fullWidth margin="dense"
              value={data.razon_social} onChange={handleChange}
              error={!!errores.razon_social} helperText={errores.razon_social} />
          </Box>

          {/* Fila 2: RFC + Teléfono */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
            <TextField label="RFC *" name="rfc" fullWidth margin="dense"
              value={data.rfc} onChange={handleChange}
              error={!!errores.rfc} helperText={errores.rfc}
              inputProps={{ style: { textTransform: "uppercase" }, maxLength: 13 }} />
            <TextField label="Teléfono *" name="telefono" fullWidth margin="dense"
              value={data.telefono} onChange={handleChange}
              error={!!errores.telefono} helperText={errores.telefono}
              inputProps={{ inputMode: "numeric", maxLength: 10 }} />
          </Box>

          {/* Fila 3: Sitio web */}
          <TextField label="Sitio web" name="sitio_web" fullWidth margin="dense"
            value={data.sitio_web} onChange={handleChange}
            error={!!errores.sitio_web} helperText={errores.sitio_web}
            placeholder="https://tuempresa.com" />

          {/* Fila 4: CP + Domicilio */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
            <TextField label="Código Postal *" name="codigo_postal" fullWidth margin="dense"
              value={data.codigo_postal} onChange={handleCodigoPostal}
              error={!!errores.codigo_postal} helperText={errores.codigo_postal}
              inputProps={{ inputMode: "numeric", maxLength: 5 }}
              InputProps={{
                endAdornment: loadingCP ? (
                  <InputAdornment position="end">
                    <CircularProgress size={18} sx={{ color: "#1a6b46" }} />
                  </InputAdornment>
                ) : null,
              }} />
            <TextField label="Domicilio *" name="domicilio" fullWidth margin="dense"
              value={data.domicilio} onChange={handleChange}
              error={!!errores.domicilio} helperText={errores.domicilio} />
          </Box>

          {/* Fila 5: Municipio + Estado + País */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
            <TextField label="Municipio *" name="municipio" fullWidth margin="dense"
              value={data.municipio} onChange={handleChange}
              error={!!errores.municipio} helperText={errores.municipio} />
            <TextField label="Estado *" name="estado" fullWidth margin="dense"
              value={data.estado} onChange={handleChange}
              error={!!errores.estado} helperText={errores.estado} />
            <TextField label="País" name="pais" fullWidth margin="dense"
              value={data.pais} onChange={handleChange} />
          </Box>

          {/* Observaciones */}
          <TextField label="Observaciones" name="observaciones" fullWidth margin="dense"
            multiline rows={2} value={data.observaciones} onChange={handleChange} />

          {/* Upload logo */}
          <div className="logo-upload-zone" style={{ marginTop: 10 }}>
            <input id="logo-input" type="file" accept="image/*"
              style={{ display: "none" }} onChange={handleLogoChange} />
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
          <ButtonVerdeForm colorType="green" onClick={handleSubmit} disabled={loading}>
            {loading ? "Registrando..." : "Finalizar"}
          </ButtonVerdeForm>
        </Box>
      </div>

      <Snackbar open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.type} variant="filled" sx={{ fontWeight: 600 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}

export default StepCompany;
