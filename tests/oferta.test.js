import { test } from "node:test";
import assert from "node:assert/strict";
import { ofertaPara } from "../api/cuenta.js";
import { rondaOferta } from "../api/panel.js";
import { limpiarInteres } from "../api/interes.js";

const AJ = { activa: true, desde: "2026-11-11T00:00:00.000Z", precio: "19,90", antes: "24,90", hotmart: "https://pay.hotmart.com/X?off=abc", mpago: "https://mpago.la/x", pesos: "31.000" };
const falso = (ajuste, vistas) => async (ruta) => ruta.startsWith("ajustes") ? (ajuste ? [{ valor: ajuste }] : []) : vistas;

test("oferta: solo si está activa, con link y sin verla en esta ronda", async () => {
  assert.deepEqual(await ofertaPara("a@x.com", falso(AJ, [])), { precio: "19,90", antes: "24,90", hotmart: AJ.hotmart, mpago: AJ.mpago, pesos: "31.000" });
  assert.equal(await ofertaPara("a@x.com", falso(AJ, [{ id: 1 }])), null);
  assert.equal(await ofertaPara("a@x.com", falso({ ...AJ, activa: false }, [])), null);
  assert.equal(await ofertaPara("a@x.com", falso({ ...AJ, hotmart: "" }, [])), null);
  assert.equal(await ofertaPara("a@x.com", falso(null, [])), null);
  // Apagada, pero el email está en «prueba»: la ve
  assert.equal((await ofertaPara("a@x.com", falso({ ...AJ, activa: false, prueba: ["a@x.com"] }, [])) || {}).precio, "19,90");
  assert.equal(await ofertaPara("b@x.com", falso({ ...AJ, activa: false, prueba: ["a@x.com"] }, [])), null);
  assert.equal(await ofertaPara("a@x.com", async () => { throw new Error("caída"); }), null);
});

test("ronda de la oferta en el panel: solo cuenta lo de esta ronda", () => {
  const ev = [
    { email: "a", evento: "oferta_vista", creado: "2026-11-11T01:00:00Z" }, { email: "b", evento: "oferta_vista", creado: "2026-11-11T02:00:00Z" },
    { email: "a", evento: "oferta_si", creado: "2026-11-11T01:01:00Z" }, { email: "b", evento: "oferta_no", creado: "2026-11-11T02:01:00Z" },
    { email: "c", evento: "oferta_vista", creado: "2026-11-01T00:00:00Z" }
  ];
  assert.deepEqual(rondaOferta(AJ, ev), { activa: true, desde: AJ.desde, precio: "19,90", antes: "24,90", listo: true, vieron: 2, quieren: 1, pasaron: 1 });
  assert.equal(rondaOferta(null, ev), null);
  assert.deepEqual(limpiarInteres({ evento: "oferta_si", detalle: "hotmart" }), { evento: "oferta_si", detalle: "hotmart" });
});
