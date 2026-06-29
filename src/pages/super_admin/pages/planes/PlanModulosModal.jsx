import { useState, useEffect } from "react";
import SAButton from "../../components/SAButton";
import "./PlanModulosModal.css";

/**
 * Contenido del modal de asignación de módulos. Se usa dentro de <SAModal>.
 * Muestra una lista plana de checkboxes (todos los módulos disponibles)
 * con los que el plan ya tiene asignados pre-marcados.
 *
 * @param {object[]} modulosDisponibles  Todos los módulos activos del sistema
 * @param {number[]} modulosAsignados    IDs de los módulos que el plan ya tiene
 * @param {function} onSubmit            (idsSeleccionados: number[]) => Promise
 * @param {function} onCancel
 * @param {string|null} errorMsg
 * @param {boolean} loading
 */
function PlanModulosModal({ modulosDisponibles, modulosAsignados, onSubmit, onCancel, errorMsg, loading }) {
  const [seleccionados, setSeleccionados] = useState(new Set());

  useEffect(() => {
    setSeleccionados(new Set(modulosAsignados || []));
  }, [modulosAsignados]);

  const toggleModulo = (id) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const seleccionarTodos = () => {
    setSeleccionados(new Set(modulosDisponibles.map((m) => m.id)));
  };

  const quitarTodos = () => {
    setSeleccionados(new Set());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(Array.from(seleccionados));
  };

  return (
    <form onSubmit={handleSubmit}>
      {errorMsg && <div className="sa-modal-error">{errorMsg}</div>}

      <div className="sa-pxm-toolbar">
        <span className="sa-pxm-count">
          {seleccionados.size} de {modulosDisponibles.length} seleccionados
        </span>
        <div className="sa-pxm-toolbar__actions">
          <button type="button" className="sa-pxm-link" onClick={seleccionarTodos}>
            Seleccionar todos
          </button>
          <span className="sa-pxm-sep">·</span>
          <button type="button" className="sa-pxm-link" onClick={quitarTodos}>
            Quitar todos
          </button>
        </div>
      </div>

      <div className="sa-pxm-list">
        {modulosDisponibles.length === 0 && (
          <div className="sa-pxm-empty">No hay módulos disponibles.</div>
        )}
        {modulosDisponibles.map((modulo) => (
          <label key={modulo.id} className="sa-pxm-item">
            <input
              type="checkbox"
              checked={seleccionados.has(modulo.id)}
              onChange={() => toggleModulo(modulo.id)}
            />
            <span className="sa-pxm-item__nombre">{modulo.nombre}</span>
            <span className="sa-pxm-item__clave">{modulo.clave}</span>
          </label>
        ))}
      </div>

      <div className="sa-form-actions">
        <SAButton variant="outline" type="button" onClick={onCancel} disabled={loading}>
          Cancelar
        </SAButton>
        <SAButton variant="accent" type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar módulos"}
        </SAButton>
      </div>
    </form>
  );
}

export default PlanModulosModal;
