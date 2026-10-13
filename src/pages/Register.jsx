import { Box, TextField, Typography, Paper, Snackbar, Alert, InputAdornment } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import "../css/Login.css";
import "../css/Register.css";
import logo from "../assets/Logo.png";
import ButtonVerdeForm from "../components/ButtonVerdeForm";
import StepVerification from "../components/StepVerification";
import StepCompany from "../components/StepCompany";

const IconMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

const IconCheck = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#e8f5ee" stroke="#1a6b46" strokeWidth="1.5" />
    <path d="M7.5 12.5l3 3 6-6" stroke="#1a6b46" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const STEPS = ["Cuenta", "Verificación", "Empresa"];

function StepperBar({ current }) {
  return (
    <div className="reg-stepper">
      <div className="reg-track">
        <div className="reg-track-fill" style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }} />
      </div>
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} className="reg-step-item">
            <div className={`reg-dot ${done ? "done" : ""} ${active ? "active" : ""}`}>
              {done ? "✓" : i + 1}
            </div>
            <span className={`reg-step-label ${active ? "active" : done ? "done" : ""}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StepCredentials({ data, onChange, onNext, onBack, fieldError, loading }) {
  return (
    <div className="reg-body">
      <Typography variant="h5" className="title-bold">Crear Cuenta</Typography>
      <Typography variant="body2" className="subtitle-slim">
        Ingresa tu correo y una contraseña segura
      </Typography>
      <Box className="form-stack" sx={{ mt: 1 }}>
        <TextField
          label="Correo electrónico" name="correo" fullWidth margin="dense"
          value={data.correo} error={fieldError && !data.correo} onChange={onChange}
          InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: "#bbb" }}><IconMail /></InputAdornment> }}
        />
        <Box className="password-row">
          <TextField label="Contraseña" name="password" type="password" fullWidth margin="dense"
            value={data.password} error={fieldError && (!data.password || data.password !== data.confirmar)} onChange={onChange} />
          <TextField label="Repetir contraseña" name="confirmar" type="password" fullWidth margin="dense"
            value={data.confirmar} error={fieldError && data.password !== data.confirmar} onChange={onChange} />
        </Box>
      </Box>
      <Box className="button-group">
        <ButtonVerdeForm colorType="green" onClick={onBack}>Volver</ButtonVerdeForm>
        <ButtonVerdeForm colorType="green" onClick={onNext} disabled={loading}>
          {loading ? "Enviando..." : "Siguiente"}
        </ButtonVerdeForm>
      </Box>
    </div>
  );
}

function StepSuccess({ onBackToLogin }) {
  return (
    <div className="reg-body reg-success">
      <div className="success-check"><IconCheck /></div>
      <Typography variant="h5" className="title-bold" sx={{ mt: 1.5 }}>¡Registro completado!</Typography>
      <Typography variant="body2" className="subtitle-slim" sx={{ px: 1 }}>
        Tu cuenta y empresa fueron registradas. Un administrador revisará tu solicitud y te notificará por correo.
      </Typography>
      <div style={{ marginTop: 28 }}>
        <ButtonVerdeForm colorType="green" onClick={onBackToLogin}>Ir al inicio de sesión</ButtonVerdeForm>
      </div>
    </div>
  );
}

function Register({ onBackToLogin, onStepChange }) {
  const [step,       setStep]       = useState(0);
  const [dir,        setDir]        = useState("fwd");
  const [animKey,    setAnimKey]    = useState(0);
  const [creds,      setCreds]      = useState({ correo: "", password: "", confirmar: "" });
  const [fieldError, setFieldError] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [snack,      setSnack]      = useState({ open: false, msg: "", type: "error" });

  useEffect(() => {
    document.body.className = "login-body";
    return () => { document.body.className = ""; };
  }, []);

  const go = (nextStep, direction = "fwd") => {
    setDir(direction);
    setAnimKey((k) => k + 1);
    setStep(nextStep);
    setFieldError(false);
    onStepChange?.(nextStep);
  };

  const toast = (msg, type = "error") => setSnack({ open: true, msg, type });

  const handleStep0Next = async () => {
    if (!creds.correo || !creds.password || !creds.confirmar) { setFieldError(true); toast("Completa todos los campos"); return; }
    if (!/\S+@\S+\.\S+/.test(creds.correo))                  { toast("Correo inválido"); return; }
    if (creds.password.length < 5)                            { toast("Mínimo 5 caracteres"); return; }
    if (creds.password !== creds.confirmar)                   { setFieldError(true); toast("Las contraseñas no coinciden"); return; }

    setLoading(true);
    try {
      await axios.post(
        "/enviar-otp",
        { correo: creds.correo },
        { skipLoader: false }
      );
      go(1);
    } catch (error) {
      toast(error.response?.data?.message || "Error al enviar el código");
    } finally {
      setLoading(false);
    }
  };

  const animClass = dir === "fwd" ? "step-enter-right" : "step-enter-left";

  return (
    <div className="auth-content">
      <div className="login-appearance visible">
        <Paper elevation={15} className="login-paper-premium reg-paper">

          <div className="reg-brand" style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <img src={logo} alt="logo" className="logo-jaguar reg-logo" />
          </div>

          {step < 3 && <StepperBar current={step} />}

          <div key={animKey} className={`step-anim ${animClass}`}>
            {step === 0 && (
              <StepCredentials
                data={creds}
                onChange={(e) => setCreds({ ...creds, [e.target.name]: e.target.value })}
                onNext={handleStep0Next}
                onBack={onBackToLogin}
                fieldError={fieldError}
                loading={loading}
              />
            )}
            {step === 1 && (
              <StepVerification
                correo={creds.correo}
                onNext={() => go(2)}
                onBack={() => go(0, "back")}
              />
            )}
            {step === 2 && (
              <StepCompany
                correo={creds.correo}
                password={creds.password}
                onFinish={() => go(3)}
                onBack={() => go(1, "back")}
              />
            )}
            {step === 3 && (
              <StepSuccess onBackToLogin={onBackToLogin} />
            )}
          </div>

        </Paper>
      </div>

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.type} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </div>
  );
}

export default Register;