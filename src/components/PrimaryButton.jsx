import { Button, CircularProgress } from "@mui/material";
import useAccionAsync from "../hooks/useAccionAsync";

function PrimaryButton({
  text,
  icon,
  onClick,
  color = "#295E4E",
  hover = "#357564",
  dataTour,
  loading = false,
  disabled = false,
  compact = false,
}) {
  const [handleClick, busy] = useAccionAsync(onClick);
  const isBusy = loading || busy;

  return (
    <Button
      variant="contained"
      startIcon={isBusy ? null : icon}
      onClick={handleClick}
      disabled={disabled || isBusy}
      data-tour={dataTour}
      sx={{
        position: "relative",
        ...{
          backgroundColor: color,
          textTransform: "none",
          fontWeight: "bold",
          borderRadius: "999px",
          px: compact ? 2.2 : 3,
          py: compact ? 0.8 : 1.2,
          minHeight: compact ? 38 : undefined,
          fontSize: compact ? "0.9rem" : undefined,
          boxShadow: "none",
          "&:hover": {
            backgroundColor: hover,
            boxShadow: "none",
          },
        },
      }}
    >
      <span style={{ visibility: isBusy ? "hidden" : "visible" }}>{text}</span>
      {isBusy && (
        <CircularProgress
          size={compact ? 18 : 20}
          thickness={5}
          sx={{ color: "#fff", position: "absolute" }}
        />
      )}
    </Button>
  );
}

export default PrimaryButton;