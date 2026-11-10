import { test } from "node:test";
import assert from "node:assert/strict";
import { codigoValido, hashCodigo, limpiarEmail, mailCodigo, nuevoCodigo } from "../lib/codigo.js";
import { destinoSeguro, cookiesDeSesion } from "../api/verificar.js";
import { esAdmin } from "../lib/sesion.js";
import { limpiarTexto, vista } from "../api/comunidad.js";
import { limpiarCuenta } from "../api/cuenta.js";
import { limpiarMensajes, instrucciones } from "../api/maestro.js";
import { resumen } from "../api/panel.js";

test("código: 6 números, se valida con su email y nada más", () => {
  for (let i = 0; i < 50; i++) assert.match(nuevoCodigo(), /^\d{6}$/);
  const h = hashCodigo("ana@mail.com", "012345", "s");
  assert.equal(codigoValido("ana@mail.com", "012345", h, "s"), true);
  assert.equal(codigoValido("ana@mail.com", " 012 345 ", h, "s"), true);
  assert.equal(codigoValido("otro@mail.com", "012345", h, "s"), false);
  assert.equal(codigoValido("ana@mail.com", "012346", h, "s"), false);
  assert.equal(codigoValido("ana@mail.com", "012345", h, "otro-secreto"), false);
  assert.equal(codigoValido("ana@mail.com", "12345", h, "s"), false);
  assert.equal(codigoValido("ana@mail.com", "012345", "", "s"), false);
});

test("código: el mail lleva el código y no el hash", () => {
  const m = mailCodigo("482913", "Juan Pérez");
  assert.match(m.subject, /482913/);
  assert.match(m.text, /Hola, Juan\./);
  assert.match(m.html, />482913</); assert.doesNotMatch(m.html, /4 8 2 9/);
});

test("emails: se normalizan y los raros no pasan", () => {
  assert.equal(limpiarEmail("  Ana@Mail.COM "), "ana@mail.com");
  assert.equal(limpiarEmail("sin-arroba"), null);
  assert.equal(limpiarEmail("a@b"), null);
});

test("después del código solo se vuelve a páginas propias", () => {
  assert.equal(destinoSeguro("/guias/configura-claude-en-10-minutos"), "/guias/configura-claude-en-10-minutos");
  assert.equal(destinoSeguro("/comunidad"), "/comunidad");
  assert.equal(destinoSeguro("https://malo.com"), "/recursos");
  assert.equal(destinoSeguro("//malo.com"), "/recursos");
  assert.equal(destinoSeguro(""), "/recursos");
});

test("sesión: cookie de acceso HttpOnly y marca de equipo solo para admins", () => {
  const c = cookiesDeSesion("x.y", "pago", "Ana López", true);
  assert.ok(c.some((x) => x.startsWith("jpa_acceso=") && x.includes("HttpOnly")));
  assert.ok(c.some((x) => x.startsWith("jpa_rol=admin")));
  assert.ok(cookiesDeSesion("x.y", "gratis", "", false).some((x) => x.startsWith("jpa_rol=;") && x.includes("Max-Age=0")));
  assert.equal(esAdmin("Yo@Mail.com", "otro@x.com, yo@mail.com"), true);
  assert.equal(esAdmin("yo@mail.com", ""), false);
  assert.equal(esAdmin(null, "yo@mail.com"), false);
});

test("comunidad: los emails no salen al navegador", () => {
  const p = vista({ id: 1, email: "ana@mail.com", nombre: "Ana", canal: "general", texto: "hola", fijado: false, creado: "2026-11-10",
    comunidad_likes: [{ email: "yo@mail.com" }], comunidad_comentarios: [{ id: 2, email: "beto@mail.com", nombre: "Beto", texto: "buenísimo", creado: "x" }, { id: 3, email: "x@x.com", texto: "borrado", borrado: true }] },
  { email: "yo@mail.com" });
  assert.equal(JSON.stringify(p).includes("@"), false);
  assert.equal(p.megusta, true);
  assert.equal(p.comentarios.length, 1);
  assert.equal(p.mio, false);
  assert.equal(limpiarTexto("a\u0000b\n\n\n\n\nc", 100), "ab\n\n\nc");
});

test("cuenta: solo cambia nombre, rubro y mails", () => {
  assert.deepEqual(limpiarCuenta({ nombre: "  Ana   López ", rubro: "", mails: false, compro: true, email: "x" }), { nombre: "Ana López", rubro: null, baja: true });
});

test("maestro: turnos alternados y sin instrucciones de afuera", () => {
  const t = limpiarMensajes([{ rol: "maestro", texto: "hola" }, { rol: "yo", texto: "a" }, { rol: "yo", texto: "b" }, { rol: "maestro", texto: "c" }, { rol: "yo", texto: "d" }]);
  assert.deepEqual(t.map((x) => x.role), ["user", "assistant", "user"]);
  assert.equal(t[0].content, "a\n\nb");
  assert.match(instrucciones("Ana", true, ""), /plan gratis/);
  assert.match(instrucciones("", false, ""), /\/guias\//);
});

test("panel: el admin no cuenta en el resumen", () => {
  const r = resumen([{ email: "yo@x.co", compro: true, vistas: 1 }, { email: "a@x.co", compro: true, vistas: 0 }], "yo@x.co");
  assert.equal(r.registrados, 1);
  assert.equal(r.compraron, 1);
});

test("panel: resumen de usuarios", () => {
  assert.deepEqual(resumen([{ origen: "chat", perfil_completo: true, compro: false, vistas: 2 }, { origen: "web", compro: true, vistas: 0 }]),
    { registrados: 2, chat: 1, perfil: 1, compraron: 1, activos: 1, hoy: 0, semana: 0, vuelven: 0 });
});

import { frecuencia } from "../api/panel.js";
import { paginaDe } from "../api/cuenta.js";
test("actividad: página que se anota", () => {
  assert.equal(paginaDe("/api/cuenta?p=%2Fguias%2F22-skills-claude-code"), "g:22-skills-claude-code");
  assert.equal(paginaDe("/api/cuenta?p=/comunidad"), "comunidad");
  assert.equal(paginaDe("/api/cuenta?p=/"), "inicio");
  assert.equal(paginaDe("/api/cuenta"), "");
  assert.equal(paginaDe("/api/cuenta?p=/x/../../etc"), "");
});
test("actividad: frecuencia por persona", () => {
  const f = frecuencia([
    { email: "a@x.co", dia: "2026-11-10", paginas: 3, secciones: ["g:uno", "classroom"] },
    { email: "a@x.co", dia: "2026-11-01", paginas: 1, secciones: ["g:dos"] },
  ], "2026-11-10");
  assert.equal(f["a@x.co"].dias, 2);
  assert.equal(f["a@x.co"].dias7, 1);
  assert.equal(f["a@x.co"].hoy, true);
  assert.equal(f["a@x.co"].abiertas, 2);
});

import { embudo } from "../api/panel.js";
import { limpiarInteres } from "../api/interes.js";
test("interés: solo eventos conocidos", () => {
  assert.equal(limpiarInteres({ evento: "hackeo" }), null);
  assert.deepEqual(limpiarInteres({ evento: "guia_paga", detalle: "Sistema-Base<script>" }), { evento: "guia_paga", detalle: "sistema-basescript" });
});
test("interés: embudo y lista por persona", () => {
  const us = [{ email: "a@x.co", nombre: "Ana" }, { email: "b@x.co", nombre: "Beto" }, { email: "yo@x.co", admin: true }];
  const ev = [
    { email: "a@x.co", evento: "hotmart", creado: "2026-11-10T22:00:00Z" },
    { email: "a@x.co", evento: "si", creado: "2026-11-10T21:59:00Z" },
    { email: "a@x.co", evento: "aviso", creado: "2026-11-10T21:58:00Z" },
    { email: "b@x.co", evento: "no", creado: "2026-11-10T21:00:00Z" },
    { email: "b@x.co", evento: "aviso", creado: "2026-11-10T20:59:00Z" },
    { email: "yo@x.co", evento: "si", creado: "2026-11-10T23:00:00Z" }
  ];
  const e = embudo(ev, us);
  assert.equal(e.vieron, 2); assert.equal(e.si, 1); assert.equal(e.pagar, 1); assert.equal(e.no, 1);
  assert.deepEqual(e.lista.map((x) => [x.email, x.top]), [["a@x.co", "hotmart"], ["b@x.co", "no"]]);
});
