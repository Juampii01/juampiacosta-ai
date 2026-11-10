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

test("la palabra del reel escrita a mano se reconoce, pero no frases comunes", async () => {
  const { palabraDeReel } = await import("../api/agente.js");
  assert.equal(palabraDeReel("Linkedin"), "LINKEDIN");
  assert.equal(palabraDeReel("GUÍA"), "GUIA");
  assert.equal(palabraDeReel("Quiero la guia"), "GUIA");
  assert.equal(palabraDeReel("jarvis 🙏"), "JARVIS");
  assert.equal(palabraDeReel("plan pago"), null);
  assert.equal(palabraDeReel("hola que tal"), null);
});

test("encuentra el mail y la guía que pidió antes", async () => {
  const { mailEn, guiaPedida } = await import("../api/agente.js");
  assert.equal(mailEn("mi mail es Ana.Perez@Gmail.com."), "ana.perez@gmail.com");
  assert.equal(mailEn("no tengo mail"), null);
  assert.equal(guiaPedida(["hola", "Linkedin", "ok"]), "linkedin-agent-11-skills");
  assert.equal(guiaPedida(["hola"]), null);
});
