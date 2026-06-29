import { useState } from "react";
import SAButton from "../../components/SAButton";
import "./CambiarPlanModal.css";

/**
 * Contenido del modal de renovación / cambio de plan. Se usa dentro de
 * <SAModal>. Llama a POST /suscripciones/{id_aseguradora}/activar, que
 * en tu SuscripcionController cancela la suscripción vigente de esa
 * aseguradora y crea una nueva con el plan seleccionado.
 *
 * @param {object} aseguradora      La aseguradora a la que se le cambia el plan
 * @param {object[]} planes         Lista de planes disponibles
 * @param {function} onSubmit       (idPlan: number) => Promise
 */
function CambiarPlanModal({ aseguradora, planes, onSubmit, onCancel, errorMsg, loading }) {
  const [idPlanSeleccionado, setIdPlanSeleccionado] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!idPlanSeleccionado) return;
    onSubmit(Number(idPlanSeleccionado));
  };

  return (
    <form onSubmit={handleSubmit}>
      {errorMsg && <div className="sa-modal-error">{errorMsg}</div>}

      <p className="sa-cambiar-plan__intro">
        Esto cancelará la suscripción activa de <strong>{aseguradora?.aseguradora}</strong> y
        creará una nueva con el plan que elijas.
      </p>

      <div className="sa-field">
        <label>Nuevo plan *</label>
        <select
          value={idPlanSeleccionado}
          onChange={(e) => setIdPlanSeleccionado(e.target.value)}
          required
        >
          <option value="">Selecciona un plan...</option>
          {planes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} — ${Number(p.precio).toLocaleString("es-MX")} MXN/mes
            </option>
          ))}
        </select>
      </div>

      <div className="sa-form-actions">
        <SAButton variant="outline" type="button" onClick={onCancel} disabled={loading}>
          Cancelar
        </SAButton>
        <SAButton variant="accent" type="submit" disabled={loading || !idPlanSeleccionado}>
          {loading ? "Procesando..." : "Activar plan"}
        </SAButton>
      </div>
    </form>
  );
}

export default CambiarPlanModal;
