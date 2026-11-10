// GET /api/inicio -> el resumen de quien está adentro para /inicio:
// guías que lleva (abiertas o completadas), días activos, racha, guías abiertas, última guía; y además
//   plan gratis: chances del sorteo de 2 accesos completos
//   acceso completo: ranking del mes (top 3 y tu puesto)

import { esAdmin, sesion } from "../lib/sesion.js";
import { config, enc, json, sb } from "../lib/db.js";
import { SORTEO, chances, hoyAr, mejorRacha, racha, ranking } from "../lib/inicio.js";

function contar(filas) {
  const n = {};
  (filas || []).forEach((f) => { n[f.email] = (n[f.email] || 0) + 1; });
  return n;
}

export default async function handler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return json(res, 405, { error: "metodo" }); }
  const yo = await sesion(req);
  if (!yo) return json(res, 401, { error: "sesion" });
  const pago = yo.nivel === "pago";
  if (!yo.email || !config()) return json(res, 200, { nombre: yo.nombre, pago, vacio: true });
  const hoy = hoyAr();
  const mes = hoy.slice(0, 8) + "01";
  const hace60 = new Date(Date.parse(hoy) - 59 * 864e5).toISOString().slice(0, 10);
  const e = enc(yo.email);
  try {
    const [reg, prog, act] = await Promise.all([
      sb(`registros?email=eq.${e}&select=nombre`),
      sb(`progreso?email=eq.${e}&select=slug,visto&order=visto.desc&limit=1000`),
      sb(`actividad?email=eq.${e}&select=dia,secciones&dia=gte.${hace60}&order=dia.desc&limit=100`)
    ]);
    const dias = act.map((a) => a.dia);
    // «Llevas N guías»: las que abrió más las que marcó como leídas (casi nadie llega al final de una guía)
    const abiertas = new Set();
    act.forEach((a) => (a.secciones || []).forEach((s) => { if (s.startsWith("g:")) abiertas.add(s.slice(2)); }));
    const llevas = new Set([...abiertas, ...prog.map((p) => p.slug)]);
    const hace7 = new Date(Date.parse(hoy) - 6 * 864e5).toISOString().slice(0, 10);
    const semana = [];
    for (let i = 6; i >= 0; i--) semana.push(dias.includes(new Date(Date.parse(hoy) - i * 864e5).toISOString().slice(0, 10)));
    const r = {
      nombre: (reg[0] && reg[0].nombre) || yo.nombre || "",
      pago,
      completadas: prog.length,
      llevas: [...llevas],
      completadasSemana: prog.filter((p) => (p.visto || "").slice(0, 10) >= hace7).length,
      ultimaCompletada: prog[0] ? prog[0].slug : null,
      vistas: prog.map((p) => p.slug),
      diasMes: dias.filter((d) => d >= mes).length,
      dias30: dias.filter((d) => d >= new Date(Date.parse(hoy) - 29 * 864e5).toISOString().slice(0, 10)).length,
      semana,
      racha: racha(dias, hoy),
      mejorRacha: mejorRacha(dias),
      abiertas: abiertas.size
    };
    if (!pago) {
      r.sorteo = { premios: SORTEO.premios, cierra: SORTEO.cierra, chances: chances(llevas.size, dias.filter((d) => d >= SORTEO.desde).length) };
    } else {
      const [personas, guiasMes, diasMes] = await Promise.all([
        sb("registros?compro=eq.true&select=email,nombre&limit=5000"),
        sb(`progreso?visto=gte.${mes}T03:00:00Z&select=email,slug&limit=50000`),
        sb(`actividad?dia=gte.${mes}&select=email,secciones&limit=50000`)
      ]);
      const quienes = personas.filter((p) => !esAdmin(p.email));
      if (!yo.admin && !quienes.some((p) => p.email === yo.email)) quienes.push({ email: yo.email, nombre: r.nombre });
      // Guías del mes por persona: las que abrió o completó este mes (sin repetir)
      const guias = {};
      const sumar = (email, slug) => { (guias[email] || (guias[email] = new Set())).add(slug); };
      guiasMes.forEach((g) => sumar(g.email, g.slug));
      diasMes.forEach((a) => (a.secciones || []).forEach((x) => { if (x.startsWith("g:")) sumar(a.email, x.slice(2)); }));
      const nGuias = Object.fromEntries(Object.entries(guias).map(([k, v]) => [k, v.size]));
      r.ranking = ranking(quienes, nGuias, contar(diasMes), yo.admin ? null : yo.email);
    }
    return json(res, 200, r);
  } catch (err) {
    console.error("inicio:", err.message);
    return json(res, 502, { error: "servidor" });
  }
}
