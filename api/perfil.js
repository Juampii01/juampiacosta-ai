// POST /api/perfil (JSON) -> guarda las respuestas del formulario de bienvenida en la fila de «registros» de quien está adentro.
// Quién es sale de la cookie firmada (no del cuerpo): nadie puede escribir los datos de otro email.
// Se llama varias veces (al cerrar cada bloque y al terminar); cada vez guarda lo que llegó.

import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_MAX_AGE, leerCookie, valorCookie } from "../lib/acceso.js";
import { limpiarPerfil } from "../lib/perfil.js";
import { cabeceras } from "./registro.js";

export const PERFIL_COOKIE_NAME = "jpa_perfil";

async function leerJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let texto = typeof req.body === "string" ? req.body : "";
  if (!texto) for await (const trozo of req) { texto += trozo; if (texto.length > 4000) break; }
  try { return JSON.parse(texto); } catch { return null; }
}

export async function actualizarEnSupabase(email, fila, { url, clave, fetchImpl = fetch } = {}) {
  const h = cabeceras(clave);
  h.Prefer = "return=minimal";
  const r = await fetchImpl(`${url.replace(/\/$/, "")}/rest/v1/registros?email=eq.${encodeURIComponent(email)}`, {
    method: "PATCH", headers: h, body: JSON.stringify(fila), signal: AbortSignal.timeout(5000)
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
  // Quien entró con clave de compra no tiene fila de email: no hay nada que guardar
  if (!quien.m || !quien.m.includes("@") || quien.m.startsWith("clave:")) return fin(204);

  const cuerpo = await leerJson(req);
  if (!cuerpo) return fin(400);
  const { fila, completo } = limpiarPerfil(cuerpo);
  if (!Object.keys(fila).length && !completo) return fin(400);
  fila.actualizado = new Date().toISOString();
  if (completo) fila.perfil_completo = true;

  try {
    await actualizarEnSupabase(quien.m, fila, { url, clave });
  } catch (e) {
    console.error("No se pudo guardar el perfil:", e.message);
    return fin(502);
  }
  if (completo) res.setHeader("Set-Cookie", `${PERFIL_COOKIE_NAME}=1; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax`);
  return fin(204);
}
