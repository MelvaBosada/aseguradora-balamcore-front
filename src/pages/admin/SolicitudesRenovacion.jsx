// pages/admin/SolicitudesRenovacion.jsx
import { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import SearchIcon    from "@mui/icons-material/Search";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import Snackbar      from "@mui/material/Snackbar";
import Alert         from "@mui/material/Alert";
import FilterListIcon from "@mui/icons-material/FilterList";

import TablaForm          from "../../components/TablaForm";
import Paginacion         from "../../components/Paginacion";
import RenovarPolizaModal from "../../components/RenovarPolizaModal";

import "../../css/PolizasVencer.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const campos   = ["nPoliza", "nombre", "apellido", "tipo", "vigencia", "vence", "asesor", "estatus"];
const columnas = ["N° Póliza", "Nombre", "Apellido(s)", "Tipo", "Vigencia", "Vence", "Asesor", "Estatus", "Acciones"];

const CAMPOS_RENOVAR = [
  { label: "Fecha de inicio", name: "fecha_inicio",   type: "date"   },
  { label: "Fecha de fin",     name: "fecha_fin",     type: "date"   },
  { label: "Forma de pago",    name: "forma_pago",    type: "select", options: ["contado", "mensual", "trimestral", "semestral", "anual"] },
  { label: "Suma asegurada",   name: "suma_asegurada", type: "number", placeholder: "Ingresa la suma del seguro"    },
  { label: "Prima neta",       name: "prima_neta",     type: "number", placeholder: "Ingresa la prima neta" },
  { label: "Derecho de póliza",name: "derecho_poliza", type: "number", placeholder: "Ingresa el derecho de póliza" },
  { label: "IVA",              name: "iva",            type: "number", placeholder: "Ingresa el IVA" },
  { label: "Prima total",      name: "prima_total",    type: "number", placeholder: "Ingresa el monto total", readOnly: true },
  { label: "Observaciones",    name: "observaciones",  type: "textarea", placeholder: "Observaciones de la renovación" }
];

const FORM_VACIO = {
  fecha_inicio: "",
  fecha_fin: "",
  forma_pago: "",
  suma_asegurada: "",
  prima_neta: "",
  derecho_poliza: "",
  iva: "",
  prima_total: "",
  observaciones: ""
};

const SolicitudesRenovacion = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detallePoliza, setDetallePoliza] = useState(null);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [estatusFilter, setEstatusFilter] = useState("Todos");
  const [formData, setFormData] = useState(FORM_VACIO);

  // ✅ CORRECCIÓN: useCallback con las mismas deps que el useEffect original
  const cargarSolicitudes = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/renovaciones`, {
        params: { 
          page: currentPage, 
          search: search, 
          per_page: itemsPerPage,
          estatus: estatusFilter 
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSolicitudes(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, itemsPerPage, estatusFilter]);

  // ✅ CORRECCIÓN: cargarSolicitudes incluida en el array de dependencias
  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  const cargarDetallePoliza = async (polizaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/renovaciones/poliza/${polizaId}/detalle`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      setDetallePoliza(data);
      
      if (data.sugerencia) {
        setFormData({
          fecha_inicio: data.sugerencia.fecha_inicio,
          fecha_fin: data.sugerencia.fecha_fin,
          forma_pago: data.sugerencia.forma_pago,
          suma_asegurada: data.sugerencia.suma_asegurada,
          prima_neta: data.sugerencia.prima_neta,
          derecho_poliza: data.sugerencia.derecho_poliza,
          iva: data.sugerencia.iva,
          prima_total: data.sugerencia.prima_total,
          observaciones: ""
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const handleSearch = (e) => { 
    setSearch(e.target.value); 
    setCurrentPage(1); 
  };

  const handleRenovar = async (poliza) => {
    setSelected(poliza);
    await cargarDetallePoliza(poliza.id);
    setModalOpen(true);
  };

  const calcularPrimaTotal = () => {
    const neta = parseFloat(formData.prima_neta) || 0;
    const derecho = parseFloat(formData.derecho_poliza) || 0;
    const iva = parseFloat(formData.iva) || 0;
    const total = neta + derecho + iva;
    setFormData(prev => ({ ...prev, prima_total: total.toFixed(2) }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (['prima_neta', 'derecho_poliza', 'iva'].includes(name)) {
      setTimeout(calcularPrimaTotal, 0);
    }
  };

  const handleConfirmRenovar = async () => {
    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        id_poliza_anterior: selected.id,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        suma_asegurada: formData.suma_asegurada,
        prima_neta: formData.prima_neta,
        derecho_poliza: formData.derecho_poliza,
        iva: formData.iva,
        prima_total: formData.prima_total,
        forma_pago: formData.forma_pago,
        observaciones: formData.observaciones
      };
      
      await axios.post(`${API_URL}/renovaciones`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setModalOpen(false);
      setSnackMessage("Póliza renovada exitosamente");
      setSnackSeverity("success");
      setSnackOpen(true);
      cargarSolicitudes();
      setFormData(FORM_VACIO);
      setDetallePoliza(null);
      
    } catch (error) {
      console.error('Error:', error);
      setSnackMessage(error.response?.data?.message || "Error al renovar la póliza");
      setSnackSeverity("error");
      setSnackOpen(true);
    }
  };

  if (loading && solicitudes.length === 0) {
    return <div className="container py-4"><div className="text-center py-5"><div className="spinner-border text-success"></div><p>Cargando solicitudes...</p></div></div>;
  }

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Solicitudes de renovación de pólizas</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div className="pv-field">
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="pv-search-wrapper">
            <SearchIcon />
            <input type="text" className="pv-search" placeholder="Buscar póliza..."
              value={search} onChange={handleSearch} />
          </div>
        </div>

        <div>
          <div className="fw-bold mb-2">Filtrar por estado</div>
          <div className="d-flex align-items-center gap-2">
            <FilterListIcon style={{ color: '#6B7280' }} />
            <select 
              className="form-select" 
              style={{ width: "180px" }} 
              value={estatusFilter} 
              onChange={(e) => {
                setEstatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="Todos">Todos</option>
              <option value="Por vencer">Por vencer</option>
              <option value="Urgente">Urgente</option>
              <option value="Vencida">Vencidas</option>
            </select>
          </div>
        </div>
      </div>

      <TablaForm
        columna={columnas} data={solicitudes} campos={campos}
        acciones={[
          { 
            titulo: "Renovar", 
            clase: "tabla-btn-edit", 
            icono: <AutorenewIcon fontSize="small" />, 
            onClick: handleRenovar 
          },
        ]}
      />

      <Paginacion
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      <RenovarPolizaModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setDetallePoliza(null);
          setFormData(FORM_VACIO);
        }}
        onRenovar={handleConfirmRenovar}
        poliza={selected}
        detallePoliza={detallePoliza}
        formData={formData}
        onInputChange={handleInputChange}
        camposNuevos={CAMPOS_RENOVAR}
      />

      <Snackbar open={snackOpen} autoHideDuration={2500} onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snackSeverity} variant="filled" onClose={() => setSnackOpen(false)}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default SolicitudesRenovacion;
