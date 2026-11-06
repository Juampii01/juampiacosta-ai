// Secciones de la biblioteca y cuántos recursos tiene cada una (el menú y el contador de inicio leen esto).
var SECCIONES = [
  { id: "guias-web", nombre: "Guías", n: GUIAS_WEB.length },
  { id: "prompts", nombre: "Prompts", n: PROMPTS.length },
  { id: "skills", nombre: "Skills", n: HERRAMIENTAS.filter(function (h) { return h.cat === "Skills"; }).length },
  { id: "mcp", nombre: "MCP", n: HERRAMIENTAS.filter(function (h) { return h.cat === "MCP"; }).length },
  { id: "herramientas", nombre: "Herramientas", n: HERRAMIENTAS.filter(function (h) { return h.cat === "Herramientas"; }).length },
  { id: "posts", nombre: "De mis reels", n: GUIAS_WEB.filter(function (g) { return g.post; }).length }
];
