// Entrada con código de 6 números por mail (sin contraseñas).
// api/codigo.js lo genera y lo manda por Resend; api/verificar.js lo canjea por la cookie de acceso.
// En la base solo se guarda un HMAC del código, nunca el código.

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const CODIGO_MINUTOS = 10;
export const CODIGO_INTENTOS = 5;
export const REENVIO_SEGUNDOS = 45;
export const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

export function limpiarEmail(e) {
  const email = String(e || "").trim().toLowerCase();
  return EMAIL.test(email) && email.length <= 254 ? email : null;
}

export function nuevoCodigo() {
  return String(randomInt(0, 1000000)).padStart(6, "0");
}

export function hashCodigo(email, codigo, secreto) {
  return createHmac("sha256", secreto + "|codigo").update(`${email}:${codigo}`).digest("hex");
}

export function codigoValido(email, codigo, hash, secreto) {
  const limpio = String(codigo || "").replace(/\D/g, "");
  if (limpio.length !== 6 || !hash) return false;
  const a = Buffer.from(hashCodigo(email, limpio, secreto)), b = Buffer.from(String(hash));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function mailCodigo(codigo, nombre) {
  const hola = nombre ? `Hola, ${nombre.split(" ")[0]}.` : "Hola.";
  const espaciado = codigo.split("").join(" ");
  const text = `${hola}\n\nTu código para entrar a Forja IA es: ${codigo}\n\nVence en ${CODIGO_MINUTOS} minutos. Si no lo pediste, ignora este mail.\n\nJuampi`;
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#0a0a0b;font-family:Inter,Arial,sans-serif;color:#f4f4f5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#121214;border:1px solid #26262b;border-radius:16px;padding:32px">
<tr><td style="font-size:18px;font-weight:800">Forja <span style="color:#ff5a1f">IA</span></td></tr>
<tr><td style="padding-top:20px;font-size:15px;line-height:1.5;color:#d4d4d8">${hola} Este es tu código para entrar:</td></tr>
<tr><td style="padding:22px 0;font-family:'JetBrains Mono',Consolas,monospace;font-size:34px;font-weight:700;letter-spacing:6px;color:#ff7a45">${espaciado}</td></tr>
<tr><td style="font-size:13px;line-height:1.5;color:#a1a1aa">Vence en ${CODIGO_MINUTOS} minutos. Si no lo pediste, ignora este mail: nadie puede entrar sin el código.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject: `Tu código para entrar: ${codigo}`, text, html };
}

/** Manda el mail por la API de Resend. Sin RESEND_API_KEY (desarrollo) solo lo anota en el log, sin el código. */
export async function enviarMail(para, { subject, text, html }, { fetchImpl = fetch } = {}) {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) { console.warn("Sin RESEND_API_KEY: no se mandó el mail a", para.replace(/^(.).*@/, "$1***@")); return false; }
  const r = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_DESDE || "Forja IA <acceso@forjaia.com>", to: [para], subject, text, html }),
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) throw new Error(`Resend respondió ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return true;
}
