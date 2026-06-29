import "../css/SAButton.css";

/**
 * Botón reutilizable de SuperAdmin
 
 */
function SAButton({ children, variant = "accent", type = "button", className = "", ...props }) {
  return (
    <button type={type} className={`sa-btn sa-btn--${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default SAButton;
