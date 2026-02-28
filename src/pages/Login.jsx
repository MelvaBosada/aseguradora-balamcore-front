import { Box, TextField, Typography, Paper, Snackbar, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../css/Login.css";
import { useEffect, useState } from "react";
import logoSin    from "../assets/LogoSin.png";
import LetrasColor from "../assets/LetrasColor.png";
import ButtonVerdeForm from "../components/ButtonVerdeForm";

function Login({ onGoToRegister }) {
  const navigate = useNavigate();

  const [correo,      setCorreo]      = useState("");
  const [password,    setPassword]    = useState("");
  const [error,       setError]       = useState(false);
  const [open,        setOpen]        = useState(false);
  const [mensaje,     setMensaje]     = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    document.body.className = "login-body";
    const timer = setTimeout(() => setIsAnimating(true), 1400);
    return () => { clearTimeout(timer); document.body.className = ""; };
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

      {/* LogoSinLetras viaja desde centro hacia la brand-zone */}
      <div className={`interpolator-track ${isAnimating ? "state-form" : "state-center"}`}>
        <img src={logoSin} alt="BalamCore logo" className="logo-viajero" />
      </div>

      {/* Formulario */}
      <div className={`login-appearance ${isAnimating ? "visible" : ""}`}>
        <Paper elevation={15} className="login-paper-premium">

          {/* Brand zone: espacio para el logo viajero + letras fijas debajo */}
          <div className="brand-zone">
            <div className="logo-slot" /> {/* espacio reservado para el logo viajero */}
            <img
              src={LetrasColor}
              alt="BalamCore"
              className="letras-fijas"
            />
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
