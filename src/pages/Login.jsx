import { Box, TextField, Typography, Paper, Snackbar, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../css/Login.css";
import { useEffect, useState } from "react";
import axios from "axios";
import logoSin from "../assets/LogoSin.png";
import LetrasColor from "../assets/LetrasColor.png";
import ButtonVerdeForm from "../components/ButtonVerdeForm";

function Login({ onGoToRegister }) {
  const navigate = useNavigate();

  // ── Estados ──────────────────────────────────────────────────
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);   // true = inputs rojos
  const [open, setOpen] = useState(false);   // controla el snackbar
  const [mensaje, setMensaje] = useState("");      // texto del snackbar
  const [loading, setLoading] = useState(false);   // true mientras espera al backend
  const [isAnimating, setIsAnimating] = useState(false);   // animación del logo

  // ── Animación del logo al cargar ─────────────────────────────
  useEffect(() => {
    document.body.className = "login-body";
    const timer = setTimeout(() => setIsAnimating(true), 1400);
    return () => { clearTimeout(timer); document.body.className = ""; };
  }, []);

  // ── Login principal ──────────────────────────────────────────
  const handleLogin = async () => {

    // 1. Valida que no estén vacíos
    if (!correo || !password) {
      setMensaje("Completa todos los campos");
      setError(true);
      setOpen(true);
      return;
    }

    setLoading(true);

    try {
      
      // 2. Manda correo y password al backend Laravel
      const res = await axios.post(
        "/api/login",
        {
          correo,
          password,
        },
        {
          withCredentials: true,
        }
      );

      // 3. Guarda el usuario, permisos, módulos y suscripción en localStorage
localStorage.setItem("token",        res.data.token);
localStorage.setItem("usuario",      JSON.stringify(res.data.usuario));
localStorage.setItem("permisos",     JSON.stringify(res.data.permisos));
localStorage.setItem("modulos",      JSON.stringify(res.data.modulos));
localStorage.setItem("suscripcion",  JSON.stringify(res.data.suscripcion));

      // Setea el token globalmente para todas las peticiones axios
axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;

      // 4. Muestra mensaje de éxito
      setMensaje("Sesión iniciada correctamente");
      setError(false);
      setOpen(true);

      // 5. Redirige según tipo de usuario
      setTimeout(() => {
        if (res.data.usuario.es_superadmin) {
          navigate("/superadmin");
        } else {
          navigate("/admin");
        }
      }, 1000);

    } catch (err) {
      // 6. Muestra el error del backend
      setMensaje(err.response?.data?.message || "Credenciales incorrectas");
      setError(true);
      setOpen(true);
      setCorreo("");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  // ── Quita el error visual cuando empieza a escribir ──────────
  const handleTyping = (e, setter) => {
    setter(e.target.value);
    if (error) setError(false);
  };

  // ── Enter en cualquier input hace login ───────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="auth-content">

      {/* Logo que viaja desde el centro hacia arriba */}
      <div className={`interpolator-track ${isAnimating ? "state-form" : "state-center"}`}>
        <img src={logoSin} alt="BalamCore logo" className="logo-viajero" />
      </div>

      {/* Formulario */}
      <div className={`login-appearance ${isAnimating ? "visible" : ""}`}>
        <Paper elevation={15} className="login-paper-premium">

          {/* Zona del logo y letras */}
          <div className="brand-zone">
            <div className="logo-slot" />
            <img src={LetrasColor} alt="BalamCore" className="letras-fijas" />
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
              onKeyDown={handleKeyDown}
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              margin="dense"
              value={password}
              error={error}
              onChange={(e) => handleTyping(e, setPassword)}
              onKeyDown={handleKeyDown}
            />
          </Box>

          <Box className="button-group">
            <ButtonVerdeForm colorType="green" onClick={handleLogin} disabled={loading}>
              {loading ? "Entrando..." : "Iniciar Sesión"}
            </ButtonVerdeForm>
            <ButtonVerdeForm colorType="green" onClick={onGoToRegister}>
              Registrarse
            </ButtonVerdeForm>
          </Box>

        </Paper>
      </div>

      {/* Snackbar — arriba centrado, fuera del card, no tapa nada */}
      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: "20px !important" }}
      >
        <Alert
          severity={error ? "error" : "success"}
          variant="filled"
          sx={{
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: "13px",
            padding: "6px 20px",
            whiteSpace: "nowrap",                       // no parte en 2 líneas
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",  // sombra elevada
          }}
        >
          {mensaje}
        </Alert>
      </Snackbar>

    </div>
  );
}

export default Login;