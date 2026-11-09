import { test } from "node:test";
import assert from "node:assert/strict";
import { derivarPorReglas, leerSalida, limpiarEstilo } from "../api/agente.js";

test("los pagos, problemas y reembolsos van siempre a Juampi", () => {
  assert.equal(derivarPorReglas("Ya pagué por mercado pago"), true);
  assert.equal(derivarPorReglas("te mando el comprobante"), true);
  assert.equal(derivarPorReglas("no me abre la guia"), true);
  assert.equal(derivarPorReglas("que mas tiene dentro?"), false);
});

test("el estilo: sin ¿ ¡, sin tildes, mayúscula, sin listas, con ñ", () => {
  assert.equal(limpiarEstilo("¿qué guía querés? Mañana sale"), "Que guia queres? Mañana sale");
  assert.equal(limpiarEstilo("1. armar tu web"), "Armar tu web");
});

test("lee el JSON del modelo y deriva si no se entiende", () => {
  assert.deepEqual(leerSalida('{"derivar": false, "mensajes": ["hola", "como va?"]}'), { derivar: false, mensajes: ["Hola", "Como va?"] });
  assert.deepEqual(leerSalida("algo raro"), { derivar: true, mensajes: [] });
  assert.deepEqual(leerSalida('{"derivar": true, "mensajes": []}'), { derivar: true, mensajes: [] });
  assert.equal(leerSalida('{"derivar":false,"mensajes":["a","b","c"]}').mensajes.length, 2);
});
