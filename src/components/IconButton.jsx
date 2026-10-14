import { IconButton as MuiIconButton, Tooltip, CircularProgress } from "@mui/material";
import useAccionAsync from "../hooks/useAccionAsync";

function IconButton({ icon, onClick, title, color = "#0F4C3A", hover = "#13624b" }) {
  const [handleClick, busy] = useAccionAsync(onClick);

  return (
    <Tooltip title={title}>
      <MuiIconButton
        onClick={handleClick}
        disabled={busy}
        sx={{
          position: "relative",
          backgroundColor: color,
          color: "white",
          width: 38,
          height: 38,
          mr: 1,
          cursor: busy ? "progress" : "pointer",
          "&:hover": {
            backgroundColor: hover,
          },
        }}
      >
        <span style={{ display: "flex", visibility: busy ? "hidden" : "visible" }}>{icon}</span>
        {busy && (
          <CircularProgress
            size={20}
            thickness={5}
            sx={{ color: "#fff", position: "absolute" }}
          />
        )}
      </MuiIconButton>
    </Tooltip>
  );
}

export default IconButton;