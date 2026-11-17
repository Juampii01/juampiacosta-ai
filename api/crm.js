// GET /api/crm?dias=30 -> métricas del negocio de Forja IA para el CRM interno (crm.forjaia.com).
// Lo llama el servidor del CRM con «Authorization: Bearer <CRM_TOKEN>» (variable CRM_TOKEN en los dos proyectos de Vercel).
// Nunca devuelve emails completos ni datos de contacto: solo números agregados y listas con nombre y email enmascarado.

import { timingSafeEqual } from "node:crypto";
import { esAdmin } from "../lib/sesion.js";
import { config, json, sb } from "../lib/db.js";
import { embudo } from "./panel.js";

const AR = 3 * 36e5; // los días se cuentan en hora de Argentina

export function tokenValido(cabecera, esperado = process.env.CRM_TOKEN) {
  const recibido = String(cabecera || "").replace(/^Bearer\s+/i, "");
  if (!recibido || !esperado || esperado.length < 32) return false;
  const a = Buffer.from(recibido), b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Lo que vale una venta en dólares: el precio de la oferta o, si se cobró en USD, el monto. */
export const usdDe = (v) => (v.monto_usd != null ? Number(v.monto_usd) : v.moneda === "USD" && v.monto ? Number(v.monto) : 0);

export const diaAr = (iso) => new Date(Date.parse(iso) - AR).toISOString().slice(0, 10);
export const enmascarar = (email) => String(email || "").replace(/^(.).*?(@.*)$/, "$1***$2");

/** Días de la ventana, del más viejo al de hoy (hora de Argentina). */
export function dias(n, ahora = Date.now()) {
  const hoy = Date.parse(new Date(ahora - AR).toISOString().slice(0, 10));
  return Array.from({ length: n }, (_, i) => new Date(hoy - (n - 1 - i) * 864e5).toISOString().slice(0, 10));
}

/** Arma todas las métricas a partir de las filas crudas. Pura (sin red) para poder probarla. */
export function metricas({ registros, ventas, chat, actividad, interes, n = 30, ahora = Date.now(), admins = process.env.ADMINS }) {
  const fuera = (email) => esAdmin(email, admins);
  const regs = registros.filter((r) => !r.prueba && !fuera(r.email));
  const pruebas = new Set(registros.filter((r) => r.prueba || fuera(r.email)).map((r) => r.email));
  const vts = ventas.filter((v) => !pruebas.has(v.email));
  const act = actividad.filter((a) => !pruebas.has(a.email));
  const ventana = dias(n, ahora), desde = ventana[0];
  const serie = Object.fromEntries(ventana.map((d) => [d, { dia: d, registros: 0, ventas: 0, ingresos_usd: 0, conversaciones: 0, activos: 0 }]));

  regs.forEach((r) => { const d = diaAr(r.creado); if (serie[d]) serie[d].registros++; });
  // Ventas netas: las anuladas restan
  const aprobadas = vts.filter((v) => v.estado === "aprobada");
  const anuladas = new Set(vts.filter((v) => v.estado === "anulada").map((v) => v.transaccion));
  const netas = aprobadas.filter((v) => !anuladas.has(v.transaccion));
  const esBiblioteca = (v) => !v.producto_id || v.producto_id === "8923277";
  netas.forEach((v) => {
    const d = diaAr(v.creado); if (!serie[d]) return;
    if (esBiblioteca(v)) serie[d].ventas++;
    serie[d].ingresos_usd += usdDe(v);
  });
  // Conversaciones del agente: el día del primer mensaje de cada contacto
  const primero = {};
  chat.forEach((m) => { if (m.rol === "usuario" && (!primero[m.contacto] || m.creado < primero[m.contacto])) primero[m.contacto] = m.creado; });
  Object.values(primero).forEach((c) => { const d = diaAr(c); if (serie[d]) serie[d].conversaciones++; });
  act.forEach((a) => { if (serie[a.dia]) serie[a.dia].activos++; });

  const enVentana = (iso) => diaAr(iso) >= desde;
  const regsV = regs.filter((r) => enVentana(r.creado));
  const ventasBib = netas.filter(esBiblioteca);
  const ventasV = ventasBib.filter((v) => enVentana(v.creado));
  const usd = (lista) => Math.round(lista.reduce((s, v) => s + usdDe(v), 0) * 100) / 100;
  const contactosV = Object.values(primero).filter(enVentana).length;
  const hace7 = dias(7, ahora)[0];
  const activos7 = new Set(act.filter((a) => a.dia >= hace7).map((a) => a.email)).size;

  // Embudo de la ventana: conversación -> registro -> perfil -> levantó la mano -> compró
  const emailsV = new Set(regsV.map((r) => r.email));
  const manos = new Set(interes.filter((e) => emailsV.has(e.email) && ["si", "ventana", "guia_paga", "oferta_si", "hotmart", "mpago"].includes(e.evento)).map((e) => e.email));
  const compradoresV = regsV.filter((r) => r.compro).length;

  // De dónde vienen las ventas
  const contar = (lista, clave) => Object.entries(lista.reduce((m, x) => { const k = clave(x) || "sin dato"; m[k] = (m[k] || 0) + 1; return m; }, {}))
    .map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n).slice(0, 6);

  // Biblioteca: guías más abiertas en la ventana
  const guias = {};
  act.filter((a) => a.dia >= desde).forEach((a) => (a.secciones || []).forEach((s) => { if (s.startsWith("g:")) guias[s.slice(2)] = (guias[s.slice(2)] || 0) + 1; }));
  const diasPorEmail = {};
  act.filter((a) => a.dia >= desde).forEach((a) => { diasPorEmail[a.email] = (diasPorEmail[a.email] || 0) + 1; });
  const activosV = Object.keys(diasPorEmail).length;
  const vuelven = Object.values(diasPorEmail).filter((d) => d >= 2).length;
  const pagos = regs.filter((r) => r.compro).length;
  const ingresosV = usd(ventasV.concat(netas.filter((v) => !esBiblioteca(v) && enVentana(v.creado))));

  const interesados = embudo(interes, regs.map((r) => ({ ...r, admin: false }))).lista.filter((x) => !x.compro).slice(0, 10)
    .map((x) => ({ nombre: x.nombre || "Sin nombre", email: enmascarar(x.email), pais: x.pais || null, que: x.top, cuando: x.ultimo, whatsapp: !!x.whatsapp }));
  const serieL = Object.values(serie).map((d) => ({ ...d, ingresos_usd: Math.round(d.ingresos_usd * 100) / 100 }));

  return {
    generado: new Date(ahora).toISOString(), dias: n, desde,
    // Negocio: plata y conversión
    negocio: {
      ingresos_usd: ingresosV,
      ventas: ventasV.length,
      ticket_usd: ventasV.length ? Math.round((ingresosV / ventasV.length) * 100) / 100 : 0,
      conversion: regsV.length ? Math.round((compradoresV / regsV.length) * 1000) / 10 : 0,
      embudo: [
        { paso: "Conversaciones por DM", n: contactosV },
        { paso: "Registros", n: regsV.length },
        { paso: "Levantaron la mano", n: manos.size },
        { paso: "Compraron", n: compradoresV }
      ],
      origen_ventas: contar(ventasV, (v) => v.origen || v.medio),
      serie: serieL.map((d) => ({ dia: d.dia, ventas: d.ventas, ingresos_usd: d.ingresos_usd, conversaciones: d.conversaciones })),
      seguimiento: interesados
    },
    // Plataformas: una entrada por producto (hoy, la biblioteca de Forja IA)
    plataformas: {
      biblioteca: {
        nombre: "Biblioteca Forja IA",
        usuarios: regs.length, gratis: regs.length - pagos, pagos,
        nuevos: regsV.length, activos_7d: activos7, activos: activosV,
        retencion: activosV ? Math.round((vuelven / activosV) * 1000) / 10 : 0,
        guias_top: Object.entries(guias).map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n).slice(0, 5),
        serie: serieL.map((d) => ({ dia: d.dia, registros: d.registros, activos: d.activos }))
      }
    }
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return json(res, 405, { error: "metodo" }); }
  if (!tokenValido(req.headers.authorization)) return json(res, 401, { error: "permiso" });
  if (!config()) return json(res, 500, { error: "config" });
  const n = Math.min(Math.max(parseInt(new URL(req.url, "http://x").searchParams.get("dias"), 10) || 30, 1), 180);
  try {
    const [registros, ventas, chat, actividad, interes] = await Promise.all([
      sb("registros?select=email,nombre,compro,prueba,pais,whatsapp,creado&order=creado.desc&limit=20000"),
      sb("ventas?select=transaccion,estado,medio,email,producto_id,producto,monto,moneda,monto_usd,origen,creado&order=creado.desc&limit=20000"),
      sb(`chat_mensajes?select=contacto,rol,creado&order=creado.desc&limit=50000`),
      sb(`actividad?select=email,dia,secciones&dia=gte.${dias(Math.max(n, 7))[0]}&limit=50000`),
      sb("interes?select=email,evento,detalle,creado&order=creado.desc&limit=20000")
    ]);
    return json(res, 200, metricas({ registros, ventas, chat, actividad, interes, n }));
  } catch (e) {
    console.error("crm:", e.message);
    return json(res, 502, { error: "servidor" });
  }
}
