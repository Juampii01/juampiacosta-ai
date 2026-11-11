// Registro gratis con email. POST /api/registro (formulario: nombre, email, y opcionales utm_* del link).
// Guarda a la persona en la tabla «registros» de Supabase y le da la cookie de nivel «gratis»: abre las guías de los reels
// y el Módulo 1, y ve el resto bloqueado. Si ya tenía acceso pago, no se lo baja.
// Variables en Vercel: ACCESS_SECRET, SUPABASE_URL y SUPABASE_SECRET_KEY (la «secret key» sb_secret_… de Supabase; también sirve la vieja SUPABASE_SERVICE_ROLE_KEY). Nunca en el navegador ni en el código.

import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_MAX_AGE, AVISO_COOKIE_NAME, crearCookie, leerCookie, nivelDe, valorCookie } from "../lib/acceso.js";
import { permitido } from "./entrar.js";
import { mandarCodigo } from "./codigo.js";

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
// Las claves nuevas (sb_secret_…) no son JWT: van solo en «apikey». Las viejas (service_role, empiezan con eyJ) también en Authorization.
export function cabeceras(clave) {
  const h = { apikey: clave, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" };
  if (clave.startsWith("eyJ")) h.Authorization = `Bearer ${clave}`;
  return h;
}

export async function guardarEnSupabase(fila, { url, clave, fetchImpl = fetch } = {}) {
  const r = await fetchImpl(`${url.replace(/\/$/, "")}/rest/v1/registros?on_conflict=email`, {
    method: "POST",
    headers: cabeceras(clave),
    body: JSON.stringify(fila),
    signal: AbortSignal.timeout(5000)
  });
  if (!r.ok) throw new Error(`Supabase respondió ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

// ¿Este email ya compró? (lo marca el aviso de pago de Hotmart en api/hotmart.js)
export async function yaCompro(email, { url, clave, fetchImpl = fetch } = {}) {
  const h = cabeceras(clave);
  delete h.Prefer;
  const r = await fetchImpl(`${url.replace(/\/$/, "")}/rest/v1/registros?email=eq.${encodeURIComponent(email)}&select=compro`, {
    headers: h, signal: AbortSignal.timeout(5000)
  });
  if (!r.ok) throw new Error(`Supabase respondió ${r.status}`);
  const filas = await r.json();
  return Array.isArray(filas) && filas.length > 0 && filas[0].compro === true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.statusCode = 405; res.setHeader("Allow", "POST"); return res.end(); }
  const volver = (error) => { res.statusCode = 303; res.setHeader("Location", "/?error=" + error + "#gratis"); res.end(); };

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "sin-ip";
  if (!permitido(ip)) return volver("espera");

  const { ACCESS_SECRET: secreto, SUPABASE_URL: url } = process.env;
  const clave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secreto || !url || !clave) { console.error("Faltan variables: ACCESS_SECRET, SUPABASE_URL o SUPABASE_SECRET_KEY"); return volver("config"); }

  const cuerpo = await leerCuerpo(req);
  const fila = limpiarRegistro(cuerpo);
  if (!fila) return volver("email");

  try {
    await guardarEnSupabase(fila, { url, clave });
  } catch (e) {
    console.error("No se pudo guardar el registro:", e.message);
    return volver("config");
  }

  // Quien ya pagó sigue con su acceso completo. El registro solo da el plan gratis: el acceso completo exige
  // probar que el email es tuyo con el código del mail (api/codigo.js + api/verificar.js).
  const actual = nivelDe(await leerCookie(valorCookie(req.headers.cookie, ACCESS_COOKIE_NAME), secreto));
  if (actual !== "pago") {
    let compro = false;
    try { compro = await yaCompro(fila.email, { url, clave }); } catch (e) { console.error("No se pudo ver si compró:", e.message); }
    const cookie = await crearCookie(fila.email, fila.nombre || "", secreto, "gratis");
    const cookies = [
      `${ACCESS_COOKIE_NAME}=${encodeURIComponent(cookie)}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
      `${AVISO_COOKIE_NAME}=gratis; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax`,
      // Primer nombre legible por la página: el formulario de bienvenida saluda con él
      `jpa_nombre=${encodeURIComponent((fila.nombre || "").split(" ")[0].slice(0, 30))}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax`
    ];
    if (compro) {
      // Compró: le mandamos el código y lo llevamos a ponerlo; con eso se abre todo
      try { await mandarCodigo(fila.email, fila.nombre || ""); } catch (e) { console.error("No se pudo mandar el código:", e.message); }
      cookies.push(`jpa_pend=${encodeURIComponent(fila.email)}; Path=/; Max-Age=900; Secure; SameSite=Lax`);
      res.setHeader("Set-Cookie", cookies);
      res.statusCode = 303;
      res.setHeader("Location", "/entrar?paso=codigo");
      return res.end();
    }
    res.setHeader("Set-Cookie", cookies);
  }
  res.statusCode = 303;
  // Si vino desde una guía gratis, vuelve a esa guía; si no, a la biblioteca
  const destino = String(cuerpo.volver || "");
  // «/biblioteca» (link de los comentarios de reels): directo a la sección De mis reels para buscar la palabra del video
  res.setHeader("Location", /^\/guias\/[a-z0-9-]{3,120}(\.html)?$/.test(destino) ? destino : destino === "/biblioteca" ? "/biblioteca#posts" : destino === "/maquina" ? "/maquina" : "/recursos");
  res.end();
}
