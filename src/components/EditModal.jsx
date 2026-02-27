import React from "react";
import "../css/BalamCoreModal.css"
import logo from "../assets/Logo.png";

function EditModal({
  open,
  onClose,
  onSave,
  editingCliente,
  formData,
  onChange
}) {
  if (!open) return null;

  return (
    <div className="balam-overlay">
      <div className="balam-modal">

        {/* HEADER */}
        <div className="balam-header">
          <img src={logo} alt="Logo" className="balam-logo" />
          <div>
            <h2>
              {editingCliente
                ? "Editar cliente"
                : "Agregar nuevo cliente"}
            </h2>
            <p>
              {editingCliente
                ? "Modifica los datos del cliente"
                : "Ingresa los datos para registrar el cliente"}
            </p>
          </div>
        </div>

        {/* BODY */}
        <div className="balam-body">
          {[
            { label: "Nombre", name: "nombre", type: "text" },
            { label: "Apellido", name: "apellido", type: "text" },
            { label: "Teléfono", name: "telefono", type: "text" },
            { label: "Fecha Alta", name: "fechaAlta", type: "date" },
            { label: "Correo", name: "correo", type: "email" },
            { label: "CURP", name: "curp", type: "text" },
            { label: "RFC", name: "rfc", type: "text" }
          ].map(function (campo) {
            return (
              <div key={campo.name} className="balam-field">
                <label>{campo.label}</label>
                <input
                  type={campo.type}
                  name={campo.name}
                  value={formData[campo.name] || ""}
                  onChange={onChange}
                  placeholder={`Ingresa ${campo.label}`}
                />
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="balam-footer">
          <button className="balam-btn cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="balam-btn save" onClick={onSave}>
            {editingCliente ? "Guardar Cambios" : "Agregar Cliente"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default EditModal;