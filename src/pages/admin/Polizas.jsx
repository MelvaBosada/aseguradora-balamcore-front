// pages/admin/Polizas.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import '../../css/Clientes.css';

import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
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
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import Paginacion from "../../components/Paginacion";
import PolizaDetalleModal from "../../components/PolizaDetalleModal";
import PolizaCoberturasModal from "../../components/PolizaCoberturasModal";
import DescargarModal from "../../components/DescargarModal";

const API_URL = import.meta.env.VITE_API_URL || '/api';

const MAX_PDF_MB = 2;
const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;

const AVISO_EXITO_MS = 3500;
const SIN_CONEXION = "No hay conexión con el servidor.";

// Estilos del icono de advertencia (por si el CSS no define .advertencia)
const ESTILO_ICONO_ADVERTENCIA = { background: "#FFF4D6", color: "#9A6B00" };

// IVA general en México: 16% sobre (prima neta + derecho de póliza)
const TASA_IVA = 0.16;

// Tipo de póliza que se sugiere según el tipo del primer bien elegido
const TIPO_POR_BIEN = { vehiculo: 'autos', inmueble: 'hogar' };

// Textos que se muestran mientras el sistema aún no asigna el número (se asigna al guardar)
const TEXTO_NUMERO_AUTO = "Se asigna automáticamente al guardar";
const TEXTO_ENDOSO_AUTO = "Se asigna automáticamente (N° de póliza + -E001)";

// El orden de "campos" debe coincidir con el de "columnas"
const campos = ["nPoliza", "cliente", "estatus", "endoso"];
const columnas = ["N° Póliza", "Cliente", "Estatus", "Endoso", "Acciones"];

const FORM_CAMPOS = [
  { label: "RFC del Cliente", name: "rfc_buscar", type: "text", seccion: "Buscar Cliente", fullWidth: true },
  { label: "Nombre del cliente", name: "nombre_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "Correo", name: "correo_cliente", type: "email", seccion: "Información del Cliente", readOnly: true },
  { label: "Teléfono", name: "telefono_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "Domicilio", name: "domicilio_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "CURP", name: "curp_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  // El número de póliza lo asigna el sistema: siempre es de solo lectura
  { label: "N° PÓLIZA", name: "numero_poliza", type: "text", seccion: "DATOS DE LA PÓLIZA", readOnly: true },
  { label: "TIPO DE PÓLIZA", name: "tipo", type: "select", options: ["vida", "gastos_medicos", "autos", "hogar", "empresarial", "responsabilidad_civil", "otro"], seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "FECHA DE INICIO", name: "fecha_inicio", type: "date", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "FECHA DE FIN", name: "fecha_fin", type: "date", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "SUMA ASEGURADA", name: "suma_asegurada", type: "number", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "PRIMA NETA", name: "prima_neta", type: "number", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "DERECHO DE PÓLIZA", name: "derecho_poliza", type: "number", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "IVA (16% sugerido)", name: "iva", type: "number", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "PRIMA TOTAL", name: "prima_total", type: "number", seccion: "DATOS DE LA PÓLIZA", required: true, readOnly: true },
  { label: "FORMA DE PAGO", name: "forma_pago", type: "select", options: ["contado", "mensual", "trimestral", "semestral", "anual"], seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "OBSERVACIONES", name: "observaciones", type: "textarea", seccion: "DATOS DE LA PÓLIZA" },
];

const FORM_VACIO = {
  rfc_buscar: "", id_cliente: "", nombre_cliente: "", correo_cliente: "", telefono_cliente: "",
  domicilio_cliente: "", curp_cliente: "", numero_poliza: "", tipo: "", fecha_inicio: "", fecha_fin: "",
  suma_asegurada: "", prima_neta: "", derecho_poliza: "", iva: "", prima_total: "", forma_pago: "", observaciones: "",
  bienes_seleccionados: [],
  precios_bienes: {},
  tiene_endoso: false,
  descripcion_endoso: ""
};

// Mismos estilos que usa EditModal para sus mensajes
const COLOR_ERROR = "#C0392B";
const estiloMensaje = { fontSize: 11, marginTop: 3 };
const estiloAyuda = { ...estiloMensaje, color: "#6B7280" };
const estiloRequerido = { color: "red", marginLeft: 4 };

const validarPdf = (file) => {
  if (!file) return "";
  const esPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!esPdf) return "El archivo debe ser un PDF.";
  if (file.size > MAX_PDF_BYTES) {
    return `El archivo pesa ${(file.size / 1024 / 1024).toFixed(2)} MB y el máximo permitido es ${MAX_PDF_MB} MB.`;
  }
  return "";
};

// Mensaje legible a partir de un error de axios
const mensajeError = (error, defecto) => {
  if (!error.response) return SIN_CONEXION;
  const errores = error.response?.data?.errors;
  if (errores) return Object.values(errores).flat().join("\n");
  return error.response?.data?.message || defecto || error.message;
};

// ───────────── Helpers de cálculo y fechas ─────────────

const num = (v) => parseFloat(v) || 0;
const fmt = (n) => (n > 0 ? n.toFixed(2) : "");

const sumaBienes = (precios, seleccionados) =>
  seleccionados.reduce((total, id) => total + num(precios?.[id]), 0);

// Fecha de hoy en hora local (toISOString usaría UTC y en la noche daría el día siguiente)
const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Suma un año a una fecha "YYYY-MM-DD" (el 29 de febrero pasa al 28 del año siguiente)
const sumarAnio = (fecha) => {
  if (!fecha) return "";
  const [y, m, d] = fecha.split('-').map(Number);
  const ultimoDia = new Date(y + 1, m, 0).getDate();
  return `${y + 1}-${String(m).padStart(2, '0')}-${String(Math.min(d, ultimoDia)).padStart(2, '0')}`;
};

const Polizas = () => {
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showDescarga, setShowDescarga] = useState(false);
  const [polizaToDelete, setPolizaToDelete] = useState(null);
  const [polizaDetalle, setPolizaDetalle] = useState(null);
  const [polizaCob, setPolizaCob] = useState(null); // póliza a la que se le asignan coberturas
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

  // Documentos PDF (póliza y endoso)
  const [docPoliza, setDocPoliza] = useState(null);
  const [docEndoso, setDocEndoso] = useState(null);
  const [docActual, setDocActual] = useState(null); // documento ya guardado de la póliza que se edita
  const [erroresDocs, setErroresDocs] = useState({});
  const [fileKey, setFileKey] = useState(0);        // sirve para limpiar los <input type="file">
  const [siguienteEndoso, setSiguienteEndoso] = useState(""); // N° que recibirá el próximo endoso (al editar)

  // Aviso con el diseño del sistema (reemplaza alert)
  // { tipo: 'exito' | 'error' | 'advertencia', titulo, mensaje }
  const [aviso, setAviso] = useState(null);

  // Indica qué campos el usuario ya escribió a mano: esos dejan de llenarse solos.
  const manual = useRef({ fin: false, iva: false, suma: false });

  const mostrarAviso = useCallback((tipo, titulo, mensaje) => {
    setAviso({ tipo, titulo, mensaje });
  }, []);

  // Los avisos de éxito se cierran solos
  useEffect(() => {
    if (aviso?.tipo !== 'exito') return;
    const t = setTimeout(() => setAviso(null), AVISO_EXITO_MS);
    return () => clearTimeout(t);
  }, [aviso]);

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
      mostrarAviso('error', 'No se pudieron cargar las pólizas', mensajeError(error));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, estatusFilter, itemsPerPage, mostrarAviso]);

  useEffect(() => {
    cargarPolizas();
  }, [cargarPolizas]);

  // ───────────── Campos que se llenan solos ─────────────

  // Recalcula lo que depende de otros campos, salvo lo que el usuario ya escribió a mano:
  //  - suma asegurada = suma del valor de los bienes marcados
  //  - IVA            = 16% de (prima neta + derecho de póliza)
  //  - prima total    = prima neta + derecho de póliza + IVA (siempre)
  const derivar = (f) => {
    const m = manual.current;
    const next = { ...f };

    if (!m.suma) {
      next.suma_asegurada = fmt(sumaBienes(f.precios_bienes, f.bienes_seleccionados));
    }

    const base = num(f.prima_neta) + num(f.derecho_poliza);

    if (!m.iva) {
      next.iva = fmt(base * TASA_IVA);
    }

    next.prima_total = fmt(base + num(next.iva));
    return next;
  };

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

  const validarBienesSeleccionados = async (bienesIds, polizaTipo, preciosBienes) => {
    const nuevosErrores = {};
    let todoValido = true;

    for (const bienId of bienesIds) {
      const bien = bienesCliente.find(b => b.id === bienId);
      if (bien) {
        const precio = parseFloat(preciosBienes?.[bienId]) || parseFloat(bien.valor) || 0;
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
    if (!clienteId) return [];

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

  // Busca al cliente por RFC. SOLO llena los datos del cliente; los datos de la póliza no se copian.
  const buscarClientePorRfc = async (rfc) => {
    if (!rfc || rfc.length < 8) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/polizas/buscar-ultima-por-rfc`, {
        params: { rfc },
        headers: { Authorization: `Bearer ${token}` }
      });

      const cliente = response.data.cliente;
      const bienes = await cargarBienesPorClienteId(cliente.id);

      const preciosIniciales = {};
      bienes.forEach(bien => {
        preciosIniciales[bien.id] = bien.valor || 0;
      });

      setFormData(prev => derivar({
        ...prev,
        id_cliente: cliente.id,
        nombre_cliente: `${cliente.nombre} ${cliente.apellido}`,
        correo_cliente: cliente.correo || "",
        telefono_cliente: cliente.telefono || "",
        domicilio_cliente: cliente.domicilio || "",
        curp_cliente: cliente.curp || "",
        bienes_seleccionados: [],
        precios_bienes: preciosIniciales
      }));
      setErroresBienes({});
    } catch (error) {
      if (error.response?.status === 404) {
        // Limpia al cliente anterior para no guardar la póliza a nombre de otra persona
        setFormData(prev => derivar({
          ...prev,
          id_cliente: "",
          nombre_cliente: "Cliente no encontrado",
          correo_cliente: "",
          telefono_cliente: "",
          domicilio_cliente: "",
          curp_cliente: "",
          bienes_seleccionados: [],
          precios_bienes: {}
        }));
        setBienesCliente([]);
      }
    }
  };

  const handleSeleccionarBien = async (bienId) => {
    const yaEsta = formData.bienes_seleccionados.includes(bienId);
    const nuevosSeleccionados = yaEsta
      ? formData.bienes_seleccionados.filter(id => id !== bienId)
      : [...formData.bienes_seleccionados, bienId];

    // Si todavía no hay tipo de póliza, se sugiere según el bien elegido
    let tipoSugerido = "";
    if (!editingPoliza && !formData.tipo && !yaEsta) {
      const bien = bienesCliente.find(b => b.id === bienId);
      tipoSugerido = TIPO_POR_BIEN[bien?.tipo] || "";
    }

    setFormData(prev => derivar({
      ...prev,
      bienes_seleccionados: nuevosSeleccionados,
      tipo: tipoSugerido || prev.tipo
    }));

    const tipoActual = tipoSugerido || formData.tipo;
    if (tipoActual) {
      await validarBienesSeleccionados(nuevosSeleccionados, tipoActual, formData.precios_bienes);
    }
  };

  const handlePrecioBienChange = (bienId, nuevoPrecio) => {
    const nuevosPrecios = {
      ...formData.precios_bienes,
      [bienId]: parseFloat(nuevoPrecio) || 0
    };

    setFormData(prev => derivar({ ...prev, precios_bienes: nuevosPrecios }));

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

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    const m = manual.current;

    // Lo que el usuario escribe a mano deja de llenarse solo; si lo borra, vuelve a ser automático
    if (name === 'fecha_fin') m.fin = value !== '';
    if (name === 'iva') m.iva = value !== '';
    if (name === 'suma_asegurada') m.suma = value !== '';

    setFormData(prev => {
      const next = { ...prev, [name]: value };

      // La vigencia dura un año desde el inicio
      if (name === 'fecha_inicio' && !m.fin) {
        next.fecha_fin = sumarAnio(value);
      }

      return derivar(next);
    });

    if (name === 'tipo' && formData.bienes_seleccionados.length > 0) {
      await validarBienesSeleccionados(formData.bienes_seleccionados, value, formData.precios_bienes);
    }
  };

  // ───────────── Documentos PDF ─────────────

  const resetDocumentos = () => {
    setDocPoliza(null);
    setDocEndoso(null);
    setDocActual(null);
    setErroresDocs({});
    setSiguienteEndoso("");
    setFileKey(k => k + 1);
  };

  const handleArchivo = (e, tipo) => {
    const file = e.target.files?.[0] || null;
    const error = validarPdf(file);
    const clave = tipo === 'poliza' ? 'poliza' : 'endoso_doc';

    setErroresDocs(prev => ({ ...prev, [clave]: error }));

    if (error || !file) {
      e.target.value = "";
      tipo === 'poliza' ? setDocPoliza(null) : setDocEndoso(null);
      return;
    }

    tipo === 'poliza' ? setDocPoliza(file) : setDocEndoso(file);
  };

  const handleTieneEndoso = (valor) => {
    setFormData(prev => ({
      ...prev,
      tiene_endoso: valor,
      descripcion_endoso: valor ? prev.descripcion_endoso : ""
    }));

    if (!valor) {
      setDocEndoso(null);
      setErroresDocs(prev => ({ ...prev, endoso_descripcion: "", endoso_doc: "" }));
      setFileKey(k => k + 1);
    }
  };

  // Abre un PDF protegido (necesita token) en una pestaña nueva
  const abrirPdf = async (url) => {
    const ventana = window.open('', '_blank');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));

      if (ventana) {
        ventana.location.href = blobUrl;
      } else {
        window.location.href = blobUrl;
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      if (ventana) ventana.close();
      console.error('Error al abrir documento:', error);

      // Con responseType 'blob' el JSON de error llega como Blob: se intenta leer el mensaje
      let mensaje = error.response ? 'El documento no está disponible.' : SIN_CONEXION;
      try {
        const texto = await error.response?.data?.text?.();
        if (texto) mensaje = JSON.parse(texto).message || mensaje;
      } catch {
        /* se mantiene el mensaje por defecto */
      }
      mostrarAviso('error', 'No se pudo abrir el documento', mensaje);
    }
  };

  const handleNuevaPoliza = () => {
    manual.current = { fin: false, iva: false, suma: false };

    // La vigencia arranca hoy y termina en un año
    const hoy = hoyLocal();

    setEditingPoliza(null);
    setFormData({ ...FORM_VACIO, fecha_inicio: hoy, fecha_fin: sumarAnio(hoy) });
    setBienesCliente([]);
    setErroresBienes({});
    resetDocumentos();
    setShowModal(true);
  };

  const handleEditar = async (poliza) => {
    // Al editar se respetan los valores guardados: vigencia y suma no se tocan solos.
    // El IVA y la prima total sí se recalculan si cambias la prima neta o el derecho de póliza.
    manual.current = { fin: true, iva: false, suma: true };

    setEditingPoliza(poliza);
    resetDocumentos();
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
        precios_bienes: preciosIniciales,
        tiene_endoso: false,
        descripcion_endoso: ""
      });

      setDocActual(data.tiene_documento ? { nombre: data.documento_nombre } : null);
      setSiguienteEndoso(data.siguiente_endoso || "");
      setBienesCliente(bienesResponse.data);
      setErroresBienes({});
      setShowModal(true);
    } catch (error) {
      console.error('Error:', error);
      setEditingPoliza(null);
      mostrarAviso(
        'error',
        'No se pudo abrir la póliza',
        mensajeError(error, 'No se pudieron cargar los datos de la póliza para editar.')
      );
    }
  };

  const handleGuardar = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!formData.id_cliente) {
        mostrarAviso('error', 'Faltan datos', 'Primero busca un cliente por RFC.');
        return;
      }

      if (formData.bienes_seleccionados.length > 0) {
        const esValido = await validarBienesSeleccionados(formData.bienes_seleccionados, formData.tipo, formData.precios_bienes);
        if (!esValido) {
          mostrarAviso(
            'error',
            'Bienes fuera de cobertura',
            'Hay bienes que no cumplen con los rangos de cobertura. Revisa los errores marcados.'
          );
          return;
        }
      }

      // Validación de documentos y endoso
      const nuevosErrores = { poliza: erroresDocs.poliza || "" };
      if (formData.tiene_endoso) {
        if (!formData.descripcion_endoso.trim()) nuevosErrores.endoso_descripcion = 'Escribe la descripción del endoso.';
        if (!docEndoso) nuevosErrores.endoso_doc = erroresDocs.endoso_doc || 'Sube el documento del endoso (PDF).';
      }
      setErroresDocs(nuevosErrores);

      if (Object.values(nuevosErrores).some(Boolean)) {
        document.getElementById('seccion-documentos')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Se envía como FormData porque lleva archivos PDF.
      // Ni el N° de póliza ni el de endoso se envían: los asigna el servidor.
      const fd = new FormData();
      const simples = {
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
        observaciones: formData.observaciones
      };
      Object.entries(simples).forEach(([k, v]) => fd.append(k, v ?? ""));

      fd.append('bienes_sync', '1');
      formData.bienes_seleccionados.forEach(id => fd.append('bienes_ids[]', id));
      Object.entries(formData.precios_bienes).forEach(([id, precio]) => fd.append(`precios_bienes[${id}]`, precio));

      if (docPoliza) fd.append('documento', docPoliza);

      fd.append('tiene_endoso', formData.tiene_endoso ? '1' : '0');
      if (formData.tiene_endoso) {
        fd.append('descripcion_endoso', formData.descripcion_endoso.trim());
        fd.append('endoso_documento', docEndoso);
      }

      const headers = { Authorization: `Bearer ${token}` };

      if (editingPoliza) {
        fd.append('_method', 'PUT');
        await axios.post(`${API_URL}/polizas/${editingPoliza.id}`, fd, { headers });

        setShowModal(false);
        cargarPolizas();
        mostrarAviso('exito', 'Póliza actualizada', 'Los cambios se guardaron correctamente.');
        return;
      }

      const res = await axios.post(`${API_URL}/polizas`, fd, { headers });
      const numeroNuevo = res.data.poliza.numero_poliza;

      // Asignar a la póliza las mismas coberturas que se usan para validar los bienes
      const idsCob = [...new Set(formData.bienes_seleccionados.flatMap((id) => {
        const bien = bienesCliente.find((b) => b.id === id);
        return bien ? obtenerCoberturaParaBien(bien.tipo).map((c) => c.id) : [];
      }))];

      let fallaronCoberturas = false;
      if (idsCob.length) {
        try {
          await axios.put(`${API_URL}/polizas/${res.data.poliza.id}/coberturas`, { ids: idsCob }, { headers });
        } catch (errCob) {
          console.error('Error al asignar coberturas:', errCob);
          fallaronCoberturas = true;
        }
      }

      setShowModal(false);
      cargarPolizas();

      if (fallaronCoberturas) {
        mostrarAviso(
          'advertencia',
          'Póliza creada sin coberturas',
          `La póliza se creó con el N° ${numeroNuevo}, pero no se pudieron asignar las coberturas.\nAsígnalas con el botón "Coberturas".`
        );
      } else {
        mostrarAviso('exito', 'Póliza creada', `La póliza se creó con el N° ${numeroNuevo}.`);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAviso('error', 'No se pudo guardar', mensajeError(error, 'Error al guardar la póliza.'));
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
        mostrarAviso('error', 'No se pudo abrir el detalle', 'No se pudo identificar la póliza seleccionada.');
        return;
      }

      const res = await axios.get(`${API_URL}/polizas/${polizaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = res.data;
      const items = [
        { icon: <AssignmentIcon />, label: "N° Póliza", value: data.nPoliza },
        { icon: <AssignmentIcon />, label: "Endoso", value: data.endoso },
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
        { icon: <NotesIcon />, label: "Observaciones", value: data.observaciones || "—", fullWidth: true }
      ];

      setPolizaDetalle({ ...data, items });
      setShowDetalleModal(true);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      mostrarAviso(
        'error',
        'No se pudo abrir el detalle',
        mensajeError(error, 'Error al cargar los detalles de la póliza.')
      );
    }
  };

  const handleEliminarClick = (p) => {
    setPolizaToDelete(p);
    setShowDeleteModal(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!polizaToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${API_URL}/polizas/${polizaToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowDeleteModal(false);
      setPolizaToDelete(null);
      cargarPolizas();
      mostrarAviso(
        'exito',
        'Póliza eliminada',
        res.data?.message || 'La póliza se eliminó correctamente.'
      );
    } catch (error) {
      console.error('Error al eliminar:', error);
      setShowDeleteModal(false);
      setPolizaToDelete(null);
      mostrarAviso('error', 'No se pudo eliminar', mensajeError(error, 'Error al eliminar la póliza.'));
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
            onChange={(e) => {
              setEstatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="Todos">Todos</option>
            <option value="activa">Activa</option>
            <option value="vencida">Vencida</option>
            <option value="cancelada">Cancelada</option>
            <option value="suspendida">Suspendida</option>
            <option value="en_renovacion">En renovación</option>
          </select>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <PrimaryButton
            text="Descargar"
            icon={<DownloadIcon />}
            onClick={() => setShowDescarga(true)}
          />
          <PrimaryButton text="Nueva póliza" icon={<AddCircleRoundedIcon />} onClick={handleNuevaPoliza} />
        </div>
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
              titulo: "Coberturas",
              clase: "tabla-btn-ver",
              icono: <VerifiedUserIcon fontSize="small" />,
              onClick: (p) => setPolizaCob({ id: p.id, nPoliza: p.nPoliza })
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
          resetDocumentos();
        }}
        onSave={handleGuardar}
        editando={!!editingPoliza}
        titulo={editingPoliza ? "Editar póliza" : "Agregar nueva póliza"}
        subtitulo={editingPoliza ? "Modifica los datos de la póliza" : "Ingresa el RFC del cliente y los datos de la póliza"}
        btnTexto={editingPoliza ? "Guardar cambios" : "Agregar póliza"}
        campos={FORM_CAMPOS}
        // En una póliza nueva el N° se muestra como texto informativo; el real lo asigna el servidor
        formData={{ ...formData, numero_poliza: editingPoliza ? formData.numero_poliza : TEXTO_NUMERO_AUTO }}
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
                                (El precio se suma a la suma asegurada)
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

        {/* Documento de la póliza + Endoso: mismo diseño que el resto del formulario */}
        <div id="seccion-documentos">

          {/* DOCUMENTO DE LA PÓLIZA */}
          <div className="balam-section-title">DOCUMENTO DE LA PÓLIZA</div>
          <div className="balam-fields-grid">

            {editingPoliza && docActual && (
              <div className="balam-field balam-full">
                <label>DOCUMENTO ACTUAL</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
                  <span>{docActual.nombre || 'documento.pdf'}</span>
                  <button
                    type="button"
                    className="balam-btn cancel"
                    style={{ padding: '6px 14px', fontSize: 12 }}
                    onClick={() => abrirPdf(`${API_URL}/polizas/${editingPoliza.id}/documento`)}
                  >
                    Ver PDF
                  </button>
                </div>
              </div>
            )}

            <div className="balam-field balam-full">
              <label style={{ color: erroresDocs.poliza ? COLOR_ERROR : "" }}>
                {docActual ? 'REEMPLAZAR DOCUMENTO (PDF)' : 'SUBIR DOCUMENTO (PDF)'}
              </label>
              <input
                key={`doc-poliza-${fileKey}`}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => handleArchivo(e, 'poliza')}
                style={{ borderColor: erroresDocs.poliza ? COLOR_ERROR : "" }}
              />
              <span style={estiloAyuda}>Solo archivos PDF · Tamaño máximo: {MAX_PDF_MB} MB</span>
              {erroresDocs.poliza && (
                <span style={{ ...estiloMensaje, color: COLOR_ERROR }}>{erroresDocs.poliza}</span>
              )}
            </div>
          </div>

          {/* ENDOSO */}
          <div className="balam-section-title" style={{ marginTop: 24 }}>ENDOSO</div>
          <div className="balam-fields-grid">

            <div className="balam-field">
              <label>{editingPoliza ? '¿AGREGAR UN ENDOSO?' : '¿TIENE ENDOSO?'}</label>
              <select
                className="balam-select"
                value={formData.tiene_endoso ? 'si' : 'no'}
                onChange={(e) => handleTieneEndoso(e.target.value === 'si')}
              >
                <option value="no">{editingPoliza ? 'No agregar endoso' : 'No tiene endoso'}</option>
                <option value="si">{editingPoliza ? 'Sí, agregar endoso' : 'Sí tiene endoso'}</option>
              </select>
            </div>

            {formData.tiene_endoso && (
              <>
                {/* El N° de endoso lo asigna el sistema a partir del N° de póliza */}
                <div className="balam-field">
                  <label>N° DE ENDOSO</label>
                  <input
                    type="text"
                    readOnly
                    value={editingPoliza ? (siguienteEndoso || TEXTO_ENDOSO_AUTO) : TEXTO_ENDOSO_AUTO}
                  />
                  <span style={estiloAyuda}>Se arma con el N° de póliza y un consecutivo</span>
                </div>

                <div className="balam-field balam-full">
                  <label style={{ color: erroresDocs.endoso_descripcion ? COLOR_ERROR : "" }}>
                    DESCRIPCIÓN DEL ENDOSO<span style={estiloRequerido}>*</span>
                  </label>
                  <textarea
                    className="balam-textarea"
                    rows={3}
                    maxLength={255}
                    value={formData.descripcion_endoso}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion_endoso: e.target.value }))}
                    placeholder="Describe qué cambio se hizo a la póliza"
                    style={{ borderColor: erroresDocs.endoso_descripcion ? COLOR_ERROR : "" }}
                  />
                  {erroresDocs.endoso_descripcion && (
                    <span style={{ ...estiloMensaje, color: COLOR_ERROR }}>{erroresDocs.endoso_descripcion}</span>
                  )}
                </div>

                <div className="balam-field balam-full">
                  <label style={{ color: erroresDocs.endoso_doc ? COLOR_ERROR : "" }}>
                    DOCUMENTO DEL ENDOSO (PDF)<span style={estiloRequerido}>*</span>
                  </label>
                  <input
                    key={`doc-endoso-${fileKey}`}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => handleArchivo(e, 'endoso')}
                    style={{ borderColor: erroresDocs.endoso_doc ? COLOR_ERROR : "" }}
                  />
                  <span style={estiloAyuda}>Solo archivos PDF · Tamaño máximo: {MAX_PDF_MB} MB</span>
                  {erroresDocs.endoso_doc && (
                    <span style={{ ...estiloMensaje, color: COLOR_ERROR }}>{erroresDocs.endoso_doc}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </EditModal>

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPolizaToDelete(null);
        }}
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
        documento={polizaDetalle?.tiene_documento ? { nombre: polizaDetalle.documento_nombre } : null}
        onVerDocumento={() => abrirPdf(`${API_URL}/polizas/${polizaDetalle.id}/documento`)}
        endosos={polizaDetalle ? polizaDetalle.endosos || [] : []}
        onVerDocumentoEndoso={(e) => abrirPdf(`${API_URL}/polizas/${polizaDetalle.id}/endosos/${e.id}/documento`)}
      />

      {/* COBERTURAS CONTRATADAS DE LA PÓLIZA */}
      <PolizaCoberturasModal
        open={!!polizaCob}
        poliza={polizaCob}
        onClose={() => setPolizaCob(null)}
      />

      {/* ---------- Aviso (éxito / error / advertencia) ---------- */}
      {aviso && (
        <div
          className="balam-overlay"
          style={{ zIndex: 3000 }}
          onClick={(e) => e.target === e.currentTarget && setAviso(null)}
        >
          <div className="balam-modal evi-aviso">
            <div
              className={`evi-aviso-icono ${aviso.tipo}`}
              style={aviso.tipo === 'advertencia' ? ESTILO_ICONO_ADVERTENCIA : undefined}
            >
              {aviso.tipo === 'exito' && <CheckCircleIcon style={{ fontSize: 40 }} />}
              {aviso.tipo === 'error' && <ErrorOutlineIcon style={{ fontSize: 40 }} />}
              {aviso.tipo === 'advertencia' && <WarningAmberIcon style={{ fontSize: 40 }} />}
            </div>
            <h3>{aviso.titulo}</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{aviso.mensaje}</p>
            <button className="balam-btn save" onClick={() => setAviso(null)}>Aceptar</button>
          </div>
        </div>
      )}

      {/* MODAL DE DESCARGA DEL LISTADO (PDF / Excel / CSV) */}
      <DescargarModal
        open={showDescarga}
        onClose={() => setShowDescarga(false)}
        url={`${API_URL}/exportar/polizas`}
        params={{ search: searchTerm, estatus: estatusFilter }}
        nombreArchivo="polizas"
        titulo="Descargar listado de pólizas"
        nota={
          searchTerm || estatusFilter !== "Todos"
            ? `Se exportarán las pólizas con los filtros actuales${searchTerm ? ` (búsqueda: "${searchTerm}")` : ""}${estatusFilter !== "Todos" ? ` (estatus: ${estatusFilter})` : ""}.`
            : "Se exportarán todas las pólizas."
        }
      />
    </div>
  );
};

export default Polizas;