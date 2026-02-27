import { Button } from "@mui/material";

function PrimaryButton({
  text,
  icon,
  onClick,
  color = "#295E4E",
  hover = "#357564",
}) {
  return (
    <Button
      variant="contained"
      startIcon={icon}
      onClick={onClick}
      sx={{
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
      }}
    >
      {text}
    </Button>
  );
}

export default PrimaryButton;