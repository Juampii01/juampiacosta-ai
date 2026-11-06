// Entrada a la biblioteca con la clave que recibe cada comprador.
// POST /api/entrar (formulario: clave) -> si la clave está en CLAVES_ACCESO, da la cookie de acceso firmada y lleva a /recursos.
// Variables en Vercel (nunca en el código): ACCESS_SECRET (texto largo al azar) y CLAVES_ACCESO (claves separadas por comas).
// Para cortar el acceso de una clave que se filtró: sacala de CLAVES_ACCESO (quien ya entró sigue adentro hasta que cambies ACCESS_SECRET).

import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_MAX_AGE, AVISO_COOKIE_NAME, crearCookie } from "../lib/acceso.js";

// Límite de 10 intentos por minuto por IP (en memoria por instancia), contra quien prueba claves al azar
const intentos = new Map();
export function permitido(ip, ahora = Date.now()) {
  const recientes = (intentos.get(ip) || []).filter((t) => ahora - t < 60000);
  if (recientes.length >= 10) { intentos.set(ip, recientes); return false; }
  recientes.push(ahora);
  intentos.set(ip, recientes);
  if (intentos.size > 1000) for (const [k, v] of intentos) if (v.every((t) => ahora - t >= 60000)) intentos.delete(k);
  return true;
}

export function claveValida(clave, lista) {
  const limpia = String(clave || "").trim().toUpperCase();
  if (!limpia || limpia.length > 64) return false;
  return String(lista || "").split(",").map((c) => c.trim().toUpperCase()).filter(Boolean).includes(limpia);
}

async function leerCuerpo(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return Object.fromEntries(new URLSearchParams(req.body));
  let texto = "";
  for await (const trozo of req) { texto += trozo; if (texto.length > 2000) break; }
  return Object.fromEntries(new URLSearchParams(texto));
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.statusCode = 405; res.setHeader("Allow", "POST"); return res.end(); }
  const volver = (error) => { res.statusCode = 303; res.setHeader("Location", "/?error=" + error + "#entrar"); res.end(); };

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "sin-ip";
  if (!permitido(ip)) return volver("espera");

  const secreto = process.env.ACCESS_SECRET;
  if (!secreto) { console.error("Falta ACCESS_SECRET"); return volver("config"); }

  const { clave } = await leerCuerpo(req);
  if (!claveValida(clave, process.env.CLAVES_ACCESO)) return volver("clave");

  const cookie = await crearCookie("clave:" + String(clave).trim().toUpperCase(), "", secreto, "pago");
  res.setHeader("Set-Cookie", [
    `${ACCESS_COOKIE_NAME}=${encodeURIComponent(cookie)}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
    `${AVISO_COOKIE_NAME}=pago; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax`
  ]);
  res.statusCode = 303;
  res.setHeader("Location", "/recursos");
  res.end();
}
