import { test } from "node:test";
import assert from "node:assert/strict";
import { claveIgual, guiaGratis } from "../api/manychat.js";
import { crearCookie, crearEnlace, leerCookie, leerEnlace } from "../lib/acceso.js";

test("la guía se acepta como slug o como link, solo si es gratis", () => {
  assert.equal(guiaGratis("tu-propio-jarvis-con-claude"), "tu-propio-jarvis-con-claude");
  assert.equal(guiaGratis("https://juampiacosta-ai.vercel.app/guias/codex-dentro-de-claude-code?x=1"), "codex-dentro-de-claude-code");
  assert.equal(guiaGratis("una-guia-paga-cualquiera"), null);
  assert.equal(guiaGratis(""), null);
});

test("la clave de ManyChat se compara entera", () => {
  assert.equal(claveIgual("abc123", "abc123"), true);
  assert.equal(claveIgual("abc124", "abc123"), false);
  assert.equal(claveIgual("", ""), false);
  assert.equal(claveIgual(undefined, "abc"), false);
});

test("el link mágico se lee, vence a los 30 días y no sirve como cookie ni al revés", async () => {
  const t0 = Date.now();
  const e = await crearEnlace("Ana@Mail.com", "Ana", "tu-propio-jarvis-con-claude", "s1", t0);
  const p = await leerEnlace(e, "s1", t0 + 1000);
  assert.equal(p.m, "ana@mail.com");
  assert.equal(p.g, "tu-propio-jarvis-con-claude");
  assert.equal(await leerEnlace(e, "s2", t0), null);
  assert.equal(await leerEnlace(e, "s1", t0 + 31 * 86400000), null);
  assert.equal(await leerCookie(e, "s1"), null);
  const c = await crearCookie("ana@mail.com", "", "s1", "pago");
  assert.equal(await leerEnlace(c, "s1"), null);
});

import { anuncioDe, marcarAnuncio } from "../api/registro.js";
test("manychat: el campo «anuncio» del contacto queda como utm_campaign", () => {
  assert.equal(anuncioDe({ custom_fields: { anuncio: " Ad-Codex " } }), "ad-codex");
  assert.equal(anuncioDe({ custom_fields: {} }), null);
  assert.deepEqual(marcarAnuncio({ email: "a@b.co" }, { custom_fields: { anuncio: "ad-acceso" } }), { email: "a@b.co", utm_source: "ig-ads", utm_campaign: "ad-acceso" });
});
