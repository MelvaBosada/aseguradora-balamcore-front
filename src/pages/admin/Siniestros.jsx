
 // pages/admin/Siniestros.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/Clientes.css";

// Iconos
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import DateRangeIcon from "@mui/icons-material/DateRange";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import InfoIcon from "@mui/icons-material/Info";
import ReportIcon from "@mui/icons-material/Report";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

// Componentes
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const campos = ["nSiniestro", "tipo", "cliente", "estatus", "prioridad"];
const columnas = [
  "N° Siniestro",
  "Tipo",
  "Cliente",
  "Estatus",
  "Prioridad",
  "Acciones"
];

const FORM_CAMPOS_SINIESTRO = [
  {
    label: "RFC del Cliente",
    name: "rfc_buscar",
    type: "text",
    seccion: "Buscar Cliente",
    fullWidth: true
  },
  {
    label: "Nombre del cliente",
    name: "nombre_cliente",
    type: "text",
    seccion: "Información del Cliente",
    readOnly: true
  },
  {
    label: "Selecciona Póliza",
    name: "id_poliza",
    type: "select",
    options: [],
    seccion: "Información del Cliente",
    required: true
  },
  {
    label: "Selecciona Reporte",
    name: "id_reporte",
    type: "select",
    options: [],
    seccion: "Información del Cliente",
    required: true
  },
  {
    label: "Tipo de Siniestro",
    name: "tipo",
    type: "select",
    options: [
      "robo",
      "accidente",
      "incendio",
      "inundacion",
      "responsabilidad_civil",
      "fallecimiento",
      "invalidez",
      "otro"
    ],
    seccion: "Datos del Siniestro",
    required: true
  },
  {
    label: "Prioridad",
    name: "prioridad",
    type: "select",
    options: ["baja", "media", "alta", "urgente"],
    seccion: "Datos del Siniestro",
    required: true
  },
  {
    label: "Monto Reclamado",
    name: "monto_reclamado",
    type: "number",
    seccion: "Datos del Siniestro",
    required: true
  },
  {
    label: "Deducible Aplicado",
    name: "deducible_aplicado",
    type: "number",
    seccion: "Datos del Siniestro"
  }
];

const FORM_VACIO_SINIESTRO = {
  rfc_buscar: "",
  id_cliente: "",
  nombre_cliente: "",
  id_poliza: "",
  id_reporte: "",
  tipo: "",
  prioridad: "",
  monto_reclamado: "",
  deducible_aplicado: ""
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const Siniestros = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [siniestros, setSiniestros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  const [siniestroToDelete, setSiniestroToDelete] = useState(null);
  const [siniestroDetalle, setSiniestroDetalle] = useState(null);
  const [editingSiniestro, setEditingSiniestro] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(FORM_VACIO_SINIESTRO);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [estatusFilter, setEstatusFilter] = useState("Todos");
  const [totalPages, setTotalPages] = useState(1);

  const [polizasOptions, setPolizasOptions] = useState([]);
  const [reportesOptions, setReportesOptions] = useState([]);

  const timerRfcRef = useRef(null);

  // =========================================================
  // CARGAR SINIESTROS
  // =========================================================
  const cargarSiniestros = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axios.get(`${API_URL}/siniestros`, {
        params: {
          page: currentPage,
          search: searchTerm,
          estatus: estatusFilter,
          per_page: itemsPerPage
        },
        ...getAuthHeaders()
      });

      setSiniestros(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error("Error cargando siniestros:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, estatusFilter, itemsPerPage]);

  useEffect(() => {
    cargarSiniestros();
  }, [cargarSiniestros]);

  // =========================================================
  // NUEVO: CARGAR DATOS DEL REPORTE SELECCIONADO
  // =========================================================
  const cargarDatosPorReporteId = useCallback(
    async (reporteId, idPolizaDesdeReporte) => {
      try {
        const response = await axios.get(
          `${API_URL}/siniestros/reportes/por-id/${reporteId}`,
          getAuthHeaders()
        );

        const data = response.data || {};

        const cliente = data.cliente || {};

        // Identificar el reporte que originó la navegación.
        const reporteActual =
          data.reporte_actual ||
          (data.reportes || []).find(
            (r) => String(r.id) === String(reporteId)
          ) ||
          {};

        // Recuperar la póliza asociada al reporte.
        const idPoliza = String(
          reporteActual.id_poliza ??
          idPolizaDesdeReporte ??
          ""
        );

        // Cargar las pólizas disponibles.
        const polizas = (data.polizas || []).map((p) => ({
          value: String(p.id),
          label: `${p.numero_poliza || p.id} - ${p.tipo || ""}`
        }));

        // Asegurar que la póliza del reporte aparezca en el select.
        if (
          idPoliza &&
          !polizas.some((p) => p.value === idPoliza)
        ) {
          polizas.push({
            value: idPoliza,
            label:
              reporteActual.numero_poliza ||
              `Póliza ${idPoliza}`
          });
        }

        // Cargar los reportes disponibles.
        const reportes = (data.reportes || []).map((r) => ({
          value: String(r.id),
          label: `${
            r.numero_reporte || r.id
          } - Póliza: ${
            r.numero_poliza || r.id_poliza || ""
          } - ${
            r.fecha_reporte || ""
          }`,
          id_poliza: r.id_poliza
        }));

        // Asegurar que el reporte seleccionado esté disponible.
        if (
          !reportes.some(
            (r) => r.value === String(reporteId)
          )
        ) {
          reportes.push({
            value: String(reporteId),
            label: `Reporte ${reporteId}`,
            id_poliza: idPoliza
          });
        }

        setPolizasOptions(polizas);
        setReportesOptions(reportes);

        // Precargar el formulario con los datos del reporte.
        setFormData({
          ...FORM_VACIO_SINIESTRO,
          rfc_buscar:
            cliente.rfc ||
            data.cliente_rfc ||
            "",
          id_cliente:
            cliente.id ??
            data.id_cliente ??
            "",
          nombre_cliente: [
            cliente.nombre || data.nombre_cliente || "",
            cliente.apellido || data.apellido_cliente || ""
          ]
            .filter(Boolean)
            .join(" "),
          id_poliza: idPoliza,
          id_reporte: String(reporteId)
        });

        setEditingSiniestro(null);
        setShowModal(true);
      } catch (error) {
        console.error(
          "Error al cargar los datos del reporte:",
          error.response?.data || error
        );

        alert(
          "No se pudieron cargar los datos del reporte. Verifica la conexión con el servidor."
        );
      }
    },
    []
  );

  // =========================================================
  // NUEVO: RECIBIR EL REPORTE DESDE EL MÓDULO DE REPORTES
  // =========================================================
  useEffect(() => {
    const state = location.state;

    if (state?.reporteId) {
      const reporteId = state.reporteId;
      const idPoliza = state.id_poliza;

      // Limpiar el estado para evitar abrir el modal otra vez
      // cuando se regrese a esta pantalla.
      navigate(location.pathname, {
        replace: true,
        state: null
      });

      cargarDatosPorReporteId(reporteId, idPoliza);
    }
  }, [
    location.state,
    location.pathname,
    navigate,
    cargarDatosPorReporteId
  ]);

  // =========================================================
  // CARGAR REPORTES Y PÓLIZAS POR RFC
  // =========================================================
  const cargarReportesPorRfc = async (rfc) => {
    if (!rfc || rfc.length < 8) return;

    try {
      const response = await axios.get(
        `${API_URL}/siniestros/reportes/por-rfc`,
        {
          params: { rfc },
          ...getAuthHeaders()
        }
      );

      const data = response.data || {};

      if (data.reportes && data.reportes.length > 0) {
        setReportesOptions(
          data.reportes.map((r) => ({
            value: String(r.id),
            label: `${
              r.numero_reporte || r.id
            } - Póliza: ${
              r.numero_poliza || ""
            }`,
            id_poliza: r.id_poliza
          }))
        );

        setPolizasOptions(
          (data.polizas || []).map((p) => ({
            value: String(p.id),
            label: `${
              p.numero_poliza || p.id
            } - ${p.tipo || ""}`
          }))
        );
      } else {
        setReportesOptions([]);
        setPolizasOptions([]);
      }

      setFormData((prev) => ({
        ...prev,
        id_cliente: data.cliente?.id || "",
        nombre_cliente: data.cliente
          ? `${data.cliente.nombre || ""} ${
              data.cliente.apellido || ""
            }`.trim()
          : "Cliente no encontrado",
        id_poliza: "",
        id_reporte: ""
      }));
    } catch (error) {
      console.error(
        "Error al cargar reportes por RFC:",
        error
      );

      setReportesOptions([]);
      setPolizasOptions([]);
    }
  };

  // =========================================================
  // CARGAR REPORTES POR PÓLIZA
  // =========================================================
  const cargarReportesPorPoliza = async (polizaId) => {
    if (!polizaId) return;

    try {
      const response = await axios.get(
        `${API_URL}/siniestros/reportes/por-poliza/${polizaId}`,
        getAuthHeaders()
      );

      if (
        response.data &&
        response.data.length > 0
      ) {
        setReportesOptions(
          response.data.map((r) => ({
            value: String(r.id),
            label: `${
              r.numero_reporte || r.id
            } - ${
              r.fecha_reporte || ""
            } - ${
              r.estado || ""
            }`,
            id_poliza: r.id_poliza || polizaId
          }))
        );
      } else {
        setReportesOptions([]);
      }
    } catch (error) {
      console.error(
        "Error al cargar reportes:",
        error
      );

      setReportesOptions([]);
    }
  };

  // =========================================================
  // CAMBIO DEL RFC
  // =========================================================
  const handleRfcChange = (e) => {
    const rfc = e.target.value;

    setFormData((prev) => ({
      ...prev,
      rfc_buscar: rfc
    }));

    if (timerRfcRef.current) {
      clearTimeout(timerRfcRef.current);
    }

    timerRfcRef.current = setTimeout(() => {
      if (rfc.length >= 8) {
        cargarReportesPorRfc(rfc);
      }
    }, 500);
  };

  // =========================================================
  // CAMBIO DE CAMPOS DEL FORMULARIO
  // =========================================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === "id_poliza") {
      // Al cambiar la póliza, cargar sus reportes.
      setFormData((prev) => ({
        ...prev,
        id_reporte: ""
      }));

      cargarReportesPorPoliza(value);
    }

    if (name === "id_reporte") {
      // Si se cambia el reporte, seleccionar su póliza asociada.
      const reporteSeleccionado = reportesOptions.find(
        (r) => String(r.value) === String(value)
      );

      if (reporteSeleccionado?.id_poliza) {
        setFormData((prev) => ({
          ...prev,
          id_poliza: String(reporteSeleccionado.id_poliza)
        }));
      }
    }
  };

  // =========================================================
  // CERRAR MODAL
  // =========================================================
  const cerrarModal = () => {
    setShowModal(false);
    setEditingSiniestro(null);
    setFormData({ ...FORM_VACIO_SINIESTRO });
    setPolizasOptions([]);
    setReportesOptions([]);

    if (timerRfcRef.current) {
      clearTimeout(timerRfcRef.current);
    }
  };

  // =========================================================
  // NUEVO SINIESTRO
  // =========================================================
  const handleNuevoSiniestro = () => {
    cerrarModal();
    setShowModal(true);
  };

  // =========================================================
  // EDITAR SINIESTRO
  // =========================================================
  const handleEditar = async (siniestro) => {
    const id = siniestro.id || siniestro.id_siniestro;

    if (!id) {
      console.error(
        "No se pudo identificar el ID del siniestro:",
        siniestro
      );
      return;
    }

    try {
      const res = await axios.get(
        `${API_URL}/siniestros/${id}`,
        getAuthHeaders()
      );

      const data = res.data || {};

      if (data.reportes) {
        setReportesOptions(
          data.reportes.map((r) => ({
            value: String(r.id),
            label: `${
              r.numero_reporte || r.id
            } - Póliza: ${
              r.numero_poliza || ""
            }`,
            id_poliza: r.id_poliza
          }))
        );
      }

      if (data.polizas) {
        setPolizasOptions(
          data.polizas.map((p) => ({
            value: String(p.id),
            label: `${
              p.numero_poliza || p.id
            } - ${p.tipo || ""}`
          }))
        );
      }

      const polizaIdVal =
        data.id_poliza ||
        data.poliza_id ||
        "";

      if (
        polizaIdVal &&
        (!data.reportes || data.reportes.length === 0)
      ) {
        await cargarReportesPorPoliza(polizaIdVal);
      }

      setFormData({
        rfc_buscar:
          data.cliente_rfc ||
          data.rfc ||
          "",
        id_cliente:
          data.id_cliente ||
          data.cliente_id ||
          "",
        nombre_cliente:
          data.cliente ||
          data.nombre_cliente ||
          "",
        id_poliza: String(polizaIdVal),
        id_reporte: String(
          data.id_reporte ||
          data.reporte_id ||
          ""
        ),
        tipo: (data.tipo || "").toLowerCase(),
        prioridad: (data.prioridad || "").toLowerCase(),
        monto_reclamado: data.monto_reclamado ?? "",
        deducible_aplicado: data.deducible_aplicado ?? ""
      });

      setEditingSiniestro(siniestro);
      setShowModal(true);
    } catch (error) {
      console.error(
        "Error al obtener siniestro para editar:",
        error
      );

      alert(
        "Error al obtener datos del siniestro para editar"
      );
    }
  };

  // =========================================================
  // GUARDAR SINIESTRO
  // =========================================================
  const handleGuardar = async () => {
    if (!formData.id_reporte) {
      alert("Debes seleccionar un reporte");
      return;
    }

    if (
      formData.monto_reclamado === "" ||
      formData.monto_reclamado === null
    ) {
      alert("Debes ingresar el monto reclamado");
      return;
    }

    try {
      const dataToSend = {
        id_reporte: parseInt(formData.id_reporte, 10),
        tipo: formData.tipo,
        prioridad: formData.prioridad,
        monto_reclamado: parseFloat(
          formData.monto_reclamado
        ),
        deducible_aplicado:
          formData.deducible_aplicado !== "" &&
          formData.deducible_aplicado !== null
            ? parseFloat(formData.deducible_aplicado)
            : null
      };

      const idToEdit =
        editingSiniestro?.id ||
        editingSiniestro?.id_siniestro;

      if (editingSiniestro && idToEdit) {
        await axios.put(
          `${API_URL}/siniestros/${idToEdit}`,
          dataToSend,
          getAuthHeaders()
        );
      } else {
        await axios.post(
          `${API_URL}/siniestros`,
          dataToSend,
          getAuthHeaders()
        );
      }

      cerrarModal();
      await cargarSiniestros();
    } catch (error) {
      console.error(
        "Error al guardar el siniestro:",
        error
      );

      alert(
        "Error al guardar: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // =========================================================
  // VER DETALLE DEL SINIESTRO
  // =========================================================
  const handleVerDetalle = async (siniestro) => {
    const id = siniestro.id || siniestro.id_siniestro;

    let data = siniestro;

    try {
      if (id) {
        const res = await axios.get(
          `${API_URL}/siniestros/${id}`,
          getAuthHeaders()
        );

        data = res.data;
      }
    } catch (error) {
      console.warn(
        "No se pudieron obtener detalles extendidos de la API. Se usarán los datos locales:",
        error
      );
    }

    const items = [
      {
        icon: <AssignmentIcon />,
        label: "N° Siniestro",
        value:
          data.numero_siniestro ||
          data.nSiniestro ||
          "—"
      },
      {
        icon: <ReportIcon />,
        label: "Tipo",
        value: data.tipo || "—"
      },
      {
        icon: <InfoIcon />,
        label: "Estatus",
        value: data.estatus || "—"
      },
      {
        icon: <PriorityHighIcon />,
        label: "Prioridad",
        value: data.prioridad || "—"
      },
      {
        icon: <AttachMoneyIcon />,
        label: "Monto Reclamado",
        value: data.monto_reclamado
          ? `$${Number(
              data.monto_reclamado
            ).toLocaleString()}`
          : "—"
      },
      {
        icon: <AttachMoneyIcon />,
        label: "Deducible Aplicado",
        value: data.deducible_aplicado
          ? `$${Number(
              data.deducible_aplicado
            ).toLocaleString()}`
          : "—"
      },
      {
        icon: <DateRangeIcon />,
        label: "Fecha de Creación",
        value: data.fecha_creacion || "—"
      },
      {
        icon: <DateRangeIcon />,
        label: "Fecha de Cierre",
        value: data.fecha_cierre || "—"
      },
      {
        icon: <AssignmentIcon />,
        label: "Motivo de Cierre",
        value: data.motivo_cierre || "—"
      },
      {
        icon: <PersonIcon />,
        label: "Cliente",
        value: data.cliente || "—"
      },
      {
        icon: <AssignmentIcon />,
        label: "Póliza",
        value: data.poliza || "—"
      }
    ];

    setSiniestroDetalle({
      ...data,
      items
    });

    setShowDetalleModal(true);
  };

  // =========================================================
  // ELIMINAR SINIESTRO
  // =========================================================
  const handleEliminarClick = (siniestro) => {
    setSiniestroToDelete(siniestro);
    setShowDeleteModal(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!siniestroToDelete) return;

    const id =
      siniestroToDelete.id ||
      siniestroToDelete.id_siniestro;

    if (!id) {
      alert("No se encontró el ID del registro a eliminar");
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/siniestros/${id}`,
        getAuthHeaders()
      );

      setShowDeleteModal(false);
      setSiniestroToDelete(null);

      await cargarSiniestros();
    } catch (error) {
      console.error(
        "Error al eliminar siniestro:",
        error
      );

      alert(
        "Error al eliminar el siniestro: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // =========================================================
  // BÚSQUEDA Y PAGINACIÓN
  // =========================================================
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (newItems) => {
    setItemsPerPage(newItems);
    setCurrentPage(1);
  };

  // Preparar las opciones de los selects del formulario.
  const camposConOpciones = FORM_CAMPOS_SINIESTRO.map(
    (campo) => {
      if (campo.name === "id_poliza") {
        return {
          ...campo,
          options: polizasOptions
        };
      }

      if (campo.name === "id_reporte") {
        return {
          ...campo,
          options: reportesOptions
        };
      }

      return campo;
    }
  );

  // =========================================================
  // PANTALLA DE CARGA
  // =========================================================
  if (loading && siniestros.length === 0) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p className="mt-2">Cargando siniestros...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // VISTA PRINCIPAL
  // =========================================================
  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Siniestros</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>

          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />

            <input
              type="text"
              className="search-custom"
              placeholder="Buscar número de siniestro..."
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
            <option value="abierto">Abierto</option>
            <option value="en_proceso">En proceso</option>
            <option value="en_evaluacion">En evaluación</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>

        <PrimaryButton
          text="Nuevo siniestro"
          icon={<AddCircleOutlinedIcon />}
          onClick={handleNuevoSiniestro}
        />
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={siniestros}
          campos={campos}
          acciones={[
            {
              titulo: "Ver detalle",
              clase: "tabla-btn-ver",
              icono: <VisibilityIcon fontSize="small" />,
              onClick: handleVerDetalle
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

      {/* FORMULARIO DE SINIESTROS */}
      <EditModal
        open={showModal}
        onClose={cerrarModal}
        onSave={handleGuardar}
        editando={!!editingSiniestro}
        titulo={
          editingSiniestro
            ? "Editar siniestro"
            : "Agregar nuevo siniestro"
        }
        subtitulo={
          editingSiniestro
            ? "Modifica los datos del siniestro"
            : "Ingresa el RFC del cliente y los datos del siniestro"
        }
        btnTexto={
          editingSiniestro
            ? "Guardar cambios"
            : "Agregar siniestro"
        }
        campos={camposConOpciones}
        formData={formData}
        onChange={handleInputChange}
        customHandlers={{
          onRfcChange: handleRfcChange
        }}
      />

      {/* CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSiniestroToDelete(null);
        }}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar siniestro"
        subtitle="¿Deseas eliminar este siniestro del sistema?"
      >
        {siniestroToDelete && (
          <div>
            <p>
              <strong>
                Siniestro #
                {siniestroToDelete.nSiniestro ||
                  siniestroToDelete.numero_siniestro ||
                  siniestroToDelete.id}
              </strong>
            </p>

            <p>
              Cliente: {siniestroToDelete.cliente || "—"}
            </p>

            <p>
              Tipo: {siniestroToDelete.tipo || "—"}
            </p>

            <p>
              Estatus: {siniestroToDelete.estatus || "—"}
            </p>
          </div>
        )}
      </ConfirmDeleteModal>

      {/* DETALLE DEL SINIESTRO */}
      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => {
          setShowDetalleModal(false);
          setSiniestroDetalle(null);
        }}
        titulo={
          siniestroDetalle
            ? `Siniestro #${
                siniestroDetalle.numero_siniestro ||
                siniestroDetalle.nSiniestro ||
                siniestroDetalle.id
              }`
            : ""
        }
        subtitulo={
          siniestroDetalle
            ? siniestroDetalle.cliente || ""
            : ""
        }
        avatar="S"
        items={siniestroDetalle?.items || []}
      />
    </div>
  );
};

export default Siniestros;
