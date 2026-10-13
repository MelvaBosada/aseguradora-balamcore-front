import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from 'axios';
import "../../css/Clientes.css";

// Iconos
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionIcon from "@mui/icons-material/Description";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DateRangeIcon from "@mui/icons-material/DateRange";
import CategoryIcon from "@mui/icons-material/Category";
import InfoIcon from "@mui/icons-material/Info";
import GavelIcon from "@mui/icons-material/Gavel";

// Componentes
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";

const API_URL = import.meta.env.VITE_API_URL || '/api';

const campos = ["nombre_archivo", "tipo", "siniestro", "empleado", "estatus_validacion", "fecha_subida"];
const columnas = ["Archivo", "Tipo", "Siniestro", "Subido por", "Estatus", "Fecha", "Acciones"];

const FORM_CAMPOS_EVIDENCIA = [
  { label: "N° de Siniestro a buscar", name: "siniestro_buscar", type: "text", seccion: "Buscar Siniestro", fullWidth: true },
  { label: "Siniestro", name: "numero_siniestro", type: "text", seccion: "Siniestro Seleccionado", readOnly: true },
  { label: "Tipo de evidencia", name: "tipo", type: "select", options: ["foto", "video", "documento", "audio", "otro"], seccion: "Datos de la Evidencia", required: true },
  { label: "Categoría", name: "categoria", type: "text", seccion: "Datos de la Evidencia" },
  { label: "Descripción", name: "descripcion", type: "text", seccion: "Datos de la Evidencia", fullWidth: true },
  { label: "Archivo", name: "archivo", type: "file", seccion: "Datos de la Evidencia", fullWidth: true }
];

const FORM_VACIO_EVIDENCIA = {
  siniestro_buscar: "",
  id_siniestro: "",
  numero_siniestro: "",
  tipo: "",
  categoria: "",
  descripcion: "",
  archivo: null
};

// ----------------------------------------------------------------------
// Función de cabeceras optimizada: Incluye siempre 'Accept: application/json'
// para evitar que Sanctum responda con redirect 302 y cause error de CORS.
// ----------------------------------------------------------------------
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  };
};

const getEmpleadoIdActual = () => {
  return localStorage.getItem('id_empleado') || null;
};

const Evidencias = () => {
  const location = useLocation();

  const [evidencias, setEvidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  const [evidenciaToDelete, setEvidenciaToDelete] = useState(null);
  const [evidenciaDetalle, setEvidenciaDetalle] = useState(null);
  const [editingEvidencia, setEditingEvidencia] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(FORM_VACIO_EVIDENCIA);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [estatusFilter, setEstatusFilter] = useState("Todos");
  const [totalPages, setTotalPages] = useState(1);

  const [siniestrosOptions, setSiniestrosOptions] = useState([]);

  const timerSiniestroRef = useRef(null);

  const cargarEvidencias = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/evidencias`, {
        params: {
          page: currentPage,
          search: searchTerm,
          estatus_validacion: estatusFilter === "Todos" ? undefined : estatusFilter,
          per_page: itemsPerPage
        },
        ...getAuthHeaders()
      });

      const data = response.data.data || [];

      setEvidencias(data.map(e => ({
        ...e,
        nombre_archivo: e.nombre_archivo,
        siniestro: e.siniestro?.numero_siniestro || e.id_siniestro || "—",
        empleado: e.empleado ? `${e.empleado.nombre || ''} ${e.empleado.apellido || ''}`.trim() : "—",
        fecha_subida: e.fecha_subida ? new Date(e.fecha_subida).toLocaleDateString() : "—"
      })));
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error('Error cargando evidencias:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, estatusFilter, itemsPerPage]);

  useEffect(() => {
    cargarEvidencias();
  }, [cargarEvidencias]);

  // Precarga de siniestro cuando se navega desde el detalle de un siniestro
  useEffect(() => {
    if (location.state && location.state.siniestroId) {
      const { siniestroId, numeroSiniestro } = location.state;
      window.history.replaceState({}, document.title);
      setFormData(prev => ({
        ...prev,
        id_siniestro: siniestroId,
        numero_siniestro: numeroSiniestro || siniestroId
      }));
      setShowModal(true);
    }
  }, [location]);

  const buscarSiniestros = async (termino) => {
    if (!termino || termino.length < 2) {
      setSiniestrosOptions([]);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/siniestros`, {
        params: { search: termino, per_page: 10 },
        ...getAuthHeaders()
      });

      const resultados = response.data.data || [];
      setSiniestrosOptions(resultados.map(s => ({
        value: s.id,
        label: `${s.numero_siniestro || s.id} - ${s.cliente || ''}`
      })));
    } catch (error) {
      console.error('Error al buscar siniestros:', error);
      setSiniestrosOptions([]);
    }
  };

  const handleSiniestroBuscarChange = (e) => {
    const termino = e.target.value;
    setFormData(prev => ({ ...prev, siniestro_buscar: termino }));

    if (timerSiniestroRef.current) clearTimeout(timerSiniestroRef.current);
    timerSiniestroRef.current = setTimeout(() => buscarSiniestros(termino), 500);
  };

  const handleSeleccionarSiniestro = (opcion) => {
    setFormData(prev => ({
      ...prev,
      id_siniestro: opcion.value,
      numero_siniestro: opcion.label
    }));
    setSiniestrosOptions([]);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'archivo') {
      setFormData(prev => ({ ...prev, archivo: files?.[0] || null }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'siniestro_buscar') {
      handleSiniestroBuscarChange(e);
    }
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingEvidencia(null);
    setFormData(FORM_VACIO_EVIDENCIA);
    setSiniestrosOptions([]);
  };

  const handleNuevaEvidencia = () => {
    cerrarModal();
    setShowModal(true);
  };

  const handleEditar = (evidencia) => {
    setFormData({
      siniestro_buscar: "",
      id_siniestro: evidencia.id_siniestro || "",
      numero_siniestro: evidencia.siniestro || "",
      tipo: evidencia.tipo || "",
      categoria: evidencia.categoria || "",
      descripcion: evidencia.descripcion || "",
      archivo: null
    });
    setEditingEvidencia(evidencia);
    setShowModal(true);
  };

  const handleGuardar = async () => {
    if (!formData.id_siniestro) {
      alert('Debes seleccionar un siniestro');
      return;
    }
    if (!editingEvidencia && !formData.archivo) {
      alert('Debes seleccionar un archivo');
      return;
    }

    const idEmpleado = getEmpleadoIdActual();
    if (!editingEvidencia && !idEmpleado) {
      alert('No se pudo identificar al empleado actual, vuelve a iniciar sesión');
      return;
    }

    try {
      if (editingEvidencia) {
        // Solo se actualizan metadatos, no el archivo
        await axios.put(`${API_URL}/evidencias/${editingEvidencia.id}`, {
          categoria: formData.categoria,
          descripcion: formData.descripcion
        }, getAuthHeaders());
      } else {
        const fd = new FormData();
        fd.append('id_siniestro', formData.id_siniestro);
        fd.append('id_empleado', idEmpleado);
        fd.append('tipo', formData.tipo);
        if (formData.categoria) fd.append('categoria', formData.categoria);
        if (formData.descripcion) fd.append('descripcion', formData.descripcion);
        fd.append('archivo', formData.archivo);

        const authConfig = getAuthHeaders();
        await axios.post(`${API_URL}/evidencias`, fd, {
          headers: {
            ...authConfig.headers,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      cerrarModal();
      cargarEvidencias();
    } catch (error) {
      console.error('Error al guardar la evidencia:', error);
      alert('Error al guardar: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleVerDetalle = async (evidencia) => {
    let data = evidencia;
    try {
      const res = await axios.get(`${API_URL}/evidencias/${evidencia.id}`, getAuthHeaders());
      data = res.data;
    } catch (error) {
      console.warn('No se pudo obtener el detalle extendido, usando datos locales:', error);
    }

    const items = [
      { icon: <DescriptionIcon />, label: "Archivo", value: data.nombre_archivo || "—" },
      { icon: <CategoryIcon />, label: "Tipo", value: data.tipo || "—" },
      { icon: <InfoIcon />, label: "Categoría", value: data.categoria || "—" },
      { icon: <AssignmentIcon />, label: "Siniestro", value: data.siniestro?.numero_siniestro || data.id_siniestro || "—" },
      { icon: <PersonIcon />, label: "Subido por", value: data.empleado ? `${data.empleado.nombre || ''} ${data.empleado.apellido || ''}`.trim() : "—" },
      { icon: <GavelIcon />, label: "Estatus de validación", value: data.estatus_validacion || "—" },
      { icon: <PersonIcon />, label: "Validado por", value: data.validador ? `${data.validador.nombre || ''} ${data.validador.apellido || ''}`.trim() : "—" },
      { icon: <InfoIcon />, label: "Motivo de rechazo", value: data.motivo_rechazo || "—" },
      { icon: <DateRangeIcon />, label: "Fecha de subida", value: data.fecha_subida ? new Date(data.fecha_subida).toLocaleString() : "—" },
      { icon: <InfoIcon />, label: "Descripción", value: data.descripcion || "—" }
    ];

    setEvidenciaDetalle({ ...data, items });
    setShowDetalleModal(true);
  };

  const handleDescargar = async (evidencia) => {
    try {
      const response = await axios.get(`${API_URL}/evidencias/${evidencia.id}/descargar`, {
        ...getAuthHeaders(),
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', evidencia.nombre_archivo || 'evidencia');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al descargar la evidencia:', error);
      alert('Error al descargar el archivo');
    }
  };

  const handleValidar = async (evidencia) => {
    const idEmpleado = getEmpleadoIdActual();
    if (!idEmpleado) {
      alert('No se pudo identificar al empleado actual, vuelve a iniciar sesión');
      return;
    }

    try {
      await axios.post(`${API_URL}/evidencias/${evidencia.id}/validar`, {
        accion: 'validar',
        id_validador: idEmpleado
      }, getAuthHeaders());

      cargarEvidencias();
    } catch (error) {
      console.error('Error al validar la evidencia:', error);
      alert('Error al validar: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRechazar = async (evidencia) => {
    const idEmpleado = getEmpleadoIdActual();
    if (!idEmpleado) {
      alert('No se pudo identificar al empleado actual, vuelve a iniciar sesión');
      return;
    }

    const motivo = window.prompt('Motivo del rechazo:');
    if (!motivo) return;

    try {
      await axios.post(`${API_URL}/evidencias/${evidencia.id}/validar`, {
        accion: 'rechazar',
        id_validador: idEmpleado,
        motivo_rechazo: motivo
      }, getAuthHeaders());

      cargarEvidencias();
    } catch (error) {
      console.error('Error al rechazar la evidencia:', error);
      alert('Error al rechazar: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEliminarClick = (evidencia) => {
    setEvidenciaToDelete(evidencia);
    setShowDeleteModal(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!evidenciaToDelete) return;

    try {
      await axios.delete(`${API_URL}/evidencias/${evidenciaToDelete.id}`, getAuthHeaders());
      setShowDeleteModal(false);
      setEvidenciaToDelete(null);
      cargarEvidencias();
    } catch (error) {
      console.error('Error al eliminar evidencia:', error);
      alert('Error al eliminar la evidencia: ' + (error.response?.data?.message || error.message));
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

  const camposConOpciones = FORM_CAMPOS_EVIDENCIA;

  if (loading && evidencias.length === 0) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p className="mt-2">Cargando evidencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Evidencias</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar por nombre de archivo..."
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
            <option value="pendiente">Pendiente</option>
            <option value="validada">Validada</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>

        <PrimaryButton
          text="Nueva evidencia"
          icon={<AddCircleOutlinedIcon />}
          onClick={handleNuevaEvidencia}
        />
      </div>

      {/* Sugerencias de siniestros mientras se busca en el modal */}
      {showModal && siniestrosOptions.length > 0 && (
        <div className="siniestro-sugerencias">
          {siniestrosOptions.map(op => (
            <div key={op.value} onClick={() => handleSeleccionarSiniestro(op)}>
              {op.label}
            </div>
          ))}
        </div>
      )}

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={evidencias}
          campos={campos}
          acciones={[
            {
              titulo: "Ver detalle",
              clase: "tabla-btn-ver",
              icono: <VisibilityIcon fontSize="small" />,
              onClick: handleVerDetalle
            },
            {
              titulo: "Descargar",
              clase: "tabla-btn-ver",
              icono: <DownloadIcon fontSize="small" />,
              onClick: handleDescargar
            },
            {
              titulo: "Validar",
              clase: "tabla-btn-edit",
              icono: <CheckCircleIcon fontSize="small" />,
              onClick: handleValidar,
              mostrarSi: (e) => e.estatus_validacion === 'pendiente'
            },
            {
              titulo: "Rechazar",
              clase: "tabla-btn-del",
              icono: <CancelIcon fontSize="small" />,
              onClick: handleRechazar,
              mostrarSi: (e) => e.estatus_validacion === 'pendiente'
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
            }
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
  onClose={cerrarModal}
  onSave={handleGuardar}
  editando={!!editingEvidencia}
  titulo={editingEvidencia ? "Editar evidencia" : "Agregar nueva evidencia"}
  subtitulo={editingEvidencia ? "Modifica la categoría o descripción" : "Busca el siniestro y sube el archivo de evidencia"}
  btnTexto={editingEvidencia ? "Guardar cambios" : "Subir evidencia"}
  campos={camposConOpciones}
  formData={formData}
  onChange={handleInputChange}
  dropdowns={{
    siniestro_buscar: {
      options: siniestrosOptions,
      onSelect: handleSeleccionarSiniestro
    }
  }}
/>

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setEvidenciaToDelete(null); }}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar evidencia"
        subtitle="¿Deseas eliminar este archivo de evidencia del sistema?"
      >
        {evidenciaToDelete && (
          <div>
            <p><strong>{evidenciaToDelete.nombre_archivo}</strong></p>
            <p>Siniestro: {evidenciaToDelete.siniestro || "—"}</p>
            <p>Tipo: {evidenciaToDelete.tipo || "—"}</p>
            <p>Estatus: {evidenciaToDelete.estatus_validacion || "—"}</p>
          </div>
        )}
      </ConfirmDeleteModal>

      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => { setShowDetalleModal(false); setEvidenciaDetalle(null); }}
        titulo={evidenciaDetalle ? evidenciaDetalle.nombre_archivo : ""}
        subtitulo={evidenciaDetalle ? (evidenciaDetalle.siniestro?.numero_siniestro || "") : ""}
        avatar="E"
        items={evidenciaDetalle?.items || []}
      />
    </div>
  );
};

export default Evidencias;