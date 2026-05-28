import { useState } from "react";
import logo from "../assets/Logo.png";
import "../css/BalamCoreModal.css";

const AsignarPermisosModal = ({
  open,
  onClose,
  onSave,
  perfil,
  permisosDisponibles = [],  // [{id, nombre, clave, descripcion}]
  permisosActuales    = [],  // [id, id, id]
}) => {
  const [seleccionados, setSeleccionados] = useState(permisosActuales);

  if (!open) return null;

  const togglePermiso = (id) =>
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );

  const toggleTodos = () =>
    setSeleccionados(
      seleccionados.length === permisosDisponibles.length
        ? []
        : permisosDisponibles.map(p => p.id)
    );

  return (
    <div className="balam-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="balam-modal">

        <div className="balam-header">
          <img src={logo} alt="BalamCore" className="balam-logo" />
          <div>
            <h2>Asignar permisos</h2>
            <p>Selecciona los permisos para <strong>{perfil?.nombre}</strong></p>
          </div>
        </div>

        <div className="balam-body" style={{ display: "flex", flexDirection: "column", gap: 0 }}>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <button
              onClick={toggleTodos}
              style={{
                background: "none", border: "none",
                color: "#0F4C3A", fontWeight: 600,
                fontSize: 12, cursor: "pointer",
                textDecoration: "underline", padding: 0,
              }}
            >
              {seleccionados.length === permisosDisponibles.length ? "Deseleccionar todos" : "Seleccionar todos"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {permisosDisponibles.map((permiso) => (
              <label
                key={permiso.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: seleccionados.includes(permiso.id) ? "#E5F0EC" : "#F3F4F6",
                  border: `1.5px solid ${seleccionados.includes(permiso.id) ? "#0F4C3A" : "transparent"}`,
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#1f2d2a",
                  transition: "all 0.15s",
                  boxSizing: "border-box",
                }}
              >
                <span style={{ flex: 1 }}>{permiso.nombre}</span>
                <input
                  type="checkbox"
                  checked={seleccionados.includes(permiso.id)}
                  onChange={() => togglePermiso(permiso.id)}
                  style={{
                    width: 16, height: 16,
                    accentColor: "#0F4C3A",
                    cursor: "pointer",
                    marginLeft: 12,
                    flexShrink: 0,
                  }}
                />
              </label>
            ))}
          </div>

          <div style={{ textAlign: "right", marginTop: 10, fontSize: 11, color: "#9CA3AF" }}>
            {seleccionados.length} de {permisosDisponibles.length} permisos seleccionados
          </div>

        </div>

        <div className="balam-footer">
          <button className="balam-btn cancel" onClick={onClose}>Cancelar</button>
          <button className="balam-btn save" onClick={() => onSave(seleccionados)}>Asignar permisos</button>
        </div>

      </div>
    </div>
  );
};

export default AsignarPermisosModal;