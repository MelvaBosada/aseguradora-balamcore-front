const usePermisos = () => {
  const permisos = JSON.parse(localStorage.getItem("permisos") || "[]");
  const tiene = (clave) => permisos.includes(clave);
  const tieneAlguno = (...claves) => claves.some(c => tiene(c));
  return { permisos, tiene, tieneAlguno };
};

export default usePermisos;