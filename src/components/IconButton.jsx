import { IconButton as MuiIconButton, Tooltip } from "@mui/material";

function IconButton({ icon, onClick, title, color = "#0F4C3A", hover = "#13624b" }) {
  return (
    <Tooltip title={title}>
      <MuiIconButton
        onClick={onClick}
        sx={{
          backgroundColor: color,
          color: "white",
          width: 40,
          height: 40,
          mr: 1,
          "&:hover": {
            backgroundColor: hover,
          },
        }}
      >
        {icon}
      </MuiIconButton>
    </Tooltip>
  );
}

export default IconButton;