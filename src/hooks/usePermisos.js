const usePermisos = () => {
  const permisos    = JSON.parse(localStorage.getItem("permisos") || "[]");
  const modulos     = JSON.parse(localStorage.getItem("modulos")  || "[]");
  const usuario     = JSON.parse(localStorage.getItem("usuario")  || "{}");
  const suscripcion = JSON.parse(localStorage.getItem("suscripcion") || "null");

  const tiene = (clave) => permisos.includes(clave) && (modulos.length === 0 || modulos.includes(clave));
  const tieneAlguno = (...claves) => claves.some(c => tiene(c));

  const diasRestantes = () => {
    // tiene suscripción pagada activa
    if (suscripcion && suscripcion.estatus === "activo") {
      const fin  = new Date(suscripcion.fecha_fin);
      const hoy  = new Date();
      const diff = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    }

    // prueba gratuita de 15 días desde fecha_registro
    const fechaRegistro = usuario.fecha_registro;
    if (fechaRegistro) {
      const registro = new Date(fechaRegistro);
      const hoy      = new Date();
      const diasUsados = Math.floor((hoy - registro) / (1000 * 60 * 60 * 24));
      const restantes  = 15 - diasUsados;
      return restantes > 0 ? restantes : 0;
    }

    return 15;
  };

  const esPrueba = !suscripcion || suscripcion.estatus === "prueba";
  const vencida  = diasRestantes() <= 0 && (!suscripcion || suscripcion.estatus !== "activo");

  return { permisos, modulos, tiene, tieneAlguno, suscripcion, diasRestantes, esPrueba, vencida };
};

export default usePermisos;