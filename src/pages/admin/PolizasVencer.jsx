import { useState, useEffect, useCallback } from "react";

import SearchIcon         from "@mui/icons-material/Search";
import NotificationsIcon  from "@mui/icons-material/Notifications";
import AutorenewIcon      from "@mui/icons-material/Autorenew";
import VisibilityIcon     from "@mui/icons-material/Visibility";
import DownloadIcon       from "@mui/icons-material/Download";
import PolicyIcon         from "@mui/icons-material/Policy";
import BadgeIcon          from "@mui/icons-material/Badge";
import AccessTimeIcon     from "@mui/icons-material/AccessTime";
import CalendarTodayIcon  from "@mui/icons-material/CalendarToday";
import SupportAgentIcon   from "@mui/icons-material/SupportAgent";
import EmailIcon          from "@mui/icons-material/Email";
import AttachMoneyIcon    from "@mui/icons-material/AttachMoney";
import PaymentsIcon       from "@mui/icons-material/Payments";
import ReceiptIcon        from "@mui/icons-material/Receipt";
import EventIcon          from "@mui/icons-material/Event";
import NotesIcon          from "@mui/icons-material/Notes";
import CheckCircleIcon    from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon   from "@mui/icons-material/ErrorOutline";

import PrimaryButton       from "../../components/PrimaryButton";
import TablaForm           from "../../components/TablaForm";
import Paginacion          from "../../components/Paginacion";
import AvisarModal         from "../../components/AvisarModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import RenovarPolizaModal  from "../../components/RenovarPolizaModal";
import DescargarModal      from "../../components/DescargarModal";

import { PolizasVencerData } from "../../components/PolizasVencerData";
import "../../css/Clientes.css";
import "../../css/PolizasVencer.css";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const AVISO_EXITO_MS = 3500;

const ESTATUS_DIAS = {
  Todos:        30,
  Urgente:       7,
  "Por vencer": 15,
  Normal:       30,
};

const ESTATUS_OPTIONS = ["Todos", "Urgente", "Por vencer", "Normal"];

const campos   = ["nPoliza", "tipo", "vigencia", "estatus"];
const columnas = ["N° Póliza", "Tipo", "Vigencia", "Estatus", "Acciones"];

const CAMPOS_RENOVAR = [
  { label: "Fecha de inicio", name: "fechaInicio",   type: "date" },
  { label: "Fecha de corte",  name: "fechaCorte",    type: "date" },
  { label: "Nueva vigencia",  name: "nuevaVigencia", opciones: ["1 mes", "3 meses", "6 meses", "1 año", "2 años"], placeholder: "Selecciona vigencia" },
  { label: "Tipo de pago",    name: "tipoPago",      opciones: ["Mensual", "Trimestral", "Semestral", "Anual"], placeholder: "Selecciona tipo de pago" },
  { label: "Suma asegurada",  name: "sumaAsegurada", type: "number", placeholder: "Ingresa la suma del seguro" },
  { label: "Monto a pagar",   name: "montoAPagar",   type: "number", placeholder: "Ingresa lo que debe de pagar" },
];

const formatVigencia = (dias) => {
  if (dias <= 0)  return "Vence hoy";
  if (dias === 1) return "1 día restante";
  if (dias < 30)  return `${dias} días restantes`;
  const meses     = Math.floor(dias / 30);
  const diasExtra = dias % 30;
  if (diasExtra === 0)
    return `${meses} ${meses === 1 ? "mes" : "meses"} restante${meses === 1 ? "" : "s"}`;
  return `${meses} ${meses === 1 ? "mes" : "meses"} y ${diasExtra} día${diasExtra === 1 ? "" : "s"}`;
};

const PolizasVencer = () => {
  const [polizas,      setPolizas]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const [searchTerm,   setSearchTerm]   = useState("");
  const [searchInput,  setSearchInput]  = useState("");
  const [estatus,      setEstatus]      = useState("Todos");
  const [currentPage,  setCurrentPage]  = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [avisarOpen,   setAvisarOpen]   = useState(false);
  const [detalleOpen,  setDetalleOpen]  = useState(false);
  const [renovarOpen,  setRenovarOpen]  = useState(false);
  const [showDescarga, setShowDescarga] = useState(false);
  const [selected,     setSelected]     = useState(null);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPolizas = useCallback(async (estatusFiltro) => {
    setLoading(true);
    setError(null);
    try {
      const dias   = ESTATUS_DIAS[estatusFiltro] ?? 30;
      const raw    = await PolizasVencerData(dias);
      const mapped = raw.map((p) => ({ ...p, vigencia: formatVigencia(p.dias) }));
      setPolizas(mapped);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las pólizas. Intenta de nuevo.");
      mostrarAviso("error", "No se pudieron cargar las pólizas", "Ocurrió un error al cargar las pólizas por vencer. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [mostrarAviso]);

  useEffect(() => {
    fetchPolizas(estatus);
    setCurrentPage(1);
  }, [estatus, fetchPolizas]);

  const filtered = polizas.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      p.nombre.toLowerCase().includes(q)   ||
      p.apellido.toLowerCase().includes(q) ||
      p.nPoliza.toLowerCase().includes(q)  ||
      p.tipo.toLowerCase().includes(q)     ||
      p.asesor.toLowerCase().includes(q);
    const matchEstatus = estatus === "Todos" || p.estatus === estatus;
    return matchSearch && matchEstatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading && polizas.length === 0) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p className="mt-2">Cargando pólizas por vencer...</p>
        </div>
      </div>
    );
  }

  const handleEstatus = (e) => { setEstatus(e.target.value); };

  const openAvisar  = (p) => { setSelected(p); setAvisarOpen(true);  };
  const openDetalle = (p) => { setSelected(p); setDetalleOpen(true); };
  const openRenovar = (p) => { setSelected(p); setRenovarOpen(true); };

  const handleEnviado = () => {
    mostrarAviso("exito", "Aviso enviado", `Correo enviado a ${selected?.correo || "cliente"}.`);
    fetchPolizas(estatus);
  };

  const handleConfirmRenovar = (data) => {
    setRenovarOpen(false);
    mostrarAviso("exito", "Póliza renovada", `La póliza ${data.nPoliza} se renovó exitosamente.`);
    fetchPolizas(estatus);
  };

  const detalleItems = selected ? [
    { icon: <PolicyIcon />,        label: "N° Póliza",            value: selected.nPoliza                  },
    { icon: <BadgeIcon />,         label: "Tipo",                 value: selected.tipo                     },
    { icon: <BadgeIcon />,         label: "Estatus",              value: selected.estatus                  },
    { icon: <AccessTimeIcon />,    label: "Vigencia",             value: selected.vigencia                 },
    { icon: <CalendarTodayIcon />, label: "Fecha de emisión",     value: selected.fecha_emision   || "—"  },
    { icon: <CalendarTodayIcon />, label: "Fecha de inicio",      value: selected.fecha_inicio    || "—"  },
    { icon: <CalendarTodayIcon />, label: "Fecha de vencimiento", value: selected.vence                   },
    { icon: <AttachMoneyIcon />,   label: "Suma asegurada",       value: selected.suma_asegurada  ? `$${Number(selected.suma_asegurada).toLocaleString()}` : "—" },
    { icon: <AttachMoneyIcon />,   label: "Prima neta",           value: selected.prima_neta      ? `$${Number(selected.prima_neta).toLocaleString()}`      : "—" },
    { icon: <ReceiptIcon />,       label: "Derecho de póliza",    value: selected.derecho_poliza  ? `$${Number(selected.derecho_poliza).toLocaleString()}`  : "—" },
    { icon: <ReceiptIcon />,       label: "IVA",                  value: selected.iva             ? `$${Number(selected.iva).toLocaleString()}`             : "—" },
    { icon: <AttachMoneyIcon />,   label: "Prima total",          value: selected.prima_total     ? `$${Number(selected.prima_total).toLocaleString()}`     : "—" },
    { icon: <PaymentsIcon />,      label: "Forma de pago",        value: selected.forma_pago      || "—"  },
    { icon: <EventIcon />,         label: "Día de pago",          value: selected.dia_pago        ?? "—"  },
    { icon: <CalendarTodayIcon />, label: "Primer pago",          value: selected.fecha_primer_pago || "—"},
    { icon: <CalendarTodayIcon />, label: "Siguiente pago",       value: selected.siguiente_pago  || "—"  },
    { icon: <SupportAgentIcon />,  label: "Asesor",               value: selected.asesor                   },
    { icon: <EmailIcon />,         label: "Correo cliente",       value: selected.correo          || "—"  },
    { icon: <NotesIcon />,         label: "Observaciones",        value: selected.observaciones   || "—"  },
  ] : [];

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Pólizas por vencer</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar póliza..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="fw-bold mb-2">Estatus</div>
          <select className="form-select" style={{ width: "180px" }} value={estatus} onChange={handleEstatus}>
            {ESTATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <PrimaryButton
            text="Descargar"
            icon={<DownloadIcon />}
            onClick={() => setShowDescarga(true)}
          />
        </div>
      </div>

      {error ? (
        <div className="pv-error">{error}</div>
      ) : (
        <div className="mb-4">
          <TablaForm
            columna={columnas}
            data={paginated}
            campos={campos}
            acciones={[
              {
                titulo:   "Avisar",
                icono:    (row) => row.aviso_enviado_at
                            ? <CheckCircleIcon fontSize="small" />
                            : <NotificationsIcon fontSize="small" />,
                clase:    (row) => row.aviso_enviado_at
                            ? "tabla-btn-ver tabla-btn-avisado"
                            : "tabla-btn-ver",
                onClick:  (row) => !row.aviso_enviado_at && openAvisar(row),
                disabled: (row) => !!row.aviso_enviado_at,
              },
              { titulo: "Renovar",    clase: "tabla-btn-edit", icono: <AutorenewIcon  fontSize="small" />, onClick: openRenovar },
              { titulo: "Ver póliza", clase: "tabla-btn-del",  icono: <VisibilityIcon fontSize="small" />, onClick: openDetalle },
            ]}
          />
        </div>
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
        onEnviado={handleEnviado}
      />

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

      {/* MODAL DE DESCARGA DEL LISTADO (PDF / Excel / CSV) */}
      <DescargarModal
        open={showDescarga}
        onClose={() => setShowDescarga(false)}
        url={`${API_URL}/exportar/polizas-vencer`}
        params={{ search: searchTerm, estatus, dias: ESTATUS_DIAS[estatus] ?? 30 }}
        nombreArchivo="polizas_por_vencer"
        titulo="Descargar listado de pólizas por vencer"
        nota={
          searchTerm || estatus !== "Todos"
            ? `Se exportarán las pólizas por vencer con los filtros actuales${searchTerm ? ` (búsqueda: "${searchTerm}")` : ""}${estatus !== "Todos" ? ` (estatus: ${estatus})` : ""}.`
            : "Se exportarán todas las pólizas por vencer."
        }
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

export default PolizasVencer;