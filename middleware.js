// La biblioteca es paga: sin la cookie de acceso firmada (la pone api/entrar.js) no se entra.
// Quien llega a la biblioteca, a una guía o a los datos de las guías sin cookie va a la página de inicio, a «Entrar».
// contenido/ (el texto fuente de las guías) no se sirve nunca.

import { next } from "@vercel/functions";
import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_MAX_AGE, AVISO_COOKIE_NAME, leerCookie, valorCookie } from "./lib/acceso.js";

export const config = {
  matcher: [
    "/", "/index.html",
    "/recursos", "/recursos.html",
    "/guias/:path*",
    "/web/guias-web.js", "/web/guias-web.json", "/web/prompts.js", "/web/herramientas.js",
    "/contenido/:path*", "/build.py", "/lib/:path*", "/tests/:path*"
  ]
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const privado = /^\/(contenido|lib|tests)\/|^\/build\.py$/;
  if (privado.test(url.pathname)) return new Response("No encontrado", { status: 404 });

  const acceso = await leerCookie(valorCookie(request.headers.get("cookie"), ACCESS_COOKIE_NAME), process.env.ACCESS_SECRET);

  if (url.pathname === "/" || url.pathname === "/index.html") {
    if (!acceso) return next();
    return next({ headers: { "Set-Cookie": `${AVISO_COOKIE_NAME}=1; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE}; Secure; SameSite=Lax` } });
  }

  if (acceso) return next();
  if (url.pathname.startsWith("/web/")) return new Response("Necesitás acceso", { status: 401 });
  return Response.redirect(new URL("/#entrar", url), 307);
}
