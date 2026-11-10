// Quién hace el pedido, según la cookie firmada, y si es del equipo.
// ADMINS (variable en Vercel): emails del equipo separados por comas. Nunca en el código.

import { ACCESS_COOKIE_NAME, leerCookie, nivelDe, valorCookie } from "./acceso.js";

export function esAdmin(email, lista = process.env.ADMINS) {
  if (!email || !lista) return false;
  return String(lista).split(",").map((x) => x.trim().toLowerCase()).filter(Boolean).includes(String(email).toLowerCase());
}

/** { email, nombre, nivel, admin } o null si no hay sesión válida. Las sesiones de «clave:» no tienen email. */
export async function sesion(req, secreto = process.env.ACCESS_SECRET) {
  const p = await leerCookie(valorCookie(req.headers.cookie, ACCESS_COOKIE_NAME), secreto);
  if (!p) return null;
  const email = p.m && p.m.includes("@") && !p.m.startsWith("clave:") ? p.m : null;
  return { email, nombre: p.n || "", nivel: nivelDe(p), admin: esAdmin(email) };
}
