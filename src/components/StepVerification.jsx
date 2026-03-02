import { useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import ButtonVerdeForm from "./ButtonVerdeForm";

/* ── Ícono mail inline ── */
const IconMail = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

/**
 * StepVerification — ingreso de código OTP de 6 dígitos
 *
 * Props:
 *   correo   {string}   — correo donde se envió el código (display only)
 *   onNext   {fn}       — callback al verificar con éxito
 *   onBack   {fn}       — callback para volver
 *   mockCode {string}   — código válido para pruebas (default "123456")
 */
function StepVerification({ correo = "", onNext, onBack, mockCode = "123456" }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [errOtp, setErrOtp]  = useState(false);
  const [resent, setResent]  = useState(false);
  const inputs = useRef([]);

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

  const handleVerify = () => {
    const code = digits.join("");
    if (code.length < 6 || code !== mockCode) {
      setErrOtp(true);
      return;
    }
    onNext();
  };

  const handleResend = () => {
    setResent(true);
    setDigits(["", "", "", "", "", ""]);
    inputs.current[0]?.focus();
    setTimeout(() => setResent(false), 4000);
  };

  return (
    <div className="reg-body">
      {/* Ícono */}
      <div className="otp-mail-icon">
        <IconMail />
      </div>

      <Typography variant="h5" className="title-bold">
        Verifica tu correo
      </Typography>
      <Typography variant="body2" className="subtitle-slim">
        Enviamos un código de 6 dígitos a<br />
        <strong style={{ color: "#1a6b46", fontWeight: 700 }}>
          {correo || "tu correo"}
        </strong>
      </Typography>

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
          />
        ))}
      </div>

      {errOtp && (
        <Typography
          variant="caption"
          sx={{ color: "#d32f2f", display: "block", mt: 0.5 }}
        >
          Código incorrecto. Intenta de nuevo.
        </Typography>
      )}

      <button className="otp-resend" onClick={handleResend}>
        {resent ? "✓ Código reenviado" : "¿No llegó? Reenviar código"}
      </button>

      <Box className="button-group" sx={{ mt: 2 }}>
        <ButtonVerdeForm colorType="gold" onClick={onBack}>
          Volver
        </ButtonVerdeForm>
        <ButtonVerdeForm colorType="green" onClick={handleVerify}>
          Verificar
        </ButtonVerdeForm>
      </Box>
    </div>
  );
}

export default StepVerification;
