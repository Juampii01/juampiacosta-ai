// POST /api/hotmart -> aviso de Hotmart (Webhook 2.0) cuando cambia una compra.
// Compra aprobada: marca el email como comprador en «registros». Reembolso o contracargo: le saca la marca.
// Quien compró entra registrándose en la landing con el mismo email: api/registro.js le da el acceso completo.
// Hotmart firma cada aviso con el «hottok» de tu cuenta (variable HOTMART_HOTTOK en Vercel).

import { timingSafeEqual } from "node:crypto";
import { cabeceras } from "./registro.js";

const APROBADA = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"]);
const ANULADA = new Set(["PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK", "PURCHASE_CANCELED", "PURCHASE_PROTEST"]);

async function leerJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let texto = typeof req.body === "string" ? req.body : "";
  if (!texto) for await (const trozo of req) { texto += trozo; if (texto.length > 100000) break; }
  try { return JSON.parse(texto); } catch { return null; }
}

export function hottokValido(recibido, esperado) {
  if (!recibido || !esperado) return false;
  const a = Buffer.from(String(recibido)), b = Buffer.from(String(esperado));
  return a.length === b.length && timingSafeEqual(a, b);
}

// Devuelve { email, nombre, compro } o null si el aviso no cambia nada
export function leerAviso(cuerpo) {
  if (!cuerpo || typeof cuerpo !== "object") return null;
  const evento = String(cuerpo.event || "");
  const comprador = (cuerpo.data && cuerpo.data.buyer) || {};
  const email = String(comprador.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (APROBADA.has(evento)) return { email, nombre: String(comprador.name || "").slice(0, 80), compro: true };
  if (ANULADA.has(evento)) return { email, compro: false };
  return null;
}

export async function marcarCompra({ email, nombre, compro }, { url, clave, fetchImpl = fetch } = {}) {
  const base = url.replace(/\/$/, "");
  const h = cabeceras(clave);
  h.Prefer = "return=minimal";
  // Si ya existe la fila (se registró antes), solo cambia «compro»; si no, la crea
  const r = await fetchImpl(`${base}/rest/v1/registros?email=eq.${encodeURIComponent(email)}`, {
    method: "PATCH", headers: { ...h, Prefer: "return=representation" }, body: JSON.stringify({ compro }), signal: AbortSignal.timeout(5000)
  });
  if (!r.ok) throw new Error(`Supabase respondió ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const filas = await r.json();
  if (Array.isArray(filas) && filas.length) return;
  if (!compro) return;
  const n = await fetchImpl(`${base}/rest/v1/registros`, {
    method: "POST", headers: h, body: JSON.stringify({ email, nombre: nombre || null, origen: "hotmart", compro: true }), signal: AbortSignal.timeout(5000)
  });
  if (n.status === 409) {
    // Dos avisos a la vez (aprobada y completa): el otro ya creó la fila, así que solo se marca
    const p = await fetchImpl(`${base}/rest/v1/registros?email=eq.${encodeURIComponent(email)}`, {
      method: "PATCH", headers: h, body: JSON.stringify({ compro: true }), signal: AbortSignal.timeout(5000)
    });
    if (!p.ok) throw new Error(`Supabase respondió ${p.status}: ${(await p.text()).slice(0, 200)}`);
    return;
  }
  if (!n.ok) throw new Error(`Supabase respondió ${n.status}: ${(await n.text()).slice(0, 200)}`);
}

export default async function handler(req, res) {
  const fin = (codigo) => { res.statusCode = codigo; res.end(); };
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return fin(405); }

  const { HOTMART_HOTTOK: hottok, SUPABASE_URL: url } = process.env;
  const clave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hottok || !url || !clave) { console.error("Faltan variables: HOTMART_HOTTOK, SUPABASE_URL o SUPABASE_SECRET_KEY"); return fin(500); }

  const cuerpo = await leerJson(req);
  const recibido = req.headers["x-hotmart-hottok"] || (cuerpo && cuerpo.hottok);
  if (!hottokValido(recibido, hottok)) return fin(401);

  const aviso = leerAviso(cuerpo);
  if (!aviso) return fin(200); // Otros eventos: se reciben y no cambian nada

  try {
    await marcarCompra(aviso, { url, clave });
  } catch (e) {
    console.error("No se pudo marcar la compra:", e.message);
    return fin(502); // Hotmart reintenta
  }
  return fin(200);
}
