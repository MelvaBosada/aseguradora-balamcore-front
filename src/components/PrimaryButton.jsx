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
          px: 3,
          py: 1.2,
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
          size={20}
          thickness={5}
          sx={{ color: "#fff", position: "absolute" }}
        />
      )}
    </Button>
  );
}

export default PrimaryButton;