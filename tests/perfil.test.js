import { test } from "node:test";
import assert from "node:assert/strict";
import { limpiarPerfil, whatsappValido } from "../lib/perfil.js";
import { actualizarEnSupabase } from "../api/perfil.js";

test("perfil: guarda solo opciones válidas y de a partes", () => {
  const { fila, completo } = limpiarPerfil({ situacion: "Tengo un negocio", nivel: "Inventado", rubro: "  Inmobiliaria  " });
  assert.deepEqual(fila, { situacion: "Tengo un negocio", rubro: "Inmobiliaria" });
  assert.equal(completo, false);
});

test("perfil: completo solo con todo lo obligatorio", () => {
  const todo = { situacion: "Estudiante", nivel: "Nunca usé IA", objetivo: "Aprender", horas: "2 a 5 h", pais: "Argentina", whatsapp: "+54 9 236 412-3456", completo: true };
  assert.equal(limpiarPerfil(todo).completo, true);
  assert.equal(limpiarPerfil(todo).fila.whatsapp, "+5492364123456");
  assert.equal(limpiarPerfil({ ...todo, whatsapp: "123" }).completo, false);
  assert.equal(limpiarPerfil({ ...todo, completo: false }).completo, false);
});

test("whatsapp: formato internacional", () => {
  assert.equal(whatsappValido("+1 (305) 555-0100"), "+13055550100");
  assert.equal(whatsappValido("2364123456"), null);
  assert.equal(whatsappValido("+0123456789"), null);
});

test("perfil: actualiza la fila de ese email", async () => {
  let llamada;
  await actualizarEnSupabase("a+b@c.com", { nivel: "Aprender" }, { url: "https://x.supabase.co/", clave: "sb_secret_x",
    fetchImpl: async (url, o) => { llamada = { url, o }; return { ok: true }; } });
  assert.equal(llamada.url, "https://x.supabase.co/rest/v1/registros?email=eq.a%2Bb%40c.com");
  assert.equal(llamada.o.method, "PATCH");
  assert.equal(llamada.o.headers.apikey, "sb_secret_x");
});
