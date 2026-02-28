import { useState } from "react";
import SearchIcon       from "@mui/icons-material/Search";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon     from "@mui/icons-material/Download";
import CloseIcon        from "@mui/icons-material/Close";
import Snackbar         from "@mui/material/Snackbar";
import Alert            from "@mui/material/Alert";
import TablaForm        from "../../components/TablaForm";
import Paginacion       from "../../components/Paginacion";
import IndemnizacionDocumento from "../../components/IndemnizacionDocumento";
import usePDFExport     from "../../components/usePDFExport";
import "../../css/PolizasVencer.css";
import "../../css/IndemnizacionPDF.css";

/* ─── ARRAY DE DATOS (definido en la propia vista) ───────────────── */
const indemnizaciones = [
  {
    id: 1,
    nSiniestro:        "SIN-2025-000123",
    montoAprobado:     "$50,000",
    formaPago:         "Transferencia",
    titularCuenta:     "Juan Méndez",
    nEvaluacion:       "EVA-2025-000123",
    fechaPago:         "12-03-2025",
    numeroCuenta:      "SPEI-8839 201",
    estatus:           "Activo",
    // Campos del documento PDF
    aseguradora:       "Aseguradora Integral del Sureste S.A. de C.V.",
    nPoliza:           "POL-2026-000146",
    fechaEmision:      "23 de mayo de 2026",
    nombreAsegurado:   "María Ana López García",
    rfc:               "LOGM520514KJ2",
    domicilio:         "Av. Reforma No. 456, Col. Centro, Mérida, Yucatán",
    telefono:          "999 456 7890",
    correo:            "maria.lopez@ejemplo.com",
    nEvaluacionPDF:    "EVA-2026-000178",
    ajustador:         "Carlos Hernández Pérez",
    fechaEvaluacion:   "20 de mayo de 2026",
    resultadoEval:     "El siniestro cumple con las condiciones generales y particulares de la póliza; los bienes reclamados se encuentran debidamente asegurados y el evento es procedente.",
    prioridad:         "Baja",
    banco:             "BBVA",
    titularBanco:      "María Ana López García",
    cuentaBancaria:    "**** **** **** 4521",
    fechaAutorizacion: "22 de mayo de 2026",
    fechaPagoPDF:      "25 de mayo de 2026",
    referencia:        "SPEI-88924307",
    tipoSiniestro:     "Robo",
    fechaOcurrencia:   "18 de mayo de 2026",
    ubicacion:         "Domicilio del asegurado",
    descripcion:       "El asegurado reporta el robo de bienes asegurados ocurrido dentro del domicilio, en presencia del asegurado al momento del evento. El hecho fue denunciado ante las autoridades correspondientes.",
    montoReclamado:    "$35,000.00 MXN",
    montoAprobadoPDF:  "$30,000.00 MXN",
    deducible:         "$5,000.00 MXN",
    montoTotal:        "$30,000.00 MXN (Treinta mil pesos 00/100 M.N.)",
    estatusPDF:        "Pagada",
  },
  {
    id: 2,
    nSiniestro:        "SIN-2026-000003",
    montoAprobado:     "$80,000",
    formaPago:         "Efectivo",
    titularCuenta:     "Angel Real",
    nEvaluacion:       "EVA-2025-000123",
    fechaPago:         "12-04-2025",
    numeroCuenta:      "SPEI-8839 201",
    estatus:           "Activo",
    aseguradora:       "Aseguradora Integral del Sureste S.A. de C.V.",
    nPoliza:           "POL-2026-000200",
    fechaEmision:      "10 de abril de 2026",
    nombreAsegurado:   "Angel Real Torres",
    rfc:               "RETA900101AB1",
    domicilio:         "Calle 60 No. 100, Col. Centro, Mérida, Yucatán",
    telefono:          "999 111 2222",
    correo:            "angel.real@ejemplo.com",
    nEvaluacionPDF:    "EVA-2026-000200",
    ajustador:         "Laura Pérez González",
    fechaEvaluacion:   "8 de abril de 2026",
    resultadoEval:     "El siniestro es procedente conforme a las condiciones de la póliza.",
    prioridad:         "Media",
    banco:             "Banamex",
    titularBanco:      "Angel Real Torres",
    cuentaBancaria:    "**** **** **** 9988",
    fechaAutorizacion: "9 de abril de 2026",
    fechaPagoPDF:      "10 de abril de 2026",
    referencia:        "EFE-00291837",
    tipoSiniestro:     "Daños por inundación",
    fechaOcurrencia:   "5 de abril de 2026",
    ubicacion:         "Domicilio del asegurado",
    descripcion:       "Inundación severa que dañó mobiliario y enseres del hogar asegurado.",
    montoReclamado:    "$85,000.00 MXN",
    montoAprobadoPDF:  "$80,000.00 MXN",
    deducible:         "$5,000.00 MXN",
    montoTotal:        "$80,000.00 MXN (Ochenta mil pesos 00/100 M.N.)",
    estatusPDF:        "Pagada",
  },
  {
    id: 3,
    nSiniestro:        "SIN-2026-000004",
    montoAprobado:     "$80,000",
    formaPago:         "Transferencia",
    titularCuenta:     "Maria Ana",
    nEvaluacion:       "EVA-2025-000133",
    fechaPago:         "22-05-2025",
    numeroCuenta:      "SPEI-8839 201",
    estatus:           "Pendiente",
    aseguradora:       "Aseguradora Integral del Sureste S.A. de C.V.",
    nPoliza:           "POL-2026-000301",
    fechaEmision:      "20 de mayo de 2026",
    nombreAsegurado:   "Maria Ana Ruiz López",
    rfc:               "RULM850202CD3",
    domicilio:         "Av. Itzáes No. 200, Col. García Ginerés, Mérida, Yucatán",
    telefono:          "999 333 4444",
    correo:            "maria.ana@ejemplo.com",
    nEvaluacionPDF:    "EVA-2026-000301",
    ajustador:         "Roberto Díaz Mena",
    fechaEvaluacion:   "18 de mayo de 2026",
    resultadoEval:     "Siniestro procedente. Daños eléctricos confirmados por perito.",
    prioridad:         "Alta",
    banco:             "HSBC",
    titularBanco:      "Maria Ana Ruiz López",
    cuentaBancaria:    "**** **** **** 1234",
    fechaAutorizacion: "19 de mayo de 2026",
    fechaPagoPDF:      "22 de mayo de 2026",
    referencia:        "SPEI-77651234",
    tipoSiniestro:     "Daños eléctricos",
    fechaOcurrencia:   "15 de mayo de 2026",
    ubicacion:         "Domicilio del asegurado",
    descripcion:       "Cortocircuito provocó daños en equipos electrónicos y electrodomésticos del hogar.",
    montoReclamado:    "$82,000.00 MXN",
    montoAprobadoPDF:  "$80,000.00 MXN",
    deducible:         "$2,000.00 MXN",
    montoTotal:        "$80,000.00 MXN (Ochenta mil pesos 00/100 M.N.)",
    estatusPDF:        "Pagada",
  },
];

/* ─── CONFIG TABLA ───────────────────────────────────────────────── */
const ITEMS_PER_PAGE  = 8;
const ESTATUS_OPTIONS = ["Todos", "Activo", "Pagado", "Pendiente", "Rechazado"];

const campos   = ["nSiniestro", "montoAprobado", "formaPago", "titularCuenta", "nEvaluacion", "fechaPago", "numeroCuenta", "estatus"];
const columnas = ["N° Siniestro", "Monto aprobado", "Forma de pago", "Titular de la cuenta", "N° Evaluación", "Fecha de pago", "Número de cuenta", "Estatus", "Acciones"];

/* ─── VISTA ──────────────────────────────────────────────────────── */
const Indemnizaciones = () => {
  const [search,      setSearch]      = useState("");
  const [estatus,     setEstatus]     = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal: qué registro está activo para ver PDF
  const [modalData, setModalData] = useState(null);

  // Hook reutilizable de exportación PDF
  const { printRef, snack, setSnack, handleDescargar } = usePDFExport(
    modalData ? `Indemnizacion_${modalData.nSiniestro}` : "Indemnizacion"
  );

  /* ── Filtro ── */
  const filtered = indemnizaciones.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.nSiniestro.toLowerCase().includes(q)    ||
      p.titularCuenta.toLowerCase().includes(q) ||
      p.formaPago.toLowerCase().includes(q)     ||
      p.nEvaluacion.toLowerCase().includes(q);
    const matchEstatus = estatus === "Todos" || p.estatus === estatus;
    return matchSearch && matchEstatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch  = (e) => { setSearch(e.target.value);  setCurrentPage(1); };
  const handleEstatus = (e) => { setEstatus(e.target.value); setCurrentPage(1); };

  /* ── Acciones de tabla ── */
  const handleVerPDF      = (fila) => setModalData(fila);
  const handleDescargarPDF = (fila) => {
    // Si el modal está abierto con otro registro, primero actualizamos
    setModalData(fila);
    // Pequeño timeout para que el ref se monte con el nuevo data
    setTimeout(() => handleDescargar(), 100);
  };

  return (
    <div className="pv-page">
      <div className="pv-page-header"><h1>Indemnización</h1></div>

      {/* TOOLBAR */}
      <div className="pv-toolbar">
        <div className="pv-field">
          <label>Búsqueda</label>
          <div className="pv-search-wrapper">
            <SearchIcon />
            <input
              type="text"
              className="pv-search"
              placeholder="Buscar número de indemnización..."
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>
        <div className="pv-field">
          <label>Estatus</label>
          <select className="pv-select" value={estatus} onChange={handleEstatus}>
            {ESTATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* TABLA */}
      <TablaForm
        columna={columnas}
        data={paginated}
        campos={campos}
        acciones={[
          {
            titulo: "Ver PDF",
            clase: "tabla-btn-ver",
            icono: <PictureAsPdfIcon fontSize="small" />,
            onClick: handleVerPDF,
          },
          {
            titulo: "Descargar PDF",
            clase: "tabla-btn-descargar",
            icono: <DownloadIcon fontSize="small" />,
            onClick: handleDescargarPDF,
          },
        ]}
      />

      <Paginacion
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* MODAL: Ver PDF */}
      {modalData && (
        <div className="ipdf-modal-overlay" onClick={() => setModalData(null)}>
          <div className="ipdf-modal" onClick={(e) => e.stopPropagation()}>

            {/* Toolbar del modal */}
            <div className="ipdf-toolbar">
              <button className="ipdf-back" onClick={() => setModalData(null)}>
                <CloseIcon fontSize="small" /> Cerrar
              </button>
              <button className="ipdf-download" onClick={handleDescargar}>
                <DownloadIcon fontSize="small" /> Descargar PDF
              </button>
            </div>

            {/* Documento reutilizable */}
            <div className="ipdf-wrapper">
              <IndemnizacionDocumento data={modalData} printRef={printRef} />
            </div>

          </div>
        </div>
      )}

      {/* Snackbar de confirmación */}
      <Snackbar
        open={snack}
        autoHideDuration={2500}
        onClose={() => setSnack(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSnack(false)}>
          PDF descargado exitosamente
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Indemnizaciones;
