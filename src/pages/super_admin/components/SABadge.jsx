import "../css/SABadge.css";

/**
 * Badge de estatus, reutiliza las clases .badge--* ya definidas en
 * SuperAdminDashboard.css (success, warning, danger, expired, neutral, etc).
 *
 * variant: "success" | "warning" | "danger" | "expired" | "neutral" | "pro" | "std" | "bas"
 */
function SABadge({ children, variant = "neutral" }) {
  return <span className={`sa-badge badge--${variant}`}>{children}</span>;
}

export default SABadge;
