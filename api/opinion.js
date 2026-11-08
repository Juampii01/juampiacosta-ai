// POST /api/opinion (JSON) -> guarda una opinión sobre la biblioteca en la tabla «opiniones».
// Solo para quien está adentro (cookie firmada). El email sale de la cookie, no del cuerpo.

import { ACCESS_COOKIE_NAME, leerCookie, valorCookie } from "../lib/acceso.js";
import { limpiarOpinion } from "../lib/opinion.js";
import { cabeceras } from "./registro.js";

async function leerJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let texto = typeof req.body === "string" ? req.body : "";
  if (!texto) for await (const trozo of req) { texto += trozo; if (texto.length > 12000) break; }
  try { return JSON.parse(texto); } catch { return null; }
}

export async function guardarOpinion(fila, { url, clave, fetchImpl = fetch } = {}) {
  const h = cabeceras(clave);
  h.Prefer = "return=minimal";
  const r = await fetchImpl(`${url.replace(/\/$/, "")}/rest/v1/opiniones`, {
    method: "POST", headers: h, body: JSON.stringify(fila), signal: AbortSignal.timeout(5000)
  });
  if (!r.ok) throw new Error(`Supabase respondió ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

export default async function handler(req, res) {
  const fin = (codigo) => { res.statusCode = codigo; res.end(); };
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return fin(405); }

  const { ACCESS_SECRET: secreto, SUPABASE_URL: url } = process.env;
  const clave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secreto || !url || !clave) { console.error("Faltan variables: ACCESS_SECRET, SUPABASE_URL o SUPABASE_SECRET_KEY"); return fin(500); }

  const quien = await leerCookie(valorCookie(req.headers.cookie, ACCESS_COOKIE_NAME), secreto);
  if (!quien) return fin(401);

  const fila = limpiarOpinion(await leerJson(req));
  if (!fila) return fin(400);
  fila.email = quien.m && quien.m.includes("@") ? quien.m : null;
  fila.nivel = quien.l || null;

  try {
    await guardarOpinion(fila, { url, clave });
  } catch (e) {
    console.error("No se pudo guardar la opinión:", e.message);
    return fin(502);
  }
  return fin(204);
}
