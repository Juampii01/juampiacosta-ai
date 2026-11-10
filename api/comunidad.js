// Comunidad. Solo para quien entró con email. Los emails nunca salen al navegador: cada post muestra nombre, «es del equipo» y «es mío».
// GET  /api/comunidad?canal=<canal>          -> últimos 40 posts del canal (o de todos), con comentarios y me gusta
// POST /api/comunidad (JSON, campo «accion»):
//   post      { canal, titulo?, texto }    -> publica (el canal «anuncios» es solo del equipo)
//   comentar  { post, texto }
//   like      { post }                     -> pone o saca tu me gusta
//   borrar    { post } o { comentario }    -> lo tuyo, o cualquier cosa si eres del equipo
//   fijar     { post, fijado }             -> solo el equipo

import { permitido } from "./entrar.js";
import { sesion } from "../lib/sesion.js";
import { config, enc, json, leerCuerpo, sb } from "../lib/db.js";

export const CANALES = ["anuncios", "clientes", "arme", "preguntas", "general"];

export function limpiarTexto(t, max) {
  return String(t || "").replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/\n{4,}/g, "\n\n\n").trim().slice(0, max);
}

export function vista(p, yo) {
  const likes = p.comunidad_likes || [];
  return {
    id: p.id, canal: p.canal, titulo: p.titulo || "", texto: p.texto, fijado: p.fijado, creado: p.creado,
    autor: p.nombre || "Miembro", equipo: p.equipo === true, mio: p.email === yo.email,
    likes: likes.length, megusta: likes.some((l) => l.email === yo.email),
    comentarios: (p.comunidad_comentarios || []).filter((c) => !c.borrado).sort((a, b) => a.id - b.id)
      .map((c) => ({ id: c.id, autor: c.nombre || "Miembro", equipo: c.equipo === true, mio: c.email === yo.email, texto: c.texto, creado: c.creado }))
  };
}

async function nombreDe(yo) {
  const f = (await sb(`registros?email=eq.${enc(yo.email)}&select=nombre`))[0];
  return (f && f.nombre) || yo.nombre || yo.email.split("@")[0].slice(0, 20);
}

export default async function handler(req, res) {
  const yo = await sesion(req);
  if (!yo) return json(res, 401, { error: "sesion" });
  if (!yo.email) return json(res, 403, { error: "email", mensaje: "Entra con tu email para participar en la comunidad." });
  if (!config()) return json(res, 500, { error: "config" });
  const equipo = (process.env.ADMINS || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  const marcar = (x) => ({ ...x, equipo: equipo.includes(String(x.email).toLowerCase()) });

  try {
    if (req.method === "GET") {
      const canal = new URL(req.url, "http://x").searchParams.get("canal");
      const filtro = CANALES.includes(canal) ? `&canal=eq.${canal}` : "";
      const posts = await sb(`comunidad_posts?select=id,email,nombre,canal,titulo,texto,fijado,creado,comunidad_comentarios(id,email,nombre,texto,creado,borrado),comunidad_likes(email)&borrado=eq.false${filtro}&order=fijado.desc,creado.desc&limit=40`);
      const conteo = await sb("comunidad_posts?select=canal&borrado=eq.false&limit=2000");
      const porCanal = {};
      conteo.forEach((p) => { porCanal[p.canal] = (porCanal[p.canal] || 0) + 1; });
      return json(res, 200, {
        posts: posts.map((p) => vista({ ...marcar(p), comunidad_comentarios: (p.comunidad_comentarios || []).map(marcar) }, yo)),
        canales: porCanal, total: conteo.length, yo: { nombre: await nombreDe(yo), equipo: yo.admin }
      });
    }
    if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return json(res, 405, { error: "metodo" }); }
    if (!permitido("comunidad:" + yo.email)) return json(res, 429, { error: "espera" });

    const c = await leerCuerpo(req, 12000);
    const id = Number(c.post || c.comentario);
    if (c.accion === "post") {
      const canal = CANALES.includes(c.canal) ? c.canal : "general";
      if (canal === "anuncios" && !yo.admin) return json(res, 403, { error: "canal" });
      const texto = limpiarTexto(c.texto, 5000), titulo = limpiarTexto(c.titulo, 140).replace(/\n/g, " ");
      if (texto.length < 2) return json(res, 400, { error: "vacio" });
      const [p] = await sb("comunidad_posts", { method: "POST", prefer: "return=representation",
        body: { email: yo.email, nombre: await nombreDe(yo), canal, titulo: titulo || null, texto } });
      return json(res, 200, { ok: true, id: p.id });
    }
    if (!Number.isInteger(id) || id <= 0) return json(res, 400, { error: "id" });
    if (c.accion === "comentar") {
      const texto = limpiarTexto(c.texto, 2000);
      if (texto.length < 1) return json(res, 400, { error: "vacio" });
      await sb("comunidad_comentarios", { method: "POST", prefer: "return=minimal", body: { post_id: id, email: yo.email, nombre: await nombreDe(yo), texto } });
      return json(res, 200, { ok: true });
    }
    if (c.accion === "like") {
      const ya = await sb(`comunidad_likes?post_id=eq.${id}&email=eq.${enc(yo.email)}&select=post_id`);
      if (ya.length) await sb(`comunidad_likes?post_id=eq.${id}&email=eq.${enc(yo.email)}`, { method: "DELETE", prefer: "return=minimal" });
      else await sb("comunidad_likes", { method: "POST", prefer: "resolution=ignore-duplicates,return=minimal", body: { post_id: id, email: yo.email } });
      return json(res, 200, { ok: true, megusta: !ya.length });
    }
    if (c.accion === "borrar") {
      const tabla = c.comentario ? "comunidad_comentarios" : "comunidad_posts";
      const filtro = yo.admin ? "" : `&email=eq.${enc(yo.email)}`;
      const r = await sb(`${tabla}?id=eq.${id}${filtro}`, { method: "PATCH", prefer: "return=representation", body: { borrado: true } });
      return r.length ? json(res, 200, { ok: true }) : json(res, 403, { error: "permiso" });
    }
    if (c.accion === "fijar") {
      if (!yo.admin) return json(res, 403, { error: "permiso" });
      await sb(`comunidad_posts?id=eq.${id}`, { method: "PATCH", prefer: "return=minimal", body: { fijado: c.fijado !== false } });
      return json(res, 200, { ok: true });
    }
    return json(res, 400, { error: "accion" });
  } catch (e) {
    console.error("comunidad:", e.message);
    return json(res, 502, { error: "servidor" });
  }
}
