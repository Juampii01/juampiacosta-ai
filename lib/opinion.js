// Limpia lo que llega del formulario «Tu opinión»: solo campos conocidos, textos recortados y nota del 1 al 5.
const TEXTOS = ["gusta", "mejorar", "sobra", "falta"];
const MAX = 2000;

export function limpiarOpinion(cuerpo) {
  if (!cuerpo || typeof cuerpo !== "object") return null;
  const fila = {};
  const nota = Number(cuerpo.nota);
  if (Number.isInteger(nota) && nota >= 1 && nota <= 5) fila.nota = nota;
  for (const k of TEXTOS) {
    const v = typeof cuerpo[k] === "string" ? cuerpo[k].trim().slice(0, MAX) : "";
    if (v) fila[k] = v;
  }
  if (typeof cuerpo.vista === "string" && /^[a-z-]{2,30}$/.test(cuerpo.vista)) fila.vista = cuerpo.vista;
  // Sin nota y sin ningún texto no hay opinión
  if (!fila.nota && !TEXTOS.some((k) => fila[k])) return null;
  return fila;
}
