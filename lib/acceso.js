// Cookie de acceso a la biblioteca: base64url(JSON) + "." + firma HMAC-SHA256 con ACCESS_SECRET.
// Usa Web Crypto para funcionar igual en la función de entrada (Node) y en middleware.js (Edge).

export const ACCESS_COOKIE_NAME = "jpa_acceso";
export const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año
// Aviso legible por las páginas (la cookie de acceso es HttpOnly): "pago" o "gratis". Solo cambia lo que se muestra;
// lo que se puede abrir lo decide middleware.js con la cookie firmada.
export const AVISO_COOKIE_NAME = "jpa_nivel";

/** Nivel de una cookie ya leída: las viejas, sin nivel, eran de pago */
export function nivelDe(payload) {
  if (!payload) return null;
  return payload.l === "gratis" ? "gratis" : "pago";
}

const encoder = new TextEncoder();

function aBase64url(bytes) {
  let texto = "";
  for (const b of bytes) texto += String.fromCharCode(b);
  return btoa(texto).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64url(texto) {
  const normal = texto.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((texto.length + 3) % 4);
  return Uint8Array.from(atob(normal), (c) => c.charCodeAt(0));
}

async function firmar(datos, secreto) {
  const clave = await crypto.subtle.importKey("raw", encoder.encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return aBase64url(new Uint8Array(await crypto.subtle.sign("HMAC", clave, encoder.encode(datos))));
}

/** base64url(JSON) + "." + firma. `quien` identifica la compra (email o clave usada) */
export async function crearCookie(email, nombre, secreto, nivel = "pago") {
  const payload = { v: 1, iat: Date.now(), m: email.trim().toLowerCase(), l: nivel === "gratis" ? "gratis" : "pago",
    ...(nombre ? { n: nombre.trim().slice(0, 60) } : {}) };
  const datos = aBase64url(encoder.encode(JSON.stringify(payload)));
  return `${datos}.${await firmar(datos, secreto)}`;
}

/** El payload si la firma es buena y no caducó; si no, null. Nunca lanza. */
export async function leerCookie(valor, secreto) {
  if (!valor || !secreto) return null;
  const [datos, firma] = valor.split(".");
  if (!datos || !firma) return null;
  try {
    // Comparación de tiempo constante
    const esperada = await firmar(datos, secreto);
    if (esperada.length !== firma.length) return null;
    let diferencia = 0;
    for (let i = 0; i < esperada.length; i++) diferencia |= esperada.charCodeAt(i) ^ firma.charCodeAt(i);
    if (diferencia !== 0) return null;
    const payload = JSON.parse(new TextDecoder().decode(deBase64url(datos)));
    if (payload.v !== 1 || typeof payload.iat !== "number") return null;
    if (Date.now() - payload.iat >= ACCESS_COOKIE_MAX_AGE * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Busca una cookie por nombre en la cabecera Cookie */
export function valorCookie(cabecera, nombre) {
  const trozo = (cabecera || "").split(/;\s*/).find((c) => c.startsWith(nombre + "="));
  return trozo ? decodeURIComponent(trozo.slice(nombre.length + 1)) : undefined;
}

// Link mágico que se manda por DM (api/manychat.js lo crea, api/acceso.js lo canjea por la cookie).
// Se firma con una variante del secreto para que una cookie no sirva como link ni al revés. Dura 30 días.
export const ENLACE_MAX_AGE = 60 * 60 * 24 * 30;

export async function crearEnlace(email, nombre, guia, secreto, ahora = Date.now()) {
  const payload = { v: 1, iat: ahora, m: email.trim().toLowerCase(), ...(nombre ? { n: nombre.trim().slice(0, 60) } : {}), ...(guia ? { g: guia } : {}) };
  const datos = aBase64url(encoder.encode(JSON.stringify(payload)));
  return `${datos}.${await firmar(datos, secreto + "|enlace")}`;
}

export async function leerEnlace(valor, secreto, ahora = Date.now()) {
  if (!valor || !secreto || valor.length > 1000) return null;
  const p = await leerCookie(valor, secreto + "|enlace");
  if (!p || typeof p.m !== "string" || ahora - p.iat >= ENLACE_MAX_AGE * 1000) return null;
  return p;
}
