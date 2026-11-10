// POST /api/codigo (JSON o formulario: email, nombre opcional, utm_* opcionales)
// Registra el email si es nuevo y le manda un código de 6 números para entrar. Responde igual exista o no la cuenta,
// así nadie puede averiguar qué emails compraron.

import { permitido } from "./entrar.js";
import { CODIGO_MINUTOS, REENVIO_SEGUNDOS, enviarMail, hashCodigo, limpiarEmail, mailCodigo, nuevoCodigo } from "../lib/codigo.js";
import { config, enc, ipDe, json, leerCuerpo, sb } from "../lib/db.js";

const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];

export async function mandarCodigo(email, nombre, { extra = {}, ahora = Date.now() } = {}) {
  const secreto = process.env.ACCESS_SECRET;
  const previo = (await sb(`codigos?email=eq.${enc(email)}&select=ultimo_envio`))[0];
  if (previo) {
    const pasaron = (ahora - Date.parse(previo.ultimo_envio)) / 1000;
    if (pasaron < REENVIO_SEGUNDOS) return { espera: Math.ceil(REENVIO_SEGUNDOS - pasaron) };
  }
  // Si es nuevo, queda registrado (plan gratis). Si ya estaba, no se toca nada.
  await sb("registros?on_conflict=email", { method: "POST", prefer: "resolution=ignore-duplicates,return=minimal",
    body: { email, nombre: nombre || null, origen: extra.origen || "web", ...Object.fromEntries(UTM.filter((k) => extra[k]).map((k) => [k, extra[k]])) } });
  const fila = (await sb(`registros?email=eq.${enc(email)}&select=nombre`))[0] || {};
  const codigo = nuevoCodigo();
  await sb("codigos?on_conflict=email", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal",
    body: { email, hash: hashCodigo(email, codigo, secreto), expira: new Date(ahora + CODIGO_MINUTOS * 60000).toISOString(), intentos: 0, ultimo_envio: new Date(ahora).toISOString() } });
  await enviarMail(email, mailCodigo(codigo, fila.nombre || nombre));
  return { ok: true };
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return json(res, 405, { error: "metodo" }); }
  if (!permitido("codigo:" + ipDe(req))) return json(res, 429, { error: "espera", segundos: 60 });
  if (!process.env.ACCESS_SECRET || !config()) { console.error("Faltan ACCESS_SECRET o las variables de Supabase"); return json(res, 500, { error: "config" }); }

  const cuerpo = await leerCuerpo(req);
  const email = limpiarEmail(cuerpo.email);
  if (!email) return json(res, 400, { error: "email" });
  const nombre = String(cuerpo.nombre || "").trim().replace(/\s+/g, " ").slice(0, 80);
  const extra = {};
  for (const k of UTM) { const v = String(cuerpo[k] || "").trim().slice(0, 120); if (v) extra[k] = v; }

  try {
    const r = await mandarCodigo(email, nombre, { extra });
    if (r.espera) return json(res, 429, { error: "espera", segundos: r.espera });
    return json(res, 200, { ok: true });
  } catch (e) {
    console.error("No se pudo mandar el código:", e.message);
    return json(res, 502, { error: "envio" });
  }
}
