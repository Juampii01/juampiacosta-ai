// Cuentas del Inicio (/inicio): racha, chances del sorteo y ranking del mes. Funciones puras para poder testearlas.

/** Fecha de hoy en Argentina (AAAA-MM-DD), igual que la tabla actividad. */
export function hoyAr(ahora = Date.now()) {
  return new Date(ahora - 3 * 36e5).toISOString().slice(0, 10);
}

function menosDias(dia, n) {
  return new Date(Date.parse(dia + "T12:00:00Z") - n * 864e5).toISOString().slice(0, 10);
}

/** Días seguidos entrando, contando hasta hoy (o hasta ayer, si hoy todavía no entró). */
export function racha(dias, hoy = hoyAr()) {
  const set = new Set(dias || []);
  let d = set.has(hoy) ? hoy : menosDias(hoy, 1), n = 0;
  while (set.has(d)) { n++; d = menosDias(d, 1); }
  return n;
}

/** La racha más larga de una lista de días. */
export function mejorRacha(dias) {
  const orden = [...new Set(dias || [])].sort();
  let mejor = 0, actual = 0, prev = null;
  for (const d of orden) {
    actual = prev && menosDias(d, 1) === prev ? actual + 1 : 1;
    mejor = Math.max(mejor, actual); prev = d;
  }
  return mejor;
}

// Sorteo de 2 accesos completos entre los del plan gratis
export const SORTEO = { premios: 2, cierra: "2026-11-30", desde: "2026-11-01" };

/** Chances: 1 por registrarte + 1 por cada guía completada + 1 por cada día que entraste desde que arrancó el sorteo. */
export function chances(completadas, diasDesdeInicio) {
  return 1 + (completadas || 0) + (diasDesdeInicio || 0);
}

/** Puntos del ranking del mes: 10 por guía completada en el mes + 5 por día que entraste en el mes. */
export function puntos(guiasMes, diasMes) {
  return (guiasMes || 0) * 10 + (diasMes || 0) * 5;
}

/** Cómo se ve un nombre en el ranking: «Lucas C.» (nunca el email). */
export function nombreCorto(nombre) {
  const p = String(nombre || "").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "Alguien de Forja";
  const n = p[0].charAt(0).toUpperCase() + p[0].slice(1).toLowerCase();
  return p[1] ? n + " " + p[1].charAt(0).toUpperCase() + "." : n;
}

/**
 * Ranking del mes entre los que tienen el acceso completo.
 * personas: [{email, nombre}] · guias: {email: n} · dias: {email: n}
 * Devuelve el top 3 y tu puesto (sin emails).
 */
export function ranking(personas, guias, dias, yo) {
  const filas = (personas || []).map((p) => ({ email: p.email, nombre: nombreCorto(p.nombre), pts: puntos(guias[p.email], dias[p.email]) }))
    .filter((f) => f.pts > 0 || f.email === yo)
    .sort((a, b) => b.pts - a.pts || a.nombre.localeCompare(b.nombre));
  const lista = filas.map((f, i) => ({ pos: i + 1, nombre: f.nombre, pts: f.pts, yo: f.email === yo }));
  const mio = lista.find((f) => f.yo) || null;
  return { top: lista.slice(0, 3), yo: mio, total: lista.length };
}
