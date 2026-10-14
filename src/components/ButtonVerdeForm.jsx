import { Button, CircularProgress } from "@mui/material";
import useAccionAsync from "../hooks/useAccionAsync";

function ButtonVerdeForm({
  children,
  colorType = "green",
  onClick,
  loading = false, // opcional: para forzar el estado de carga desde afuera
  ...props
}) {
  const [handleClick, busyInterno] = useAccionAsync(onClick);
  const busy = loading || busyInterno;

  const styles = {
    green: {
      backgroundColor: "#114C3A",
      "&:hover": { backgroundColor: "#0d3a2c" }
    },
    gold: {
      backgroundColor: "#BA9241",
      "&:hover": { backgroundColor: "#a07c35" }
    }
  };

  return (
  
    <Button
      variant="contained"
      sx={{
        position: "relative",
        fontFamily: "'Abhaya Libre', serif",
        fontWeight: 500,
        borderRadius: "20px",
        padding: "8px 20px", // Aumenté un poco el padding vertical para mejor balance
        color: "#fff",
        textTransform: "none",
        fontSize: "1rem",   
        width: "auto",      // Deja que el padding defina el ancho
        minWidth: "130px",  // Un poco menos de lo que tenías
        cursor: busy ? "progress" : "pointer",
        ...styles[colorType]
      }}
      {...props}
      onClick={handleClick}
    >
      <span style={{ visibility: busy ? "hidden" : "visible" }}>{children}</span>
      {busy && (
        <CircularProgress
          size={20}
          thickness={5}
          sx={{ color: "#fff", position: "absolute" }}
        />
      )}
    </Button>
  );
}

export default ButtonVerdeForm;