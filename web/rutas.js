// Rutas de aprendizaje: caminos en orden, de fácil a difícil, con las guías de la biblioteca.
// Cada paso es el slug de una guía (guias/<slug>.html).
var EMPIEZA = ["5-cosas-para-montar-con-claude-el-finde", "4-conectores-que-claude-deberia-tener", "codex-dentro-de-claude-code"];

var RUTAS = [
  {
    id: "empezar", color: "azul", t: "Empezá con Claude",
    d: "Lo primero que conviene armar: tu día ordenado, tus herramientas conectadas y archivos que Claude lee sin gastar de más.",
    pasos: ["5-cosas-para-montar-con-claude-el-finde", "4-conectores-que-claude-deberia-tener", "markitdown-para-ahorrar-tokens"]
  },
  {
    id: "claude-code", color: "azul", t: "Claude Code a fondo",
    d: "Sistemas que corren en tu compu: Codex como ayudante, tu propio Jarvis por voz y edición de video automática.",
    pasos: ["codex-dentro-de-claude-code", "tu-propio-jarvis-con-claude", "claude-te-edita-el-reel"]
  },
  {
    id: "redes", color: "azul", t: "Crecé en redes con Claude",
    d: "Contenido y cuentas: LinkedIn en piloto asistido y reels editados solos.",
    pasos: ["linkedin-agent-11-skills", "claude-te-edita-el-reel"]
  }
];
