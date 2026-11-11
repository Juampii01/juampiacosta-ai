// POST /api/verificar (JSON: email, codigo, volver opcional)
// Canjea el código del mail por la sesión. Es el único camino al acceso completo con email:
// si ese email compró, la cookie sale con nivel «pago». 5 intentos por código; vence a los 10 minutos.

import { permitido } from "./entrar.js";
import { yaCompro } from "./registro.js";
import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_MAX_AGE, AVISO_COOKIE_NAME, crearCookie } from "../lib/acceso.js";
import { CODIGO_INTENTOS, codigoValido, limpiarEmail } from "../lib/codigo.js";
import { esAdmin } from "../lib/sesion.js";
import { config, enc, ipDe, json, leerCuerpo, sb } from "../lib/db.js";

export function destinoSeguro(v) {
  const d = String(v || "");
  return /^\/(inicio|maquina|recursos|biblioteca|sistemas|comunidad|cuenta|panel|guias\/[a-z0-9-]{3,120})(\.html)?(#[a-z0-9-]{1,40})?$/.test(d) ? d : "/inicio";
}

export function cookiesDeSesion(cookie, nivel, nombre, admin = false) {
  return [
    `jpa_rol=${admin ? "admin" : ""}; Path=/; Max-Age=${admin ? ACCESS_COOKIE_MAX_AGE : 0}; Secure; SameSite=Lax`,
    `${ACCESS_COOKIE_NAME}=${encodeURIComponent(cookie)}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
    `${AVISO_COOKIE_NAME}=${nivel}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax`,
    `jpa_nombre=${encodeURIComponent((nombre || "").split(" ")[0].slice(0, 30))}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax`
  ];
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return json(res, 405, { error: "metodo" }); }
  if (!permitido("verificar:" + ipDe(req))) return json(res, 429, { error: "espera" });
  const secreto = process.env.ACCESS_SECRET;
  const cfg = config();
  if (!secreto || !cfg) return json(res, 500, { error: "config" });

  const cuerpo = await leerCuerpo(req);
  const email = limpiarEmail(cuerpo.email);
  if (!email) return json(res, 400, { error: "email" });

  try {
    const fila = (await sb(`codigos?email=eq.${enc(email)}&select=hash,expira,intentos`))[0];
    if (!fila || Date.parse(fila.expira) < Date.now()) return json(res, 400, { error: "vencido" });
    if (fila.intentos >= CODIGO_INTENTOS) return json(res, 429, { error: "bloqueado" });
    if (!codigoValido(email, cuerpo.codigo, fila.hash, secreto)) {
      await sb(`codigos?email=eq.${enc(email)}`, { method: "PATCH", prefer: "return=minimal", body: { intentos: fila.intentos + 1 } });
      return json(res, 400, { error: "codigo", quedan: Math.max(0, CODIGO_INTENTOS - fila.intentos - 1) });
    }
    await sb(`codigos?email=eq.${enc(email)}`, { method: "DELETE", prefer: "return=minimal" });
    const reg = (await sb(`registros?email=eq.${enc(email)}&select=nombre,perfil_completo`))[0] || {};
    let pago = false;
    try { pago = await yaCompro(email, cfg); } catch (e) { console.error("No se pudo ver si compró:", e.message); }
    const nivel = pago ? "pago" : "gratis";
    const cookie = await crearCookie(email, reg.nombre || "", secreto, nivel);
    const cookies = cookiesDeSesion(cookie, nivel, reg.nombre, esAdmin(email));
    // Si ya respondió las preguntas de bienvenida (en cualquier dispositivo), no se las vuelve a pedir
    if (reg.perfil_completo) cookies.push(`jpa_perfil=1; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax`);
    res.setHeader("Set-Cookie", cookies);
    return json(res, 200, { ok: true, nivel, destino: destinoSeguro(cuerpo.volver) });
  } catch (e) {
    console.error("No se pudo verificar el código:", e.message);
    return json(res, 502, { error: "servidor" });
  }
}
