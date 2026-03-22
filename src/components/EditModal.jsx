import "../css/BalamCoreModal.css";
import logo from "../assets/Logo.png";

function EditModal({ open, onClose, onSave, titulo, subtitulo, btnTexto, campos, formData, onChange }) {
  if (!open) return null;

  // Agrupa campos por sección si tienen `seccion`
  const secciones = campos?.reduce((acc, campo) => {
    const sec = campo.seccion || "General";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(campo);
    return acc;
  }, {});

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
              {/* Título de sección solo si no es "General" */}
              {seccion !== "General" && (
                <div className="balam-section-title">{seccion}</div>
              )}
              <div className="balam-fields-grid">
                {camposSec.map((campo) => (
                  <div key={campo.name} className={`balam-field ${campo.fullWidth ? "balam-full" : ""}`}>
                    <label>{campo.label}</label>

                    {/* SELECT */}
                    {campo.type === "select" ? (
                      <select
                        name={campo.name}
                        value={formData[campo.name] || ""}
                        onChange={onChange}
                        className="balam-select"
                      >
                        <option value="">Selecciona...</option>
                        {campo.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                    ) : campo.type === "textarea" ? (
                      /* TEXTAREA */
                      <textarea
                        name={campo.name}
                        value={formData[campo.name] || ""}
                        onChange={onChange}
                        placeholder={`Ingresa ${campo.label.toLowerCase()}`}
                        className="balam-textarea"
                        rows={3}
                      />

                    ) : (
                      /* INPUT normal */
                      <input
                        type={campo.type}
                        name={campo.name}
                        value={formData[campo.name] || ""}
                        onChange={onChange}
                        placeholder={`Ingresa ${campo.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
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