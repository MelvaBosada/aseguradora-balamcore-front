import "../css/SAButton.css";
import { CircularProgress } from "@mui/material";
import { useEffect } from "react";
import useAccionAsync from "../../../hooks/useAccionAsync";
import { useLoader } from "../../../context/LoaderContext";

/**
 * Botón reutilizable de SuperAdmin
 
 */
function SAButton({
  children,
  variant = "accent",
  type = "button",
  className = "",
  loading = false,
  disabled = false,
  onClick,
  style,
  ...props
}) {
  const [handleClick, busy] = useAccionAsync(onClick);
  const { showLoader, hideLoader } = useLoader();
  const isBusy = loading || busy;

  useEffect(() => {
    if (!loading) return undefined;
    showLoader();
    return hideLoader;
  }, [loading, showLoader, hideLoader]);

  return (
    <button
      type={type}
      className={`sa-btn sa-btn--${variant} ${className}`}
      onClick={handleClick}
      disabled={disabled || isBusy}
      aria-busy={isBusy}
      style={{ position: "relative", ...style }}
      {...props}
    >
      <span style={{ visibility: isBusy ? "hidden" : "visible" }}>{children}</span>
      {isBusy && <CircularProgress size={18} sx={{ color: "currentColor", position: "absolute" }} />}
    </button>
  );
}

export default SAButton;
