// Panel de equipo (solo emails de ADMINS en Vercel).
// GET  /api/panel                               -> usuarios (registros + guías vistas) y números del resumen
// POST /api/panel (JSON: accion "acceso", email, compro) -> da o saca el acceso completo a mano (por ejemplo, pagos por Mercado Pago)

import { esAdmin, sesion } from "../lib/sesion.js";
import { limpiarEmail } from "../lib/codigo.js";
import { config, enc, json, leerCuerpo, sb } from "../lib/db.js";
import { enviarLote, mailInvitacion } from "../lib/invitacion.js";

const CAMPOS = "email,nombre,origen,compro,baja,perfil_completo,situacion,rubro,nivel,objetivo,inversion,foco,pais,whatsapp,creado,actualizado,utm_source,utm_campaign,invitado_forja,ultimo_ingreso";

// Los admins (el equipo) no cuentan en los números: sus pruebas no son registros ni ventas reales.
export function resumen(todos, admins = process.env.ADMINS) {
  const usuarios = todos.filter((u) => !esAdmin(u.email, admins));
  return {
    registrados: usuarios.length,
    chat: usuarios.filter((u) => /chat|manychat|agente/i.test(u.origen || "")).length,
    perfil: usuarios.filter((u) => u.perfil_completo).length,
    compraron: usuarios.filter((u) => u.compro).length,
    activos: usuarios.filter((u) => u.vistas > 0).length,
    hoy: usuarios.filter((u) => u.hoy).length,
    semana: usuarios.filter((u) => u.dias7 > 0).length,
    vuelven: usuarios.filter((u) => u.dias >= 2).length
  };
}

const PESO = { hotmart: 5, mpago: 5, oferta_si: 5, si: 4, guia_paga: 3, ventana: 2, no: 1, oferta_no: 1, aviso: 0, oferta_vista: 0 };
/** Embudo de intención de compra y la lista de quienes mostraron interés (sin admins), del más reciente al más viejo. */
export function embudo(eventos, usuarios) {
  const porEmail = Object.fromEntries((usuarios || []).map((u) => [u.email, u]));
  const ev = (eventos || []).filter((e) => porEmail[e.email] && !porEmail[e.email].admin);
  const quien = (tipos) => new Set(ev.filter((e) => tipos.includes(e.evento)).map((e) => e.email)).size;
  const p = {};
  ev.forEach((e) => {
    if (e.evento === "aviso" || e.evento === "oferta_vista") return;
    const x = p[e.email] || (p[e.email] = { email: e.email, ultimo: e.creado, top: e.evento, detalle: e.detalle, si: 0, pagos: 0, guias: [] });
    if (e.evento === "si") x.si++;
    if (e.evento === "hotmart" || e.evento === "mpago") x.pagos++;
    if (e.evento === "guia_paga" && e.detalle && !x.guias.includes(e.detalle) && x.guias.length < 3) x.guias.push(e.detalle);
    if (PESO[e.evento] > PESO[x.top]) { x.top = e.evento; x.detalle = e.detalle; }
  });
  const lista = Object.values(p).map((x) => {
    const u = porEmail[x.email];
    return { ...x, nombre: u.nombre, pais: u.pais, whatsapp: u.whatsapp, compro: u.compro, objetivo: u.objetivo, inversion: u.inversion };
  }).sort((a, b) => (a.ultimo < b.ultimo ? 1 : -1)).slice(0, 200);
  return {
    vieron: quien(["aviso"]), si: quien(["si"]), ventana: quien(["ventana"]), pagar: quien(["hotmart", "mpago", "oferta_si"]),
    no: quien(["no"]), compraron: lista.filter((x) => x.compro).length, lista
  };
}

/** Días distintos que entró cada uno (últimos 30 y últimos 7), si entró hoy, páginas vistas y guías abiertas. */
export function frecuencia(filas, hoy = new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10)) {
  const hace7 = new Date(Date.parse(hoy) - 6 * 864e5).toISOString().slice(0, 10);
  const f = {};
  (filas || []).forEach((a) => {
    const u = f[a.email] || (f[a.email] = { dias: 0, dias7: 0, hoy: false, paginas: 0, guias: new Set(), ultimo_dia: null });
    u.dias++; u.paginas += a.paginas || 0;
    if (a.dia >= hace7) u.dias7++;
    if (a.dia === hoy) u.hoy = true;
    if (!u.ultimo_dia || a.dia > u.ultimo_dia) u.ultimo_dia = a.dia;
    (a.secciones || []).forEach((s) => { if (s.startsWith("g:")) u.guias.add(s); });
  });
  Object.values(f).forEach((u) => { u.abiertas = u.guias.size; delete u.guias; });
  return f;
}

// accion "oferta": {activa:true} la prende (y arranca una ronda nueva: le vuelve a aparecer a todos una vez),
// {activa:false} la apaga. Los links y el precio viven en ajustes.oferta.
async function oferta(res, yo, c) {
  if (typeof c.activa !== "boolean") return json(res, 400, { error: "datos" });
  const fila = (await sb("ajustes?clave=eq.oferta&select=valor"))[0];
  const valor = { ...((fila && fila.valor) || {}), activa: c.activa };
  if (c.activa) {
    if (!valor.hotmart) return json(res, 400, { error: "sin_link" });
    valor.desde = new Date().toISOString();
  }
  await sb("ajustes?on_conflict=clave", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: { clave: "oferta", valor, actualizado: new Date().toISOString() } });
  console.log(`panel: ${yo.email} ${c.activa ? "prendió" : "apagó"} la oferta`);
  return json(res, 200, { ok: true, oferta: valor });
}

/** Cómo va la ronda actual de la oferta: cuántos la vieron, cuántos tocaron comprar y cuántos pasaron. */
export function rondaOferta(o, eventos) {
  if (!o) return null;
  const desde = o.desde || "9999";
  const quien = (ev) => new Set((eventos || []).filter((e) => e.evento === ev && e.creado >= desde).map((e) => e.email)).size;
  return { activa: !!o.activa, desde: o.desde || null, precio: o.precio, antes: o.antes, listo: !!o.hotmart,
    vieron: quien("oferta_vista"), quieren: quien("oferta_si"), pasaron: quien("oferta_no") };
}

// accion "invitar": {prueba:true} manda el mail solo al admin; {confirmar:"ENVIAR"} a todos los que no lo recibieron
// (sin baja), en lotes de 100, y marca invitado_forja para no repetir nunca.
async function invitar(res, yo, c) {
  if (c.prueba === true) {
    const yoReg = (await sb(`registros?email=eq.${enc(yo.email)}&select=nombre,compro`))[0] || {};
    await enviarLote([{ para: yo.email, ...mailInvitacion(yoReg.nombre || yo.nombre, false) }]);
    return json(res, 200, { ok: true, prueba: true });
  }
  if (c.confirmar !== "ENVIAR") return json(res, 400, { error: "confirmar" });
  const pendientes = await sb("registros?select=email,nombre,compro&invitado_forja=is.null&or=(baja.is.null,baja.eq.false)&order=creado.asc&limit=1000");
  let enviados = 0;
  for (let i = 0; i < pendientes.length; i += 100) {
    const lote = pendientes.slice(i, i + 100).filter((u) => limpiarEmail(u.email));
    if (!lote.length) continue;
    await enviarLote(lote.map((u) => ({ para: u.email, ...mailInvitacion(u.nombre, !!u.compro) })));
    const lista = lote.map((u) => `"${u.email.replace(/"/g, "")}"`).join(",");
    await sb(`registros?email=in.(${enc(lista)})`, { method: "PATCH", prefer: "return=minimal", body: { invitado_forja: new Date().toISOString() } });
    enviados += lote.length;
  }
  console.log(`panel: ${yo.email} mandó la invitación a Forja IA a ${enviados} personas`);
  return json(res, 200, { ok: true, enviados });
}

export default async function handler(req, res) {
  const yo = await sesion(req);
  if (!yo || !yo.admin) return json(res, 403, { error: "permiso" });
  if (!config()) return json(res, 500, { error: "config" });
  try {
    if (req.method === "GET") {
      const desde = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
      const [regs, prog, act, int, aj] = await Promise.all([
        sb(`registros?select=${CAMPOS}&order=creado.desc&limit=5000`),
        sb("progreso?select=email,visto&limit=50000"),
        sb("interes?select=email,evento,detalle,creado&order=creado.desc&limit=20000").catch(() => []),
        sb(`actividad?select=email,dia,paginas,secciones&dia=gte.${desde}&limit=50000`),
        sb("ajustes?clave=eq.oferta&select=valor").catch(() => [])
      ]);
      const vistas = {}, ultimo = {};
      prog.forEach((p) => { vistas[p.email] = (vistas[p.email] || 0) + 1; if (!ultimo[p.email] || p.visto > ultimo[p.email]) ultimo[p.email] = p.visto; });
      const frec = frecuencia(act);
      const usuarios = regs.map((r) => ({ ...r, admin: esAdmin(r.email), vistas: vistas[r.email] || 0, ultima_guia: ultimo[r.email] || null, ...(frec[r.email] || { dias: 0, dias7: 0, paginas: 0, abiertas: 0 }) }));
      const noAdmin = int.filter((e) => !esAdmin(e.email));
      return json(res, 200, { usuarios, resumen: resumen(usuarios), interes: embudo(int, usuarios), oferta: rondaOferta(aj[0] && aj[0].valor, noAdmin) });
    }
    if (req.method === "POST") {
      const c = await leerCuerpo(req);
      if (c.accion === "invitar") return invitar(res, yo, c);
      if (c.accion === "oferta") return oferta(res, yo, c);
      const email = limpiarEmail(c.email);
      if (c.accion !== "acceso" || !email || typeof c.compro !== "boolean") return json(res, 400, { error: "datos" });
      const r = await sb(`registros?email=eq.${enc(email)}`, { method: "PATCH", prefer: "return=representation", body: { compro: c.compro, actualizado: new Date().toISOString() } });
      if (!r.length) await sb("registros", { method: "POST", prefer: "return=minimal", body: { email, origen: "manual", compro: c.compro } });
      console.log(`panel: ${yo.email} ${c.compro ? "dio" : "sacó"} acceso completo a ${email.replace(/^(.).*@/, "$1***@")}`);
      return json(res, 200, { ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "metodo" });
  } catch (e) {
    console.error("panel:", e.message);
    return json(res, 502, { error: "servidor" });
  }
}
