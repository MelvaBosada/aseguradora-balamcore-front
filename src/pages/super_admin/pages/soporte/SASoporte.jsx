import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import SATable from "../../components/SATable";
import SAPagination from "../../components/SAPagination";
import SAButton from "../../components/SAButton";
import SAModal from "../../components/SAModal";
import SABadge from "../../components/SABadge";
import { API_BASE_URL } from "../../config";

import "../aseguradoras/SAAseguradoras.css";

const API_URL = `${API_BASE_URL}/api/superadmin/reembolsos`;

// Cambia los variant si quieres otros colores en tus badges
const ESTATUS = {
  en_revision: { texto: "En revisión", variant: "pro" },
  aprobada:    { texto: "Aprobada",    variant: "success" },
  rechazada:   { texto: "Rechazada",   variant: "danger" },
};

const USO_LABELS = {
  clientes: "Clientes",
  polizas: "Pólizas",
  siniestros: "Siniestros",
  bienes: "Bienes",
  empleados: "Empleados",
};

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const dinero = (n) =>
  Number(n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const fecha = (f) =>
  f ? new Date(f).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";

const cajaInfo = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  padding: "12px 14px",
};

const etiqueta = {
  fontSize: 10.5,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  opacity: 0.6,
  marginBottom: 3,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "inherit",
  fontSize: 14,
};

export default function SASoporte() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [okMsg, setOkMsg] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("en_revision");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal de revisión
  const [target, setTarget] = useState(null);
  const [monto, setMonto] = useState("");
  const [nota, setNota] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [modalError, setModalError] = useState(null);

  const cargar = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data } = await axios.get(API_URL, { headers: authHeaders() });
      setSolicitudes(data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "No se pudieron cargar las solicitudes de reembolso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const pendientes = solicitudes.filter((s) => s.estatus === "en_revision").length;

  // ── Filtrado + paginación ───────────────────────────────────────
  const filtradas = useMemo(
    () =>
      solicitudes.filter((s) => {
        const coincideBusqueda =
          !busqueda || s.aseguradora?.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEstatus = filtroEstatus === "todos" || s.estatus === filtroEstatus;
        return coincideBusqueda && coincideEstatus;
      }),
    [solicitudes, busqueda, filtroEstatus]
  );

  const totalPages = Math.max(1, Math.ceil(filtradas.length / itemsPerPage));
  const paginadas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtradas.slice(start, start + itemsPerPage);
  }, [filtradas, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  // ── Filas de la tabla ───────────────────────────────────────────
  const filasTabla = paginadas.map((s) => ({
    ...s,
    folio: `#${s.id}`,
    aseg_celda: (
      <div className="sa-aseg-cell__info">
        <span className="sa-aseg-cell__nombre">{s.aseguradora}</span>
        <span className="sa-aseg-cell__rfc">
          {s.plan ? `${s.plan} · ${s.periodo || "mensual"}` : "—"}
        </span>
      </div>
    ),
    monto_celda: dinero(s.monto_sugerido),
    uso_celda: s.uso
      ? Object.entries(USO_LABELS)
          .map(([k, label]) => `${s.uso[k] ?? 0} ${label.toLowerCase()}`)
          .slice(0, 3)
          .join(" · ")
      : "—",
    fecha_celda: fecha(s.created_at),
    estatus_celda: (
      <SABadge variant={ESTATUS[s.estatus]?.variant || "neutral"}>
        {ESTATUS[s.estatus]?.texto || s.estatus}
      </SABadge>
    ),
  }));

  const columnas = ["#", "Aseguradora", "Monto sugerido", "Uso de la cuenta", "Solicitada", "Estatus"];
  const campos = ["folio", "aseg_celda", "monto_celda", "uso_celda", "fecha_celda", "estatus_celda"];

  const acciones = [
    {
      icono: (fila) => (fila.estatus === "en_revision" ? "✎" : "👁"),
      titulo: (fila) => (fila.estatus === "en_revision" ? "Revisar y resolver" : "Ver resolución"),
      onClick: (fila) => abrir(fila),
    },
  ];

  // ── Modal ───────────────────────────────────────────────────────
  const abrir = (fila) => {
    setTarget(fila);
    setMonto(String(fila.monto_sugerido ?? ""));
    setNota("");
    setModalError(null);
  };

  const cerrar = () => {
    if (procesando) return;
    setTarget(null);
    setModalError(null);
  };

  const resolver = async (aprobar) => {
    setModalError(null);

    if (aprobar) {
      const m = Number(monto);
      if (!(m > 0)) return setModalError("Escribe un monto mayor a 0.");
      if (target.monto_cobrado != null && m > Number(target.monto_cobrado)) {
        return setModalError(`El monto no puede pasar de lo que pagó (${dinero(target.monto_cobrado)}).`);
      }
      const ok = window.confirm(
        `Se reembolsarán ${dinero(m)} a ${target.aseguradora} y su plan se cancelará de inmediato. ¿Continuar?`
      );
      if (!ok) return;
    } else if (!nota.trim()) {
      return setModalError("Escribe el motivo del rechazo: se le envía al cliente por correo.");
    }

    setProcesando(true);
    try {
      await axios.post(
        `${API_URL}/${target.id}/resolver`,
        {
          aprobar,
          monto: aprobar ? Number(monto) : undefined,
          nota: nota.trim() || undefined,
        },
        { headers: authHeaders() }
      );
      setOkMsg(
        aprobar
          ? `Reembolso aprobado para ${target.aseguradora}. Se le avisó por correo.`
          : `Solicitud de ${target.aseguradora} rechazada. Se le avisó por correo.`
      );
      setTarget(null);
      await cargar();
    } catch (err) {
      setModalError(
        err.response?.data?.message ||
          (err.response?.data?.errors && Object.values(err.response.data.errors).flat().join(" ")) ||
          "No se pudo resolver la solicitud."
      );
    } finally {
      setProcesando(false);
    }
  };

  const pendienteTarget = target?.estatus === "en_revision";

  return (
    <div className="sa-page">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="sa-page__header">
        <div>
          <h1 className="sa-page__title">Soporte</h1>
          <span className="sa-page__sub">
            solicitudes de reembolso — {pendientes} pendiente{pendientes === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {okMsg && (
        <div
          style={{
            margin: "0 0 14px", padding: "10px 14px", borderRadius: 10, fontSize: 13.5,
            background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.4)", color: "#4ade80",
          }}
        >
          {okMsg}{" "}
          <button
            type="button"
            onClick={() => setOkMsg(null)}
            style={{ background: "none", border: "none", color: "inherit", textDecoration: "underline", cursor: "pointer" }}
          >
            Cerrar
          </button>
        </div>
      )}

      {/* ── Filtros ─────────────────────────────────────────────── */}
      <div className="sa-aseg-filtros">
        <input
          className="sa-aseg-search"
          type="text"
          placeholder="Buscar por aseguradora..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          className="sa-aseg-select"
          value={filtroEstatus}
          onChange={(e) => {
            setFiltroEstatus(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="en_revision">En revisión</option>
          <option value="aprobada">Aprobadas</option>
          <option value="rechazada">Rechazadas</option>
          <option value="todos">Todas</option>
        </select>
      </div>

      {/* ── Tabla ───────────────────────────────────────────────── */}
      <div className="sa-card sa-card--table">
        {errorMsg && <div className="sa-modal-error" style={{ margin: "16px" }}>{errorMsg}</div>}

        {loading ? (
          <div className="sa-loading">
            <div className="sa-spinner" />
            Cargando solicitudes...
          </div>
        ) : (
          <>
            <SATable
              columnas={columnas}
              data={filasTabla}
              campos={campos}
              acciones={acciones}
              emptyText="No hay solicitudes con este filtro"
            />
            <SAPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}
      </div>

      {/* ── Modal de revisión ───────────────────────────────────── */}
      <SAModal
        open={!!target}
        onClose={cerrar}
        title={target ? `Solicitud #${target.id} — ${target.aseguradora}` : ""}
        size="md"
      >
        {target && (
          <div style={{ display: "grid", gap: 14 }}>
            {modalError && <div className="sa-modal-error">{modalError}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={cajaInfo}>
                <div style={etiqueta}>Plan</div>
                <div>{target.plan ? `${target.plan} · ${target.periodo || "mensual"}` : "—"}</div>
              </div>
              <div style={cajaInfo}>
                <div style={etiqueta}>Estatus</div>
                <SABadge variant={ESTATUS[target.estatus]?.variant || "neutral"}>
                  {ESTATUS[target.estatus]?.texto || target.estatus}
                </SABadge>
              </div>
              <div style={cajaInfo}>
                <div style={etiqueta}>Pagó</div>
                <div>{target.monto_cobrado != null ? dinero(target.monto_cobrado) : "—"}</div>
              </div>
              <div style={cajaInfo}>
                <div style={etiqueta}>Monto sugerido (tiempo no usado)</div>
                <div>{dinero(target.monto_sugerido)}</div>
              </div>
              <div style={cajaInfo}>
                <div style={etiqueta}>Plan iniciado</div>
                <div>{fecha(target.fecha_inicio_plan)}</div>
              </div>
              <div style={cajaInfo}>
                <div style={etiqueta}>Solicitada</div>
                <div>{fecha(target.created_at)}</div>
              </div>
            </div>

            <div style={cajaInfo}>
              <div style={etiqueta}>Contacto</div>
              <div style={{ fontSize: 13.5 }}>
                {target.aseguradora_correo || "—"}
                {target.aseguradora_telefono ? ` · ${target.aseguradora_telefono}` : ""}
              </div>
            </div>

            <div style={cajaInfo}>
              <div style={etiqueta}>Uso de la cuenta (registros)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 4 }}>
                {Object.entries(USO_LABELS).map(([k, label]) => (
                  <div key={k}>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{target.uso?.[k] ?? 0}</div>
                    <div style={{ fontSize: 11.5, opacity: 0.65 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {pendienteTarget ? (
              <>
                <div>
                  <div style={etiqueta}>Monto a reembolsar (MXN)</div>
                  <input
                    style={inputStyle}
                    type="number"
                    min="0"
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                  />
                </div>
                <div>
                  <div style={etiqueta}>Nota para el cliente (obligatoria al rechazar)</div>
                  <textarea
                    style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                    maxLength={500}
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Ej. Se descuenta el uso de la cuenta durante los primeros días."
                  />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <SAButton onClick={() => resolver(false)} disabled={procesando}>
                    Rechazar
                  </SAButton>
                  <SAButton variant="accent" onClick={() => resolver(true)} disabled={procesando}>
                    {procesando ? "Procesando..." : "Aprobar y reembolsar"}
                  </SAButton>
                </div>
              </>
            ) : (
              <div style={cajaInfo}>
                <div style={etiqueta}>Resolución</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                  {target.estatus === "aprobada"
                    ? `Aprobada por ${dinero(target.monto_aprobado)}`
                    : "Rechazada"}
                  {" · "}
                  {fecha(target.resuelto_at)}
                  {target.nota ? <div style={{ opacity: 0.75, marginTop: 4 }}>Nota: {target.nota}</div> : null}
                </div>
              </div>
            )}
          </div>
        )}
      </SAModal>
    </div>
  );
}