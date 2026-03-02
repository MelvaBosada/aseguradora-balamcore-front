import { useState } from "react";
import SearchIcon        from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AutorenewIcon     from "@mui/icons-material/Autorenew";
import VisibilityIcon    from "@mui/icons-material/Visibility";
import PolicyIcon        from "@mui/icons-material/Policy";
import BadgeIcon         from "@mui/icons-material/Badge";
import AccessTimeIcon    from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SupportAgentIcon  from "@mui/icons-material/SupportAgent";
import Snackbar          from "@mui/material/Snackbar";
import Alert             from "@mui/material/Alert";

import TablaForm           from "../../components/TablaForm";
import Paginacion          from "../../components/Paginacion";
import AvisarModal         from "../../components/AvisarModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import RenovarPolizaModal  from "../../components/RenovarPolizaModal";

import { polizasVencerData } from "../../components/PolizasVencerData";
import "../../css/PolizasVencer.css";

const ITEMS_PER_PAGE  = 8;
const ESTATUS_OPTIONS = ["Todos", "Urgente", "Por vencer", "Normal"];

const campos   = ["nPoliza",  "tipo", "vigencia",  "estatus"];
const columnas = ["N° Póliza", "Tipo", "Vigencia", "Estatus", "Acciones"];

const CAMPOS_RENOVAR = [
  { label: "Fecha de inicio",  name: "fechaInicio",   type: "date"   },
  { label: "Fecha de corte",   name: "fechaCorte",    type: "date"   },
  { label: "Nueva vigencia",   name: "nuevaVigencia", opciones: ["1 mes", "3 meses", "6 meses", "1 año", "2 años"], placeholder: "Selecciona vigencia" },
  { label: "Tipo de pago",     name: "tipoPago",      opciones: ["Mensual", "Trimestral", "Semestral", "Anual"],    placeholder: "Selecciona tipo de pago" },
  { label: "Suma asegurada",   name: "sumaAsegurada", type: "number", placeholder: "Ingresa la suma del seguro"    },
  { label: "Monto a pagar",    name: "montoAPagar",   type: "number", placeholder: "Ingresa lo que debe de pagar" },
];

const PolizasVencer = () => {
  const [search,      setSearch]      = useState("");
  const [estatus,     setEstatus]     = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [avisarOpen,  setAvisarOpen]  = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [renovarOpen, setRenovarOpen] = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [snackOpen,     setSnackOpen]     = useState(false);
  const [snackMsg,      setSnackMsg]      = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");

  const showSnack = (msg, severity = "success") => {
    setSnackMsg(msg); setSnackSeverity(severity); setSnackOpen(true);
  };

  const filtered = polizasVencerData.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.nombre.toLowerCase().includes(q)   ||
      p.apellido.toLowerCase().includes(q) ||
      p.nPoliza.toLowerCase().includes(q)  ||
      p.tipo.toLowerCase().includes(q)     ||
      p.asesor.toLowerCase().includes(q);
    const matchEstatus = estatus === "Todos" || p.estatus === estatus;
    return matchSearch && matchEstatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch  = (e) => { setSearch(e.target.value);  setCurrentPage(1); };
  const handleEstatus = (e) => { setEstatus(e.target.value); setCurrentPage(1); };

  const openAvisar  = (p) => { setSelected(p); setAvisarOpen(true);  };
  const openDetalle = (p) => { setSelected(p); setDetalleOpen(true); };
  const openRenovar = (p) => { setSelected(p); setRenovarOpen(true); };

  const handleConfirmRenovar = (data) => {
    setRenovarOpen(false);
    showSnack(`Póliza ${data.nPoliza} renovada exitosamente`);
  };

  const detalleItems = selected ? [
    { icon: <PolicyIcon />,        label: "N° Póliza", value: selected.nPoliza  },
    { icon: <BadgeIcon />,         label: "Tipo",      value: selected.tipo     },
    { icon: <AccessTimeIcon />,    label: "Vigencia",  value: selected.vigencia },
    { icon: <CalendarTodayIcon />, label: "Vence",     value: selected.vence    },
    { icon: <SupportAgentIcon />,  label: "Asesor",    value: selected.asesor   },
  ] : [];

  return (
    <div className="pv-page">
      <div className="pv-page-header"><h1>Pólizas por vencer</h1></div>

      <div className="pv-toolbar">
        <div className="pv-field">
          <label>Búsqueda</label>
          <div className="pv-search-wrapper">
            <SearchIcon />
            <input type="text" className="pv-search" placeholder="Buscar póliza..."
              value={search} onChange={handleSearch} />
          </div>
        </div>
        <div className="pv-field">
          <label>Estatus</label>
          <select className="pv-select" value={estatus} onChange={handleEstatus}>
            {ESTATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <TablaForm
        columna={columnas} data={paginated} campos={campos}
        acciones={[
          { titulo: "Avisar",     clase: "tabla-btn-ver",  icono: <NotificationsIcon fontSize="small" />, onClick: openAvisar  },
          { titulo: "Renovar",    clase: "tabla-btn-edit", icono: <AutorenewIcon     fontSize="small" />, onClick: openRenovar },
          { titulo: "Ver póliza", clase: "tabla-btn-del",  icono: <VisibilityIcon    fontSize="small" />, onClick: openDetalle },
        ]}
      />

      <Paginacion currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <AvisarModal open={avisarOpen} onClose={() => setAvisarOpen(false)} poliza={selected} />

      <ClienteDetalleModal
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        titulo={selected ? `${selected.nombre} ${selected.apellido}` : ""}
        subtitulo={selected ? selected.nPoliza : ""}
        avatar={selected ? `${selected.nombre.charAt(0)}${selected.apellido.charAt(0)}` : ""}
        items={detalleItems}
      />

      <RenovarPolizaModal
        open={renovarOpen}
        onClose={() => setRenovarOpen(false)}
        onRenovar={handleConfirmRenovar}
        poliza={selected}
        camposNuevos={CAMPOS_RENOVAR}
      />

      <Snackbar open={snackOpen} autoHideDuration={2500} onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snackSeverity} variant="filled" onClose={() => setSnackOpen(false)}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default PolizasVencer;
