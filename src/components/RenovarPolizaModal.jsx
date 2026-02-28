import { useState } from "react";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import AddIcon       from "@mui/icons-material/Add";
import DeleteIcon    from "@mui/icons-material/Delete";
import CloseIcon     from "@mui/icons-material/Close";
import "../css/BalamCoreModal.css";
import "../css/RenovarPolizaModal.css";
import logo from "../assets/Logo.png";

function RenovarPolizaModal({ open, onClose, onRenovar, poliza, camposNuevos }) {
  const [bienes, setBienes] = useState([{ nombre: "", monto: "" }]);
  const [form,   setForm]   = useState({});

  if (!open || !poliza) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleBienChange = (i, field, value) => {
    const updated = [...bienes];
    updated[i][field] = value;
    setBienes(updated);
  };

  const addBien    = () => setBienes([...bienes, { nombre: "", monto: "" }]);
  const removeBien = (i) => {
    if (bienes.length === 1) return;
    setBienes(bienes.filter((_, idx) => idx !== i));
  };

  const handleRenovar = () => {
    onRenovar && onRenovar({ ...poliza, ...form, bienes });
    onClose();
  };

  return (
    <div className="balam-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="balam-modal renovar-modal">

        {/* HEADER */}
        <div className="balam-header renovar-header">
          <img src={logo} alt="BalamCore" className="balam-logo" />
          <div>
            <h2>Renovar póliza</h2>
            <p>Ingresa todos los datos para continuar con el proceso</p>
          </div>
          <button className="detalle-close renovar-close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="renovar-body">

          {/* ── DATOS ACTUALES (readonly, siempre igual) ── */}
          <div className="renovar-section">
            <div className="renovar-field">
              <label>Folio de póliza anterior</label>
              <input type="text" value={poliza.nPoliza} readOnly className="renovar-readonly" />
            </div>
            <div className="renovar-field">
              <label>Nombre y apellido</label>
              <input type="text" value={`${poliza.nombre} ${poliza.apellido}`} readOnly className="renovar-readonly" />
            </div>
            <div className="renovar-field">
              <label>Tipo de póliza</label>
              <input type="text" value={poliza.tipo} readOnly className="renovar-readonly" />
            </div>
            <div className="renovar-field">
              <label>Estatus actual</label>
              <input type="text" value={poliza.estatus} readOnly className="renovar-readonly" />
            </div>
          </div>

          {/* ── BIENES ASEGURADOS (siempre igual) ── */}
          <div className="renovar-bienes-section">
            <div className="renovar-bienes-header">
              <label>Bienes asegurados</label>
              <button className="renovar-add-btn" onClick={addBien} type="button">
                <AddIcon style={{ fontSize: 16 }} /> Agregar bien
              </button>
            </div>
            <div className="renovar-bienes-table">
              <div className="renovar-bienes-cols">
                <span>Nombre del bien</span>
                <span>Monto</span>
                <span></span>
              </div>
              {bienes.map((b, i) => (
                <div key={i} className="renovar-bien-row">
                  <input type="text" placeholder="Nombre del bien" value={b.nombre}
                    onChange={(e) => handleBienChange(i, "nombre", e.target.value)} />
                  <input type="text" placeholder="$ Monto" value={b.monto}
                    onChange={(e) => handleBienChange(i, "monto", e.target.value)} />
                  <button className="renovar-del-bien" onClick={() => removeBien(i)}
                    type="button" disabled={bienes.length === 1}>
                    <DeleteIcon style={{ fontSize: 16 }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── DATOS NUEVOS (vienen desde afuera) ── */}
          <div className="renovar-divider">
            <span>Datos nuevos para la póliza</span>
          </div>

          <div className="renovar-section renovar-section-3">
            {camposNuevos?.map((campo) => (
              <div key={campo.name} className="renovar-field">
                <label>{campo.label}</label>
                {campo.opciones ? (
                  <select name={campo.name} value={form[campo.name] || ""} onChange={handleChange}>
                    <option value="">{campo.placeholder || `Selecciona ${campo.label.toLowerCase()}`}</option>
                    {campo.opciones.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={campo.type || "text"}
                    name={campo.name}
                    placeholder={campo.placeholder || `Ingresa ${campo.label.toLowerCase()}`}
                    value={form[campo.name] || ""}
                    onChange={handleChange}
                  />
                )}
              </div>
            ))}
          </div>

        </div>

        {/* FOOTER */}
        <div className="balam-footer renovar-footer">
          <button className="balam-btn cancel" onClick={onClose}>Cancelar</button>
          <button className="balam-btn save renovar-save-btn" onClick={handleRenovar}>
            <AutorenewIcon style={{ fontSize: 16 }} /> Renovar Póliza
          </button>
        </div>

      </div>
    </div>
  );
}

export default RenovarPolizaModal;
