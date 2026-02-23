import { useNavigate } from "react-router-dom";
function Login() {
    const navigate = useNavigate(); // inicializamos el hook

     const handleLogin = () => {
    // Aquí podrías validar usuario y contraseña si quieres
    navigate("/home"); // redirige a /home
     }

     const handleRegister = () => {
    navigate("/register"); // va a Register
  };
  return (
    <div>
      <h1>Login</h1>
     <button onClick={handleLogin}>Entrar</button>
     <button onClick={handleRegister}>Registrar</button>
    </div>
  )
}

export default Login