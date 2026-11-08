// Preguntas del formulario de bienvenida (web/bienvenida.js) y su validación en el servidor (api/perfil.js).
// Si cambiás una opción acá, cambiala también en web/bienvenida.js: lo que no esté en esta lista no se guarda.

export const OPCIONES = {
  situacion: ["Tengo un negocio", "Trabajo en una empresa", "Freelancer o agencia", "Quiero vender IA a empresas", "Estudiante", "Otro"],
  nivel: ["Nunca usé IA", "Uso ChatGPT o Claude a veces", "La uso todos los días", "Ya armo automatizaciones o agentes"],
  objetivo: ["Ahorrar tiempo en mi negocio", "Vender servicios de IA", "Conseguir trabajo con IA", "Aprender", "Que me lo instalen en mi negocio"],
  inversion: ["Sí, ahora", "En los próximos meses", "Por ahora solo lo gratis"],
  pais: ["Argentina", "México", "Colombia", "Chile", "Perú", "Uruguay", "Ecuador", "Venezuela", "España", "Estados Unidos", "Otro"]
};
const OBLIGATORIOS = [...Object.keys(OPCIONES), "whatsapp"];

const texto = (v, max) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);

/** WhatsApp en formato internacional (+ y 8 a 15 dígitos) o null */
export function whatsappValido(v) {
  const limpio = String(v ?? "").replace(/[\s().-]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(limpio) ? limpio : null;
}

/** Solo los campos válidos que vinieron (se guarda de a partes). completo = todos los obligatorios y el aviso de fin. */
export function limpiarPerfil(cuerpo) {
  const fila = {};
  for (const [k, lista] of Object.entries(OPCIONES)) {
    const v = texto(cuerpo?.[k], 60);
    if (lista.includes(v)) fila[k] = v;
  }
  const w = whatsappValido(cuerpo?.whatsapp);
  if (w) fila.whatsapp = w;
  if (cuerpo && "rubro" in cuerpo) fila.rubro = texto(cuerpo.rubro, 80) || null;
  const completo = cuerpo?.completo === true && OBLIGATORIOS.every((k) => fila[k]);
  return { fila, completo };
}
