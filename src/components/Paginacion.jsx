import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "../css/Paginacion.css";

const OPCIONES_FILAS = [5, 8, 10, 15, 20, 50, 100, 200];

const Paginacion = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }) => {
  return (
    <div className="paginacion-wrapper">

      <div className="paginacion-filas">
        <span>Filas por página:</span>
        <select
          className="pag-select"
          value={itemsPerPage}
          onChange={(e) => {
            onItemsPerPageChange(Number(e.target.value));
            onPageChange(1); // reset a página 1
          }}
        >
          {OPCIONES_FILAS.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {totalPages > 1 && (
        <div className="paginacion">
          <button
            className="pag-btn pag-arrow"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeftIcon fontSize="small" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`pag-btn ${currentPage === page ? "active" : ""}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="pag-btn pag-arrow"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRightIcon fontSize="small" />
          </button>
        </div>
      )}

    </div>
  );
};

export default Paginacion;