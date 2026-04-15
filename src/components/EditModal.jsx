// components/EditModal.jsx
import "../css/BalamCoreModal.css";
import logo from "../assets/Logo.png";

function EditModal({ open, onClose, onSave, titulo, subtitulo, btnTexto, campos, formData, onChange, errores = {}, customHandlers = {}, children }) {
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
                {camposSec.map((campo) => (
                  <div key={campo.name} className={`balam-field ${campo.fullWidth ? "balam-full" : ""}`}>
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

                    ) : (
                      <input
                        type={campo.type || "text"}
                        name={campo.name}
                        value={formData[campo.name] || ""}
                        onChange={getHandler(campo)}
                        placeholder={`Ingresa ${campo.label.toLowerCase()}`}
                        readOnly={campo.readOnly || false}
                        style={{ borderColor: errores[campo.name] ? "#C0392B" : "" }}
                      />
                    )}

                    {/* MENSAJE DE ERROR */}
                    {errores[campo.name] && (
                      <span style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>
                        {errores[campo.name]}
                      </span>
                    )}

                  </div>
                ))}
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
          <button className="balam-btn save" onClick={onSave}>{btnTexto}</button>
        </div>

      </div>
    </div>
  );
}

export default EditModal;