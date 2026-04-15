// components/RenovarPolizaModal.jsx
import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import CarIcon from "@mui/icons-material/DirectionsCar";
import ComputerIcon from "@mui/icons-material/Computer";
import BuildIcon from "@mui/icons-material/Build";
import AssignmentIcon from "@mui/icons-material/Assignment";
import "../css/BalamCoreModal.css";

function RenovarPolizaModal({ 
  open, 
  onClose, 
  onRenovar, 
  poliza, 
  detallePoliza,
  formData,
  onInputChange,
  camposNuevos 
}) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    setLoading(true);
    await onRenovar();
    setLoading(false);
  };

  const getIconoPorTipoBien = (tipo) => {
    switch(tipo) {
      case 'vehiculo': return <CarIcon fontSize="small" />;
      case 'inmueble': return <HomeIcon fontSize="small" />;
      case 'electronico': return <ComputerIcon fontSize="small" />;
      case 'maquinaria': return <BuildIcon fontSize="small" />;
      default: return <AssignmentIcon fontSize="small" />;
    }
  };

  const renderInput = (campo) => {
    const value = formData[campo.name] || "";
    
    if (campo.type === "select") {
      return (
        <select
          name={campo.name}
          value={value}
          onChange={onInputChange}
          className="balam-select"
          required={campo.required}
        >
          <option value="">{campo.placeholder || `Selecciona ${campo.label.toLowerCase()}`}</option>
          {campo.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    
    if (campo.type === "textarea") {
      return (
        <textarea
          name={campo.name}
          value={value}
          onChange={onInputChange}
          placeholder={campo.placeholder}
          className="balam-textarea"
          rows={campo.rows || 3}
          readOnly={campo.readOnly}
        />
      );
    }
    
    return (
      <input
        type={campo.type || "text"}
        name={campo.name}
        value={value}
        onChange={onInputChange}
        placeholder={campo.placeholder}
        readOnly={campo.readOnly}
        className="balam-input"
      />
    );
  };

  return (
    <div className="balam-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="balam-modal balam-modal-wide">

        <div className="balam-header">
          <div>
            <h2>Renovar póliza</h2>
            <p>Ingresa todos los datos para continuar con el proceso</p>
          </div>
          <button className="detalle-close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="balam-body">
          {/* Información de la póliza anterior */}
          {poliza && (
            <div className="info-poliza-anterior" style={{ 
              backgroundColor: '#F9FAFB', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>FOLIO DE PÓLIZA ANTERIOR</h3>
              <p><strong>{poliza.nPoliza}</strong></p>
              <p><strong>NOMBRE Y APELLIDO</strong><br />{poliza.nombre} {poliza.apellido}</p>
              
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                <div>
                  <strong>TIPO DE PÓLIZA</strong>
                  <p>{detallePoliza?.tipo || poliza.tipo}</p>
                </div>
                <div>
                  <strong>ESTATUS ACTUAL</strong>
                  <p style={{ color: poliza.estatus === 'Urgente' ? '#DC2626' : '#F59E0B' }}>
                    {poliza.estatus}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bienes asegurados */}
          {detallePoliza?.bienes && detallePoliza.bienes.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>
                BIENES ASEGURADOS
              </h3>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px',
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '10px'
              }}>
                {detallePoliza.bienes.map(bien => (
                  <div key={bien.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}>
                    {getIconoPorTipoBien(bien.tipo)}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{bien.descripcion}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {bien.marca && `Marca: ${bien.marca} | `}
                        {bien.modelo && `Modelo: ${bien.modelo} | `}
                        Valor: ${Number(bien.valor).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datos nuevos para la póliza */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>
              DATOS NUEVOS PARA LA PÓLIZA
            </h3>
            <div className="balam-fields-grid">
              {camposNuevos?.map((campo, idx) => (
                <div key={idx} className="balam-field">
                  <label>{campo.label}</label>
                  {renderInput(campo)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="balam-footer">
          <button className="balam-btn cancel" onClick={onClose}>Cancelar</button>
          <button className="balam-btn save" onClick={handleSubmit} disabled={loading}>
            {loading ? "Procesando..." : "Renovar Póliza"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default RenovarPolizaModal;