// Registro gratis. POST /api/registro (formulario: nombre, email, whatsapp, pais, perfil, rubro, nivel, objetivo y utm_* del link).
// Guarda a la persona en la tabla «registros» de Supabase y le da la cookie de nivel «gratis»: abre las guías de los reels
// y el Módulo 1, y ve el resto bloqueado. Si ya tenía acceso pago, no se lo baja.
// Variables en Vercel: ACCESS_SECRET, SUPABASE_URL y SUPABASE_SECRET_KEY (la «secret key» sb_secret_… de Supabase; también sirve la vieja SUPABASE_SERVICE_ROLE_KEY). Nunca en el navegador ni en el código.

import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_MAX_AGE, AVISO_COOKIE_NAME, crearCookie, leerCookie, nivelDe, valorCookie } from "../lib/acceso.js";
import { permitido } from "./entrar.js";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];

// Opciones de cada desplegable del formulario (las mismas que en web/inicio.html). Lo que no esté acá no se guarda.
export const OPCIONES = {
  pais: ["Argentina", "México", "Colombia", "Chile", "Perú", "Uruguay", "Ecuador", "Venezuela", "España", "Estados Unidos", "Otro"],
  perfil: ["Tengo un negocio", "Trabajo en una empresa", "Freelancer o agencia", "Quiero vender IA a empresas", "Estudiante", "Otro"],
  nivel: ["Nunca usé IA", "Uso ChatGPT o Claude a veces", "La uso todos los días", "Ya armo automatizaciones o agentes"],
  objetivo: ["Ahorrar tiempo en mi negocio", "Vender servicios de IA", "Conseguir trabajo con IA", "Aprender", "Que me lo instalen en mi negocio"]
};
const WHATSAPP = /^\+?[0-9 ()-]{8,25}$/;
const texto = (v, max) => String(v || "").trim().replace(/\s+/g, " ").slice(0, max);

// Devuelve { fila } o { error } con el código que muestra la portada
export function limpiarRegistro(cuerpo) {
  const email = String(cuerpo.email || "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return { error: "email" };
  const nombre = texto(cuerpo.nombre, 80);
  if (!nombre) return { error: "datos" };
  const whatsapp = texto(cuerpo.whatsapp, 25);
  if (!WHATSAPP.test(whatsapp) || whatsapp.replace(/\D/g, "").length < 8) return { error: "whatsapp" };
  const fila = { email, nombre, whatsapp, rubro: texto(cuerpo.rubro, 80) || null, origen: "web", actualizado: new Date().toISOString() };
  for (const [k, lista] of Object.entries(OPCIONES)) {
    const v = texto(cuerpo[k], 60);
    if (!lista.includes(v)) return { error: "datos" };
    fila[k] = v;
  }
  for (const k of UTM) {
    const v = texto(cuerpo[k], 120);
    if (v) fila[k] = v;
  }
  return { fila };
}

async function leerCuerpo(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return Object.fromEntries(new URLSearchParams(req.body));
  let texto = "";
  for await (const trozo of req) { texto += trozo; if (texto.length > 4000) break; }
  return Object.fromEntries(new URLSearchParams(texto));
}

// Inserta en Supabase por su API REST. Si el email ya estaba, actualiza sus datos sin duplicarlo (merge-duplicates sobre la columna única email).
// Las claves nuevas (sb_secret_…) no son JWT: van solo en «apikey». Las viejas (service_role, empiezan con eyJ) también en Authorization.
export function cabeceras(clave) {
  const h = { apikey: clave, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" };
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

export default async function handler(req, res) {
  if (req.method !== "POST") { res.statusCode = 405; res.setHeader("Allow", "POST"); return res.end(); }
  const volver = (error) => { res.statusCode = 303; res.setHeader("Location", "/?error=" + error + "#gratis"); res.end(); };

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "sin-ip";
  if (!permitido(ip)) return volver("espera");

  const { ACCESS_SECRET: secreto, SUPABASE_URL: url } = process.env;
  const clave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secreto || !url || !clave) { console.error("Faltan variables: ACCESS_SECRET, SUPABASE_URL o SUPABASE_SECRET_KEY"); return volver("config"); }

  const { fila, error } = limpiarRegistro(await leerCuerpo(req));
  if (error) return volver(error);

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
