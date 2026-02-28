import "../css/BalamCoreModal.css";
import logo from "../assets/Logo.png";

function EditModal({ open, onClose, onSave, titulo, subtitulo, btnTexto, campos, formData, onChange }) {
  if (!open) return null;

  return (
    <div className="balam-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="balam-modal">

        {/* HEADER */}
        <div className="balam-header">
          <img src={logo} alt="BalamCore" className="balam-logo" />
          <div>
            <h2>{titulo}</h2>
            <p>{subtitulo}</p>
          </div>
        </div>

        {/* BODY */}
        <div className="balam-body">
          {campos?.map((campo) => (
            <div key={campo.name} className="balam-field">
              <label>{campo.label}</label>
              <input
                type={campo.type}
                name={campo.name}
                value={formData[campo.name] || ""}
                onChange={onChange}
                placeholder={`Ingresa ${campo.label.toLowerCase()}`}
              />
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
