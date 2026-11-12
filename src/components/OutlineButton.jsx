import { Button, CircularProgress } from "@mui/material";
import useAccionAsync from "../hooks/useAccionAsync";

function OutlineButton({
  text,
  icon,
  onClick,
  color = "#295E4E",
  dataTour,
  loading = false,
  disabled = false,
  compact = false,
  square = false,
}) {
  const [handleClick, busy] = useAccionAsync(onClick);
  const isBusy = loading || busy;

  return (
    <Button
      variant="outlined"
      startIcon={isBusy ? null : icon}
      onClick={handleClick}
      disabled={disabled || isBusy}
      data-tour={dataTour}
      sx={{
        position: "relative",
        backgroundColor: "#fff",
        color: color,
        border: `1.5px solid ${color}`,
        textTransform: "none",
        fontWeight: "bold",
        borderRadius: square ? "8px" : "999px",
        px: compact ? 2 : 3,
        py: compact ? 0.4 : 1.2,
        fontSize: compact ? "0.85rem" : undefined,
        boxShadow: "none",
        transition: "background-color 0.2s ease, color 0.2s ease",
        "&:hover": {
          backgroundColor: color,
          borderColor: color,
          color: "#fff",
          boxShadow: "none",
        },
        "&.Mui-disabled": {
          backgroundColor: "#fff",
          color: color,
          borderColor: color,
          opacity: isBusy ? 1 : 0.5,
        },
      }}
    >
      <span style={{ visibility: isBusy ? "hidden" : "visible" }}>{text}</span>
      {isBusy && (
        <CircularProgress
          size={compact ? 12 : 16}
          thickness={5}
          sx={{ color: color, position: "absolute" }}
        />
      )}
    </Button>
  );
}

export default OutlineButton;