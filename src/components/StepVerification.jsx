import { useRef, useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import axios from "axios";
import ButtonVerdeForm from "./ButtonVerdeForm";
const API_BASE = import.meta.env.VITE_API_URL || "";

function StepVerification({ correo = "", onNext, onBack }) {
  const [digits,   setDigits]   = useState(["", "", "", "", "", ""]);
  const [errOtp,   setErrOtp]   = useState(false);
  const [resent,   setResent]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [segundos, setSegundos] = useState(600);
  const [expirado, setExpirado] = useState(false);
  const inputs    = useRef([]);
  const intervalo = useRef(null);

  useEffect(() => {
    intervalo.current = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) {
          clearInterval(intervalo.current);
          setExpirado(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalo.current);
  }, []);

  const formatTiempo = (s) => {
    const m   = Math.floor(s / 60).toString().padStart(2, "0");
    const seg = (s % 60).toString().padStart(2, "0");
    return `${m}:${seg}`;
  };

  const handleDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    setErrOtp(false);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(""));
      inputs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    if (expirado) return;
    const code = digits.join("");
    if (code.length < 6) { setErrOtp(true); return; }
    setLoading(true);
    try {
     await axios.post(`${API_BASE}/verificar-otp`, { correo, codigo: code });
      onNext();
    } catch {
      setErrOtp(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await axios.post(`${API_BASE}/enviar-otp`, { correo });
      setSegundos(600);
      setExpirado(false);
      setResent(true);
      setDigits(["", "", "", "", "", ""]);
      clearInterval(intervalo.current);
      intervalo.current = setInterval(() => {
        setSegundos((s) => {
          if (s <= 1) { clearInterval(intervalo.current); setExpirado(true); return 0; }
          return s - 1;
        });
      }, 1000);
      inputs.current[0]?.focus();
      setTimeout(() => setResent(false), 4000);
    } catch {
      console.error("Error al reenviar código");
    }
  };

  return (
    <div className="reg-body">

      <Typography variant="h5" className="title-bold">Verifica tu correo</Typography>

      <Typography variant="body2" className="subtitle-slim">
        Enviamos un código de 6 dígitos a<br />
        <strong style={{ color: "#1a6b46", fontWeight: 700 }}>{correo || "tu correo"}</strong>
      </Typography>

      {/* Cronómetro */}
<p style={{ margin: "0", fontSize: "12px", color: expirado ? "#dc2626" : "#1a6b46", textAlign: "center" }}>
  {expirado ? "Código expirado" : `Expira en ${formatTiempo(segundos)}`}
</p>

      {/* Cajas OTP */}
      <div className="otp-row" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            className={`otp-box ${errOtp ? "otp-error" : ""} ${d ? "otp-filled" : ""}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={expirado}
          />
        ))}
      </div>

      {/* Espacio reservado para errores — siempre ocupa el mismo alto */}
      <div style={{ minHeight: "16px", marginTop: "2px" }}>
        {errOtp && !expirado && (
          <Typography variant="caption" sx={{ color: "#d32f2f", display: "block", textAlign: "center" }}>
            Código incorrecto. Intenta de nuevo.
          </Typography>
        )}
        {expirado && (
          <Typography variant="caption" sx={{ color: "#d32f2f", display: "block", textAlign: "center" }}>
            Tu código expiró. Reenvía uno nuevo.
          </Typography>
        )}
      </div>

      <button className="otp-resend" onClick={handleResend}>
        {resent ? "✓ Código reenviado" : "¿No llegó? Reenviar código"}
      </button>

      <Box className="button-group" sx={{ mt: 1.5 }}>
        <ButtonVerdeForm colorType="gold"  onClick={onBack}>Volver</ButtonVerdeForm>
        <ButtonVerdeForm colorType="green" onClick={handleVerify} disabled={loading || expirado}>
          {loading ? "Verificando..." : "Verificar"}
        </ButtonVerdeForm>
      </Box>

    </div>
  );
}

export default StepVerification;