// GET  /api/progreso -> { vistas: [slugs] } de quien está adentro
// POST /api/progreso (JSON: slug o slugs) -> marca guías como vistas. Así el progreso sigue a la persona entre dispositivos.

import { sesion } from "../lib/sesion.js";
import { config, enc, json, leerCuerpo, sb } from "../lib/db.js";

const SLUG = /^[a-z0-9-]{3,140}$/;

export default async function handler(req, res) {
  const yo = await sesion(req);
  if (!yo) return json(res, 401, { error: "sesion" });
  if (!yo.email || !config()) return json(res, 200, { vistas: [] });
  try {
    if (req.method === "GET") {
      const filas = await sb(`progreso?email=eq.${enc(yo.email)}&select=slug&limit=1000`);
      return json(res, 200, { vistas: filas.map((f) => f.slug) });
    }
    if (req.method === "POST") {
      const c = await leerCuerpo(req, 12000);
      const slugs = [].concat(c.slugs || [], c.slug || []).map(String).filter((s) => SLUG.test(s)).slice(0, 200);
      if (!slugs.length) return json(res, 400, { error: "slug" });
      await sb("progreso?on_conflict=email,slug", { method: "POST", prefer: "resolution=ignore-duplicates,return=minimal",
        body: slugs.map((slug) => ({ email: yo.email, slug })) });
      return json(res, 200, { ok: true });
    }
  } catch (e) { console.error("progreso:", e.message); return json(res, 502, { error: "servidor" }); }
  res.setHeader("Allow", "GET, POST");
  return json(res, 405, { error: "metodo" });
}
