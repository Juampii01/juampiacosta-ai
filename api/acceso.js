// Canjea el link mágico del chat (api/manychat.js) por la sesión. GET /api/acceso?t=<token>
// Deja la cookie de nivel «gratis» y lleva a la guía que pidió (el acceso completo se activa con el código del mail).
// Con &a=<slug> va a otra guía gratis; con &a=reels, a la lista de guías de los reels. Si el link no sirve o venció, manda al registro normal.

import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_MAX_AGE, AVISO_COOKIE_NAME, crearCookie, leerCookie, leerEnlace, nivelDe, valorCookie } from "../lib/acceso.js";
import { guiaGratis } from "./manychat.js";
import { HOST_SITIO, SITIO } from "../lib/sitio.js";

export default async function handler(req, res) {
  const ir = (a) => { res.statusCode = 303; res.setHeader("Location", a); res.setHeader("Cache-Control", "no-store"); res.end(); };
  const { ACCESS_SECRET: secreto, SUPABASE_URL: url } = process.env;
  const clave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Links viejos (juampiacosta-ai.vercel.app/api/acceso?t=…): se canjean en el dominio nuevo para que la sesión quede ahí
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  if (host === "juampiacosta-ai.vercel.app" && HOST_SITIO !== host) return ir(SITIO + req.url);
  const q = new URL(req.url, "http://x").searchParams;
  const p = await leerEnlace(q.get("t"), secreto);
  if (!p) { const g = guiaGratis(q.get("a")); return ir(g ? `/?volver=/guias/${g}#gratis` : "/#gratis"); }
  // «a» elige otra guía gratis (un mismo link sirve para varios botones en ManyChat: {{link}}&a=<slug>)
  // &a=reels lleva a «De mis reels» de la biblioteca: todas las guías de los reels con su palabra
  const reels = q.get("a") === "reels";
  const g = reels ? null : guiaGratis(q.get("a")) || p.g;
  const destino = reels ? "/biblioteca#posts" : g ? `/guias/${g}` : "/recursos";

  const actual = nivelDe(await leerCookie(valorCookie(req.headers.cookie, ACCESS_COOKIE_NAME), secreto));
  if (actual === "pago") return ir(destino);

  // El link del chat solo prueba que escribió por Instagram, no que el email es suyo: abre el plan gratis.
  // El acceso completo se activa entrando con el código del mail.
  const nivel = "gratis";
  const cookie = await crearCookie(p.m, p.n || "", secreto, nivel);
  let perfil = false;
  try {
    if (url && clave) {
      const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/registros?email=eq.${encodeURIComponent(p.m)}&select=perfil_completo`, { headers: { apikey: clave, ...(clave.startsWith("eyJ") ? { Authorization: `Bearer ${clave}` } : {}) }, signal: AbortSignal.timeout(4000) });
      perfil = r.ok && !!((await r.json())[0] || {}).perfil_completo;
    }
  } catch (e) { console.error("acceso: no se pudo leer el perfil:", e.message); }
  res.setHeader("Set-Cookie", [
    ...(perfil ? [`jpa_perfil=1; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax`] : []),
    `${ACCESS_COOKIE_NAME}=${encodeURIComponent(cookie)}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
    `${AVISO_COOKIE_NAME}=${nivel}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax`,
    `jpa_nombre=${encodeURIComponent((p.n || "").split(" ")[0].slice(0, 30))}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax`
  ]);
  return ir(destino);
}
