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
        fontFamily: "Abhaya Libre",
        fontWeight: 800,
        borderRadius: "25px",
        padding: "10px 25px",
        color: "#fff",
        textTransform: "none",
        ...styles[colorType]
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

export default ButtonVerdeForm;