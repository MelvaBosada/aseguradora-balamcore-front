import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import SearchIcon         from "@mui/icons-material/Search";
import NotificationsIcon  from "@mui/icons-material/Notifications";
import AutorenewIcon      from "@mui/icons-material/Autorenew";
import VisibilityIcon     from "@mui/icons-material/Visibility";
import DownloadIcon       from "@mui/icons-material/Download";
import CheckCircleIcon    from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon   from "@mui/icons-material/ErrorOutline";
import AssignmentIcon     from "@mui/icons-material/Assignment";
import PersonIcon         from "@mui/icons-material/Person";
import DateRangeIcon      from "@mui/icons-material/DateRange";
import AttachMoneyIcon    from "@mui/icons-material/AttachMoney";
import PaymentIcon        from "@mui/icons-material/Payment";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import NotesIcon          from "@mui/icons-material/Notes";
import InfoIcon           from "@mui/icons-material/Info";

import PrimaryButton       from "../../components/PrimaryButton";
import TablaForm           from "../../components/TablaForm";
import Paginacion          from "../../components/Paginacion";
import AvisarModal         from "../../components/AvisarModal";
import PolizaDetalleModal  from "../../components/PolizaDetalleModal";
import DescargarModal      from "../../components/DescargarModal";
import { NOMBRES_RAMO, dinero0 } from "../../components/FichaCobertura";

import { PolizasVencerData } from "../../components/PolizasVencerData";
import "../../css/Clientes.css";
import "../../css/PolizasVencer.css";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// Ruta del módulo "Solicitudes de renovación" (ajústala a tu router)
const RUTA_RENOVACIONES = "/admin/solicitudesP";

const AVISO_EXITO_MS = 3500;
const SIN_CONEXION = "No hay conexión con el servidor.";

const ESTATUS_DIAS = {
  Todos:        30,
  Urgente:       7,
  "Por vencer": 15,
  Normal:       30,
};

const ESTATUS_OPTIONS = ["Todos", "Urgente", "Por vencer", "Normal"];

const campos   = ["nPoliza", "tipo", "vigencia", "estatus"];
const columnas = ["N° Póliza", "Tipo", "Vigencia", "Estatus", "Acciones"];

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const mensajeError = (error, defecto) => {
  if (!error.response) return SIN_CONEXION;
  const errores = error.response?.data?.errors;
  if (errores) return Object.values(errores).flat().join("\n");
  return error.response?.data?.message || defecto || error.message;
};

// Mensaje legible cuando falla una descarga con responseType 'blob'
const mensajeErrorBlob = async (error) => {
  let mensaje = error.response ? "El documento no está disponible." : SIN_CONEXION;
  try {
    const texto = await error.response?.data?.text?.();
    if (texto) mensaje = JSON.parse(texto).message || mensaje;
  } catch {
    /* se mantiene el mensaje por defecto */
  }
  return mensaje;
};

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
  const navigate = useNavigate();

  const [polizas,      setPolizas]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const [searchTerm,   setSearchTerm]   = useState("");
  const [searchInput,  setSearchInput]  = useState("");
  const [estatus,      setEstatus]      = useState("Todos");
  const [currentPage,  setCurrentPage]  = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [avisarOpen,   setAvisarOpen]   = useState(false);
  const [showDescarga, setShowDescarga] = useState(false);
  const [selected,     setSelected]     = useState(null);

  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [polizaDetalle,    setPolizaDetalle]    = useState(null);

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

  const handleEstatus = (e) => { setEstatus(e.target.value); };

  const openAvisar = (p) => { setSelected(p); setAvisarOpen(true); };

  const handleEnviado = () => {
    mostrarAviso("exito", "Aviso enviado", `Correo enviado a ${selected?.correo || "cliente"}.`);
    fetchPolizas(estatus);
  };

  // Renovar: manda la póliza al módulo de renovaciones, que abre su modal con estos datos
  const handleRenovar = (p) => {
    navigate(RUTA_RENOVACIONES, { state: { renovarPoliza: p } });
  };

  // Abre un PDF protegido (necesita token) en una pestaña nueva
  const abrirPdf = async (url) => {
    const ventana = window.open("", "_blank");
    try {
      const res = await axios.get(url, { headers: headers(), responseType: "blob" });
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      if (ventana) ventana.location.href = blobUrl;
      else window.location.href = blobUrl;
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      if (ventana) ventana.close();
      console.error("Error al abrir documento:", err);
      mostrarAviso("error", "No se pudo abrir el documento", await mensajeErrorBlob(err));
    }
  };

  // Ver póliza: mismo desglose que el módulo de Pólizas
  const handleVerDetalle = async (poliza) => {
    try {
      const [res, coberturasRes] = await Promise.all([
        axios.get(`${API_URL}/polizas/${poliza.id}`, { headers: headers() }),
        axios.get(`${API_URL}/polizas/${poliza.id}/coberturas`, { headers: headers() }),
      ]);

      const data = res.data;
      const coberturas = (coberturasRes.data?.coberturas || []).filter((c) => c.asignada);
      const items = [
        { icon: <AssignmentIcon />, label: "N° Póliza", value: data.nPoliza },
        { icon: <AssignmentIcon />, label: "Ramo", value: NOMBRES_RAMO[data.tipo] || data.tipo },
        { icon: <AssignmentIcon />, label: "Endoso", value: data.endoso },
        { icon: <PersonIcon />, label: "Cliente", value: data.cliente },
        { icon: <DateRangeIcon />, label: "Fecha de inicio", value: data.fechaInicio },
        { icon: <DateRangeIcon />, label: "Fecha final", value: data.fechaFinal },
        { icon: <InfoIcon />, label: "Estatus", value: data.estatus },
        { icon: <AttachMoneyIcon />, label: "Suma asegurada", value: `$${Number(data.sumaAsegurada).toLocaleString()}` },
        { icon: <PaymentIcon />, label: "Forma de pago", value: data.numero_pagos > 1 ? `${data.formaPago}: ${data.numero_pagos} pagos de ${dinero0(data.pago_periodico)}` : data.formaPago },
        { icon: <MonetizationOnIcon />, label: "Prima neta", value: `$${Number(data.prima_neta).toLocaleString()}` },
        { icon: <MonetizationOnIcon />, label: "Derecho de póliza", value: `$${Number(data.derecho_poliza).toLocaleString()}` },
        { icon: <MonetizationOnIcon />, label: data.iva_exento ? "IVA (exento)" : `IVA (${data.tasa_iva}%)`, value: `$${Number(data.iva).toLocaleString()}` },
        { icon: <MonetizationOnIcon />, label: "Prima total", value: `$${Number(data.prima_total).toLocaleString()}` },
        {
          icon: <InfoIcon />,
          label: "Coberturas contratadas",
          value: data.coberturas?.length ? data.coberturas.map((c) => c.nombre).join(", ") : "Sin coberturas asignadas",
          fullWidth: true
        },
        { icon: <NotesIcon />, label: "Observaciones", value: data.observaciones || "—", fullWidth: true }
      ];

      setPolizaDetalle({ ...data, items, coberturas });
      setShowDetalleModal(true);
    } catch (err) {
      console.error("Error al cargar detalles:", err);
      mostrarAviso("error", "No se pudo abrir el detalle", mensajeError(err, "Error al cargar los detalles de la póliza."));
    }
  };

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
                titulo: "Ver póliza",
                clase:  "tabla-btn-reasignar",
                icono:  <VisibilityIcon fontSize="small" />,
                onClick: handleVerDetalle,
              },
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
              {
                titulo: "Renovar",
                clase:  "tabla-btn-edit",
                icono:  <AutorenewIcon fontSize="small" />,
                onClick: handleRenovar,
              },
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

      {/* DETALLE COMPLETO DE LA PÓLIZA (igual que en el módulo de Pólizas) */}
      <PolizaDetalleModal
        open={showDetalleModal}
        onClose={() => setShowDetalleModal(false)}
        titulo={polizaDetalle ? `Póliza #${polizaDetalle.nPoliza}` : ""}
        subtitulo={polizaDetalle ? polizaDetalle.cliente : ""}
        avatar="P"
        items={polizaDetalle ? polizaDetalle.items : []}
        coberturas={polizaDetalle?.coberturas || []}
        documento={polizaDetalle?.tiene_documento ? { nombre: polizaDetalle.documento_nombre } : null}
        onVerDocumento={() => abrirPdf(`${API_URL}/polizas/${polizaDetalle.id}/documento`)}
        endosos={polizaDetalle ? polizaDetalle.endosos || [] : []}
        onVerDocumentoEndoso={(e) => abrirPdf(`${API_URL}/polizas/${polizaDetalle.id}/endosos/${e.id}/documento`)}
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