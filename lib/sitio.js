// Dirección oficial de la plataforma. Los links que salen por DM y los mails apuntan acá,
// y el dominio viejo (juampiacosta-ai.vercel.app) redirige a esta (vercel.json + api/acceso.js).
export const SITIO = (process.env.SITIO_URL || "https://www.forjaia.com").replace(/\/$/, "");
export const HOST_SITIO = new URL(SITIO).host;
