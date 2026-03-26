import { useState } from "react";
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import "../css/Paginacion.css";

const OPCIONES_FILAS = [5, 8, 10, 15, 20, 50, 100, 200];

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

const Paginacion = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }) => {
  const [selectOpen, setSelectOpen] = useState(false);
  const pageRange = getPageRange(currentPage, totalPages);

  return (
    <div className="paginacion-wrapper">
      <div className="paginacion">
        <button className="pag-btn pag-arrow" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ArrowLeftIcon fontSize="small" />
        </button>

        {pageRange.map((page) => (
          <button
            key={page}
            className={`pag-btn ${currentPage === page ? "active" : ""}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        <button className="pag-btn pag-arrow" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          <ArrowRightIcon fontSize="small" />
        </button>
      </div>

      <div className="paginacion-filas">
        <span>Mostrar:</span>
        <div className="pag-select-wrapper">
          <select
            className="pag-select"
            value={itemsPerPage}
            onMouseDown={() => setSelectOpen(true)}
            onBlur={() => setSelectOpen(false)}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
              setSelectOpen(false);
            }}
          >
            {OPCIONES_FILAS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <ArrowDropDownIcon
            className="pag-select-icon"
            style={{ transform: selectOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </div>
      </div>
    </div>
  );
};

export default Paginacion;