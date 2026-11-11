// Agente de Instagram con Claude. ManyChat (respuesta por defecto → «Solicitud externa») llama:
//   POST /api/agente   cabecera x-clave: <MANYCHAT_SECRET>   cuerpo: «Full Contact Data» de ManyChat
// Lee el último mensaje de la persona (last_input_text), arma la respuesta con el estilo de Juampi y la devuelve como
// { ok, derivar: "si"|"no", m1, m2 }. ManyChat manda m1 y, si no está vacío, m2. Si derivar = "si", no responde nada:
// le pone la etiqueta para_juampi y Juampi contesta a mano.
// Guarda cada mensaje en la tabla chat_mensajes (Supabase) para tener memoria y para la revisión de cada noche.
// Si escribe la palabra de un reel/anuncio le pide el mail; si manda el mail, lo registra y le devuelve el link mágico.
// Variables en Vercel: ANTHROPIC_API_KEY, MANYCHAT_SECRET, ACCESS_SECRET, SUPABASE_URL, SUPABASE_SECRET_KEY.

import { claveIgual } from "./manychat.js";
import { SITIO } from "../lib/sitio.js";
import { cabeceras, guardarEnSupabase, limpiarRegistro } from "./registro.js";
import { crearEnlace } from "../lib/acceso.js";
import { GUIAS_GRATIS, PALABRAS } from "../lib/gratis.js";

export const MODELO = process.env.AGENTE_MODELO || "claude-haiku-5-5";

export const INSTRUCCIONES = `Eres Juampi (@juampiiacosta.ia) respondiendo DMs de Instagram. Juampi enseña a usar Claude e IA y tiene una biblioteca online con guías.

CÓMO ESCRIBES (muy importante, si suena "correcto" parece un bot):
- Mensajes cortos, como chat de WhatsApp. 1 o 2 mensajes por respuesta, cada uno de 1 o 2 frases.
- Primera letra en mayúscula. Sin tildes. Sin signos de apertura (nada de ¿ ni ¡), solo el de cierre "?".
- Comas en vez de dos puntos. Nunca listas numeradas ni viñetas. Sin emojis, o uno como mucho.
- Tono cercano y tranqui, como un amigo que sabe del tema. Español neutro tuteando: tú, nunca vos (pruebalo, fijate, dime, escribeme, puedes, tienes; nunca probalo, decime, escribime, podés, tenés).
- Nunca presiones para comprar. Frases como "Igual sin apuro, primero pruebalo gratis y fijate si te sirve".
- No digas que eres una IA ni un asistente. No uses frases de bot ("¡Hola! ¿En qué puedo ayudarte?").

QUÉ HACES:
- Respondes dudas sobre la biblioteca con la información de abajo. Si no está, no inventes.
- Te interesa saber a qué se dedica para recomendarle por dónde arrancar. Pregúntalo si todavía no lo sabes, una sola vez.
- Si pide una guía, o dice que no le llegó o no la ve, pásale el link directo: "Aca te dejo la guia, es una plataforma con mas de 35 guias gratis. Pones tu mail, entras y la revisas" y en el segundo mensaje www.forjaia.com . No le pidas el mail ni que escriba otra palabra: se registra solo en la web en un minuto. (Si escribe la palabra exacta de un reel, el sistema ya le manda el link a esa guía, tú no tienes que hacer nada.)
- Antes de cada mensaje de la persona puede venir una nota "[Sistema: ...]" con lo que sabemos de su cuenta. Si dice que ya está registrado, NUNCA le ofrezcas registrarse ni las guias gratis como algo nuevo: ya las tiene. Si quiere una guia, dile que la busque en www.forjaia.com (entra con su mail y le llega un codigo). Si la nota dice que no sabemos si se registró y la charla muestra que ya vio las guias, no le ofrezcas registrarse, preguntale si ya entró a Forja IA.
- El precio NO lo mencionas salvo que la persona lo pregunte. Si lo pregunta, das el precio y los links, y cierras con algo como "Igual sin apuro, primero pruebalo gratis y fijate si te sirve".
- Saluda con "Hola" solo en tu primer mensaje de la charla, después no.

CUÁNDO NO RESPONDES (derivar = true, Juampi contesta a mano):
- Dice que ya pagó, manda un comprobante o tiene un problema con el pago o con el acceso.
- Quiere comprar ya o pide el link para pagar.
- Pregunta por una instalación o servicio a medida para su negocio, o una propuesta comercial.
- Se queja, está enojado, pide reembolso, o es un tema personal o sensible.
- Te pide algo que no está en la información y no puedes responder bien.

INFORMACIÓN DE LA BIBLIOTECA:
- 137 guías paso a paso para usar Claude, de configurarlo desde cero hasta armar sistemas de IA y vendérselos a negocios. Incluye un roadmap completo para vender IA: cuántos mensajes mandar por día, cómo prospectar, la llamada de venta, cómo calcular el retorno y ponerle precio, objeciones y cómo entregar. 222 prompts listos para copiar, skills y conectores. Se suma algo nuevo cada semana.
- Ordenada en 3 partes: Arranca bien (configurar Claude, pedirle bien las cosas, gastar menos), Ponlo a trabajar (tu negocio, contenido y redes, conseguir clientes, skills, agentes), Vende y construye (el sistema para venderle IA a negocios, sistemas por rubro, Claude Code, crear tu app).
- Gratis: registrándose con el mail se abren 35 guías (todas las de los reels, las de gastar menos y el Módulo 1 del sistema para vender IA). Web: www.forjaia.com (la plataforma se llama Forja IA)
- Guías gratis que más piden por los reels: Codex dentro de Claude Code (con el plugin oficial de OpenAI conectas Codex a Claude Code y le pasas tareas o revisiones con comandos /codex, necesitas la CLI de Codex con tu cuenta de ChatGPT), 22 skills de Claude Code, 8 apps clonadas gratis, 5 repos que reemplazan apps pagas, oficina de agentes IA, 4 agentes de WhatsApp para vender, configurar Claude en 10 minutos. Si preguntan cómo hacer algo de estas, explicas en una frase la idea y le pasas el link www.forjaia.com para que vea el paso a paso.
- Palabras de los reels y su guía: MAPA (Graphify y Obsidian para gastar menos en Claude Code), MODELO (qué modelo de Claude usar), TOKEN (MarkItDown), PROYECTO (Proyectos y caché), PLAN (modo plan de Claude Code), CHAT (por qué Claude se vuelve torpe en chats largos), LIVIANO (Claude Code liviano), SUBAGENTE (subagentes), MEDIDOR (medidor de uso y límites), ARCHIVOS (archivos sin desperdiciar tokens), PEDIDO (pedidos que salen a la primera), CONFIG (configurar Claude en 10 minutos), GUIA (Codex dentro de Claude Code), JARVIS, LINKEDIN, INSTAGRAM, YOUTUBE, WEB, CONECTOR, SKILLS, CLON, REPOS, WHATSAPP, OFICINA, CINCO, EDITAR, EQUIPO (35 cosas para instalar en Claude como un equipo), VENDER (7 repos para vender a empresas), ROADMAP (de cero a vender IA en 8 etapas), INMOBILIARIA, EXCEL (analizar planillas), CEREBRO (segundo cerebro del negocio), APP (de idea a app publicada), FABLE (Fable 5.2), GUIAS (todas las guías gratis: le pasas el link de registro), NVIDIA (la API gratis de NVIDIA con más de 100 modelos abiertos). Si alguien escribe solo una de estas palabras, quiere esa guía: el sistema le manda el link directo a esa guía.
- Nunca digas que algo "no se puede" o "no se conecta" si hay una guía sobre eso. Si no estás seguro, deriva.
- Si piden una guía de algo que no aparece en esta información (una marca, una herramienta o un tema que no figura acá), nunca digas que existe ni que está gratis. Deriva para que responda Juampi.
- La mayoría funciona con el plan gratis de Claude. Algunas cosas (Claude Code, tareas programadas) piden plan pago. No hace falta saber programar para las partes 1 y 2.
- Acceso completo (solo si lo preguntan): US$ 24,90 pago único hasta el 30 de noviembre, después US$ 44,90. Incluye todo lo que se sume después. Desde cualquier país con Hotmart: https://pay.hotmart.com/J108404247X?off=8flev061 . En Argentina también Mercado Pago, $ 39.000: https://mpago.la/1Q8PbXK . Después de pagar se registra en la web con el mismo mail y se abre todo.

FORMATO DE SALIDA: solo JSON, sin nada más:
{"derivar": false, "mensajes": ["primer mensaje", "segundo mensaje opcional"]}
Si derivar es true, "mensajes" va vacío.`;


// Pide una guía: le mandamos el link directo. En la web pone su mail y entra en el momento (sin esperar nada en el chat).
export function mensajeGuia(slug) {
  return {
    m1: "Aca te dejo la guia, es una plataforma con mas de 35 guias gratis. Pones tu mail, entras y la revisas",
    m2: slug ? `${SITIO}/guias/${slug}` : `${SITIO}/#gratis`
  };
}

/** «linkedin», «Guía!», «JARVIS 🙏» → la palabra en mayúsculas sin tildes si es una de los reels; si no, null */
export function palabraDeReel(texto) {
  const t = String(texto || "").normalize("NFD").replace(/[\u0301\u0300]/g, "").normalize("NFC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ").trim().toUpperCase();
  // Solo la palabra sola («Linkedin») o «quiero/la/guia + palabra»: «plan pago» o «que modelo uso» siguen yendo a Claude
  const w = t.split(/\s+/).filter((x) => !["QUIERO", "LA", "EL", "GUIA", "DE", "PORFA"].includes(x));
  if (w.length === 0 && /\bGUIA\b/.test(t)) return "GUIA";
  // «GUIAS» (carrusel de la biblioteca): no es una guía puntual → el link de registro con todas las gratis
  if (w.length === 1 && w[0] === "GUIAS") return "GUIAS";
  return w.length === 1 && PALABRAS[w[0]] ? w[0] : null;
}

/** Primer mail que aparezca en el mensaje («mi mail es Ana@Gmail.com») */
export function mailEn(texto) {
  const m = String(texto || "").match(/[^\s@<>(),;:"']+@[^\s@<>(),;:"']+\.[a-z]{2,}/i);
  return m ? m[0].replace(/[.]+$/, "").toLowerCase() : null;
}

/** La guía que pidió: la última palabra de reel que escribió en la charla (o null → lista de guías de los reels) */
export function guiaPedida(textos) {
  for (const t of [...textos].reverse()) { const p = palabraDeReel(t); if (p) return PALABRAS[p] || null; }
  return null;
}

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

/** Busca su registro por el mail que trae ManyChat o por mails que escribió antes en el chat. null si no lo encontramos. */
async function cuentaDelContacto(c, contacto, db) {
  try {
    const mails = new Set();
    const m0 = mailEn(String(c.email || "")); if (m0) mails.add(m0);
    const filas = await supabase(`chat_mensajes?contacto=eq.${encodeURIComponent(contacto)}&rol=eq.usuario&texto=like.*%40*&select=texto&limit=20`, { method: "GET" }, db);
    (filas || []).forEach((f) => { const m = mailEn(f.texto); if (m) mails.add(m); });
    if (!mails.size) return null;
    const lista = [...mails].map((m) => `"${m.replace(/"/g, "")}"`).join(",");
    const regs = await supabase(`registros?email=in.(${encodeURIComponent(lista)})&select=email,nombre,compro&limit=5`, { method: "GET" }, db);
    if (!regs || !regs.length) return null;
    return regs.find((r) => r.compro) || regs[0];
  } catch (e) { console.error("No se pudo ver la cuenta del contacto:", e.message); return null; }
}

export function notaDeCuenta(cuenta) {
  if (!cuenta) return "[Sistema: no sabemos si ya se registro en la web.] ";
  return cuenta.compro
    ? "[Sistema: ya esta registrado y COMPRO el acceso completo, tiene todo abierto. No le ofrezcas registrarse ni comprar.] "
    : "[Sistema: ya esta registrado, tiene abiertas las 35 guias gratis. No le ofrezcas registrarse ni las guias gratis como algo nuevo.] ";
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

  // ¿Ya está registrado? Por el mail que manda ManyChat o por un mail que haya escrito antes en este chat
  const cuenta = db ? await cuentaDelContacto(c, contacto, db) : null;

  // Ya registrado y escribe la palabra de un reel: le mandamos el link directo a esa guía, sin pedirle el mail otra vez
  const palabra = palabraDeReel(texto);
  if (palabra && cuenta && process.env.ACCESS_SECRET) {
    try {
      const guia = guiaPedida([texto]);
      const t = await crearEnlace(cuenta.email, cuenta.nombre || nombre, guia, process.env.ACCESS_SECRET);
      const link = `${SITIO}/api/acceso?t=${encodeURIComponent(t)}${guia ? "" : "&a=reels"}`;
      const m1 = guia ? "Ahi va, toca aca y entras directo a la guia" : "Ahi va, toca aca y en De mis reels buscas la palabra del video";
      await guardar("agente", `${m1}\n${link}`);
      return responder({ ok: true, derivar: "no", m1, m2: link });
    } catch (e) { console.error("No se pudo armar el link directo:", e.message); }
  }

  // Escribió la palabra del reel o del anuncio: le mandamos el link directo a esa guía, sin pasar por Claude
  if (palabra) {
    const { m1, m2 } = mensajeGuia(guiaPedida([texto]));
    await guardar("agente", `${m1}\n${m2}`);
    return responder({ ok: true, derivar: "no", m1, m2 });
  }

  // Mandó su mail: lo registramos (origen manychat) y le mandamos el link mágico a la guía que pidió
  const mail = mailEn(texto);
  const secreto = process.env.ACCESS_SECRET;
  if (mail && db && secreto && !derivarPorReglas(texto)) {
    const fila = limpiarRegistro({ email: mail, nombre });
    if (fila) {
      try {
        fila.origen = "manychat";
        const guia = guiaPedida(historial.filter((f) => f.rol === "usuario").map((f) => f.texto));
        if (guia) fila.utm_content = guia;
        await guardarEnSupabase(fila, db);
        const t = await crearEnlace(fila.email, fila.nombre || "", guia, secreto);
        const link = `${SITIO}/api/acceso?t=${encodeURIComponent(t)}${guia ? "" : "&a=reels"}`;
        const m1 = guia ? "Listo, ya te quedo todo abierto, toca aca y entras directo a la guia" : "Listo, ya te quedo todo abierto, toca aca y en De mis reels buscas la palabra del video que viste";
        await guardar("agente", `${m1}\n${link}`);
        return responder({ ok: true, derivar: "no", m1, m2: link });
      } catch (e) { console.error("No se pudo registrar el mail del chat:", e.message); }
    }
  }

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
  const actual = `${notaDeCuenta(cuenta)}${nombre ? `(Se llama ${nombre}.) ` : ""}${texto}`;
  if (turnos.length && turnos[turnos.length - 1].role === "user") turnos[turnos.length - 1].content += "\n" + actual;
  else turnos.push({ role: "user", content: actual });

  let salida = { derivar: true, mensajes: [] };
  let motivo = "modelo";
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODELO, max_tokens: 1200, thinking: { type: "disabled" }, system: INSTRUCCIONES, messages: turnos }),
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) throw new Error(`Claude ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    const crudo = (j.content || []).map((b) => b.text || "").join("");
    salida = leerSalida(crudo);
    if (salida.derivar) motivo = `modelo (${j.stop_reason}; ${(j.content || []).map((b) => b.type).join(",")}): ${crudo.slice(0, 300)}`;
  } catch (e) {
    console.error("Falló Claude:", e.message);
    motivo = `error: ${e.message}`.slice(0, 300);
  }

  if (salida.derivar) {
    await guardar("derivado", motivo);
    return responder({ ok: true, derivar: "si" });
  }
  await guardar("agente", salida.mensajes.join("\n"));
  return responder({ ok: true, derivar: "no", m1: salida.mensajes[0], m2: salida.mensajes[1] || "" });
}
