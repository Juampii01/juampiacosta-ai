// Mail de invitación a Forja IA para los que ya estaban registrados en la biblioteca vieja.
// Lo dispara un admin desde /api/panel (accion "invitar"): primero una prueba a su propio mail, después a todos.

import { SITIO } from "./sitio.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function mailInvitacion(nombre, compro = false) {
  const primer = String(nombre || "").trim().split(" ")[0].slice(0, 30);
  const hola = primer ? `Hola, ${primer}.` : "Hola.";
  const link = `${SITIO}/entrar?utm_source=mail&utm_campaign=invitacion-forja`;
  const plan = compro
    ? "Como ya compraste, entras con el acceso completo: todo abierto, los sistemas incluidos."
    : "Tus guías gratis siguen ahí, y ahora ordenadas por fases para que sepas por dónde arrancar.";
  const puntos = [
    ["Classroom por fases", "Las guías ordenadas en módulos, de arrancar con Claude a venderle IA a un cliente."],
    ["Maestro", "Un tutor con IA que conoce las guías y te responde dudas mientras avanzas."],
    ["Comunidad", "Preguntas, lo que vas armando y anuncios, todo en un solo lugar."],
    ["Sistemas listos para replicar", "Repos con su guía paso a paso para instalarlos y vendérselos a un cliente. Se van sumando estas semanas."]
  ];
  const text = `${hola}

La biblioteca de guías ahora se llama Forja IA y tiene plataforma nueva: www.forjaia.com

- ${puntos.map((p) => `${p[0]}: ${p[1]}`).join("\n- ")}

${plan}

Para entrar no hay contraseña: pones el mismo email con el que te registraste y te llega un código de 6 números.

Entrar: ${link}

Cualquier duda, respóndeme este mail.
Juampi`;

  const filas = puntos.map((p) => `<tr><td style="padding:8px 0;font-size:14px;line-height:1.5;color:#d4d4d8"><b style="color:#f4f4f5">${esc(p[0])}.</b> ${esc(p[1])}</td></tr>`).join("");
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#0a0a0b;font-family:Inter,Arial,sans-serif;color:#f4f4f5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#121214;border:1px solid #26262b;border-radius:16px;padding:32px">
<tr><td style="font-size:18px;font-weight:800">Forja <span style="color:#ff5a1f">IA</span></td></tr>
<tr><td style="padding-top:22px;font-size:22px;font-weight:800;line-height:1.25;letter-spacing:-.02em">La biblioteca ahora es Forja IA</td></tr>
<tr><td style="padding-top:12px;font-size:15px;line-height:1.55;color:#d4d4d8">${esc(hola)} Las guías tienen plataforma nueva. Esto es lo que vas a encontrar:</td></tr>
<tr><td style="padding-top:10px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filas}</table></td></tr>
<tr><td style="padding-top:10px;font-size:15px;line-height:1.55;color:#d4d4d8">${esc(plan)}</td></tr>
<tr><td style="padding:26px 0 8px"><a href="${link}" style="display:inline-block;background:#ff5a1f;color:#0a0a0b;font-weight:800;font-size:15px;text-decoration:none;padding:14px 26px;border-radius:10px">Entrar a Forja IA →</a></td></tr>
<tr><td style="font-size:13px;line-height:1.5;color:#a1a1aa">Sin contraseña: pones el mismo email con el que te registraste y te llega un código de 6 números.</td></tr>
<tr><td style="padding-top:22px;font-size:14px;line-height:1.5;color:#d4d4d8">Cualquier duda, respóndeme este mail.<br>Juampi</td></tr>
</table>
<p style="max-width:520px;font-size:12px;line-height:1.5;color:#71717a;margin:16px auto 0">Te llega porque te registraste en la biblioteca de @juampiiacosta.ia. Si no quieres más mails, apágalos en tu cuenta o respóndeme «baja».</p>
</td></tr></table></body></html>`;
  return { subject: "La biblioteca ahora es Forja IA (entra con tu email)", text, html };
}

/** Manda hasta 100 mails en una sola llamada a la API batch de Resend. */
export async function enviarLote(mails, { fetchImpl = fetch } = {}) {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) throw new Error("Sin RESEND_API_KEY");
  const desde = process.env.MAIL_DESDE_JUAMPI || "Juampi de Forja IA <juampi@forjaia.com>";
  const r = await fetchImpl("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
    body: JSON.stringify(mails.map((m) => ({ from: desde, ...(process.env.MAIL_RESPUESTA ? { reply_to: process.env.MAIL_RESPUESTA } : {}), to: [m.para], subject: m.subject, text: m.text, html: m.html }))),
    signal: AbortSignal.timeout(20000)
  });
  if (!r.ok) throw new Error(`Resend respondió ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return true;
}
