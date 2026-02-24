import { Box, TextField, Button, Typography, Paper, Snackbar, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../css/Login.css";
import { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import ButtonVerdeForm from "../components/ButtonVerdeForm"

function Login() {

    useEffect(() => {
        document.body.className = "login-body";
        return () => (document.body.className = "");
    }, []);

    const navigate = useNavigate();

    {/* estados */ }
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const [open, setOpen] = useState(false);
    const [mensaje, setMensaje] = useState("");


    {/* Validaciones de usuario */ }
    const handleLogin = () => {
        if (correo === "admin" && password === "12345") {
            setMensaje("Se ha iniciado tu sesión correctamente");
            setOpen(true);
            setError(false);

            setTimeout(() => {
                navigate("/home");
            }, 1000);

        } else {
            setMensaje("Los datos que ingresaste son incorrectos");
            setOpen(true);
            setError(true);
        }
    };


    return (
        <Box className="login-container">
            <Paper elevation={6} sx={{ padding: 5, width: 410, borderRadius: "80px", textAlign: "center", gap: 3 }}>

                <img src={logo} alt="logo" className="login-logo" />

                <Typography variant="h5" sx={{ fontFamily: "Anek Bangla, sans-serif", fontWeight: 700, color: "#000000" }}>
                    Inicio de Sesión
                </Typography>

                <Typography variant="body2" sx={{ fontFamily: "Abel", color: "#2c2b2b", mb: 3 }}>
                    Ingresa tus datos para iniciar sesión
                </Typography>

                <TextField label="Ingesa tu correo electronico" fullWidth margin="normal" size="small"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    error={error} helperText={error ? "Usuario incorrecto" : ""} />

                <TextField label="Ingresa tu contraseña" type="password" fullWidth margin="normal" size="small"
                    sx={{ mb: 5 }}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    error={error} helperText={error ? "Contraseña incorrecta" : ""} />

                <Box className="login-buttons"  sx={{ mb: 1 }}>
                    <ButtonVerdeForm colorType="green" onClick={handleLogin}>
                        Iniciar Sesión
                    </ButtonVerdeForm>

                    <ButtonVerdeForm colorType="gold" onClick={() => navigate("/register")}>
                        Registrarse
                    </ButtonVerdeForm>

                </Box>

            </Paper>


            {/* ALERTAS de MUI */}
            <Snackbar
                open={open}
                autoHideDuration={2000}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    severity={error ? "error" : "success"}
                    variant="filled"
                    onClose={() => setOpen(false)}
                    sx={{ width: "100%" }}
                >
                    {mensaje}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Login;