// Auth.jsx
import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import "../css/Login.css";

function AuthPage() {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="auth-scene">
      <div className={`auth-card ${flipped ? "flipped" : ""}`}>

        {/* CARA FRONTAL — Login (determina la altura de la tarjeta) */}
        <div className="auth-face auth-front">
          <Login onGoToRegister={() => setFlipped(true)} />
        </div>

        {/* CARA TRASERA — Register (absoluta, misma altura) */}
        <div className="auth-face auth-back">
          <Register onBackToLogin={() => setFlipped(false)} />
        </div>

      </div>
    </div>
  );
}

export default AuthPage;
