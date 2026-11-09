// Registro gratis desde el chat de Instagram. ManyChat (paso «External Request») llama:
//   POST /api/manychat   cabecera  x-clave: <MANYCHAT_SECRET>
//   cuerpo JSON  { "email": "...", "nombre": "...", "guia": "<slug o link de la guía>" }  (o el «Full Contact Data» de ManyChat)
// Guarda a la persona en «registros» (origen «manychat») y responde { ok, link }: un link mágico que, al tocarlo,
// le deja la sesión iniciada y la lleva directo a la guía. Si el email no sirve responde { ok: false, error: "email" }
// con estado 200, para que ManyChat pueda volver a preguntarlo.
// Variables en Vercel: MANYCHAT_SECRET, ACCESS_SECRET, SUPABASE_URL, SUPABASE_SECRET_KEY.

import { crearEnlace } from "../lib/acceso.js";
import { GUIAS_GRATIS } from "../lib/gratis.js";
import { guardarEnSupabase, limpiarRegistro } from "./registro.js";

export function claveIgual(a, b) {
  a = String(a || ""); b = String(b || "");
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** Slug de una guía gratis a partir de lo que mande ManyChat (slug suelto o link completo); si no es gratis, null */
export function guiaGratis(valor) {
  const m = String(valor || "").trim().toLowerCase().match(/(?:^|\/guias\/)([a-z0-9-]{3,120})(?:\.html)?\/?(?:[?#].*)?$/);
  return m && GUIAS_GRATIS.has(m[1]) ? m[1] : null;
}

async function leerJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let texto = typeof req.body === "string" ? req.body : "";
  if (!texto) for await (const trozo of req) { texto += trozo; if (texto.length > 4000) break; }
  try { return JSON.parse(texto); } catch { return Object.fromEntries(new URLSearchParams(texto)); }
}

export default async function handler(req, res) {
  const responder = (estado, datos) => { res.statusCode = estado; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(datos)); };
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return responder(405, { ok: false }); }

  const { MANYCHAT_SECRET, ACCESS_SECRET: secreto, SUPABASE_URL: url } = process.env;
  const clave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!MANYCHAT_SECRET || !secreto || !url || !clave) { console.error("Faltan variables para /api/manychat"); return responder(500, { ok: false, error: "config" }); }
  if (!claveIgual(req.headers["x-clave"], MANYCHAT_SECRET)) return responder(401, { ok: false });

  const cuerpo = await leerJson(req);
  // ManyChat puede mandar «Full Contact Data»: el nombre viene en first_name / name
  if (!cuerpo.nombre) cuerpo.nombre = cuerpo.first_name || cuerpo.name || "";
  const fila = limpiarRegistro(cuerpo);
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "juampiacosta-ai.vercel.app").split(",")[0].trim();
  // Sin mail válido (por ejemplo, si tocó «Sin mail»): el link lleva al registro normal de la web, así los botones nunca quedan rotos
  if (!fila) return responder(200, { ok: false, error: "email", link: `https://${host}/api/acceso?t=` });
  fila.origen = "manychat";
  const guia = guiaGratis(cuerpo.guia);
  if (guia) fila.utm_content = guia.slice(0, 120);

  try { await guardarEnSupabase(fila, { url, clave }); }
  catch (e) { console.error("No se pudo guardar el registro de ManyChat:", e.message); return responder(500, { ok: false, error: "guardar" }); }

  const t = await crearEnlace(fila.email, fila.nombre || "", guia, secreto);
  return responder(200, { ok: true, link: `https://${host}/api/acceso?t=${encodeURIComponent(t)}` });
}
