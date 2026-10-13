import { useCallback, useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_STORAGE_PREFIX = "balam_tour_completed";

const normalizeRole = (role = "") =>
  role.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const createStep = (element, title, description, side = "right", route = null) => ({
  element,
  route,
  popover: {
    title,
    description,
    side,
  },
});

const MENU_ACCORDIONS = {
  '[data-tour="menu-operaciones"]': "operaciones",
  '[data-tour="menu-catalogos"]': "catalogos",
  '[data-tour="menu-reportes"]': "reportes",
};

const isAccordionTarget = (element) => Boolean(MENU_ACCORDIONS[element]);

const openSidebarSection = (element) => {
  if (!isAccordionTarget(element)) return;

  const sectionContainer = document.querySelector(element);
  if (!sectionContainer) return;

  const title = sectionContainer.querySelector(".menu-section-title");
  if (!title) return;

  const submenu = sectionContainer.querySelector(".submenu");
  if (!submenu) return;

  const isClosed = !submenu.classList.contains("open");
  if (isClosed) title.click();
};

const closeSidebarSection = (element) => {
  if (!isAccordionTarget(element)) return;

  const sectionContainer = document.querySelector(element);
  if (!sectionContainer) return;

  const title = sectionContainer.querySelector(".menu-section-title");
  const submenu = sectionContainer.querySelector(".submenu");
  if (!title || !submenu) return;

  if (submenu.classList.contains("open")) title.click();
};

const TOUR_MODULES = [
  { route: "/admin", element: '[data-tour="topbar"]', title: "Topbar", description: "Este es el panel superior del sistema. Aquí revisas tus notificaciones, tu perfil y el acceso rápido a la ayuda.", side: "bottom" },
  { route: "/admin", element: '[data-tour="notificaciones-boton"]', title: "Notificaciones", description: "En este botón revisas alertas, avisos y recordatorios importantes del sistema.", side: "bottom" },
  { route: "/admin", element: '[data-tour="perfil-usuario"]', title: "Perfil", description: "Desde aquí puedes revisar tu información personal y cerrar tu sesión del sistema.", side: "bottom" },
  { route: "/admin", element: '[data-tour="tour-help"]', title: "Botón de ayuda", description: "Este icono reabre el recorrido guiado en cualquier momento para recordarte cómo usar la plataforma.", side: "bottom" },
  { route: "/admin", element: '[data-tour="plan-status"]', title: "Estado del plan", description: "Aquí revisas si tu plan está activo, sus días restantes y tus opciones de renovación o prueba.", side: "bottom" },
  { route: "/admin", element: '[data-tour="sidebar"]', title: "Sidebar", description: "El menú lateral es la navegación principal del sistema y organiza todas las secciones del negocio.", side: "right" },
  { route: "/admin/dashboard", element: '[data-tour="menu-dashboard"]', title: "Dashboard", description: "El dashboard es la vista general del negocio con KPI, tendencias y métricas clave de operación.", side: "right" },
  { route: "/admin/dashboard", element: '[data-tour="dashboard-kpis"]', title: "KPIs", description: "Los KPI resumen el estado del negocio: pólizas activas, siniestros, clientes y más.", side: "top" },
  { route: "/admin/dashboard", element: '[data-tour="dashboard-graficas"]', title: "Gráficas", description: "Las gráficas ayudan a comparar ingresos, tendencias y distribución por tipo de póliza.", side: "top" },
  { route: "/admin/polizas", element: '[data-tour="menu-operaciones"]', title: "Operaciones", description: "Aquí se agrupan las operaciones del negocio, incluidas pólizas, siniestros, pagos y evaluaciones.", side: "right" },
  { route: "/admin/polizas", element: '[data-tour="menu-polizas"]', title: "Pólizas", description: "En este módulo gestionas las pólizas activas, su estado, su historial y los movimientos principales.", side: "right" },
  { route: "/admin/siniestros", element: '[data-tour="menu-siniestros"]', title: "Siniestros", description: "Aquí revisas y gestionas los incidentes reportados, su detalle y su evolución hasta cerrar el caso.", side: "right" },
  { route: "/admin/pagos", element: '[data-tour="menu-pagos"]', title: "Pagos", description: "Este módulo te permite revisar pagos, estatus y movimientos asociados a la operación.", side: "right" },
  { route: "/admin/evaluaciones", element: '[data-tour="menu-evaluaciones"]', title: "Evaluaciones", description: "Aquí validas el resultado de evaluaciones y revisas la información técnica del caso o del bien.", side: "right" },
  { route: "/admin/indemnizaciones", element: '[data-tour="menu-indemnizaciones"]', title: "Indemnizaciones", description: "Controla los pagos o compensaciones por siniestro, montos y reasignación de documentos.", side: "right" },
  { route: "/admin/clientes", element: '[data-tour="menu-catalogos"]', title: "Catálogos", description: "Los catálogos reúnen los datos base del sistema y mantienen toda la operación ordenada.", side: "right" },
  { route: "/admin/clientes", element: '[data-tour="menu-clientes"]', title: "Clientes", description: "Desde aquí administras clientes, datos básicos, contacto y estatus del cliente dentro del sistema.", side: "right" },
  { route: "/admin/empleados", element: '[data-tour="menu-empleados"]', title: "Empleados", description: "Módulo para registrar, editar y mantener actualizada la información del personal y su estructura operativa.", side: "right" },
  { route: "/admin/bienes", element: '[data-tour="menu-bienes"]', title: "Bienes", description: "Define y administra los bienes asociables a clientes y pólizas para completar la cobertura.", side: "right" },
  { route: "/admin/coberturas", element: '[data-tour="menu-coberturas"]', title: "Coberturas", description: "En este módulo gestionas las coberturas que aplican a cada tipo de bien o póliza.", side: "right" },
  { route: "/admin/perfiles", element: '[data-tour="menu-perfiles"]', title: "Perfiles", description: "Los perfiles definen los roles y el alcance de permisos según la estructura del negocio.", side: "right" },
  { route: "/admin/reportes", element: '[data-tour="menu-reportes"]', title: "Reportes", description: "Este bloque agrupa reportes, vencimientos y renovaciones para que el usuario anticipe actividades pendientes.", side: "right" },
  { route: "/admin/reportes", element: '[data-tour="menu-reportes-listado"]', title: "Listado de reportes", description: "Aquí gestionas los reportes disponibles y revisas la información relevante para cada área.", side: "right" },
  { route: "/admin/reportes", element: '[data-tour="menu-polizas-vencer"]', title: "Pólizas por vencer", description: "Lista las pólizas próximas a vencer para que puedas tomar medidas antes del vencimiento.", side: "right" },
  { route: "/admin/reportes", element: '[data-tour="menu-renovaciones"]', title: "Renovaciones", description: "Revisa las solicitudes de renovación y mantén los contratos vigentes sin interrupciones.", side: "right" },
  { route: "/admin/permisos", element: '[data-tour="menu-permisos"]', title: "Permisos", description: "Establece qué puede hacer cada perfil y ajusta los permisos del sistema según el rol.", side: "right" },
  { route: "/admin/clientes", element: '[data-tour="tabla-accion-agregar"]', title: "Agregar cliente", description: "Este botón inicia el alta de un nuevo cliente dentro del módulo seleccionado.", side: "top" },
  { route: "/admin/clientes", element: '[data-tour="tabla-accion-editar"]', title: "Editar cliente", description: "Modifica la información de un cliente existente desde la acción de edición.", side: "left" },
  { route: "/admin/clientes", element: '[data-tour="tabla-accion-eliminar"]', title: "Eliminar cliente", description: "Elimina el registro tras confirmar la acción para evitar cambios accidentales.", side: "left" },
  { route: "/admin/polizas", element: '[data-tour="tabla-accion-agregar"]', title: "Agregar póliza", description: "Crea una nueva póliza y completa la información del cliente, bienes y cobertura asociados.", side: "top" },
  { route: "/admin/polizas", element: '[data-tour="tabla-accion-editar"]', title: "Editar póliza", description: "Permite modificar los datos de una póliza ya creada y actualizar su información.", side: "left" },
  { route: "/admin/polizas", element: '[data-tour="tabla-accion-eliminar"]', title: "Eliminar póliza", description: "Elimina la póliza únicamente si se confirma su baja o cancelación.", side: "left" },
  { route: "/admin/siniestros", element: '[data-tour="tabla-accion-agregar"]', title: "Agregar siniestro", description: "Registra un nuevo caso de siniestro y da inicio al procesamiento del evento.", side: "top" },
  { route: "/admin/siniestros", element: '[data-tour="tabla-accion-editar"]', title: "Editar siniestro", description: "Actualiza los datos del expediente del siniestro durante su gestión y revisión.", side: "left" },
  { route: "/admin/siniestros", element: '[data-tour="tabla-accion-eliminar"]', title: "Eliminar siniestro", description: "Elimina el registro solo cuando el caso ya no corresponde al flujo activo.", side: "left" },
  { route: "/admin/reportes", element: '[data-tour="tabla-accion-descargar"]', title: "Descargar PDF", description: "Este botón exporta el documento para revisión o entrega del archivo en formato PDF.", side: "left" },
];

const getOrderedTourSteps = (role) => {
  const steps = TOUR_MODULES.map((item) =>
    createStep(item.element, item.title, item.description, item.side, item.route)
  );

  const roleSpecific = normalizeRole(role) === "administrador"
    ? [
        createStep('[data-tour="menu-operaciones"]', "Operaciones del administrador", "Aquí gestionas el flujo principal del negocio, consolidando pólizas, siniestros y pagos.", "right", "/admin/polizas"),
        createStep('[data-tour="menu-catalogos"]', "Catálogos del administrador", "Mantén la data base del sistema para que clientes, empleados y coberturas se manejen de forma consistente.", "right", "/admin/clientes"),
      ]
    : normalizeRole(role) === "empleado"
      ? [
          createStep('[data-tour="menu-operaciones"]', "Operaciones del empleado", "Aquí encontrarás las tareas y revisiones que están habilitadas para tu perfil.", "right", "/admin/polizas"),
        ]
      : [];

  return [...steps, ...roleSpecific].filter((step) => {
    if (!step?.element) return false;
    return document.querySelector(step.element);
  });
};

export const getTourSteps = (role) => getOrderedTourSteps(role);

const getStorageKey = (usuario, role) => {
  const identity = usuario.id || usuario.id_usuario || usuario.correo || "anonymous";
  return `${TOUR_STORAGE_PREFIX}:${identity}:${normalizeRole(role) || "user"}`;
};

const useTour = ({ role, usuario = {}, autoStart = false, navigate } = {}) => {
  const driverRef = useRef(null);
  const storageKey = getStorageKey(usuario, role);

  const goToRoute = useCallback((route) => {
    if (!route || !navigate || route === window.location.pathname) return;
    navigate(route);
  }, [navigate]);

  const startTour = useCallback(() => {
    const steps = getOrderedTourSteps(role);
    if (!steps.length) return;

    driverRef.current?.destroy();

    driverRef.current = driver({
      animate: true,
      smoothScroll: true,
      allowClose: true,
      showProgress: true,
      progressText: "Paso {{current}} de {{total}}",
      nextBtnText: "Siguiente",
      prevBtnText: "Atrás",
      doneBtnText: "Finalizar",
      overlayColor: "rgba(5, 9, 12, 0.62)",
      popoverClass: "modern-tour-popover",
      stagePadding: 14,
      onHighlightStarted: (element, step) => {
        const key = step?.element;
        if (key && MENU_ACCORDIONS[key]) {
          openSidebarSection(key);
        }
      },
      onDeselected: (element, step) => {
        const key = step?.element;
        if (key && MENU_ACCORDIONS[key]) {
          closeSidebarSection(key);
        }
      },
      onNext: (element, step) => {
        if (step?.route && step.route !== window.location.pathname) {
          goToRoute(step.route);
        }
      },
      onPrevious: (element, step) => {
        if (step?.route && step.route !== window.location.pathname) {
          goToRoute(step.route);
        }
      },
      onDestroyed: () => {
        localStorage.setItem(storageKey, "true");
      },
    });

    driverRef.current.setSteps(steps);
    driverRef.current.drive();
  }, [goToRoute, role, storageKey]);

  useEffect(() => {
    if (!autoStart || localStorage.getItem(storageKey)) return undefined;

    const timer = window.setTimeout(startTour, 350);
    return () => window.clearTimeout(timer);
  }, [autoStart, startTour, storageKey]);

  useEffect(() => () => driverRef.current?.destroy(), []);

  return { startTour };
};

export default useTour;