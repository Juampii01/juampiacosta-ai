// POST /api/salir -> borra la sesión de este navegador
import { ACCESS_COOKIE_NAME, AVISO_COOKIE_NAME } from "../lib/acceso.js";

export default function handler(req, res) {
  if (req.method !== "POST") { res.statusCode = 405; res.setHeader("Allow", "POST"); return res.end(); }
  res.setHeader("Set-Cookie", [ACCESS_COOKIE_NAME, AVISO_COOKIE_NAME, "jpa_nombre", "jpa_rol", "jpa_perfil"].map((n) => `${n}=; Path=/; Max-Age=0; Secure; SameSite=Lax`));
  res.statusCode = 204;
  res.end();
}
