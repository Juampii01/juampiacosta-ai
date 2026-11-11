// POST /api/interes (JSON: evento, detalle opcional) -> anota la intención de compra de quien está adentro.
// Eventos: aviso (vio el aviso del Classroom, una vez por día), si («Sí, lo quiero»), no («Ahora no»),
// ventana (se abrió la ventana de compra; detalle = desde dónde), hotmart / mpago (tocó el botón de pago),
// guia_paga (intentó abrir una guía del acceso completo; detalle = slug), oferta_vista / oferta_si / oferta_no
// (la oferta por única vez que se activa desde el Panel; detalle de oferta_si = hotmart o mpago). Los admins no cuentan.

import { sesion } from "../lib/sesion.js";
import { config, json, leerCuerpo, sb } from "../lib/db.js";

export const EVENTOS = ["aviso", "si", "no", "ventana", "hotmart", "mpago", "guia_paga", "oferta_vista", "oferta_si", "oferta_no"];

export function limpiarInteres(c) {
  const evento = String(c && c.evento || "");
  if (!EVENTOS.includes(evento)) return null;
  const detalle = String(c.detalle || "").toLowerCase().replace(/[^a-z0-9:_-]/g, "").slice(0, 120) || null;
  return { evento, detalle };
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return json(res, 405, { error: "metodo" }); }
  const yo = await sesion(req);
  if (!yo || !yo.email) return json(res, 200, { ok: false });
  if (yo.admin || !config()) return json(res, 200, { ok: true });
  const fila = limpiarInteres(await leerCuerpo(req, 2000));
  if (!fila) return json(res, 400, { error: "evento" });
  try {
    if (fila.evento === "aviso") {
      // Una sola vez por día por persona
      const hoy = new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10);
      const ya = await sb(`interes?email=eq.${encodeURIComponent(yo.email)}&evento=eq.aviso&creado=gte.${hoy}T03:00:00Z&select=id&limit=1`);
      if (ya.length) return json(res, 200, { ok: true });
    }
    await sb("interes", { method: "POST", prefer: "return=minimal", body: { email: yo.email, ...fila } });
    return json(res, 200, { ok: true });
  } catch (e) { console.error("interes:", e.message); return json(res, 502, { error: "servidor" }); }
}
