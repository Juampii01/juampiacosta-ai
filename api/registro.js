// Registro gratis con email. POST /api/registro (formulario: nombre, email, y opcionales utm_* del link).
// Guarda a la persona en la tabla «registros» de Supabase y le da la cookie de nivel «gratis»: abre las guías de los reels
// y el Módulo 1, y ve el resto bloqueado. Si ya tenía acceso pago, no se lo baja.
// Variables en Vercel: ACCESS_SECRET, SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (la clave secreta: nunca en el navegador ni en el código).

import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_MAX_AGE, AVISO_COOKIE_NAME, crearCookie, leerCookie, nivelDe, valorCookie } from "../lib/acceso.js";
import { permitido } from "./entrar.js";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];

export function limpiarRegistro(cuerpo) {
  const email = String(cuerpo.email || "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return null;
  const nombre = String(cuerpo.nombre || "").trim().replace(/\s+/g, " ").slice(0, 80);
  const fila = { email, nombre: nombre || null, origen: "web" };
  for (const k of UTM) {
    const v = String(cuerpo[k] || "").trim().slice(0, 120);
    if (v) fila[k] = v;
  }
  return fila;
}

async function leerCuerpo(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return Object.fromEntries(new URLSearchParams(req.body));
  let texto = "";
  for await (const trozo of req) { texto += trozo; if (texto.length > 4000) break; }
  return Object.fromEntries(new URLSearchParams(texto));
}

// Inserta en Supabase por su API REST. Si el email ya estaba, no lo duplica (ignore-duplicates sobre la columna única email).
export async function guardarEnSupabase(fila, { url, clave, fetchImpl = fetch } = {}) {
  const r = await fetchImpl(`${url.replace(/\/$/, "")}/rest/v1/registros?on_conflict=email`, {
    method: "POST",
    headers: { apikey: clave, Authorization: `Bearer ${clave}`, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(fila),
    signal: AbortSignal.timeout(5000)
  });
  if (!r.ok) throw new Error(`Supabase respondió ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.statusCode = 405; res.setHeader("Allow", "POST"); return res.end(); }
  const volver = (error) => { res.statusCode = 303; res.setHeader("Location", "/?error=" + error + "#gratis"); res.end(); };

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "sin-ip";
  if (!permitido(ip)) return volver("espera");

  const { ACCESS_SECRET: secreto, SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: clave } = process.env;
  if (!secreto || !url || !clave) { console.error("Faltan variables: ACCESS_SECRET, SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"); return volver("config"); }

  const fila = limpiarRegistro(await leerCuerpo(req));
  if (!fila) return volver("email");

  try {
    await guardarEnSupabase(fila, { url, clave });
  } catch (e) {
    console.error("No se pudo guardar el registro:", e.message);
    return volver("config");
  }

  // Quien ya pagó sigue con su acceso completo
  const actual = nivelDe(await leerCookie(valorCookie(req.headers.cookie, ACCESS_COOKIE_NAME), secreto));
  if (actual !== "pago") {
    const cookie = await crearCookie(fila.email, fila.nombre || "", secreto, "gratis");
    res.setHeader("Set-Cookie", [
      `${ACCESS_COOKIE_NAME}=${encodeURIComponent(cookie)}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
      `${AVISO_COOKIE_NAME}=gratis; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax`
    ]);
  }
  res.statusCode = 303;
  res.setHeader("Location", "/recursos");
  res.end();
}
