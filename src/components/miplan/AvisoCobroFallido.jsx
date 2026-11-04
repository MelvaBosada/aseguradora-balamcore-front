import { Nota } from "./ui";

export default function AvisoCobroFallido({ cobro }) {
  if (!cobro) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <Nota color="#991b1b" fondo="#fef2f2" borde="#fecaca">
        <strong>No pudimos cobrar tu renovación</strong> (intento {cobro.intentos} de {cobro.maximo}): {cobro.error}
      </Nota>
    </div>
  );
}