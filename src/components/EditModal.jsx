// components/EditModal.jsx
import "../css/BalamCoreModal.css";
import logo from "../assets/Logo.png";
import useAccionAsync from "../hooks/useAccionAsync";

function EditModal({ open, onClose, onSave, titulo, subtitulo, btnTexto, campos, formData, onChange, errores = {}, customHandlers = {}, dropdowns = {}, children }) {
  const [handleSave, saving] = useAccionAsync(onSave);

  if (!open) return null;

  const secciones = campos?.reduce((acc, campo) => {
    const sec = campo.seccion || "General";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(campo);
    return acc;
  }, {});

  // Función para renderizar opciones del select (soporta array de strings o array de objetos)
  const renderOptions = (options) => {
    if (!options || options.length === 0) return null;
    
    // Si el primer elemento es string, es un array simple
    if (typeof options[0] === 'string') {
      return options.map((opt) => (
        <option key={opt} value={opt}>
          {opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}
        </option>
      ));
    }
    
    // Si es array de objetos con value/label
    return options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ));
  };

  // Obtener el handler personalizado para el campo si existe
  const getHandler = (campo) => {
    if (campo.name === "rfc_buscar" && customHandlers.onRfcChange) {
      return customHandlers.onRfcChange;
    }
    return onChange;
  };

  return (
    <div className="balam-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="balam-modal balam-modal-wide">

        {/* HEADER */}
        <div className="balam-header">
          <img src={logo} alt="BalamCore" className="balam-logo" />
          <div>
            <h2>{titulo}</h2>
            <p>{subtitulo}</p>
          </div>
        </div>

        {/* BODY */}
        <div className="balam-body balam-body-sections">
          {Object.entries(secciones).map(([seccion, camposSec]) => (
            <div key={seccion} className="balam-section">
              {seccion !== "General" && (
                <div className="balam-section-title">{seccion}</div>
              )}
              <div className="balam-fields-grid">
                {camposSec.map((campo) => {
                  const dropdown = dropdowns[campo.name];
                  const tieneOpciones = dropdown?.options?.length > 0;

                  return (
                    <div
                      key={campo.name}
                      className={`balam-field ${campo.fullWidth ? "balam-full" : ""}`}
                      style={{ position: "relative" }}
                    >
                      <label style={{ color: errores[campo.name] ? "#C0392B" : "" }}>
                        {campo.label}
                        {campo.required && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
                      </label>

                      {/* SELECT */}
                      {campo.type === "select" ? (
                        <select
                          name={campo.name}
                          value={formData[campo.name] || campo.defaultValue || ""}
                          onChange={onChange}
                          className="balam-select"
                          style={{ borderColor: errores[campo.name] ? "#C0392B" : "" }}
                        >
                          <option value="">Selecciona {campo.label.toLowerCase()}...</option>
                          {renderOptions(campo.options)}
                        </select>

                      ) : campo.type === "textarea" ? (
                        <textarea
                          name={campo.name}
                          value={formData[campo.name] || ""}
                          onChange={onChange}
                          placeholder={`Ingresa ${campo.label.toLowerCase()}`}
                          className="balam-textarea"
                          rows={campo.rows || 3}
                          style={{ borderColor: errores[campo.name] ? "#C0392B" : "" }}
                        />

                      ) : campo.type === "file" ? (
                        // INPUT DE ARCHIVO: nunca lleva `value`, el navegador lo rechaza
                        // por seguridad (solo permite setearlo a "" programáticamente).
                        <>
                          <input
                            type="file"
                            name={campo.name}
                            onChange={getHandler(campo)}
                            readOnly={campo.readOnly || false}
                            style={{ borderColor: errores[campo.name] ? "#C0392B" : "" }}
                          />
                          {formData[campo.name] && (
                            <span style={{ fontSize: 12, color: "#666", marginTop: 4, display: "block" }}>
                              Archivo seleccionado: {formData[campo.name].name}
                            </span>
                          )}
                        </>

                      ) : (
                        <input
                          type={campo.type || "text"}
                          name={campo.name}
                          value={formData[campo.name] || ""}
                          onChange={getHandler(campo)}
                          placeholder={`Ingresa ${campo.label.toLowerCase()}`}
                          readOnly={campo.readOnly || false}
                          autoComplete="off"
                          style={{ borderColor: errores[campo.name] ? "#C0392B" : "" }}
                        />
                      )}

                      {/* DROPDOWN DE SUGERENCIAS (búsqueda en vivo) */}
                      {tieneOpciones && (
                        <div
                          className="siniestro-sugerencias"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 30,
                            background: "#fff",
                            border: "1px solid #ddd",
                            borderRadius: 6,
                            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                            maxHeight: 200,
                            overflowY: "auto"
                          }}
                        >
                          {dropdown.options.map((op) => (
                            <div
                              key={op.value}
                              onClick={() => dropdown.onSelect(op)}
                              style={{ padding: "8px 12px", cursor: "pointer" }}
                              onMouseDown={(e) => e.preventDefault()} // evita perder el foco antes del click
                            >
                              {op.label}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* MENSAJE DE ERROR */}
                      {errores[campo.name] && (
                        <span style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>
                          {errores[campo.name]}
                        </span>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* RENDERIZAR CHILDREN (SECCIÓN DE BIENES) */}
          {children && (
            <div className="balam-section">
              {children}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="balam-footer">
          <button className="balam-btn cancel" onClick={onClose}>Cancelar</button>
          <button className="balam-btn save" onClick={handleSave} disabled={saving}>
            {saving ? "Procesando..." : btnTexto}
          </button>
        </div>

      </div>
    </div>
  );
}

export default EditModal;