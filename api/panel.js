// Panel de equipo (solo emails de ADMINS en Vercel).
// GET  /api/panel                               -> usuarios (registros + guías vistas) y números del resumen
// POST /api/panel (JSON: accion "acceso", email, compro) -> da o saca el acceso completo a mano (por ejemplo, pagos por Mercado Pago)

import { sesion } from "../lib/sesion.js";
import { limpiarEmail } from "../lib/codigo.js";
import { config, enc, json, leerCuerpo, sb } from "../lib/db.js";
import { enviarLote, mailInvitacion } from "../lib/invitacion.js";

const CAMPOS = "email,nombre,origen,compro,baja,perfil_completo,situacion,rubro,nivel,objetivo,inversion,foco,pais,whatsapp,creado,actualizado,utm_source,utm_campaign,invitado_forja";

export function resumen(usuarios) {
  return {
    registrados: usuarios.length,
    chat: usuarios.filter((u) => /chat|manychat|agente/i.test(u.origen || "")).length,
    perfil: usuarios.filter((u) => u.perfil_completo).length,
    compraron: usuarios.filter((u) => u.compro).length,
    activos: usuarios.filter((u) => u.vistas > 0).length
  };
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
      const [regs, prog] = await Promise.all([
        sb(`registros?select=${CAMPOS}&order=creado.desc&limit=5000`),
        sb("progreso?select=email,visto&limit=50000")
      ]);
      const vistas = {}, ultimo = {};
      prog.forEach((p) => { vistas[p.email] = (vistas[p.email] || 0) + 1; if (!ultimo[p.email] || p.visto > ultimo[p.email]) ultimo[p.email] = p.visto; });
      const usuarios = regs.map((r) => ({ ...r, vistas: vistas[r.email] || 0, ultima_guia: ultimo[r.email] || null }));
      return json(res, 200, { usuarios, resumen: resumen(usuarios) });
    }
    if (req.method === "POST") {
      const c = await leerCuerpo(req);
      if (c.accion === "invitar") return invitar(res, yo, c);
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
