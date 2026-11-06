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
