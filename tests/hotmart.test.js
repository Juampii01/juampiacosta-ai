import { test } from "node:test";
import assert from "node:assert/strict";
import { hottokValido, leerAviso, marcarCompra } from "../api/hotmart.js";
import { yaCompro } from "../api/registro.js";

test("hotmart: hottok", () => {
  assert.equal(hottokValido("abc", "abc"), true);
  assert.equal(hottokValido("abd", "abc"), false);
  assert.equal(hottokValido("", "abc"), false);
  assert.equal(hottokValido("abc", ""), false);
});

test("hotmart: lee compra aprobada, reembolso y otros eventos", () => {
  const ap = leerAviso({ event: "PURCHASE_APPROVED", data: { buyer: { email: " Ana@Mail.com ", name: "Ana Pérez" } } });
  assert.deepEqual(ap, { email: "ana@mail.com", nombre: "Ana Pérez", compro: true });
  assert.deepEqual(leerAviso({ event: "PURCHASE_REFUNDED", data: { buyer: { email: "a@b.co" } } }), { email: "a@b.co", compro: false });
  assert.equal(leerAviso({ event: "PURCHASE_OUT_OF_SHOPPING_CART", data: { buyer: { email: "a@b.co" } } }), null);
  assert.equal(leerAviso({ event: "PURCHASE_APPROVED", data: { buyer: { email: "no-es-mail" } } }), null);
});

test("hotmart: si la fila existe solo cambia compro; si no, la crea", async () => {
  const llamadas = [];
  const fetchImpl = async (url, o) => { llamadas.push({ url, o }); return { ok: true, json: async () => (llamadas.length === 1 ? [] : null) }; };
  await marcarCompra({ email: "a@b.co", nombre: "A", compro: true }, { url: "https://x.supabase.co", clave: "sb_secret_x", fetchImpl });
  assert.equal(llamadas[0].o.method, "PATCH");
  assert.match(llamadas[0].url, /registros\?email=eq\.a%40b\.co$/);
  assert.equal(llamadas[1].o.method, "POST");
  assert.deepEqual(JSON.parse(llamadas[1].o.body), { email: "a@b.co", nombre: "A", origen: "hotmart", compro: true });
});

test("registro: ya compró", async () => {
  const f = (filas) => async () => ({ ok: true, json: async () => filas });
  assert.equal(await yaCompro("a@b.co", { url: "https://x", clave: "k", fetchImpl: f([{ compro: true }]) }), true);
  assert.equal(await yaCompro("a@b.co", { url: "https://x", clave: "k", fetchImpl: f([{ compro: false }]) }), false);
  assert.equal(await yaCompro("a@b.co", { url: "https://x", clave: "k", fetchImpl: f([]) }), false);
});

test("hotmart: dos avisos a la vez no fallan (el POST choca y se marca con PATCH)", async () => {
  const llamadas = [];
  const fetchImpl = async (url, o) => {
    llamadas.push({ url, o });
    if (llamadas.length === 1) return { ok: true, json: async () => [] };
    if (llamadas.length === 2) return { ok: false, status: 409, text: async () => "duplicate key" };
    return { ok: true, status: 204, text: async () => "" };
  };
  await marcarCompra({ email: "a@b.co", nombre: "A", compro: true }, { url: "https://x.supabase.co", clave: "sb_secret_x", fetchImpl });
  assert.deepEqual(llamadas.map((l) => l.o.method), ["PATCH", "POST", "PATCH"]);
  assert.deepEqual(JSON.parse(llamadas[2].o.body), { compro: true });
});

test("hotmart: solo la biblioteca abre el acceso, no el PDF del order bump", () => {
  const aviso = (id) => leerAviso({ event: "PURCHASE_APPROVED", data: { product: { id }, buyer: { email: "a@b.co" } } });
  assert.equal(aviso(8923495), null);
  assert.deepEqual(aviso(8923277), { email: "a@b.co", nombre: "", compro: true });
  assert.equal(leerAviso({ event: "PURCHASE_REFUNDED", data: { product: { id: 8923495 }, buyer: { email: "a@b.co" } } }), null);
});

test("hotmart: guarda de qué anuncio vino la venta (sck/src del link de pago)", async () => {
  const ap = leerAviso({ event: "PURCHASE_APPROVED", data: { buyer: { email: "a@b.co", name: "A" }, purchase: { origin: { sck: "ad-acceso" } } } });
  assert.equal(ap.venta_origen, "ad-acceso");
  const llamadas = [];
  const fetchImpl = async (url, o) => { llamadas.push({ url, o }); return { ok: true, json: async () => [{ email: "a@b.co" }] }; };
  await marcarCompra(ap, { url: "https://x.supabase.co", clave: "sb_secret_x", fetchImpl });
  assert.deepEqual(JSON.parse(llamadas[0].o.body), { compro: true, venta_origen: "ad-acceso" });
});
