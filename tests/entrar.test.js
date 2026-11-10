import { test } from "node:test";
import assert from "node:assert/strict";
import { claveValida, permitido } from "../api/entrar.js";
import { crearCookie, leerCookie } from "../lib/acceso.js";

test("la clave vale sin importar mayúsculas ni espacios", () => {
  assert.equal(claveValida(" fundador-1234 ", "FUNDADOR-1234, OTRA"), true);
  assert.equal(claveValida("OTRA", "FUNDADOR-1234,OTRA"), true);
});

test("claves vacías, largas o que no están, no entran", () => {
  assert.equal(claveValida("", "A"), false);
  assert.equal(claveValida("A", ""), false);
  assert.equal(claveValida("X".repeat(65), "X".repeat(65)), false);
  assert.equal(claveValida("NO", "SI"), false);
});

test("más de 10 intentos por minuto desde la misma IP se frenan", () => {
  const t = 1_000_000;
  for (let i = 0; i < 10; i++) assert.equal(permitido("1.1.1.1", t), true);
  assert.equal(permitido("1.1.1.1", t), false);
  assert.equal(permitido("1.1.1.1", t + 61_000), true);
});

test("la cookie firmada se lee con el mismo secreto y no con otro", async () => {
  const c = await crearCookie("clave:FUNDADOR-1234", "", "secreto-1");
  assert.ok(await leerCookie(c, "secreto-1"));
  assert.equal(await leerCookie(c, "secreto-2"), null);
  assert.equal(await leerCookie(c.slice(0, -2) + "xx", "secreto-1"), null);
});

import { decidir } from "../middleware.js";
import { limpiarRegistro, guardarEnSupabase } from "../api/registro.js";
import { nivelDe } from "../lib/acceso.js";

test("sin cookie: solo el inicio; lo privado nunca", () => {
  assert.deepEqual(decidir("/", null), { pasa: true });
  assert.deepEqual(decidir("/recursos", null), { a: "/entrar" });
  assert.deepEqual(decidir("/comunidad", null), { a: "/entrar?volver=/comunidad" });
  assert.deepEqual(decidir("/panel", null), { a: "/entrar?volver=/panel" });
  assert.deepEqual(decidir("/web/prompts.js", null), { prohibido: true });
  // Guía gratis sin sesión: al registro y de vuelta a la guía. Guía paga sin sesión: a entrar.
  assert.deepEqual(decidir("/guias/errores-que-agotan-tu-plan-de-claude.html", null), { a: "/?volver=/guias/errores-que-agotan-tu-plan-de-claude#gratis" });
  assert.deepEqual(decidir("/guias/sistema-ia-para-clinicas-y-centros-de-estetica.html", null), { a: "/entrar" });
  assert.deepEqual(decidir("/web/guias-web.json", "pago"), { no: true });
  assert.deepEqual(decidir("/contenido/config.json", "pago"), { no: true });
  assert.deepEqual(decidir("/supabase/registros.sql", "pago"), { no: true });
});

test("gratis: guías de reels sí, el resto a comprar; prompts y herramientas en vista", () => {
  assert.deepEqual(decidir("/recursos", "gratis"), { pasa: true });
  assert.deepEqual(decidir("/guias/codex-dentro-de-claude-code", "gratis"), { pasa: true });
  assert.deepEqual(decidir("/guias/sistema-base-modulo-1-la-oferta.html", "gratis"), { pasa: true });
  assert.deepEqual(decidir("/guias/sistema-base-modulo-2-elegir-a-quien-venderle", "gratis"), { a: "/recursos?desbloquear=sistema-base-modulo-2-elegir-a-quien-venderle" });
  assert.deepEqual(decidir("/web/prompts.js", "gratis"), { reescribir: "/web/prompts-vista.js" });
  assert.deepEqual(decidir("/web/herramientas.js", "gratis"), { reescribir: "/web/herramientas-vista.js" });
});

test("sistemas: la guía y el ZIP solo con acceso completo", () => {
  assert.deepEqual(decidir("/sistemas/setter-ai", null), { a: "/entrar?volver=/sistemas" });
  assert.deepEqual(decidir("/descargas/setter-ai.zip", null), { prohibido: true });
  assert.deepEqual(decidir("/sistemas", "gratis"), { pasa: true });
  assert.deepEqual(decidir("/sistemas/setter-ai", "gratis"), { a: "/recursos?desbloquear=sistema-setter-ai" });
  assert.deepEqual(decidir("/descargas/setter-ai.zip", "gratis"), { prohibido: true });
  assert.deepEqual(decidir("/sistemas/setter-ai.html", "pago"), { pasa: true });
  assert.deepEqual(decidir("/descargas/setter-ai.zip", "pago"), { pasa: true });
});

test("panel: solo el equipo, aunque haya pagado", () => {
  assert.deepEqual(decidir("/panel", "pago", false), { a: "/recursos" });
  assert.deepEqual(decidir("/panel.html", "gratis", false), { a: "/recursos" });
  assert.deepEqual(decidir("/panel", "pago", true), { pasa: true });
  assert.deepEqual(decidir("/comunidad", "gratis"), { pasa: true });
});

test("pago: todo", () => {
  assert.deepEqual(decidir("/guias/sistema-base-modulo-2-elegir-a-quien-venderle", "pago"), { pasa: true });
  assert.deepEqual(decidir("/web/prompts.js", "pago"), { pasa: true });
});

test("el nivel viaja firmado en la cookie; las viejas sin nivel son de pago", async () => {
  assert.equal(nivelDe(await leerCookie(await crearCookie("a@b.com", "", "s", "gratis"), "s")), "gratis");
  assert.equal(nivelDe(await leerCookie(await crearCookie("clave:X", "", "s"), "s")), "pago");
  assert.equal(nivelDe(null), null);
});

test("registro: valida el email, lo pasa a minúsculas y guarda los utm", () => {
  assert.equal(limpiarRegistro({ email: "no-es-mail" }), null);
  assert.deepEqual(limpiarRegistro({ email: " Juan@Mail.COM ", nombre: "  Juan  Pérez ", utm_source: "ig" }),
    { email: "juan@mail.com", nombre: "Juan Pérez", origen: "web", utm_source: "ig" });
});

test("guarda en Supabase con la clave del servidor y sin duplicar emails", async () => {
  let llamada;
  const fetchFalso = async (url, opciones) => { llamada = { url, opciones }; return { ok: true, text: async () => "" }; };
  await guardarEnSupabase({ email: "a@b.com" }, { url: "https://x.supabase.co/", clave: "sb_secret_abc", fetchImpl: fetchFalso });
  assert.equal(llamada.url, "https://x.supabase.co/rest/v1/registros?on_conflict=email");
  assert.equal(llamada.opciones.headers.apikey, "sb_secret_abc");
  assert.equal(llamada.opciones.headers.Authorization, undefined);
  await guardarEnSupabase({ email: "a@b.com" }, { url: "https://x.supabase.co", clave: "eyJvieja", fetchImpl: fetchFalso });
  assert.equal(llamada.opciones.headers.Authorization, "Bearer eyJvieja");
  assert.match(llamada.opciones.headers.Prefer, /ignore-duplicates/);
  const fetchMalo = async () => ({ ok: false, status: 401, text: async () => "no" });
  await assert.rejects(guardarEnSupabase({ email: "a@b.com" }, { url: "https://x", clave: "k", fetchImpl: fetchMalo }));
});
