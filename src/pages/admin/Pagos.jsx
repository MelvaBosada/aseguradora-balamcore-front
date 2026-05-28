import { useState } from 'react';
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import "../../css/ComprobantePago.css";
import TablaForm from "../../components/TablaForm";
import Paginacion from "../../components/Paginacion";

const campos = ["pago", "cliente", "montopagado", "formapago","estatus"];
const columnas = ["N°Pago","Cliente", "MontoPagado", "FormaPago", "Estatus", "Acciones"];

const Pagos = () => {
  const [pagos] = useState([
    { id: 1, pago: "P-2025-000123", indemnizacion: "IND-2026-00004", siniestro: "SIN-2026-00004", cliente: "Juan Bodoque", montopagado: "$10 000", formapago: "Transferencia", fechapago: "01-12-26", estatus: "Procesando" },
    { id: 2, pago: "P-2025-000456", indemnizacion: "IND-2026-50005", siniestro: "SIN-2026-70005", cliente: "Tulio Triviño", montopagado: "$500 000", formapago: "Efectivo", fechapago: "12-05-25", estatus: "Rechazado" },
    { id: 3, pago: "P-2026-000789", indemnizacion: "IND-2026-10006", siniestro: "SIN-2026-50006", cliente: "Juanin Sepalabola", montopagado: "$5", formapago: "Cheque", fechapago: "09-03-25", estatus: "Fallido" },
    { id: 4, pago: "P-2026-001011", indemnizacion: "IND-2026-10707", siniestro: "SIN-2026-00906", cliente: "Mario Hugo", montopagado: "$5", formapago: "Efectivo", fechapago: "10-10-25", estatus: "Activo" },
    { id: 5, pago: "P-2026-001012", indemnizacion: "IND-2026-10708", siniestro: "SIN-2026-00907", cliente: "Guaripolo", montopagado: "$8 000", formapago: "Transferencia", fechapago: "11-10-25", estatus: "Pendiente" },
    { id: 6, pago: "P-2026-001013", indemnizacion: "IND-2026-10709", siniestro: "SIN-2026-00908", cliente: "Patana", montopagado: "$12 500", formapago: "Cheque", fechapago: "12-10-25", estatus: "Devuelto" },
    { id: 7, pago: "P-2026-001014", indemnizacion: "IND-2026-10710", siniestro: "SIN-2026-00909", cliente: "Policarpo", montopagado: "$20 000", formapago: "Efectivo", fechapago: "13-10-25", estatus: "Cancelado" },
    { id: 8, pago: "P-2026-001015", indemnizacion: "IND-2026-10711", siniestro: "SIN-2026-00910", cliente: "Señor Cuadro", montopagado: "$50 000", formapago: "Transferencia", fechapago: "14-10-25", estatus: "Activo" },
    { id: 9, pago: "P-2026-001016", indemnizacion: "IND-2026-10712", siniestro: "SIN-2026-00911", cliente: "Mario Hugo", montopagado: "$5", formapago: "Efectivo", fechapago: "15-10-25", estatus: "Procesando" },
    { id: 10, pago: "P-2026-001017", indemnizacion: "IND-2026-10713", siniestro: "SIN-2026-00912", cliente: "Juanin Sepalabola", montopagado: "$100", formapago: "Cheque", fechapago: "16-10-25", estatus: "Pendiente" },
    { id: 11, pago: "P-2026-001018", indemnizacion: "IND-2026-10714", siniestro: "SIN-2026-00913", cliente: "Tulio Triviño", montopagado: "$75 000", formapago: "Efectivo", fechapago: "17-10-25", estatus: "Activo" },
    { id: 12, pago: "P-2026-001019", indemnizacion: "IND-2026-10715", siniestro: "SIN-2026-00914", cliente: "Guaripolo", montopagado: "$2 500", formapago: "Transferencia", fechapago: "18-10-25", estatus: "Rechazado" },
    { id: 13, pago: "P-2026-001020", indemnizacion: "IND-2026-10716", siniestro: "SIN-2026-00915", cliente: "Patana", montopagado: "$15 000", formapago: "Cheque", fechapago: "19-10-25", estatus: "Procesando" },
    { id: 14, pago: "P-2026-001021", indemnizacion: "IND-2026-10717", siniestro: "SIN-2026-00916", cliente: "Policarpo", montopagado: "$30 000", formapago: "Efectivo", fechapago: "20-10-25", estatus: "Fallido" },
    { id: 15, pago: "P-2026-001022", indemnizacion: "IND-2026-10718", siniestro: "SIN-2026-00917", cliente: "Señor Cuadro", montopagado: "$60 000", formapago: "Transferencia", fechapago: "21-10-25", estatus: "Cancelado" },
    { id: 16, pago: "P-2026-001023", indemnizacion: "IND-2026-10719", siniestro: "SIN-2026-00918", cliente: "Mario Hugo", montopagado: "$5", formapago: "Efectivo", fechapago: "22-10-25", estatus: "Devuelto" },
    { id: 17, pago: "P-2026-001024", indemnizacion: "IND-2026-10720", siniestro: "SIN-2026-00919", cliente: "Juan Bodoque", montopagado: "$9 000", formapago: "Cheque", fechapago: "23-10-25", estatus: "Activo" },
    { id: 18, pago: "P-2026-001025", indemnizacion: "IND-2026-10721", siniestro: "SIN-2026-00920", cliente: "Tulio Triviño", montopagado: "$25 000", formapago: "Transferencia", fechapago: "24-10-25", estatus: "Pendiente" },
    { id: 19, pago: "P-2026-001026", indemnizacion: "IND-2026-10722", siniestro: "SIN-2026-00921", cliente: "Patana", montopagado: "$8 000", formapago: "Cheque", fechapago: "25-10-25", estatus: "Rechazado" },
    { id: 20, pago: "P-2026-001027", indemnizacion: "IND-2026-10723", siniestro: "SIN-2026-00922", cliente: "Policarpo", montopagado: "$30 000", formapago: "Efectivo", fechapago: "26-10-25", estatus: "Procesando" }
  ]);

  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [estatus, setEstatus] = useState("Todos");

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const handleVerDetalle = (c) => { setClienteDetalle(c); setShowDetalleModal(true); };
  const handleEstatus = (e) => { setEstatus(e.target.value); setCurrentPage(1); };

  const filteredPagos = pagos.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchSearch = c.pago.toLowerCase().includes(q) || c.indemnizacion.toLowerCase().includes(q) || c.siniestro.toLowerCase().includes(q) || c.cliente.toLowerCase().includes(q) || c.montopagado.toLowerCase().includes(q) || c.formapago.toLowerCase().includes(q) || c.fechapago.toLowerCase().includes(q);
    const matchEstatus = estatus === "Todos" || c.estatus === estatus;
    return matchSearch && matchEstatus;
  });

  const totalPages = Math.ceil(filteredPagos.length / itemsPerPage);
  const paginated = filteredPagos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div className="container py-4">
        <h1 className="h2 fw-bold mb-3">Listado de Pagos</h1>
        <hr className="mt-2 mb-3" />
        <div className="pv-toolbar">
          <div className="pv-field">
              <div className="fw-bold mb-2">Búsqueda</div>
            <div className="pv-search-wrapper">
              <SearchIcon />
              <input type="text" className="pv-search" placeholder="Buscar número de evaluación" value={searchTerm} onChange={handleSearch} />
            </div>
          </div>
          <div className="pv-field">
              <div className="fw-bold mb-2">Estatus</div>
            <select className="form-select" value={estatus} onChange={handleEstatus}>
              {["Todos", "Activo", "Pendiente", "Rechazado", "Procesando", "Cancelado", "Devuelto", "Fallido"].map((o) => (<option key={o} value={o}>{o}</option>))}
            </select>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <TablaForm columna={columnas} data={paginated} campos={campos} acciones={[{ titulo: "Ver", clase: "tabla-btn-ver", icono: <VisibilityIcon fontSize="small" />, onClick: handleVerDetalle }]} />
      </div>
      <Paginacion currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} />

      {/* Modal tipo Comprobante ocupando toda la pantalla */}
      {showDetalleModal && clienteDetalle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="comprobante-modal bg-white p-4 rounded shadow">
            <div className="comprobante-header">
              <h5 className="fw-bold">Detalle de Pago</h5>
              <button className="btn-close" onClick={() => setShowDetalleModal(false)}></button>
            </div>
            <div className="comprobante-body">
              {[
                { label: "N° Pago", value: clienteDetalle.pago },
                { label: "N° Indemnización", value: clienteDetalle.indemnizacion },
                { label: "Cliente", value: clienteDetalle.cliente },
                { label: "Forma de Pago", value: clienteDetalle.formapago },
                { label: "Fecha", value: clienteDetalle.fechapago },
                { label: "Monto", value: clienteDetalle.montopagado, isMonto: true },
                { label: "Estatus", value: clienteDetalle.estatus, isEstatus: true }
              ].map((item, i) => (
                <div key={i} className="comprobante-row">
                  <span className="label">{item.label}</span>
                  <span className={`value ${item.isMonto ? 'monto' : ''} ${item.isEstatus ? `estatus ${clienteDetalle.estatus.toLowerCase()}` : ''}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default Pagos; 