import { test } from "node:test";
import assert from "node:assert/strict";
import { racha, mejorRacha, chances, puntos, nombreCorto, ranking, hoyAr } from "../lib/inicio.js";

test("racha: cuenta hasta hoy o hasta ayer", () => {
  assert.equal(racha(["2026-11-10", "2026-11-09", "2026-11-08", "2026-11-06"], "2026-11-10"), 3);
  assert.equal(racha(["2026-11-09", "2026-11-08"], "2026-11-10"), 2);
  assert.equal(racha(["2026-11-07"], "2026-11-10"), 0);
  assert.equal(racha([], "2026-11-10"), 0);
  assert.equal(racha(["2026-11-01", "2026-10-31"], "2026-11-01"), 2);
});

test("mejor racha", () => {
  assert.equal(mejorRacha(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-05", "2026-11-06"]), 3);
  assert.equal(mejorRacha([]), 0);
});

test("chances, puntos y nombres", () => {
  assert.equal(chances(0, 0), 1);
  assert.equal(chances(9, 6), 16);
  assert.equal(puntos(3, 4), 50);
  assert.equal(nombreCorto("lucas carrizo"), "Lucas C.");
  assert.equal(nombreCorto("Ana"), "Ana");
  assert.equal(nombreCorto(""), "Alguien de Forja");
  assert.equal(hoyAr(Date.parse("2026-11-11T02:00:00Z")), "2026-11-10");
});

test("ranking: top 3 y tu puesto, sin emails", () => {
  const p = [{ email: "a@x", nombre: "Ana Ruiz" }, { email: "b@x", nombre: "Beto" }, { email: "c@x", nombre: "Caro P" }, { email: "d@x", nombre: "Dani" }, { email: "e@x", nombre: "Eli" }];
  const r = ranking(p, { a: 0, "a@x": 3, "b@x": 1, "c@x": 2, "d@x": 0 }, { "a@x": 2, "b@x": 5, "d@x": 1 }, "d@x");
  assert.deepEqual(r.top.map((f) => f.nombre), ["Ana R.", "Beto", "Caro P."]);
  assert.deepEqual(r.yo, { pos: 4, nombre: "Dani", pts: 5, yo: true });
  assert.equal(r.total, 4); // Eli no sumó nada: no aparece
  assert.ok(!JSON.stringify(r).includes("@"));
});
