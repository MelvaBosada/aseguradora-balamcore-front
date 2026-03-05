import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import "../css/Login.css";


function AuthPage() {
  const [flipped, setFlipped] = useState(false);
  const [regStep, setRegStep] = useState(0);

  return (
    <div
      className="auth-scene"
      style={{
        /* Cuando el card crece (paso Empresa), cambia a flex-start
           con padding-top calculado para mantener centrado visual.*/
        alignItems: flipped && regStep === 2 ? "flex-start" : "center",
        paddingTop: flipped && regStep === 2 ? "clamp(20px, 4vh, 60px)" : undefined,
      }}
    >
      <div
        className={`auth-card ${flipped ? "flipped" : ""}`}
        style={{
          width:
            flipped && regStep === 2
              ? "min(580px, 96vw)"
              : "var(--card-width)",
          transition:
            "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform var(--flip-duration) cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* CARA FRONTAL — Login */}
        <div className="auth-face auth-front">
          <Login onGoToRegister={() => { setFlipped(true); setRegStep(0); }} />
        </div>

        {/* CARA TRASERA — Register */}
        <div className="auth-face auth-back">
          <Register
            onBackToLogin={() => setFlipped(false)}
            onStepChange={setRegStep}
          />
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
