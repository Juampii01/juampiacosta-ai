// GET  /api/cuenta -> tus datos (email, nombre, rubro, plan, preferencias de mail)
// POST /api/cuenta (JSON: nombre, rubro, mails) -> guarda los cambios. Quién eres sale de la cookie, no del cuerpo.

import { sesion } from "../lib/sesion.js";
import { config, enc, json, leerCuerpo, sb } from "../lib/db.js";

export function limpiarCuenta(c) {
  const fila = {};
  if (typeof c.nombre === "string") { const n = c.nombre.trim().replace(/\s+/g, " ").slice(0, 80); if (n) fila.nombre = n; }
  if (typeof c.rubro === "string") fila.rubro = c.rubro.trim().replace(/\s+/g, " ").slice(0, 80) || null;
  if (typeof c.mails === "boolean") fila.baja = !c.mails;
  return fila;
}

export default async function handler(req, res) {
  const yo = await sesion(req);
  if (!yo) return json(res, 401, { error: "sesion" });
  if (!yo.email || !config()) return json(res, 200, { email: null, nombre: yo.nombre, nivel: yo.nivel, admin: yo.admin });

  if (req.method === "GET") {
    try {
      const f = (await sb(`registros?email=eq.${enc(yo.email)}&select=nombre,rubro,baja,compro,creado,perfil_completo`))[0] || {};
      return json(res, 200, { email: yo.email, nombre: f.nombre || yo.nombre, rubro: f.rubro || "", mails: !f.baja, nivel: yo.nivel, compro: !!f.compro, desde: f.creado || null, perfil: !!f.perfil_completo, admin: yo.admin });
    } catch (e) { console.error("cuenta GET:", e.message); return json(res, 502, { error: "servidor" }); }
  }
  if (req.method === "POST") {
    const fila = limpiarCuenta(await leerCuerpo(req));
    if (!Object.keys(fila).length) return json(res, 400, { error: "vacio" });
    fila.actualizado = new Date().toISOString();
    try {
      await sb(`registros?email=eq.${enc(yo.email)}`, { method: "PATCH", prefer: "return=minimal", body: fila });
      if (fila.nombre) res.setHeader("Set-Cookie", `jpa_nombre=${encodeURIComponent(fila.nombre.split(" ")[0].slice(0, 30))}; Path=/; Max-Age=${60 * 60 * 24 * 365}; Secure; SameSite=Lax`);
      return json(res, 200, { ok: true });
    } catch (e) { console.error("cuenta POST:", e.message); return json(res, 502, { error: "servidor" }); }
  }
  res.setHeader("Allow", "GET, POST");
  return json(res, 405, { error: "metodo" });
}
