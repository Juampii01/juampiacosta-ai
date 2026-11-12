// GET  /api/cuenta -> tus datos (email, nombre, rubro, plan, preferencias de mail)
// POST /api/cuenta (JSON: nombre, rubro, mails) -> guarda los cambios. Quién eres sale de la cookie, no del cuerpo.

import { sesion } from "../lib/sesion.js";
import { crearCookie } from "../lib/acceso.js";
import { cookiesDeSesion } from "./verificar.js";
import { config, enc, json, leerCuerpo, sb } from "../lib/db.js";

export function limpiarCuenta(c) {
  const fila = {};
  if (typeof c.nombre === "string") { const n = c.nombre.trim().replace(/\s+/g, " ").slice(0, 80); if (n) fila.nombre = n; }
  if (typeof c.rubro === "string") fila.rubro = c.rubro.trim().replace(/\s+/g, " ").slice(0, 80) || null;
  if (typeof c.mails === "boolean") fila.baja = !c.mails;
  return fila;
}

/** "/api/cuenta?p=/guias/22-skills" → "g:22-skills"; "?p=/comunidad" → "comunidad". Nada raro entra a la base. */
export function paginaDe(url) {
  let p = "";
  try { p = new URL(url || "", "http://x").searchParams.get("p") || ""; } catch { return ""; }
  p = p.toLowerCase().replace(/\.html$/, "").replace(/[#?].*$/, "");
  const g = p.match(/^\/guias\/([a-z0-9-]{3,120})$/);
  if (g) return "g:" + g[1];
  const m = p.match(/^\/([a-z]{3,20})$/);
  return m ? m[1] : p === "/" ? "inicio" : "";
}

/** La oferta por única vez (Panel → «Oferta»): solo si está activa, tiene links y esta persona no la vio desde que se activó. */
export async function ofertaPara(email, consultar = sb, pais = "") {
  try {
    const a = (await consultar("ajustes?clave=eq.oferta&select=valor"))[0];
    const o = a && a.valor;
    // «prueba»: emails que la ven aunque esté apagada (para probarla antes de prenderla para todos)
    const prueba = Array.isArray(o && o.prueba) && o.prueba.includes(email);
    if (!o || !o.hotmart || !(prueba || (o.activa && o.desde))) return null;
    const desde = o.activa && o.desde ? o.desde : o.prueba_desde || "2000-01-01";
    const vista = await consultar(`interes?email=eq.${enc(email)}&evento=eq.oferta_vista&creado=gte.${enc(desde)}&select=id&limit=1`);
    if (vista.length) return null;
    // Mercado Pago solo cobra en pesos: a quien dijo que está en otro país no le mostramos ese botón
    const mp = pais && pais !== "Argentina" ? "" : o.mpago || "";
    return { precio: o.precio, antes: o.antes, hotmart: o.hotmart, mpago: mp, pesos: mp ? o.pesos || "" : "" };
  } catch (e) { console.error("oferta:", e.message); return null; }
}

export default async function handler(req, res) {
  const yo = await sesion(req);
  if (!yo) return json(res, 401, { error: "sesion" });
  if (!yo.email || !config()) return json(res, 200, { email: null, nombre: yo.nombre, nivel: yo.nivel, admin: yo.admin });

  if (req.method === "GET") {
    // Cada página de la plataforma llama acá al cargar: anotamos que entró hoy y qué abrió (los admins no cuentan)
    const pagina = paginaDe(req.url);
    if (!yo.admin && pagina) {
      await sb("rpc/registrar_actividad", { method: "POST", body: { p_email: yo.email, p_seccion: pagina } }).catch((e) => console.error("actividad:", e.message));
    }
    try {
      const f = (await sb(`registros?email=eq.${enc(yo.email)}&select=nombre,rubro,baja,compro,creado,perfil_completo,pais`))[0] || {};
      // Pagó (Hotmart o acceso a mano desde el Panel) y sigue con la cookie del plan gratis: se la pasamos a «pago» acá mismo
      let nivel = yo.nivel, subio = false;
      if (f.compro && yo.nivel === "gratis" && process.env.ACCESS_SECRET) {
        const cookie = await crearCookie(yo.email, f.nombre || yo.nombre || "", process.env.ACCESS_SECRET, "pago");
        res.setHeader("Set-Cookie", cookiesDeSesion(cookie, "pago", f.nombre || yo.nombre, yo.admin));
        nivel = "pago"; subio = true;
      }
      const oferta = nivel === "gratis" && !yo.admin ? await ofertaPara(yo.email, sb, f.pais || "") : null;
      return json(res, 200, { subio, oferta, email: yo.email, nombre: f.nombre || yo.nombre, rubro: f.rubro || "", mails: !f.baja, nivel, compro: !!f.compro, desde: f.creado || null, perfil: !!f.perfil_completo, admin: yo.admin });
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
