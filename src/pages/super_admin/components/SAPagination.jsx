import { useState } from "react";
import "../css/SAPagination.css";

const OPCIONES_FILAS = [5, 8, 10, 15, 20, 50];

const getPageRange = (current, total) => {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);

  let start = Math.max(1, current - 2);
  let end = start + 5;

  if (end > total) {
    end = total;
    start = Math.max(1, end - 5);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

/**
 * Paginación reutilizable de SuperAdmin. Mismo comportamiento que la
 * Paginacion del proyecto principal, pero sin depender de @mui/icons-material.
 */
function SAPagination({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }) {
  const [selectOpen, setSelectOpen] = useState(false);
  const pageRange = getPageRange(currentPage, totalPages);

  if (totalPages <= 0) return null;

  return (
    <div className="sa-pag-wrapper">
      <div className="sa-pag">
        <button
          className="sa-pag-btn sa-pag-arrow"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          type="button"
          aria-label="Anterior"
        >
          ‹
        </button>

        {pageRange.map((page) => (
          <button
            key={page}
            className={`sa-pag-btn ${currentPage === page ? "sa-pag-btn--active" : ""}`}
            onClick={() => onPageChange(page)}
            type="button"
          >
            {page}
          </button>
        ))}

        <button
          className="sa-pag-btn sa-pag-arrow"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          type="button"
          aria-label="Siguiente"
        >
          ›
        </button>
      </div>

      <div className="sa-pag-filas">
        <span>Mostrar:</span>
        <div className="sa-pag-select-wrapper">
          <select
            className="sa-pag-select"
            value={itemsPerPage}
            onMouseDown={() => setSelectOpen(true)}
            onBlur={() => setSelectOpen(false)}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
              setSelectOpen(false);
            }}
          >
            {OPCIONES_FILAS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className={`sa-pag-select-icon ${selectOpen ? "sa-pag-select-icon--open" : ""}`}>▾</span>
        </div>
      </div>
    </div>
  );
}

export default SAPagination;
