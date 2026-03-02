import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "../css/Paginacion.css";

const Paginacion = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  return (
    <div className="paginacion">
      <button
        className="pag-btn pag-arrow"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeftIcon fontSize="small" />
      </button>

      {pages.map((page) => (
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
  );
};

export default Paginacion;
