// Quién abre qué. La cookie firmada la ponen api/entrar.js (nivel «pago», con la clave de compra) y api/registro.js
// (nivel «gratis», con el email).
//   Sin cookie: solo la página de inicio y /entrar (email + código).
//   Gratis: la biblioteca, las guías de los reels y el Módulo 1; el resto de las guías lleva a «Comprar».
//           Los prompts y las herramientas se ven sin su contenido (versiones «-vista»).
//   Pago: todo.
// contenido/, supabase/, lib/, tests/, build.py y web/guias-web.json (el texto de todas las guías) no se sirven nunca.

import { next, rewrite } from "@vercel/functions";
import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_MAX_AGE, AVISO_COOKIE_NAME, leerCookie, nivelDe, valorCookie } from "./lib/acceso.js";
import { GUIAS_GRATIS } from "./lib/gratis.js";
import { esAdmin } from "./lib/sesion.js";

export const config = {
  matcher: [
    "/", "/index.html",
    "/recursos", "/recursos.html",
    "/biblioteca", "/biblioteca.html", "/sistemas", "/sistemas.html", "/comunidad", "/comunidad.html",
    "/cuenta", "/cuenta.html", "/maestro", "/maestro.html", "/panel", "/panel.html",
    "/guias/:path*",
    "/web/guias-web.js", "/web/guias-web.json", "/web/prompts.js", "/web/herramientas.js",
    "/web/prompts-vista.js", "/web/herramientas-vista.js",
    "/contenido/:path*", "/supabase/:path*", "/build.py", "/lib/:path*", "/tests/:path*"
  ]
};

const PRIVADAS = /^\/(recursos|biblioteca|sistemas|comunidad|cuenta|maestro|panel)(\.html)?$/;

export function decidir(ruta, nivel, admin = false) {
  if (/^\/(contenido|supabase|lib|tests)\/|^\/build\.py$|^\/web\/guias-web\.json$/.test(ruta)) return { no: true };
  if (ruta === "/" || ruta === "/index.html") return { pasa: true };
  const guia = ruta.match(/^\/guias\/([a-z0-9-]+?)(?:\.html)?$/);
  // Sin sesión: si la guía es gratis (por ejemplo, la que se manda por una palabra clave), registro y de vuelta a esa guía
  if (!nivel) {
    if (ruta.startsWith("/web/")) return { prohibido: true };
    if (guia && GUIAS_GRATIS.has(guia[1])) return { a: "/?volver=/guias/" + guia[1] + "#gratis" };
    const pagina = ruta.match(PRIVADAS);
    return { a: pagina && pagina[1] !== "recursos" ? "/entrar?volver=/" + pagina[1] : "/entrar" };
  }
  // El panel es solo del equipo (ADMINS en Vercel)
  if (/^\/panel(\.html)?$/.test(ruta) && !admin) return { a: "/recursos" };
  if (nivel === "pago") return { pasa: true };
  // Gratis
  if (guia) return GUIAS_GRATIS.has(guia[1]) ? { pasa: true } : { a: "/?bloqueada=" + guia[1] + "#precio" };
  if (ruta === "/web/prompts.js") return { reescribir: "/web/prompts-vista.js" };
  if (ruta === "/web/herramientas.js") return { reescribir: "/web/herramientas-vista.js" };
  return { pasa: true };
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const p = await leerCookie(valorCookie(request.headers.get("cookie"), ACCESS_COOKIE_NAME), process.env.ACCESS_SECRET);
  const nivel = nivelDe(p);
  const d = decidir(url.pathname, nivel, !!(p && esAdmin(p.m)));
  if (d.no) return new Response("No encontrado", { status: 404 });
  if (d.prohibido) return new Response("Necesitás acceso", { status: 401 });
  if (d.a) return Response.redirect(new URL(d.a, url), 307);
  if (d.reescribir) return rewrite(new URL(d.reescribir, url));
  // Mantiene al día el aviso legible del nivel (por ejemplo, si alguien pasó de gratis a pago)
  if (nivel) return next({ headers: { "Set-Cookie": `${AVISO_COOKIE_NAME}=${nivel}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax` } });
  return next();
}
