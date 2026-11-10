// Acceso a Supabase por su API REST, siempre desde el servidor con la clave secreta.
// Variables en Vercel: SUPABASE_URL y SUPABASE_SECRET_KEY (o la vieja SUPABASE_SERVICE_ROLE_KEY).

export function config() {
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && clave ? { url: url.replace(/\/$/, ""), clave } : null;
}

/** Llama a /rest/v1/<ruta>. Devuelve el JSON (o null si no hay cuerpo). Lanza si Supabase responde con error. */
export async function sb(ruta, { method = "GET", body, prefer, fetchImpl = fetch, cfg = config() } = {}) {
  if (!cfg) throw new Error("Faltan SUPABASE_URL o SUPABASE_SECRET_KEY");
  const h = { apikey: cfg.clave, "Content-Type": "application/json" };
  if (cfg.clave.startsWith("eyJ")) h.Authorization = `Bearer ${cfg.clave}`;
  if (prefer) h.Prefer = prefer;
  const r = await fetchImpl(`${cfg.url}/rest/v1/${ruta}`, {
    method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(6000)
  });
  if (!r.ok) throw new Error(`Supabase ${method} ${ruta.split("?")[0]} respondió ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const texto = await r.text();
  return texto ? JSON.parse(texto) : null;
}

export const enc = encodeURIComponent;

/** Lee el cuerpo como JSON o como formulario, con un tope de tamaño */
export async function leerCuerpo(req, max = 8000) {
  if (req.body && typeof req.body === "object") return req.body;
  let texto = typeof req.body === "string" ? req.body : "";
  if (!texto) for await (const trozo of req) { texto += trozo; if (texto.length > max) break; }
  texto = texto.slice(0, max);
  try { return JSON.parse(texto); } catch { return Object.fromEntries(new URLSearchParams(texto)); }
}

export function json(res, codigo, datos) {
  res.statusCode = codigo;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(datos));
}

export function ipDe(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "sin-ip";
}
