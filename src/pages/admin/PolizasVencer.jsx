import { useState, useEffect, useCallback } from "react";

import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PolicyIcon from "@mui/icons-material/Policy";
import BadgeIcon from "@mui/icons-material/Badge";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

import TablaForm from "../../components/TablaForm";
import Paginacion from "../../components/Paginacion";
import AvisarModal from "../../components/AvisarModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import RenovarPolizaModal from "../../components/RenovarPolizaModal";

import { PolizasVencerData } from "../../components/PolizasVencerData";
import "../../css/PolizasVencer.css";

// Mapeo de estatus → días máximos para el query param
const ESTATUS_DIAS = {
  Todos: 999,
  Urgente: 7,
  "Por vencer": 15,
  Normal: 999,
};

const ESTATUS_OPTIONS = ["Todos", "Urgente", "Por vencer", "Normal"];

const campos = ["nPoliza", "tipo", "vigencia", "estatus"];
const columnas = ["N° Póliza", "Tipo", "Vigencia", "Estatus", "Acciones"];

const CAMPOS_RENOVAR = [
  { label: "Fecha de inicio", name: "fechaInicio", type: "date" },
  { label: "Fecha de corte", name: "fechaCorte", type: "date" },
  {
    label: "Nueva vigencia",
    name: "nuevaVigencia",
    opciones: ["1 mes", "3 meses", "6 meses", "1 año", "2 años"],
    placeholder: "Selecciona vigencia",
  },
  {
    label: "Tipo de pago",
    name: "tipoPago",
    opciones: ["Mensual", "Trimestral", "Semestral", "Anual"],
    placeholder: "Selecciona tipo de pago",
  },
  {
    label: "Suma asegurada",
    name: "sumaAsegurada",
    type: "number",
    placeholder: "Ingresa la suma del seguro",
  },
  {
    label: "Monto a pagar",
    name: "montoAPagar",
    type: "number",
    placeholder: "Ingresa lo que debe de pagar",
  },
];

/**
 * Convierte los días restantes en texto legible para la columna "Vigencia".
 * Usa el campo `dias` que ya calcula el controller (diffInDays desde hoy hasta fecha_fin).
 */
const formatVigencia = (dias) => {
  if (dias <= 0) return "Vence hoy";
  if (dias === 1) return "1 día restante";
  if (dias < 30) return `${dias} días restantes`;
  const meses = Math.floor(dias / 30);
  const diasExtra = dias % 30;
  if (diasExtra === 0) return `${meses} ${meses === 1 ? "mes" : "meses"} restante${meses === 1 ? "" : "s"}`;
  return `${meses} ${meses === 1 ? "mes" : "meses"} y ${diasExtra} día${diasExtra === 1 ? "" : "s"}`;
};

const PolizasVencer = () => {
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [estatus, setEstatus] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [avisarOpen, setAvisarOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [renovarOpen, setRenovarOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");

  const showSnack = (msg, severity = "success") => {
    setSnackMsg(msg);
    setSnackSeverity(severity);
    setSnackOpen(true);
  };

  // Carga datos desde el backend.
  // Cuando el estatus cambia, pasa los días correspondientes al query param
  // para que el backend pre-filtre. El filtro por texto se hace en el cliente.
  const fetchPolizas = useCallback(async (estatusFiltro) => {
    setLoading(true);
    setError(null);
    try {
      const dias = ESTATUS_DIAS[estatusFiltro] ?? 999;
      const raw = await PolizasVencerData(dias);

      // El controller ya calcula `dias` (días restantes) y `estatus`.
      // Aquí añadimos `vigencia` como texto legible para la tabla.
      const mapped = raw.map((p) => ({
        ...p,
        vigencia: formatVigencia(p.dias),
      }));

      setPolizas(mapped);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las pólizas. Intenta de nuevo.");
      showSnack("Error al cargar pólizas", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch cuando cambia el filtro de estatus
  useEffect(() => {
    fetchPolizas(estatus);
    setCurrentPage(1);
  }, [estatus, fetchPolizas]);

  // Filtro local por búsqueda de texto + estatus exacto
  // (el backend ya pre-filtra por rango de días; aquí afinamos en cliente)
  const filtered = polizas.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.nombre.toLowerCase().includes(q) ||
      p.apellido.toLowerCase().includes(q) ||
      p.nPoliza.toLowerCase().includes(q) ||
      p.tipo.toLowerCase().includes(q) ||
      p.asesor.toLowerCase().includes(q);

    // Cuando el backend devuelve todos los registros (estatus "Todos" o "Normal"),
    // filtramos en cliente para mostrar solo el estatus seleccionado si no es "Todos".
    const matchEstatus =
      estatus === "Todos" || p.estatus === estatus;

    return matchSearch && matchEstatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleEstatus = (e) => {
    setEstatus(e.target.value);
    // currentPage se resetea en el useEffect
  };

  const openAvisar = (p) => { setSelected(p); setAvisarOpen(true); };
  const openDetalle = (p) => { setSelected(p); setDetalleOpen(true); };
  const openRenovar = (p) => { setSelected(p); setRenovarOpen(true); };

  const handleConfirmRenovar = (data) => {
    setRenovarOpen(false);
    showSnack(`Póliza ${data.nPoliza} renovada exitosamente`);
    // Re-carga para reflejar el cambio en la tabla
    fetchPolizas(estatus);
  };

  const detalleItems = selected
    ? [
        { icon: <PolicyIcon />, label: "N° Póliza", value: selected.nPoliza },
        { icon: <BadgeIcon />, label: "Tipo", value: selected.tipo },
        { icon: <AccessTimeIcon />, label: "Vigencia", value: selected.vigencia },
        { icon: <CalendarTodayIcon />, label: "Vence", value: selected.vence },
        { icon: <SupportAgentIcon />, label: "Asesor", value: selected.asesor },
      ]
    : [];

  return (
    <div className="pv-page">
      <div className="pv-page-header">
        <h1>Pólizas por vencer</h1>
      </div>

      <div className="pv-toolbar">
        <div className="pv-field">
          <label>Búsqueda</label>
          <div className="pv-search-wrapper">
            <SearchIcon />
            <input
              type="text"
              className="pv-search"
              placeholder="Buscar póliza..."
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>
        <div className="pv-field">
          <label>Estatus</label>
          <select className="pv-select" value={estatus} onChange={handleEstatus}>
            {ESTATUS_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="pv-loading">
          <CircularProgress size={40} />
          <span>Cargando pólizas...</span>
        </div>
      ) : error ? (
        <div className="pv-error">{error}</div>
      ) : (
        <TablaForm
          columna={columnas}
          data={paginated}
          campos={campos}
          acciones={[
            {
              titulo: "Avisar",
              clase: "tabla-btn-ver",
              icono: <NotificationsIcon fontSize="small" />,
              onClick: openAvisar,
            },
            {
              titulo: "Renovar",
              clase: "tabla-btn-edit",
              icono: <AutorenewIcon fontSize="small" />,
              onClick: openRenovar,
            },
            {
              titulo: "Ver póliza",
              clase: "tabla-btn-del",
              icono: <VisibilityIcon fontSize="small" />,
              onClick: openDetalle,
            },
          ]}
        />
      )}

      <Paginacion
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      <AvisarModal
        open={avisarOpen}
        onClose={() => setAvisarOpen(false)}
        poliza={selected}
      />

      <ClienteDetalleModal
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        titulo={selected ? `${selected.nombre} ${selected.apellido}` : ""}
        subtitulo={selected ? selected.nPoliza : ""}
        avatar={
          selected
            ? `${selected.nombre.charAt(0)}${selected.apellido.charAt(0)}`
            : ""
        }
        items={detalleItems}
      />

      <RenovarPolizaModal
        open={renovarOpen}
        onClose={() => setRenovarOpen(false)}
        onRenovar={handleConfirmRenovar}
        poliza={selected}
        camposNuevos={CAMPOS_RENOVAR}
      />

      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackSeverity}
          variant="filled"
          onClose={() => setSnackOpen(false)}
        >
          {snackMsg}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default PolizasVencer;
