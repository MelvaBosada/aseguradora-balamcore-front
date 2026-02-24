import { Box, TextField, Typography, Paper, Snackbar, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../css/Login.css";
import { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import ButtonVerdeForm from "../components/ButtonVerdeForm";

function Register() {

  useEffect(() => {
    document.body.className = "login-body";
    return () => (document.body.className = "");
  }, []);

  const navigate = useNavigate();

  //array estados
  const [form, setForm] = useState({
    nombre: "",
    rfc: "",
    correo: "",
    password: "",
    confirmar: ""
  });

  const [errors, setErrors] = useState({});
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoAlerta, setTipoAlerta] = useState("success");

  // inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // validaciones
  const validar = () => {
    let err = {};

    if (!form.nombre.trim())
      err.nombre = "Nombre obligatorio";

    if (!form.rfc)
      err.rfc = "RFC obligatorio";
    else if (!(form.rfc.length === 12 || form.rfc.length === 13))
      err.rfc = "RFC debe tener 12 o 13 caracteres";

    if (!form.correo.includes("@"))
      err.correo = "Correo inválido";

    if (form.password.length < 5)
      err.password = "Mínimo 5 caracteres";

    if (form.password !== form.confirmar)
      err.confirmar = "Las contraseñas no coinciden";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  //Boton que inicia la de crear cuenta
  const handleRegister = () => {
    if (validar()) {
      setMensaje("Cuenta creada correctamente");
      setTipoAlerta("success");
      setOpen(true);

      setTimeout(() => {
        navigate("/home");
      }, 1500);
    } else {
      setMensaje("La información que brindaste es erronea");
      setTipoAlerta("error");
      setOpen(true);
    }
  };

  return (
    <Box className="login-container">
      <Paper elevation={6} sx={{ padding: 5, width: 550, borderRadius: "80px", textAlign: "center" }}>

        <img src={logo} alt="logo" className="login-logo" />

        <Typography variant="h5" sx={{ fontFamily: "Anek Bangla", fontWeight: 700 }}>
          Registro
        </Typography>

        <Typography variant="body2" sx={{ fontFamily: "Abel", mb: 3 }}>
          Ingresa tus datos para crear una sesión
        </Typography>

        {/* NOMBRE */}
        <TextField label="Ingresa tu nombre completo" name="nombre"fullWidth margin="normal" size="small"
          value={form.nombre}
          onChange={handleChange}
          error={!!errors.nombre}
          helperText={errors.nombre}
        />

        {/* RFC */}
        <TextField label="Ingresa tu RFC" name="rfc" fullWidth margin="normal" size="small"
          value={form.rfc}
          onChange={handleChange}
          error={!!errors.rfc}
          helperText={errors.rfc}
        />

        {/* CORREO */}
        <TextField label="Ingresa tu correo electrónico" name="correo" fullWidth margin="normal" size="small"
          value={form.correo}
          onChange={handleChange}
          error={!!errors.correo}
          helperText={errors.correo}
        />

        {/* PASSWORD */}
        <TextField label="Ingresa tu contraseña" name="password" type="password" fullWidth margin="normal" size="small"
          value={form.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
        />

        {/* CONFIRMAR */}
        <TextField label="Confirma tu contraseña" name="confirmar" type="password" fullWidth margin="normal" size="small"
          sx={{ mb: 5 }}
          value={form.confirmar}
          onChange={handleChange}
          error={!!errors.confirmar}
          helperText={errors.confirmar}
        />

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <ButtonVerdeForm onClick={handleRegister}>
            Crear Cuenta
          </ButtonVerdeForm>
        </Box>

      </Paper>

      {/* ALERTAS */}
      <Snackbar
        open={open}
        autoHideDuration={2500}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={tipoAlerta} variant="filled">
          {mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Register;