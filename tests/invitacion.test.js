import test from "node:test";
import assert from "node:assert/strict";
import { mailInvitacion, enviarLote } from "../lib/invitacion.js";

test("invitación: saluda por nombre, link a /entrar y escapa HTML", () => {
  const m = mailInvitacion("<b>Ana</b> Pérez", false);
  assert.match(m.text, /Hola, <b>Ana<\/b>\./);
  assert.ok(!m.html.includes("<b>Ana</b>"));
  assert.match(m.html, /forjaia\.com\/entrar/);
  assert.match(m.text, /guías gratis/);
});

test("invitación: a quien compró le dice acceso completo", () => {
  assert.match(mailInvitacion("", true).text, /acceso completo/);
  assert.match(mailInvitacion("", true).text, /^Hola\./);
});

test("enviarLote usa la API batch de Resend", async () => {
  process.env.RESEND_API_KEY = "x";
  let llamada;
  await enviarLote([{ para: "a@b.co", subject: "s", text: "t", html: "h" }], { fetchImpl: async (u, o) => { llamada = { u, b: JSON.parse(o.body) }; return { ok: true }; } });
  assert.equal(llamada.u, "https://api.resend.com/emails/batch");
  assert.deepEqual(llamada.b[0].to, ["a@b.co"]);
  delete process.env.RESEND_API_KEY;
});
