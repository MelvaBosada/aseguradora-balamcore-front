// pages/admin/Polizas.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../css/Clientes.css';

import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import DateRangeIcon from "@mui/icons-material/DateRange";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PaymentIcon from "@mui/icons-material/Payment";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import NotesIcon from "@mui/icons-material/Notes";
import InfoIcon from "@mui/icons-material/Info";
import HomeIcon from "@mui/icons-material/Home";
import CarIcon from "@mui/icons-material/DirectionsCar";
import ComputerIcon from "@mui/icons-material/Computer";
import BuildIcon from "@mui/icons-material/Build";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import Paginacion from "../../components/Paginacion";
import PolizaDetalleModal from "../../components/PolizaDetalleModal";

const API_URL = import.meta.env.VITE_API_URL || '/api';

const campos = ["nPoliza", "cliente", "estatus"];
const columnas = ["N° Póliza", "Cliente", "Estatus", "Acciones"];

const FORM_CAMPOS = [
  { label: "RFC del Cliente", name: "rfc_buscar", type: "text", seccion: "Buscar Cliente", fullWidth: true },
  { label: "ID Cliente", name: "id_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "Nombre del cliente", name: "nombre_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "Correo", name: "correo_cliente", type: "email", seccion: "Información del Cliente", readOnly: true },
  { label: "Teléfono", name: "telefono_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "Domicilio", name: "domicilio_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "CURP", name: "curp_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "N° PÓLIZA", name: "numero_poliza", type: "text", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "TIPO DE PÓLIZA", name: "tipo", type: "select", options: ["vida", "gastos_medicos", "autos", "hogar", "empresarial", "responsabilidad_civil", "otro"], seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "FECHA DE INICIO", name: "fecha_inicio", type: "date", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "FECHA DE FIN", name: "fecha_fin", type: "date", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "SUMA ASEGURADA", name: "suma_asegurada", type: "number", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "PRIMA NETA", name: "prima_neta", type: "number", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "DERECHO DE PÓLIZA", name: "derecho_poliza", type: "number", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "IVA", name: "iva", type: "number", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "PRIMA TOTAL", name: "prima_total", type: "number", seccion: "DATOS DE LA PÓLIZA", required: true, readOnly: true },
  { label: "FORMA DE PAGO", name: "forma_pago", type: "select", options: ["contado", "mensual", "trimestral", "semestral", "anual"], seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "OBSERVACIONES", name: "observaciones", type: "textarea", seccion: "DATOS DE LA PÓLIZA" },
];

const FORM_VACIO = {
  rfc_buscar: "", id_cliente: "", nombre_cliente: "", correo_cliente: "", telefono_cliente: "",
  domicilio_cliente: "", curp_cliente: "", numero_poliza: "", tipo: "", fecha_inicio: "", fecha_fin: "",
  suma_asegurada: "", prima_neta: "", derecho_poliza: "", iva: "", prima_total: "", forma_pago: "", observaciones: "",
  bienes_seleccionados: [],
  precios_bienes: {}
};

const Polizas = () => {
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [polizaToDelete, setPolizaToDelete] = useState(null);
  const [polizaDetalle, setPolizaDetalle] = useState(null);
  const [editingPoliza, setEditingPoliza] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [estatusFilter, setEstatusFilter] = useState("Todos");
  const [totalPages, setTotalPages] = useState(1);
  const [buscarRfcTimer, setBuscarRfcTimer] = useState(null);
  const [bienesCliente, setBienesCliente] = useState([]);
  const [cargandoBienes, setCargandoBienes] = useState(false);
  const [coberturas, setCoberturas] = useState([]);
  const [erroresBienes, setErroresBienes] = useState({});

  // Cargar coberturas al iniciar
  useEffect(() => {
    cargarCoberturas();
  }, []);

  const cargarCoberturas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/coberturas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoberturas(response.data);
    } catch (error) {
      console.error('Error al cargar coberturas:', error);
    }
  };

  // ✅ CORRECCIÓN 3: useCallback con las mismas deps que el useEffect original
  const cargarPolizas = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/polizas`, {
        params: { page: currentPage, search: searchTerm, estatus: estatusFilter, per_page: itemsPerPage },
        headers: { Authorization: `Bearer ${token}` }
      });
      setPolizas(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, estatusFilter, itemsPerPage]);

  // ✅ CORRECCIÓN 3: cargarPolizas incluida en el array de dependencias
  useEffect(() => {
    cargarPolizas();
  }, [cargarPolizas]);

  // ✅ CORRECCIÓN 2: eliminado el parámetro polizaTipo que no se usaba
  const obtenerCoberturaParaBien = (bienTipo) => {
    const mapeoCoberturas = {
      'vehiculo': ['Daños Materiales', 'Robo Total', 'Robo Parcial', 'Responsabilidad Civil', 'Gastos Médicos Ocupantes'],
      'inmueble': ['Incendio y Explosión', 'Fenómenos Naturales', 'Responsabilidad Civil'],
      'electronico': ['Robo Parcial', 'Daños Materiales'],
      'maquinaria': ['Daños Materiales', 'Incendio y Explosión']
    };

    const nombresCobertura = mapeoCoberturas[bienTipo] || ['Daños Materiales'];
    return coberturas.filter(c => nombresCobertura.includes(c.nombre) && c.estatus === 'activa');
  };

  const validarValorBien = (valor, cobertura) => {
    if (!cobertura) return { valido: true, mensaje: '' };
    
    const montoMinimo = cobertura.monto_minimo;
    const montoMaximo = cobertura.monto_maximo;
    
    if (montoMinimo !== null && valor < montoMinimo) {
      return { 
        valido: false, 
        mensaje: `El valor ($${valor.toLocaleString()}) es menor al mínimo permitido ($${montoMinimo.toLocaleString()}) para la cobertura ${cobertura.nombre}`
      };
    }
    
    if (montoMaximo !== null && valor > montoMaximo) {
      return { 
        valido: false, 
        mensaje: `El valor ($${valor.toLocaleString()}) excede el máximo permitido ($${montoMaximo.toLocaleString()}) para la cobertura ${cobertura.nombre}`
      };
    }
    
    return { valido: true, mensaje: '' };
  };

  const calcularPrimaTotalDesdeBienes = (preciosBienes, bienesSeleccionados) => {
    let sumaTotal = 0;
    bienesSeleccionados.forEach(bienId => {
      const precio = parseFloat(preciosBienes[bienId]) || 0;
      sumaTotal += precio;
    });
    return sumaTotal;
  };

  const actualizarPrimaTotal = (preciosBienes, bienesSeleccionados) => {
    const sumaBienes = calcularPrimaTotalDesdeBienes(preciosBienes, bienesSeleccionados);
    const neta = parseFloat(formData.prima_neta) || 0;
    const derecho = parseFloat(formData.derecho_poliza) || 0;
    const iva = parseFloat(formData.iva) || 0;
    const total = sumaBienes + neta + derecho + iva;
    setFormData(prev => ({ ...prev, prima_total: total.toFixed(2) }));
  };

  // ✅ CORRECCIÓN 2: llamada actualizada sin el segundo argumento polizaTipo
  const validarBienesSeleccionados = async (bienesIds, polizaTipo, preciosBienes) => {
    const nuevosErrores = {};
    let todoValido = true;
    
    for (const bienId of bienesIds) {
      const bien = bienesCliente.find(b => b.id === bienId);
      if (bien) {
        const precio = parseFloat(preciosBienes?.[bienId]) || parseFloat(bien.valor) || 0;
        // ✅ CORRECCIÓN 2: solo se pasa bienTipo
        const coberturasDisponibles = obtenerCoberturaParaBien(bien.tipo);
        
        if (coberturasDisponibles.length === 0) {
          nuevosErrores[bienId] = `No hay coberturas disponibles para el tipo de bien: ${bien.tipo}`;
          todoValido = false;
        } else {
          const validacion = validarValorBien(precio, coberturasDisponibles[0]);
          if (!validacion.valido) {
            nuevosErrores[bienId] = validacion.mensaje;
            todoValido = false;
          }
        }
      }
    }
    
    setErroresBienes(nuevosErrores);
    return todoValido;
  };

  const cargarBienesPorClienteId = async (clienteId) => {
    if (!clienteId) return;
    
    setCargandoBienes(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/bienes/cliente/${clienteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBienesCliente(response.data);
      return response.data;
    } catch (error) {
      console.error('Error al cargar bienes:', error);
      setBienesCliente([]);
      return [];
    } finally {
      setCargandoBienes(false);
    }
  };

  const buscarClientePorRfc = async (rfc) => {
    if (!rfc || rfc.length < 8) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/polizas/buscar-ultima-por-rfc`, { 
        params: { rfc }, 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const data = response.data;
      const cliente = data.cliente;
      
      const bienes = await cargarBienesPorClienteId(cliente.id);
      
      const preciosIniciales = {};
      bienes.forEach(bien => {
        preciosIniciales[bien.id] = bien.valor || 0;
      });
      
      if (data.tienePoliza) {
        const ultimaPoliza = data.ultimaPoliza;
        
        setFormData(prev => ({
          ...prev,
          id_cliente: cliente.id,
          nombre_cliente: `${cliente.nombre} ${cliente.apellido}`,
          correo_cliente: cliente.correo || "",
          telefono_cliente: cliente.telefono || "",
          domicilio_cliente: cliente.domicilio || "",
          curp_cliente: cliente.curp || "",
          numero_poliza: ultimaPoliza.numero_poliza,
          tipo: ultimaPoliza.tipo,
          suma_asegurada: ultimaPoliza.suma_asegurada,
          prima_neta: ultimaPoliza.prima_neta,
          derecho_poliza: ultimaPoliza.derecho_poliza,
          iva: ultimaPoliza.iva,
          prima_total: ultimaPoliza.prima_total,
          forma_pago: ultimaPoliza.forma_pago,
          observaciones: ultimaPoliza.observaciones || "",
          fecha_inicio: new Date().toISOString().split('T')[0],
          fecha_fin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          bienes_seleccionados: [],
          precios_bienes: preciosIniciales
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          id_cliente: cliente.id,
          nombre_cliente: `${cliente.nombre} ${cliente.apellido}`,
          correo_cliente: cliente.correo || "",
          telefono_cliente: cliente.telefono || "",
          domicilio_cliente: cliente.domicilio || "",
          curp_cliente: cliente.curp || "",
          numero_poliza: "",
          tipo: "",
          suma_asegurada: "",
          prima_neta: "",
          derecho_poliza: "",
          iva: "",
          prima_total: "",
          forma_pago: "",
          observaciones: "",
          fecha_inicio: "",
          fecha_fin: "",
          bienes_seleccionados: [],
          precios_bienes: preciosIniciales
        }));
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setFormData(prev => ({ ...prev, nombre_cliente: "Cliente no encontrado" }));
        setBienesCliente([]);
      }
    }
  };

  const handleSeleccionarBien = async (bienId) => {
    const seleccionados = [...formData.bienes_seleccionados];
    const index = seleccionados.indexOf(bienId);
    let nuevosSeleccionados;
    
    if (index === -1) {
      nuevosSeleccionados = [...seleccionados, bienId];
    } else {
      nuevosSeleccionados = seleccionados.filter(id => id !== bienId);
    }
    
    setFormData(prev => ({ ...prev, bienes_seleccionados: nuevosSeleccionados }));
    actualizarPrimaTotal(formData.precios_bienes, nuevosSeleccionados);
    
    if (formData.tipo) {
      await validarBienesSeleccionados(nuevosSeleccionados, formData.tipo, formData.precios_bienes);
    }
  };

  const handlePrecioBienChange = (bienId, nuevoPrecio) => {
    const nuevosPrecios = {
      ...formData.precios_bienes,
      [bienId]: parseFloat(nuevoPrecio) || 0
    };
    
    setFormData(prev => ({ ...prev, precios_bienes: nuevosPrecios }));
    actualizarPrimaTotal(nuevosPrecios, formData.bienes_seleccionados);
    
    if (formData.bienes_seleccionados.includes(bienId) && formData.tipo) {
      validarBienesSeleccionados(formData.bienes_seleccionados, formData.tipo, nuevosPrecios);
    }
  };

  const handleRfcChange = (e) => {
    const rfc = e.target.value;
    setFormData(prev => ({ ...prev, rfc_buscar: rfc }));
    if (buscarRfcTimer) clearTimeout(buscarRfcTimer);
    setBuscarRfcTimer(setTimeout(() => buscarClientePorRfc(rfc), 500));
  };

  const calcularPrimaTotal = () => {
    const sumaBienes = calcularPrimaTotalDesdeBienes(formData.precios_bienes, formData.bienes_seleccionados);
    const neta = parseFloat(formData.prima_neta) || 0;
    const derecho = parseFloat(formData.derecho_poliza) || 0;
    const iva = parseFloat(formData.iva) || 0;
    setFormData(prev => ({ ...prev, prima_total: (sumaBienes + neta + derecho + iva).toFixed(2) }));
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (['prima_neta', 'derecho_poliza', 'iva'].includes(name)) {
      setTimeout(calcularPrimaTotal, 0);
    }
    
    if (name === 'tipo' && formData.bienes_seleccionados.length > 0) {
      await validarBienesSeleccionados(formData.bienes_seleccionados, value, formData.precios_bienes);
    }
  };

  const handleNuevaPoliza = () => {
    setEditingPoliza(null);
    setFormData(FORM_VACIO);
    setBienesCliente([]);
    setErroresBienes({});
    setShowModal(true);
  };

  const handleEditar = async (poliza) => {
    setEditingPoliza(poliza);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/polizas/${poliza.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data;
      
      const bienesResponse = await axios.get(`${API_URL}/bienes/cliente/${data.id_cliente}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const bienesAsociados = bienesResponse.data
        .filter(b => b.id_poliza === poliza.id)
        .map(b => b.id);
      
      const preciosIniciales = {};
      bienesResponse.data.forEach(bien => {
        preciosIniciales[bien.id] = bien.valor || 0;
      });
      
      setFormData({
        rfc_buscar: data.cliente_rfc || "",
        id_cliente: data.id_cliente || "",
        nombre_cliente: `${data.cliente_nombre || ''} ${data.cliente_apellido || ''}`.trim(),
        correo_cliente: data.cliente_correo || "",
        telefono_cliente: data.cliente_telefono || "",
        domicilio_cliente: data.cliente_domicilio || "",
        curp_cliente: data.cliente_curp || "",
        numero_poliza: data.nPoliza || "",
        tipo: data.tipo || "",
        fecha_inicio: data.fechaInicio || "",
        fecha_fin: data.fechaFinal || "",
        suma_asegurada: data.sumaAsegurada || "",
        prima_neta: data.prima_neta || "",
        derecho_poliza: data.derecho_poliza || "",
        iva: data.iva || "",
        prima_total: data.prima_total || "",
        forma_pago: data.formaPago || "",
        observaciones: data.observaciones || "",
        bienes_seleccionados: bienesAsociados,
        precios_bienes: preciosIniciales
      });
      
      setBienesCliente(bienesResponse.data);
      setErroresBienes({});
    } catch (error) {
      console.error('Error:', error);
    }
    setShowModal(true);
  };

  const handleGuardar = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!formData.id_cliente) { alert('Primero busca un cliente por RFC'); return; }
      
      if (formData.bienes_seleccionados.length > 0) {
        const esValido = await validarBienesSeleccionados(formData.bienes_seleccionados, formData.tipo, formData.precios_bienes);
        if (!esValido) {
          alert('Hay bienes que no cumplen con los rangos de cobertura. Revisa los errores marcados.');
          return;
        }
      }
      
      const dataToSend = {
        numero_poliza: formData.numero_poliza,
        id_cliente: formData.id_cliente,
        tipo: formData.tipo,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        suma_asegurada: formData.suma_asegurada,
        prima_neta: formData.prima_neta,
        derecho_poliza: formData.derecho_poliza,
        iva: formData.iva,
        prima_total: formData.prima_total,
        forma_pago: formData.forma_pago,
        observaciones: formData.observaciones,
        bienes_ids: formData.bienes_seleccionados,
        precios_bienes: formData.precios_bienes
      };
      
      let polizaId;
      if (editingPoliza) {
        await axios.put(`${API_URL}/polizas/${editingPoliza.id}`, dataToSend, { headers: { Authorization: `Bearer ${token}` } });
        polizaId = editingPoliza.id;
        alert('Póliza actualizada');
      } else {
        const response = await axios.post(`${API_URL}/polizas`, dataToSend, { headers: { Authorization: `Bearer ${token}` } });
        polizaId = response.data.poliza.id;
        alert('Póliza creada');
      }
      
      await axios.post(`${API_URL}/polizas/${polizaId}/asignar-bienes`, {
        bienes_ids: formData.bienes_seleccionados,
        precios_bienes: formData.precios_bienes
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setShowModal(false);
      cargarPolizas();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar');
    }
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

  // ✅ CORRECCIÓN 2: llamada actualizada sin polizaTipo
  const getCoberturaInfo = (bien) => {
    const precio = formData.precios_bienes?.[bien.id] || bien.valor || 0;
    const coberturasDisponibles = obtenerCoberturaParaBien(bien.tipo);
    if (coberturasDisponibles.length > 0) {
      const cobertura = coberturasDisponibles[0];
      const validacion = validarValorBien(parseFloat(precio), cobertura);
      return { cobertura, validacion, precio };
    }
    return null;
  };

  const handleVerDetalle = async (polizaOrId) => {
    try {
      const token = localStorage.getItem('token');
      const polizaId = polizaOrId?.id || polizaOrId;
      
      if (!polizaId) {
        console.error('No se pudo obtener el ID de la póliza', polizaOrId);
        alert('Error: No se pudo identificar la póliza');
        return;
      }
      
      const res = await axios.get(`${API_URL}/polizas/${polizaId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const data = res.data;
      const items = [
        { icon: <AssignmentIcon />, label: "N° Póliza", value: data.nPoliza },
        { icon: <PersonIcon />, label: "Cliente", value: data.cliente },
        { icon: <DateRangeIcon />, label: "Fecha de inicio", value: data.fechaInicio },
        { icon: <DateRangeIcon />, label: "Fecha final", value: data.fechaFinal },
        { icon: <InfoIcon />, label: "Estatus", value: data.estatus },
        { icon: <AttachMoneyIcon />, label: "Suma asegurada", value: `$${Number(data.sumaAsegurada).toLocaleString()}` },
        { icon: <PaymentIcon />, label: "Forma de pago", value: data.formaPago },
        { icon: <MonetizationOnIcon />, label: "Prima neta", value: `$${Number(data.prima_neta).toLocaleString()}` },
        { icon: <MonetizationOnIcon />, label: "Derecho de póliza", value: `$${Number(data.derecho_poliza).toLocaleString()}` },
        { icon: <MonetizationOnIcon />, label: "IVA", value: `$${Number(data.iva).toLocaleString()}` },
        { icon: <MonetizationOnIcon />, label: "Prima total", value: `$${Number(data.prima_total).toLocaleString()}` },
        { icon: <NotesIcon />, label: "Observaciones", value: data.observaciones || "—" }
      ];
      
      setPolizaDetalle({ ...data, items });
      setShowDetalleModal(true);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      alert('Error al cargar detalles de la póliza');
    }
  };

  const handleEliminarClick = (p) => { 
    setPolizaToDelete(p); 
    setShowDeleteModal(true); 
  };
  
  const handleConfirmarEliminar = async () => {
    if (polizaToDelete) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/polizas/${polizaToDelete.id}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setShowDeleteModal(false);
        cargarPolizas();
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar la póliza');
      }
    }
  };
  
  const handleSearch = (e) => { 
    setSearchTerm(e.target.value); 
    setCurrentPage(1); 
  };
  
  const handleItemsPerPageChange = (newItems) => { 
    setItemsPerPage(newItems); 
    setCurrentPage(1); 
  };

  if (loading && polizas.length === 0) {
    return <div className="container py-4"><div className="text-center py-5"><div className="spinner-border text-success"></div><p>Cargando pólizas...</p></div></div>;
  }

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Pólizas</h1>
      <hr className="mt-2 mb-3" />
      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input 
              type="text" 
              className="search-custom" 
              placeholder="Buscar número de póliza..." 
              value={searchTerm} 
              onChange={handleSearch} 
            />
          </div>
        </div>
        <div>
          <div className="fw-bold mb-2">Estatus</div>
          <select 
            className="form-select" 
            style={{ width: "180px" }} 
            value={estatusFilter} 
            onChange={(e) => setEstatusFilter(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="activa">Activa</option>
            <option value="vencida">Vencida</option>
            <option value="cancelada">Cancelada</option>
            <option value="suspendida">Suspendida</option>
            <option value="en_renovacion">En renovación</option>
          </select>
        </div>
        <PrimaryButton text="Nueva póliza" icon={<AddCircleRoundedIcon />} onClick={handleNuevaPoliza} />
      </div>
      <div className="mb-4">
        <TablaForm 
          columna={columnas} 
          data={polizas} 
          campos={campos} 
          acciones={[
            { 
              titulo: "Ver detalle", 
              clase: "tabla-btn-ver", 
              icono: <VisibilityIcon fontSize="small" />, 
              onClick: (item) => handleVerDetalle(item) 
            },
            { 
              titulo: "Editar", 
              clase: "tabla-btn-edit", 
              icono: <EditIcon fontSize="small" />, 
              onClick: handleEditar 
            },
            { 
              titulo: "Eliminar", 
              clase: "tabla-btn-del", 
              icono: <DeleteIcon fontSize="small" />, 
              onClick: handleEliminarClick 
            },
          ]} 
        />
      </div>
      <Paginacion 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
        itemsPerPage={itemsPerPage} 
        onItemsPerPageChange={handleItemsPerPageChange} 
      />
      
      <EditModal 
        open={showModal} 
        onClose={() => {
          setShowModal(false);
          setBienesCliente([]);
          setErroresBienes({});
        }} 
        onSave={handleGuardar} 
        editando={!!editingPoliza}
        titulo={editingPoliza ? "Editar póliza" : "Agregar nueva póliza"}
        subtitulo={editingPoliza ? "Modifica los datos de la póliza" : "Ingresa el RFC del cliente y los datos de la póliza"}
        btnTexto={editingPoliza ? "Guardar cambios" : "Agregar póliza"} 
        campos={FORM_CAMPOS} 
        formData={formData}
        onChange={handleInputChange} 
        customHandlers={{ onRfcChange: handleRfcChange }}
      >
        {/* Sección de Bienes del Cliente */}
        {formData.id_cliente && (
          <div style={{ marginTop: '20px', padding: '15px', borderTop: '1px solid #E5E7EB' }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <HomeIcon fontSize="small" />
              BIENES DEL CLIENTE A ASEGURAR
            </div>
            
            {cargandoBienes ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div className="spinner-border text-success spinner-border-sm"></div>
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#6B7280' }}>Cargando bienes...</p>
              </div>
            ) : bienesCliente.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                backgroundColor: '#F9FAFB', 
                borderRadius: '8px',
                color: '#6B7280',
                fontSize: '14px'
              }}>
                No hay bienes registrados para este cliente
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px', 
                maxHeight: '450px', 
                overflowY: 'auto',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '10px',
                backgroundColor: '#FFFFFF'
              }}>
                {bienesCliente.map(bien => {
                  const coberturaInfo = getCoberturaInfo(bien);
                  const tieneError = erroresBienes[bien.id];
                  const esValido = coberturaInfo?.validacion.valido;
                  const estaSeleccionado = formData.bienes_seleccionados.includes(bien.id);
                  const precioActual = formData.precios_bienes?.[bien.id] || bien.valor || 0;
                  
                  return (
                    <div 
                      key={bien.id} 
                      style={{
                        padding: '12px',
                        backgroundColor: estaSeleccionado 
                          ? (esValido ? '#E0F2FE' : '#FEE2E2')
                          : '#F9FAFB',
                        borderRadius: '8px',
                        border: estaSeleccionado 
                          ? (esValido ? '1px solid #0284C7' : '1px solid #DC2626')
                          : '1px solid #E5E7EB',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <input
                          type="checkbox"
                          checked={estaSeleccionado}
                          onChange={() => handleSeleccionarBien(bien.id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }}
                        />
                        <div style={{ flexShrink: 0 }}>
                          {getIconoPorTipoBien(bien.tipo)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                            {bien.descripcion || 'Sin descripción'}
                            {!esValido && estaSeleccionado && (
                              <span style={{ marginLeft: '8px', color: '#DC2626', fontSize: '12px' }}>
                                <WarningIcon fontSize="small" style={{ verticalAlign: 'middle' }} /> No cumple cobertura
                              </span>
                            )}
                            {esValido && estaSeleccionado && (
                              <span style={{ marginLeft: '8px', color: '#10B981', fontSize: '12px' }}>
                                <CheckCircleIcon fontSize="small" style={{ verticalAlign: 'middle' }} /> Cobertura válida
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                            <span style={{ 
                              backgroundColor: '#E5E7EB', 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              marginRight: '8px'
                            }}>
                              {bien.tipo ? bien.tipo.charAt(0).toUpperCase() + bien.tipo.slice(1) : 'Tipo no especificado'}
                            </span>
                            {bien.marca && <span style={{ marginRight: '8px' }}>Marca: {bien.marca}</span>}
                            {bien.modelo && <span style={{ marginRight: '8px' }}>Modelo: {bien.modelo}</span>}
                          </div>
                          
                          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                              Precio del bien:
                            </label>
                            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                              <span style={{ 
                                position: 'absolute', 
                                left: '8px', 
                                fontSize: '14px',
                                color: '#6B7280'
                              }}>$</span>
                              <input
                                type="number"
                                value={precioActual}
                                onChange={(e) => handlePrecioBienChange(bien.id, e.target.value)}
                                disabled={!estaSeleccionado}
                                style={{
                                  padding: '6px 8px 6px 24px',
                                  border: `1px solid ${estaSeleccionado ? '#D1D5DB' : '#E5E7EB'}`,
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  width: '150px',
                                  backgroundColor: estaSeleccionado ? '#FFFFFF' : '#F3F4F6',
                                  cursor: estaSeleccionado ? 'text' : 'not-allowed'
                                }}
                              />
                            </div>
                            {estaSeleccionado && (
                              <span style={{ fontSize: '11px', color: '#6B7280' }}>
                                (El precio se suma a la prima total)
                              </span>
                            )}
                          </div>
                          
                          {coberturaInfo && coberturaInfo.cobertura && (
                            <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #E5E7EB' }}>
                              <span>Cobertura sugerida: <strong>{coberturaInfo.cobertura.nombre}</strong></span>
                              {coberturaInfo.cobertura.monto_minimo && (
                                <span style={{ marginLeft: '12px' }}>Mínimo: ${coberturaInfo.cobertura.monto_minimo.toLocaleString()}</span>
                              )}
                              {coberturaInfo.cobertura.monto_maximo && (
                                <span style={{ marginLeft: '12px' }}>Máximo: ${coberturaInfo.cobertura.monto_maximo.toLocaleString()}</span>
                              )}
                            </div>
                          )}
                          {tieneError && (
                            <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '6px' }}>
                              <WarningIcon fontSize="small" style={{ verticalAlign: 'middle' }} /> {tieneError}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {bienesCliente.length > 0 && (
              <div style={{ 
                marginTop: '12px', 
                fontSize: '12px', 
                color: '#6B7280',
                textAlign: 'center',
                padding: '8px',
                backgroundColor: '#F3F4F6',
                borderRadius: '6px'
              }}>
                {formData.bienes_seleccionados.length} bien(es) seleccionado(s)
                {Object.keys(erroresBienes).length > 0 && (
                  <span style={{ marginLeft: '12px', color: '#DC2626' }}>
                    ({Object.keys(erroresBienes).length} con errores)
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </EditModal>
      
      <ConfirmDeleteModal 
        open={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleConfirmarEliminar}
        title="Eliminar póliza" 
        subtitle="¿Deseas eliminar esta póliza?"
      >
        {polizaToDelete && (
          <div>
            <p><strong>Póliza #{polizaToDelete.nPoliza}</strong></p>
            <p>Cliente: {polizaToDelete.cliente}</p>
          </div>
        )}
      </ConfirmDeleteModal>
      
      <PolizaDetalleModal 
        open={showDetalleModal} 
        onClose={() => setShowDetalleModal(false)}
        titulo={polizaDetalle ? `Póliza #${polizaDetalle.nPoliza}` : ""}
        subtitulo={polizaDetalle ? polizaDetalle.cliente : ""}
        avatar="P"
        items={polizaDetalle ? polizaDetalle.items : []}
      />
    </div>
  );
};

export default Polizas;
