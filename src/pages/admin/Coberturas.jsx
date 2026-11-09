import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../../css/Clientes.css";

// Iconos
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PercentIcon from "@mui/icons-material/Percent";
import DescriptionIcon from "@mui/icons-material/Description";
import SettingsIcon from "@mui/icons-material/Settings";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import NumbersIcon from "@mui/icons-material/Numbers";
import RuleIcon from "@mui/icons-material/Rule";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Componentes
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";
import DescargarModal from "../../components/DescargarModal";

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/coberturas`
  : "/api/coberturas";

const AVISO_EXITO_MS = 3500;
const SIN_CONEXION = "No hay conexión con el servidor.";

// Configuración de headers para Axios
const getAuthConfig = () => ({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// Extrae un mensaje legible de un error de axios
const mensajeError = (error, defecto) => {
  if (!error.response) return SIN_CONEXION;
  const data = error.response.data || {};
  const detalle = data.errors ? Object.values(data.errors).flat().join("\n") : null;
  return detalle || data.message || defecto;
};

const columnas = [
  "Nombre",
  "Descripción",
  "Monto Min",
  "Monto Max",
  "Deducible",
  "Estatus",
  "Acciones",
];

const campos = [
  "nombre",
  "descripcion",
  "monto_minimo",
  "monto_maximo",
  "deducible",
  "estatus",
];

const FORM_CAMPOS = [
  { label: "Nombre", name: "nombre", type: "text" },
  { label: "Descripción", name: "descripcion", type: "text" },
  { label: "Monto Mínimo", name: "monto_minimo", type: "number" },
  { label: "Monto Máximo", name: "monto_maximo", type: "number" },
  {
    label: "Monto Máximo Siniestro",
    name: "monto_maximo_siniestro",
    type: "number",
  },
  { label: "Deducible (Monto Fijo)", name: "deducible", type: "number" },
  {
    label: "Deducible (Porcentaje %)",
    name: "porcentaje_deducible",
    type: "number",
  },
  {
    label: "Porcentaje Cobertura (%)",
    name: "porcentaje_cobertura",
    type: "number",
  },
  {
    label: "Tipo de Cálculo",
    name: "tipo_calculo",
    type: "select",
    options: [
      { value: "monto_fijo", label: "Monto Fijo" },
      { value: "porcentaje", label: "Porcentaje" },
      { value: "mixto", label: "Mixto" },
    ],
  },
  {
    label: "Aplica Sobre",
    name: "aplica_sobre",
    type: "select",
    options: [
      { value: "valor_bien", label: "Valor del Bien" },
      { value: "suma_asegurada", label: "Suma Asegurada" },
      { value: "monto_reclamado", label: "Monto Reclamado" },
    ],
  },
  {
    label: "Estatus",
    name: "estatus",
    type: "select",
    options: [
      { value: "activa", label: "Activo" },
      { value: "inactiva", label: "Inactivo" },
    ],
  },
];

// Tipos de siniestro a los que puede aplicar una cobertura
const TIPOS = [
  ["robo", "Robo"],
  ["accidente", "Accidente"],
  ["incendio", "Incendio"],
  ["inundacion", "Inundación"],
  ["responsabilidad_civil", "Resp. civil"],
  ["fallecimiento", "Fallecimiento"],
  ["invalidez", "Invalidez"],
  ["otro", "Otro"],
];

const Cobertura = () => {
  const [coberturas, setCoberturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  const [coberturaToDelete, setCoberturaToDelete] = useState(null);
  const [coberturaDetalle, setCoberturaDetalle] = useState(null);
  const [editingCobertura, setEditingCobertura] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({});
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showDescarga, setShowDescarga] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: 'exito' | 'error', titulo, mensaje }

  const mostrarAviso = useCallback((tipo, titulo, mensaje) => {
    setAviso({ tipo, titulo, mensaje });
  }, []);

  // Los avisos de éxito se cierran solos
  useEffect(() => {
    if (aviso?.tipo !== "exito") return;
    const t = setTimeout(() => setAviso(null), AVISO_EXITO_MS);
    return () => clearTimeout(t);
  }, [aviso]);

  // GET: Obtener coberturas
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL, getAuthConfig());
      const data = Array.isArray(response.data) ? response.data : [];
      const sortedData = data.sort((a, b) => a.id - b.id);
      setCoberturas(sortedData);
    } catch (error) {
      console.error(
        "Error al obtener datos:",
        error.response?.data || error.message
      );
      mostrarAviso(
        "error",
        "No se pudieron cargar las coberturas",
        mensajeError(error, "Ocurrió un error al cargar las coberturas.")
      );
    } finally {
      setLoading(false);
    }
  }, [mostrarAviso]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNuevo = () => {
    setEditingCobertura(null);
    setFormData({
      id_aseguradora: 1,
      nombre: "",
      descripcion: "",
      estatus: "activa",
      tipo_calculo: "monto_fijo",
      aplica_sobre: "valor_bien",
      monto_minimo: "",
      monto_maximo: "",
      monto_maximo_siniestro: "",
      porcentaje_deducible: "",
      deducible: "",
      porcentaje_cobertura: "",
      tipos_siniestro: [],
    });
    setShowModal(true);
  };

  const handleEditar = (item) => {
    setEditingCobertura(item);
    const dataForModal = { ...item };
    const camposNum = [
      "deducible",
      "porcentaje_deducible",
      "porcentaje_cobertura",
      "monto_minimo",
      "monto_maximo",
      "monto_maximo_siniestro",
    ];
    camposNum.forEach((f) => {
      if (dataForModal[f] === null || dataForModal[f] === undefined) {
        dataForModal[f] = "";
      }
    });
    if (!Array.isArray(dataForModal.tipos_siniestro)) {
      dataForModal.tipos_siniestro = [];
    }
    setFormData(dataForModal);
    setShowModal(true);
  };

  const handleVerDetalle = (item) => {
    setCoberturaDetalle(item);
    setShowDetalleModal(true);
  };

  // POST / PUT: Guardar registro enviando 0 si el campo se deja vacío
  const handleGuardar = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);

    const isEdit = !!editingCobertura;
    const url = isEdit ? `${API_URL}/${editingCobertura.id}` : API_URL;

    const dataToSubmit = { ...formData };
    const numericFields = [
      "deducible",
      "porcentaje_deducible",
      "porcentaje_cobertura",
      "monto_minimo",
      "monto_maximo",
      "monto_maximo_siniestro",
    ];

    numericFields.forEach((field) => {
      const val = dataToSubmit[field];
      if (val === "" || val === undefined || val === null || Number.isNaN(val)) {
        dataToSubmit[field] = 0;
      } else {
        dataToSubmit[field] = Number(val);
      }
    });

    try {
      if (isEdit) {
        await axios.put(url, dataToSubmit, getAuthConfig());
      } else {
        await axios.post(url, dataToSubmit, getAuthConfig());
      }

      setShowModal(false);
      fetchData();
      mostrarAviso(
        "exito",
        isEdit ? "Cobertura actualizada" : "Cobertura creada",
        isEdit
          ? "Los cambios se guardaron correctamente."
          : "La cobertura se guardó correctamente."
      );
    } catch (error) {
      console.error("Error API:", error.response?.data || error.message);
      mostrarAviso("error", "No se pudo guardar", mensajeError(error, "Error al guardar la cobertura."));
    } finally {
      setLoading(false);
    }
  };

  // DELETE: Eliminar registro
  const handleConfirmDelete = async () => {
    if (!coberturaToDelete) return;
    setLoading(true);

    try {
      await axios.delete(`${API_URL}/${coberturaToDelete.id}`, getAuthConfig());
      setShowDeleteModal(false);
      setCoberturaToDelete(null);
      fetchData();
      mostrarAviso("exito", "Cobertura eliminada", "La cobertura se eliminó correctamente.");
    } catch (error) {
      console.error(
        "Error al eliminar:",
        error.response?.data || error.message
      );
      setShowDeleteModal(false);
      setCoberturaToDelete(null);
      mostrarAviso("error", "No se pudo eliminar", mensajeError(error, "Error al eliminar la cobertura."));
    } finally {
      setLoading(false);
    }
  };

  const filtered = coberturas.filter((c) =>
    (c.nombre || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const detalleItems = coberturaDetalle
    ? [
      {
        icon: <DescriptionIcon />,
        label: "Descripción",
        value: coberturaDetalle.descripcion || "Sin descripción",
      },
      {
        icon: <RuleIcon />,
        label: "Estatus",
        value: coberturaDetalle.estatus
          ? coberturaDetalle.estatus.toUpperCase()
          : "-",
      },
      {
        icon: <NumbersIcon />,
        label: "ID Aseguradora",
        value: coberturaDetalle.id_aseguradora,
      },
      {
        icon: <AttachMoneyIcon />,
        label: "Monto Mínimo",
        value: coberturaDetalle.monto_minimo || "0",
      },
      {
        icon: <AttachMoneyIcon />,
        label: "Monto Máximo",
        value: coberturaDetalle.monto_maximo || "0",
      },
      {
        icon: <AttachMoneyIcon />,
        label: "Monto Máx Siniestro",
        value: coberturaDetalle.monto_maximo_siniestro || "0",
      },
      {
        icon: <AttachMoneyIcon />,
        label: "Deducible (Monto)",
        value:
          coberturaDetalle.deducible === null ||
            coberturaDetalle.deducible === "" ||
            Number(coberturaDetalle.deducible) === 0
            ? "Sin deducible"
            : coberturaDetalle.deducible,
      },
      {
        icon: <PercentIcon />,
        label: "Deducible (%)",
        value: `${coberturaDetalle.porcentaje_deducible || 0}%`,
      },
      {
        icon: <PercentIcon />,
        label: "Cobertura (%)",
        value: `${coberturaDetalle.porcentaje_cobertura || 0}%`,
      },
      {
        icon: <SettingsIcon />,
        label: "Tipo de Cálculo",
        value: coberturaDetalle.tipo_calculo
          ? coberturaDetalle.tipo_calculo.replace("_", " ")
          : "-",
      },
      {
        icon: <FactCheckIcon />,
        label: "Aplica Sobre",
        value: coberturaDetalle.aplica_sobre
          ? coberturaDetalle.aplica_sobre.replace("_", " ")
          : "-",
      },
    ]
    : [];

  if (loading && coberturas.length === 0) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p>Cargando coberturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Listado de Coberturas</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar cobertura..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <PrimaryButton
            text="Descargar"
            icon={<DownloadIcon />}
            onClick={() => setShowDescarga(true)}
          />
          <PrimaryButton
            text="Nueva Cobertura"
            icon={<AddCircleOutlinedIcon />}
            onClick={handleNuevo}
          />
        </div>
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={paginated.map((c) => ({
            ...c,
            monto_minimo: c.monto_minimo || "0",
            monto_maximo: c.monto_maximo || "0",
            deducible:
              c.deducible === null ||
                c.deducible === "" ||
                Number(c.deducible) === 0
                ? "Sin deducible"
                : c.deducible,
          }))}
          campos={campos}
          acciones={[
            {
              titulo: "Ver",
              clase: "tabla-btn-ver",
              icono: <VisibilityIcon fontSize="small" />,
              onClick: handleVerDetalle,
            },
            {
              titulo: "Editar",
              clase: "tabla-btn-edit",
              icono: <EditIcon fontSize="small" />,
              onClick: handleEditar,
            },
            {
              titulo: "Eliminar",
              clase: "tabla-btn-del",
              icono: <DeleteIcon fontSize="small" />,
              onClick: (c) => {
                setCoberturaToDelete(c);
                setShowDeleteModal(true);
              },
            },
          ]}
        />
      </div>

      <Paginacion
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      <EditModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleGuardar}
        titulo={editingCobertura ? "Editar Cobertura" : "Nueva Cobertura"}
        btnTexto={editingCobertura ? "Actualizar" : "Guardar"}
        campos={FORM_CAMPOS}
        formData={formData}
        onChange={handleInputChange}
      >
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            Aplica a estos tipos de siniestro (ninguno marcado = todos)
          </div>
          {TIPOS.map(([v, t]) => (
            <label key={v} style={{ marginRight: 14 }}>
              <input
                type="checkbox"
                checked={(formData.tipos_siniestro || []).includes(v)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipos_siniestro: e.target.checked
                      ? [...(formData.tipos_siniestro || []), v]
                      : (formData.tipos_siniestro || []).filter((x) => x !== v),
                  })
                }
              />{" "}
              {t}
            </label>
          ))}
        </div>
      </EditModal>

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCoberturaToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Cobertura"
        subtitle="¿Estás seguro de que deseas eliminar este registro?"
      >
        {coberturaToDelete && (
          <p>
            <strong>{coberturaToDelete.nombre}</strong>
          </p>
        )}
      </ConfirmDeleteModal>

      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => setShowDetalleModal(false)}
        titulo={coberturaDetalle ? coberturaDetalle.nombre : ""}
        subtitulo={coberturaDetalle ? `ID #${coberturaDetalle.id}` : ""}
        avatar={
          coberturaDetalle?.nombre ? coberturaDetalle.nombre.charAt(0) : "C"
        }
        items={detalleItems}
      />

      <DescargarModal
        open={showDescarga}
        onClose={() => setShowDescarga(false)}
        url={`${import.meta.env.VITE_API_URL || "/api"}/exportar/coberturas`}
        params={{ search: searchTerm }}
        nombreArchivo="coberturas"
        titulo="Descargar listado de coberturas"
      />

      {/* ---------- Aviso (éxito / error) ---------- */}
      {aviso && (
        <div
          className="balam-overlay"
          style={{ zIndex: 3000 }}
          onClick={(e) => e.target === e.currentTarget && setAviso(null)}
        >
          <div className="balam-modal evi-aviso">
            <div className={`evi-aviso-icono ${aviso.tipo}`}>
              {aviso.tipo === "exito"
                ? <CheckCircleIcon style={{ fontSize: 40 }} />
                : <ErrorOutlineIcon style={{ fontSize: 40 }} />}
            </div>
            <h3>{aviso.titulo}</h3>
            <p style={{ whiteSpace: "pre-line" }}>{aviso.mensaje}</p>
            <button className="balam-btn save" onClick={() => setAviso(null)}>Aceptar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cobertura;