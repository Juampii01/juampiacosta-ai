// Quién abre qué. La cookie firmada la ponen api/entrar.js (nivel «pago», con la clave de compra) y api/registro.js
// (nivel «gratis», con el email).
//   Sin cookie: solo la página de inicio.
//   Gratis: la biblioteca, las guías de los reels y el Módulo 1; el resto de las guías lleva a «Comprar».
//           Los prompts y las herramientas se ven sin su contenido (versiones «-vista»).
//   Pago: todo.
// contenido/, supabase/, lib/, tests/, build.py y web/guias-web.json (el texto de todas las guías) no se sirven nunca.

import { next, rewrite } from "@vercel/functions";
import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_MAX_AGE, AVISO_COOKIE_NAME, leerCookie, nivelDe, valorCookie } from "./lib/acceso.js";
import { GUIAS_GRATIS } from "./lib/gratis.js";

export const config = {
  matcher: [
    "/", "/index.html",
    "/recursos", "/recursos.html",
    "/guias/:path*",
    "/web/guias-web.js", "/web/guias-web.json", "/web/prompts.js", "/web/herramientas.js",
    "/web/prompts-vista.js", "/web/herramientas-vista.js",
    "/contenido/:path*", "/supabase/:path*", "/build.py", "/lib/:path*", "/tests/:path*"
  ]
};

export function decidir(ruta, nivel) {
  if (/^\/(contenido|supabase|lib|tests)\/|^\/build\.py$|^\/web\/guias-web\.json$/.test(ruta)) return { no: true };
  if (ruta === "/" || ruta === "/index.html") return { pasa: true };
  if (!nivel) return ruta.startsWith("/web/") ? { prohibido: true } : { a: "/#entrar" };
  if (nivel === "pago") return { pasa: true };
  // Gratis
  const guia = ruta.match(/^\/guias\/([a-z0-9-]+?)(?:\.html)?$/);
  if (guia) return GUIAS_GRATIS.has(guia[1]) ? { pasa: true } : { a: "/?bloqueada=" + guia[1] + "#precio" };
  if (ruta === "/web/prompts.js") return { reescribir: "/web/prompts-vista.js" };
  if (ruta === "/web/herramientas.js") return { reescribir: "/web/herramientas-vista.js" };
  return { pasa: true };
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const nivel = nivelDe(await leerCookie(valorCookie(request.headers.get("cookie"), ACCESS_COOKIE_NAME), process.env.ACCESS_SECRET));
  const d = decidir(url.pathname, nivel);
  if (d.no) return new Response("No encontrado", { status: 404 });
  if (d.prohibido) return new Response("Necesitás acceso", { status: 401 });
  if (d.a) return Response.redirect(new URL(d.a, url), 307);
  if (d.reescribir) return rewrite(new URL(d.reescribir, url));
  // Mantiene al día el aviso legible del nivel (por ejemplo, si alguien pasó de gratis a pago)
  if (nivel) return next({ headers: { "Set-Cookie": `${AVISO_COOKIE_NAME}=${nivel}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax` } });
  return next();
}
