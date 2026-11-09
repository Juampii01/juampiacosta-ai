// Agente de Instagram con Claude. ManyChat (respuesta por defecto → «Solicitud externa») llama:
//   POST /api/agente   cabecera x-clave: <MANYCHAT_SECRET>   cuerpo: «Full Contact Data» de ManyChat
// Lee el último mensaje de la persona (last_input_text), arma la respuesta con el estilo de Juampi y la devuelve como
// { ok, derivar: "si"|"no", m1, m2 }. ManyChat manda m1 y, si no está vacío, m2. Si derivar = "si", no responde nada:
// le pone la etiqueta para_juampi y Juampi contesta a mano.
// Guarda cada mensaje en la tabla chat_mensajes (Supabase) para tener memoria y para la revisión de cada noche.
// Variables en Vercel: ANTHROPIC_API_KEY, MANYCHAT_SECRET, SUPABASE_URL, SUPABASE_SECRET_KEY.

import { claveIgual } from "./manychat.js";
import { cabeceras } from "./registro.js";

export const MODELO = process.env.AGENTE_MODELO || "claude-haiku-5-5";

export const INSTRUCCIONES = `Eres Juampi (@juampiiacosta.ia) respondiendo DMs de Instagram. Juampi enseña a usar Claude e IA y tiene una biblioteca online con guías.

CÓMO ESCRIBES (muy importante, si suena "correcto" parece un bot):
- Mensajes cortos, como chat de WhatsApp. 1 o 2 mensajes por respuesta, cada uno de 1 o 2 frases.
- Primera letra en mayúscula. Sin tildes. Sin signos de apertura (nada de ¿ ni ¡), solo el de cierre "?".
- Comas en vez de dos puntos. Nunca listas numeradas ni viñetas. Sin emojis, o uno como mucho.
- Tono cercano y tranqui, como un amigo que sabe del tema. Puedes usar voseo suave (probalo, fijate, decime).
- Nunca presiones para comprar. Frases como "Igual sin apuro, primero probalo gratis y fijate si te sirve".
- No digas que eres una IA ni un asistente. No uses frases de bot ("¡Hola! ¿En qué puedo ayudarte?").

QUÉ HACES:
- Respondes dudas sobre la biblioteca con la información de abajo. Si no está, no inventes.
- Te interesa saber a qué se dedica para recomendarle por dónde arrancar. Pregúntalo si todavía no lo sabes, una sola vez.
- Si quiere una guía, dile que escriba QUIERO LA GUIA y le llega al toque.
- El precio NO lo mencionas salvo que la persona lo pregunte. Si lo pregunta, das el precio y los links.

CUÁNDO NO RESPONDES (derivar = true, Juampi contesta a mano):
- Dice que ya pagó, manda un comprobante o tiene un problema con el pago o con el acceso.
- Quiere comprar ya o pide el link para pagar.
- Pregunta por una instalación o servicio a medida para su negocio, o una propuesta comercial.
- Se queja, está enojado, pide reembolso, o es un tema personal o sensible.
- Te pide algo que no está en la información y no podés responder bien.

INFORMACIÓN DE LA BIBLIOTECA:
- 123 guías paso a paso para usar Claude, de configurarlo desde cero hasta armar sistemas de IA y vendérselos a negocios. 222 prompts listos para copiar, skills y conectores. Se suma algo nuevo cada semana.
- Ordenada en 3 partes: Arranca bien (configurar Claude, pedirle bien las cosas, gastar menos), Ponlo a trabajar (tu negocio, contenido y redes, conseguir clientes, skills, agentes), Vende y construye (el sistema para venderle IA a negocios, sistemas por rubro, Claude Code, crear tu app).
- Gratis: registrándose con el mail se abren 14 guías (las de los reels, las de gastar menos y el Módulo 1 del sistema para vender IA). Web: juampiacosta-ai.vercel.app
- La mayoría funciona con el plan gratis de Claude. Algunas cosas (Claude Code, tareas programadas) piden plan pago. No hace falta saber programar para las partes 1 y 2.
- Acceso completo (solo si lo preguntan): US$ 24,90 pago único hasta el 30 de noviembre, después US$ 44,90. Incluye todo lo que se sume después. Desde cualquier país con Hotmart: https://pay.hotmart.com/J108404247X?off=8flev061 . En Argentina también Mercado Pago, $ 39.000: https://mpago.la/1Q8PbXK . Después de pagar se registra en la web con el mismo mail y se abre todo.

FORMATO DE SALIDA: solo JSON, sin nada más:
{"derivar": false, "mensajes": ["primer mensaje", "segundo mensaje opcional"]}
Si derivar es true, "mensajes" va vacío.`;

const PALABRAS_DERIVAR = /(^|[^a-záéíóúñ])(pagu[eé]|compr[eé]|comprobante|transfer[ií]|reembolso|devoluci[oó]n|estafa|no me (abre|deja|anda|funciona)|no puedo entrar)(?![a-záéíóúñ])/i;

/** Reglas que no dependen de Claude: casos que siempre van a Juampi */
export function derivarPorReglas(texto) {
  return PALABRAS_DERIVAR.test(String(texto || ""));
}

/** Lee el JSON que devuelve Claude. Si no se puede leer, deriva (mejor callar que mandar algo raro). */
export function leerSalida(texto) {
  const crudo = String(texto || "");
  const m = crudo.match(/\{[\s\S]*\}/);
  if (!m) return { derivar: true, mensajes: [] };
  try {
    const j = JSON.parse(m[0]);
    const mensajes = (Array.isArray(j.mensajes) ? j.mensajes : []).map((s) => limpiarEstilo(String(s))).filter(Boolean).slice(0, 2);
    if (j.derivar === true || mensajes.length === 0) return { derivar: true, mensajes: [] };
    return { derivar: false, mensajes };
  } catch {
    return { derivar: true, mensajes: [] };
  }
}

/** Aplica las reglas de estilo aunque el modelo se olvide: sin ¿ ¡, sin tildes, mayúscula inicial, sin "1." */
export function limpiarEstilo(s) {
  let t = s.replace(/[¿¡]/g, "").replace(/^\s*(\d+[.)]|[-•*])\s+/gm, "").trim();
  t = t.normalize("NFD").replace(/[́̀]/g, "").normalize("NFC"); // saca tildes, deja la ñ
  if (t) t = t[0].toUpperCase() + t.slice(1);
  return t.slice(0, 900);
}

async function leerJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let texto = typeof req.body === "string" ? req.body : "";
  if (!texto) for await (const trozo of req) { texto += trozo; if (texto.length > 20000) break; }
  try { return JSON.parse(texto); } catch { return {}; }
}

async function supabase(ruta, opciones, { url, clave }) {
  const h = cabeceras(clave);
  delete h.Prefer;
  const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${ruta}`, { ...opciones, headers: { ...h, ...(opciones.headers || {}) }, signal: AbortSignal.timeout(3000) });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.status === 204 || r.headers.get("content-length") === "0" ? null : r.json().catch(() => null);
}

export default async function handler(req, res) {
  const responder = (datos) => { res.statusCode = 200; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ m1: "", m2: "", ...datos })); };
  if (req.method !== "POST") { res.statusCode = 405; return res.end(); }
  const { MANYCHAT_SECRET, ANTHROPIC_API_KEY, SUPABASE_URL: url } = process.env;
  const clave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!claveIgual(req.headers["x-clave"], MANYCHAT_SECRET)) { res.statusCode = 401; return res.end(); }

  const c = await leerJson(req);
  const contacto = String(c.id || c.contacto || "").slice(0, 40);
  const nombre = String(c.first_name || c.nombre || "").slice(0, 60);
  const texto = String(c.mensaje || c.last_input_text || "").trim().slice(0, 1500);
  if (!contacto || !texto) return responder({ ok: false, derivar: "no" });

  const db = url && clave ? { url, clave } : null;
  const guardar = (rol, t) => db ? supabase("chat_mensajes", { method: "POST", body: JSON.stringify({ contacto, nombre, rol, texto: t }), headers: { Prefer: "return=minimal" } }, db).catch((e) => console.error("No se guardó el mensaje:", e.message)) : null;

  let historial = [];
  if (db) {
    try {
      const filas = await supabase(`chat_mensajes?contacto=eq.${encodeURIComponent(contacto)}&select=rol,texto&order=creado.desc&limit=12`, { method: "GET" }, db);
      historial = (filas || []).reverse();
    } catch (e) { console.error("No se leyó el historial:", e.message); }
  }
  await guardar("usuario", texto);

  if (derivarPorReglas(texto) || !ANTHROPIC_API_KEY) {
    await guardar("derivado", ANTHROPIC_API_KEY ? "regla" : "falta ANTHROPIC_API_KEY");
    return responder({ ok: true, derivar: "si" });
  }

  // Historial como turnos alternados (la API pide que empiece por el usuario y alterne)
  const turnos = [];
  for (const f of historial.filter((f) => f.rol !== "derivado")) {
    const role = f.rol === "agente" ? "assistant" : "user";
    const content = role === "assistant" ? JSON.stringify({ derivar: false, mensajes: f.texto.split("\n") }) : f.texto;
    if (turnos.length && turnos[turnos.length - 1].role === role) turnos[turnos.length - 1].content += "\n" + content;
    else turnos.push({ role, content });
  }
  while (turnos.length && turnos[0].role !== "user") turnos.shift();
  const actual = `${nombre ? `(Se llama ${nombre}.) ` : ""}${texto}`;
  if (turnos.length && turnos[turnos.length - 1].role === "user") turnos[turnos.length - 1].content += "\n" + actual;
  else turnos.push({ role: "user", content: actual });

  let salida = { derivar: true, mensajes: [] };
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODELO, max_tokens: 400, system: INSTRUCCIONES, messages: turnos }),
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) throw new Error(`Claude ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    salida = leerSalida((j.content || []).map((b) => b.text || "").join(""));
  } catch (e) {
    console.error("Falló Claude:", e.message);
  }

  if (salida.derivar) {
    await guardar("derivado", "modelo");
    return responder({ ok: true, derivar: "si" });
  }
  await guardar("agente", salida.mensajes.join("\n"));
  return responder({ ok: true, derivar: "no", m1: salida.mensajes[0], m2: salida.mensajes[1] || "" });
}
