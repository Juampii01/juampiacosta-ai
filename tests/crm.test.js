import test from "node:test";
import assert from "node:assert/strict";
import { metricas, tokenValido, enmascarar, dias } from "../api/crm.js";
import { leerVenta } from "../api/hotmart.js";

const AHORA = Date.parse("2026-11-17T15:00:00Z");

test("token del CRM: exige Bearer con el valor exacto y largo", () => {
  const t = "x".repeat(40);
  assert.equal(tokenValido("Bearer " + t, t), true);
  assert.equal(tokenValido("Bearer " + t + "y", t), false);
  assert.equal(tokenValido("", t), false);
  assert.equal(tokenValido("Bearer corto", "corto"), false);
});

test("enmascara emails y arma la ventana de días en hora de Argentina", () => {
  assert.equal(enmascarar("juan@x.com"), "j***@x.com");
  const d = dias(3, AHORA);
  assert.deepEqual(d, ["2026-11-15", "2026-11-16", "2026-11-17"]);
});

test("separa negocio y plataforma, sin admins ni pruebas, y resta reembolsos", () => {
  const registros = [
    { email: "a@x.com", compro: true, creado: "2026-11-16T12:00:00Z" },
    { email: "b@x.com", compro: false, creado: "2026-11-17T12:00:00Z" },
    { email: "p@x.com", compro: true, prueba: true, creado: "2026-11-17T12:00:00Z" },
    { email: "yo@x.com", compro: true, creado: "2026-11-17T12:00:00Z" }
  ];
  const ventas = [
    { transaccion: "T1", estado: "aprobada", email: "a@x.com", producto_id: "8923277", monto: 24.9, moneda: "USD", medio: "hotmart", origen: "ad-vender", creado: "2026-11-16T12:00:00Z" },
    { transaccion: "T2", estado: "aprobada", email: "a@x.com", producto_id: "8923495", monto: 7, moneda: "USD", medio: "hotmart", creado: "2026-11-16T12:00:00Z" },
    { transaccion: "T3", estado: "aprobada", email: "c@x.com", producto_id: "8923277", monto: 24.9, moneda: "USD", medio: "hotmart", creado: "2026-11-16T13:00:00Z" },
    { transaccion: "T3", estado: "anulada", email: "c@x.com", producto_id: "8923277", creado: "2026-11-17T13:00:00Z" },
    { transaccion: "T4", estado: "aprobada", email: "p@x.com", producto_id: "8923277", monto: 24.9, moneda: "USD", creado: "2026-11-17T13:00:00Z" }
  ];
  const chat = [{ contacto: "1", rol: "usuario", creado: "2026-11-17T10:00:00Z" }, { contacto: "1", rol: "usuario", creado: "2026-11-17T11:00:00Z" }];
  const actividad = [{ email: "a@x.com", dia: "2026-11-16", secciones: ["g:guia-1"] }, { email: "a@x.com", dia: "2026-11-17", secciones: ["g:guia-1"] }, { email: "b@x.com", dia: "2026-11-17", secciones: [] }];
  const interes = [{ email: "b@x.com", evento: "si", creado: "2026-11-17T12:30:00Z" }];
  const m = metricas({ registros, ventas, chat, actividad, interes, n: 7, ahora: AHORA, admins: "yo@x.com" });
  assert.equal(m.negocio.ventas, 1);
  assert.equal(m.negocio.ingresos_usd, 31.9);
  assert.equal(m.negocio.conversion, 50);
  assert.deepEqual(m.negocio.embudo.map((p) => p.n), [1, 2, 1, 1]);
  assert.equal(m.negocio.seguimiento[0].email, "b***@x.com");
  const b = m.plataformas.biblioteca;
  assert.deepEqual([b.usuarios, b.gratis, b.pagos, b.activos, b.retencion], [2, 1, 1, 2, 50]);
  assert.deepEqual(b.guias_top, [{ nombre: "guia-1", n: 2 }]);
});

test("lee la venta de un aviso de Hotmart, también la del order bump", () => {
  const v = leerVenta({ event: "PURCHASE_APPROVED", data: { product: { id: 8923495, name: "PDF" }, buyer: { email: "A@X.com" }, purchase: { transaction: "HP1", price: { value: 7, currency_value: "USD" }, origin: { sck: "ad-1" } } } });
  assert.deepEqual(v, { transaccion: "HP1", evento: "PURCHASE_APPROVED", estado: "aprobada", medio: "hotmart", email: "a@x.com", producto_id: "8923495", producto: "PDF", monto: 7, moneda: "USD", origen: "ad-1" });
  assert.equal(leerVenta({ event: "PURCHASE_DELAYED", data: { purchase: { transaction: "x" } } }), null);
  assert.equal(leerVenta({ event: "PURCHASE_REFUNDED", data: { purchase: { transaction: "HP1" } } }).estado, "anulada");
});
