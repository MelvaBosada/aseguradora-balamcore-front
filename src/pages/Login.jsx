import { Box, TextField, Typography, Paper, Snackbar, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../css/Login.css";
import { useEffect, useState } from "react";
import logo from "../assets/logoSin.png";
import Letrascolores from "../assets/LetrasColor.png";
import ButtonVerdeForm from "../components/ButtonVerdeForm";

function Login({ onGoToRegister }) {
  const navigate = useNavigate();

  const [correo, setCorreo]   = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState(false);
  const [open, setOpen]       = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    document.body.className = "login-body";

    // Arranca la animación de las letras viajeras
    const timer = setTimeout(() => setIsAnimating(true), 1400);

    return () => {
      clearTimeout(timer);
      document.body.className = "";
    };
  }, []);

  const handleLogin = () => {
    if (correo === "admin" && password === "12345") {
      setMensaje("Sesión iniciada correctamente");
      setError(false);
      setOpen(true);
      setTimeout(() => navigate("/admin"), 1000);
    } else {
      setMensaje("Datos incorrectos");
      setError(true);
      setOpen(true);
      setCorreo("");
      setPassword("");
    }
  };

  const handleTyping = (e, setter) => {
    setter(e.target.value);
    if (error) setError(false);
  };

  return (
    <div className="auth-content">

      {/* ── Letras viajeras (fixed, por encima de todo) ── */}
      <div className={`interpolator-track ${isAnimating ? "state-form" : "state-center"}`}>
        <img src={Letrascolores} alt="BalamCore" className="letras-viajeras" />
      </div>

      {/* ── Formulario ── */}
      <div className={`login-appearance ${isAnimating ? "visible" : ""}`}>
        <Paper elevation={15} className="login-paper-premium">

          <div className="brand-zone with-letters">
            <img src={logo} alt="logo" className="logo-jaguar" />
            <div className="letras-target-slot" />
          </div>

          <Typography variant="h5" className="title-bold">
            Inicio de Sesión
          </Typography>

          <Typography variant="body2" className="subtitle-slim">
            Ingresa tus datos para continuar
          </Typography>

          <Box className="form-stack">
            <TextField
              label="Correo electrónico"
              fullWidth
              margin="dense"
              value={correo}
              error={error}
              onChange={(e) => handleTyping(e, setCorreo)}
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              margin="dense"
              value={password}
              error={error}
              onChange={(e) => handleTyping(e, setPassword)}
            />
          </Box>

          <Box className="button-group">
            <ButtonVerdeForm colorType="green" onClick={handleLogin}>
              Iniciar Sesión
            </ButtonVerdeForm>
            <ButtonVerdeForm colorType="gold" onClick={onGoToRegister}>
              Registrarse
            </ButtonVerdeForm>
          </Box>

        </Paper>
      </div>

      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={error ? "error" : "success"} variant="filled">
          {mensaje}
        </Alert>
      </Snackbar>

    </div>
  );
}

export default Login;
