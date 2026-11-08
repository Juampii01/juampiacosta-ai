import { test } from "node:test";
import assert from "node:assert/strict";
import { limpiarOpinion } from "../lib/opinion.js";
import { guardarOpinion } from "../api/opinion.js";

test("opinión: guarda solo campos conocidos y recorta", () => {
  const f = limpiarOpinion({ nota: "4", gusta: "  las guías  ", hack: "x", vista: "guias-web", sobra: "a".repeat(3000) });
  assert.deepEqual(Object.keys(f).sort(), ["gusta", "nota", "sobra", "vista"]);
  assert.equal(f.nota, 4);
  assert.equal(f.gusta, "las guías");
  assert.equal(f.sobra.length, 2000);
});

test("opinión: vacía o nota fuera de rango no se guarda", () => {
  assert.equal(limpiarOpinion({}), null);
  assert.equal(limpiarOpinion({ nota: 9 }), null);
  assert.equal(limpiarOpinion(null), null);
  assert.deepEqual(limpiarOpinion({ falta: "un video" }), { falta: "un video" });
});

test("opinión: inserta en la tabla opiniones", async () => {
  let llamada;
  await guardarOpinion({ nota: 5 }, { url: "https://x.supabase.co/", clave: "sb_secret_x",
    fetchImpl: async (url, o) => { llamada = { url, o }; return { ok: true }; } });
  assert.equal(llamada.url, "https://x.supabase.co/rest/v1/opiniones");
  assert.equal(llamada.o.method, "POST");
  assert.equal(llamada.o.headers.Prefer, "return=minimal");
});
