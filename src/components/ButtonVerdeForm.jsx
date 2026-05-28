import { Button } from "@mui/material";

function ButtonVerdeForm({ children, colorType = "green", ...props }) {
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
        fontFamily: "'Abhaya Libre', serif",
        fontWeight: 500,
        borderRadius: "20px",
        padding: "8px 20px", // Aumenté un poco el padding vertical para mejor balance
        color: "#fff",
        textTransform: "none",
        fontSize: "1rem",   
        width: "auto",      // Deja que el padding defina el ancho
        minWidth: "130px",  // Un poco menos de lo que tenías
        ...styles[colorType]
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

export default ButtonVerdeForm;