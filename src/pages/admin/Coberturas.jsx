import { useState, useEffect } from "react";
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

// Componentes
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";

const API_URL = "http://localhost:8000/api/coberturas";

// Definición de columnas y campos para la tabla
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

// Configuración de campos para el formulario (Crear/Editar)
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

const Cobertura = () => {
  // Estados del componente
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

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        // Ordenar por ID de menor a mayor
        const sortedData = data.sort((a, b) => a.id - b.id);
        setCoberturas(sortedData);
      }
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    });
    setShowModal(true);
  };

  const handleEditar = (item) => {
    setEditingCobertura(item);
    const dataForModal = { ...item };
    // Limpieza de nulos para inputs
    const camposNum = [
      "deducible",
      "porcentaje_deducible",
      "porcentaje_cobertura",
      "monto_minimo",
      "monto_maximo",
      "monto_maximo_siniestro",
    ];
    camposNum.forEach((f) => {
      if (dataForModal[f] === null || dataForModal[f] === undefined)
        dataForModal[f] = "";
    });
    setFormData(dataForModal);
    setShowModal(true);
  };

  const handleVerDetalle = (item) => {
    setCoberturaDetalle(item);
    setShowDetalleModal(true);
  };

  const handleGuardar = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const isEdit = !!editingCobertura;
    const url = isEdit ? `${API_URL}/${editingCobertura.id}` : API_URL;

    // Preparar datos para el envío (convertir vacíos a null)
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
      if (dataToSubmit[field] === "" || dataToSubmit[field] === undefined) {
        dataToSubmit[field] = null;
      }
    });

    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getHeaders(),
        body: JSON.stringify(dataToSubmit),
      });

      if (response.ok) {
        setShowModal(false);
        fetchData();
      } else {
        const errorData = await response.json();
        alert(
          "Error al guardar: " +
            JSON.stringify(errorData.errors || errorData.message),
        );
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  const filtered = coberturas.filter((c) =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
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
          value: coberturaDetalle.estatus.toUpperCase(),
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
            coberturaDetalle.deducible === 0
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
          value: coberturaDetalle.tipo_calculo.replace("_", " "),
        },
        {
          icon: <FactCheckIcon />,
          label: "Aplica Sobre",
          value: coberturaDetalle.aplica_sobre.replace("_", " "),
        },
      ]
    : [];

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
        <PrimaryButton
          text="Nueva Cobertura"
          icon={<AddCircleOutlinedIcon />}
          onClick={handleNuevo}
        />
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          // Datos limpios para la tabla (Sin signos de peso duplicados)
          data={paginated.map((c) => ({
            ...c,
            monto_minimo: c.monto_minimo || "0",
            monto_maximo: c.monto_maximo || "0",
            deducible:
              c.deducible === null || c.deducible === 0
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
        {loading && <p className="text-center mt-3">Cargando...</p>}
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
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          try {
            const response = await fetch(`${API_URL}/${coberturaToDelete.id}`, {
              method: "DELETE",
              headers: getHeaders(),
            });
            if (response.ok) {
              setShowDeleteModal(false);
              fetchData();
            }
          } catch (error) {
            console.error("Error al eliminar:", error);
          }
        }}
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
        avatar={coberturaDetalle ? coberturaDetalle.nombre.charAt(0) : "C"}
        items={detalleItems}
      />
    </div>
  );
};

export default Cobertura;
