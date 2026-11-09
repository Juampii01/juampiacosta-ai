// Canjea el link mágico del chat (api/manychat.js) por la sesión. GET /api/acceso?t=<token>
// Deja la cookie de nivel «gratis» (o «pago», si ese email ya compró) y lleva a la guía que pidió.
// Con &a=<slug> va a otra guía gratis; con &a=reels, a la lista de guías de los reels. Si el link no sirve o venció, manda al registro normal.

import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_MAX_AGE, AVISO_COOKIE_NAME, crearCookie, leerCookie, leerEnlace, nivelDe, valorCookie } from "../lib/acceso.js";
import { yaCompro } from "./registro.js";
import { guiaGratis } from "./manychat.js";

export default async function handler(req, res) {
  const ir = (a) => { res.statusCode = 303; res.setHeader("Location", a); res.setHeader("Cache-Control", "no-store"); res.end(); };
  const { ACCESS_SECRET: secreto, SUPABASE_URL: url } = process.env;
  const clave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const q = new URL(req.url, "http://x").searchParams;
  const p = await leerEnlace(q.get("t"), secreto);
  if (!p) { const g = guiaGratis(q.get("a")); return ir(g ? `/?volver=/guias/${g}#gratis` : "/#gratis"); }
  // «a» elige otra guía gratis (un mismo link sirve para varios botones en ManyChat: {{link}}&a=<slug>)
  // &a=reels lleva a «De mis reels» de la biblioteca: todas las guías de los reels con su palabra
  const reels = q.get("a") === "reels";
  const g = reels ? null : guiaGratis(q.get("a")) || p.g;
  const destino = reels ? "/recursos#posts" : g ? `/guias/${g}` : "/recursos";

  const actual = nivelDe(await leerCookie(valorCookie(req.headers.cookie, ACCESS_COOKIE_NAME), secreto));
  if (actual === "pago") return ir(destino);

  let pago = false;
  if (url && clave) { try { pago = await yaCompro(p.m, { url, clave }); } catch (e) { console.error("No se pudo ver si compró:", e.message); } }
  const nivel = pago ? "pago" : "gratis";
  const cookie = await crearCookie(p.m, p.n || "", secreto, nivel);
  res.setHeader("Set-Cookie", [
    `${ACCESS_COOKIE_NAME}=${encodeURIComponent(cookie)}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
    `${AVISO_COOKIE_NAME}=${nivel}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax`,
    `jpa_nombre=${encodeURIComponent((p.n || "").split(" ")[0].slice(0, 30))}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax`
  ]);
  return ir(destino);
}
