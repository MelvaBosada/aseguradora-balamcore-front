import { useState, useEffect } from "react";
import "../../css/Clientes.css";

// Iconos
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CategoryIcon from "@mui/icons-material/Category";
import BrandingWatermarkIcon from "@mui/icons-material/BrandingWatermark";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";

// Componentes
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";

const API_URL = "http://localhost:8000/api/bienes";

const columnas = [
  "Tipo",
  "Descripción",
  "Modelo",
  "Marca",
  "# de Serie",
  "Valor",
  "Estado",
  "Acciones",
];

// IMPORTANTE: Mantenemos "valor" aquí para que TablaForm reciba el dato,
// pero lo formatearemos antes de enviarlo al componente.
const campos = [
  "tipo",
  "descripcion",
  "modelo",
  "marca",
  "numero_serie",
  "valor",
  "estado_bienes",
];

const CAMPOS_ESPECIFICOS = {
  vehiculo: [
    {
      label: "Tipo Vehículo",
      name: "tipo_vehiculo",
      type: "select",
      options: [
        { value: "sedan", label: "Sedán" },
        { value: "suv", label: "SUV" },
        { value: "pickup", label: "Pick-up" },
        { value: "motocicleta", label: "Motocicleta" },
        { value: "camion", label: "Camión" },
        { value: "van", label: "Van" },
        { value: "otro", label: "Otro" },
      ],
    },
    { label: "Año", name: "año", type: "number" },
    { label: "Color", name: "color", type: "text" },
    { label: "Placas", name: "numero_placas", type: "text" },
    { label: "Número Motor", name: "numero_motor", type: "text" },
    { label: "VIN", name: "numero_vin", type: "text" },
    {
      label: "Combustible",
      name: "tipo_combustible",
      type: "select",
      options: [
        { value: "gasolina", label: "Gasolina" },
        { value: "diesel", label: "Diesel" },
        { value: "electrico", label: "Eléctrico" },
        { value: "hibrido", label: "Híbrido" },
        { value: "gas", label: "Gas" },
      ],
    },
    {
      label: "Uso Vehículo",
      name: "uso_vehiculo",
      type: "select",
      options: [
        { value: "particular", label: "Particular" },
        { value: "comercial", label: "Comercial" },
        { value: "publico", label: "Público" },
        { value: "carga", label: "Carga" },
      ],
    },
  ],
  inmueble: [
    {
      label: "Tipo Inmueble",
      name: "tipo_inmueble",
      type: "select",
      options: [
        { value: "casa", label: "Casa" },
        { value: "departamento", label: "Departamento" },
        { value: "local_comercial", label: "Local Comercial" },
        { value: "bodega", label: "Bodega" },
        { value: "terreno", label: "Terreno" },
        { value: "oficina", label: "Oficina" },
      ],
    },
    {
      label: "Uso Inmueble",
      name: "uso_inmueble",
      type: "select",
      options: [
        { value: "habitacional", label: "Habitacional" },
        { value: "comercial", label: "Comercial" },
        { value: "mixto", label: "Mixto" },
        { value: "industrial", label: "Industrial" },
      ],
    },
    { label: "Colonia", name: "colonia", type: "text" },
    { label: "Núm. Exterior", name: "numero_exterior", type: "text" },
    { label: "Núm. Interior", name: "numero_interior", type: "text" },
    { label: "Metros Cuadrados", name: "metros_cuadrados", type: "number" },
    { label: "Núm. Pisos", name: "num_pisos", type: "number" },
    {
      label: "Construcción",
      name: "tipo_construccion",
      type: "select",
      options: [
        { value: "concreto", label: "Concreto" },
        { value: "madera", label: "Madera" },
        { value: "adobe", label: "Adobe" },
        { value: "metal", label: "Metal" },
        { value: "mixto", label: "Mixto" },
      ],
    },
    { label: "Año Construcción", name: "año_construccion", type: "number" },
    { label: "Número Escritura", name: "numero_escritura", type: "text" },
    { label: "Ubicación", name: "ubicacion", type: "text" },
  ],
  electronico: [
    {
      label: "Tipo Electrónico",
      name: "tipo_electronico",
      type: "select",
      options: [
        { value: "celular", label: "Celular" },
        { value: "laptop", label: "Laptop" },
        { value: "tablet", label: "Tablet" },
        { value: "camara", label: "Cámara" },
        { value: "televisor", label: "Televisor" },
        { value: "otro", label: "Otro" },
      ],
    },
    { label: "Número IMEI", name: "numero_imei", type: "text" },
    { label: "Color Electrónico", name: "color_electronico", type: "text" },
  ],
  maquinaria: [
    {
      label: "Tipo Maquinaria",
      name: "tipo_maquinaria",
      type: "select",
      options: [
        { value: "agricola", label: "Agrícola" },
        { value: "construccion", label: "Construcción" },
        { value: "industrial", label: "Industrial" },
        { value: "medica", label: "Médica" },
        { value: "otro", label: "Otro" },
      ],
    },
    {
      label: "Uso Maquinaria",
      name: "uso_maquinaria",
      type: "select",
      options: [
        { value: "propio", label: "Propio" },
        { value: "rentado", label: "Rentado" },
        { value: "leasing", label: "Leasing" },
      ],
    },
    { label: "Ubicación Operación", name: "ubicacion_operacion", type: "text" },
  ],
};

const FORM_VACIO = {
  id_aseguradora: 1,
  id_cliente: 1,
  id_poliza: 1,
  tipo: "vehiculo",
  marca: "",
  modelo: "",
  numero_serie: "",
  descripcion: "",
  valor: "",
  fecha_adquisicion: new Date().toISOString().split("T")[0],
  estado_bienes: "bueno",
  nivel_riesgo: "bajo",
  numero_factura: "",
  proveedor: "",
};

const Bienes = () => {
  const [bienes, setBienes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  const [bienToDelete, setBienToDelete] = useState(null);
  const [bienDetalle, setBienDetalle] = useState(null);
  const [editingBien, setEditingBien] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(FORM_VACIO);
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
        const finalData = Array.isArray(data) ? data : data.data || [];

        // 1. ORDENAR POR ID (De mayor a menor)
        setBienes(finalData.sort((a, b) => b.id - a.id));
      }
    } catch (error) {
      console.error("Error al cargar bienes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNuevoBien = () => {
    setEditingBien(null);
    setFormData(FORM_VACIO);
    setShowModal(true);
  };

  const handleEditar = (item) => {
    setEditingBien(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleGuardar = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);

    const dataAEnviar = {
      ...formData,
      valor: formData.valor ? parseFloat(formData.valor) : 0,
    };

    const isEdit = !!editingBien;
    const url = isEdit ? `${API_URL}/${editingBien.id}` : API_URL;

    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getHeaders(),
        body: JSON.stringify(dataAEnviar),
      });

      if (response.ok) {
        setShowModal(false);
        fetchData();
      } else {
        const errorData = await response.json();
        alert(
          "Error del servidor: " +
            (errorData.message || JSON.stringify(errorData)),
        );
      }
    } catch (error) {
      console.error("Error en Fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarClick = (item) => {
    setBienToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmarEliminar = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/${bienToDelete.id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (response.ok) {
        setShowDeleteModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (item) => {
    setBienDetalle(item);
    setShowDetalleModal(true);
  };

  const filteredBienes = bienes.filter((b) => {
    const q = searchTerm.toLowerCase();
    return (
      b.tipo?.toLowerCase().includes(q) ||
      b.modelo?.toLowerCase().includes(q) ||
      b.descripcion?.toLowerCase().includes(q) ||
      b.marca?.toLowerCase().includes(q)
    );
  });

  // 2. FORMATEO DE VALOR PARA LA TABLA
  const paginated = filteredBienes
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .map((item) => ({
      ...item,
      valor: `$${parseFloat(item.valor).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    }));

  const camposFormulario = [
    {
      label: "Tipo de Bien",
      name: "tipo",
      type: "select",
      options: [
        { value: "vehiculo", label: "Vehículo" },
        { value: "inmueble", label: "Inmueble" },
        { value: "electronico", label: "Electrónico" },
        { value: "maquinaria", label: "Maquinaria" },
      ],
    },
    { label: "Descripción", name: "descripcion", type: "text" },
    { label: "Marca", name: "marca", type: "text" },
    { label: "Modelo", name: "modelo", type: "text" },
    { label: "# de Serie", name: "numero_serie", type: "text" },
    { label: "Valor Estimado", name: "valor", type: "number" },
    { label: "Fecha Adquisición", name: "fecha_adquisicion", type: "date" },
    {
      label: "Nivel de Riesgo",
      name: "nivel_riesgo",
      type: "select",
      options: [
        { value: "bajo", label: "Bajo" },
        { value: "medio", label: "Medio" },
        { value: "alto", label: "Alto" },
      ],
    },
    {
      label: "Estado Físico",
      name: "estado_bienes",
      type: "select",
      options: [
        { value: "excelente", label: "Excelente" },
        { value: "bueno", label: "Bueno" },
        { value: "regular", label: "Regular" },
        { value: "malo", label: "Malo" },
      ],
    },
    ...(CAMPOS_ESPECIFICOS[formData.tipo] || []),
  ];

  const getDetalleItems = () => {
    if (!bienDetalle) return [];

    // Usamos el valor del objeto original de bienes (que no tiene el $) para el modal
    const original = bienes.find((b) => b.id === bienDetalle.id);
    const valorDisplay = original
      ? `$${parseFloat(original.valor).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
      : `$${bienDetalle.valor}`;

    const items = [
      { icon: <CategoryIcon />, label: "Categoría", value: bienDetalle.tipo },
      {
        icon: <DescriptionIcon />,
        label: "Descripción",
        value: bienDetalle.descripcion,
      },
      {
        icon: <BrandingWatermarkIcon />,
        label: "Marca",
        value: bienDetalle.marca,
      },
      { icon: <DescriptionIcon />, label: "Modelo", value: bienDetalle.modelo },
      {
        icon: <DescriptionIcon />,
        label: "# de Serie",
        value: bienDetalle.numero_serie,
      },
      {
        icon: <AttachMoneyIcon />,
        label: "Valor Estimado",
        value: valorDisplay,
      },
      {
        icon: <CalendarMonthIcon />,
        label: "Adquisición",
        value: bienDetalle.fecha_adquisicion,
      },
      {
        icon: <AssignmentIndIcon />,
        label: "Estado",
        value: bienDetalle.estado_bienes,
      },
    ];

    const configuracion = CAMPOS_ESPECIFICOS[bienDetalle.tipo] || [];
    configuracion.forEach((c) => {
      if (bienDetalle[c.name]) {
        items.push({
          icon: <DescriptionIcon />,
          label: c.label,
          value: bienDetalle[c.name],
        });
      }
    });

    return items;
  };

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Bienes asegurados</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar bienes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <PrimaryButton
          text="Nuevo bien"
          icon={<AddCircleOutlinedIcon />}
          onClick={handleNuevoBien}
        />
      </div>

      <div className="mb-4 position-relative">
        <TablaForm
          columna={columnas}
          data={paginated}
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
              onClick: handleEliminarClick,
            },
          ]}
        />
        {loading && <p className="text-center mt-3">Cargando...</p>}
      </div>

      <Paginacion
        currentPage={currentPage}
        totalPages={Math.ceil(filteredBienes.length / itemsPerPage)}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      <EditModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleGuardar}
        titulo={editingBien ? "Editar bien" : "Agregar nuevo bien"}
        btnTexto={editingBien ? "Guardar cambios" : "Registrar bien"}
        campos={camposFormulario}
        formData={formData}
        onChange={handleInputChange}
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar bien"
        subtitle="¿Deseas eliminar este registro?"
      >
        {bienToDelete && (
          <p>
            <strong>
              {bienToDelete.tipo} - {bienToDelete.modelo}
            </strong>
          </p>
        )}
      </ConfirmDeleteModal>

      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => setShowDetalleModal(false)}
        titulo={bienDetalle ? `${bienDetalle.tipo} ${bienDetalle.marca}` : ""}
        subtitulo={bienDetalle ? `Folio #${bienDetalle.id}` : ""}
        avatar={bienDetalle ? bienDetalle.tipo.charAt(0).toUpperCase() : "B"}
        items={getDetalleItems()}
      />
    </div>
  );
};

export default Bienes;