// Rutas de aprendizaje: caminos en orden, de fácil a difícil, con las guías de la biblioteca.
// Cada paso es el slug de una guía (guias/<slug>.html).
var EMPIEZA = ["configura-claude-en-10-minutos", "las-formas-de-usar-claude", "5-cosas-para-montar-con-claude-el-finde"];

var RUTAS = [
  {
    id: "empezar", color: "azul", t: "Empezá con Claude",
    d: "De cero a usarlo todos los días: configurarlo, elegir el modelo, pedirle bien y que tu plan rinda.",
    pasos: ["configura-claude-en-10-minutos", "las-formas-de-usar-claude", "que-modelo-de-claude-uso", "formula-para-pedirle-bien-a-claude",
            "proyectos-de-claude-para-tu-negocio", "errores-que-agotan-tu-plan-de-claude", "por-que-claude-se-vuelve-torpe-en-chats-largos"]
  },
  {
    id: "conectar", color: "azul", t: "Conectá Claude a tus apps",
    d: "Mail, calendario, archivos y la web: que Claude trabaje con tus cosas de verdad.",
    pasos: ["conectores-claude-dentro-de-tus-apps", "5-cosas-para-montar-con-claude-el-finde", "4-conectores-que-claude-deberia-tener",
            "markitdown-para-ahorrar-tokens", "como-elegir-y-revisar-un-mcp-antes-de-instalarlo", "mcp-oficiales-para-tu-negocio"]
  },
  {
    id: "skills", color: "azul", t: "Skills: enseñale a Claude tu forma de trabajar",
    d: "Qué es una skill, cómo armar la tuya y las que conviene tener en un negocio.",
    pasos: ["que-es-una-skill-y-como-crear-la-tuya", "convertir-una-tarea-manual-en-skill", "skills-globales-o-por-proyecto",
            "skill-de-tu-marca", "skill-de-presupuestos-para-tu-negocio", "skill-para-responder-clientes", "instalar-skills-de-github", "plugins-de-claude-desde-cero"]
  },
  {
    id: "claude-code", color: "azul", t: "Claude Code a fondo",
    d: "Sistemas que corren en tu compu: instalarlo sin miedo, planificar, trabajar con subagentes y dejar tareas programadas.",
    pasos: ["claude-code-de-cero-sin-miedo", "comandos-de-claude-code-de-todos-los-dias", "modo-plan-de-claude-code", "claude-md-la-memoria-del-proyecto",
            "permisos-y-modo-automatico-con-cuidado", "subagentes-en-claude-code", "tareas-programadas-en-claude-code", "claude-code-desde-el-celular-y-la-web",
            "codex-dentro-de-claude-code", "tu-propio-jarvis-con-claude"]
  },
  {
    id: "negocio", color: "azul", t: "IA en tu negocio",
    d: "Qué automatizar primero, cómo armarlo y cuánto cobrar si lo hacés para otros.",
    pasos: ["cinco-preguntas-antes-de-meter-ia-en-tu-negocio", "el-plano-de-un-negocio-con-ia", "segundo-cerebro-de-tu-negocio",
            "panel-de-metricas-de-tu-negocio-con-claude", "de-donde-vienen-tus-clientes", "make-zapier-o-n8n-cual-elegir",
            "agente-de-whatsapp-que-atiende-y-agenda", "cuanto-cobrar-por-automatizar-con-ia"]
  },
  {
    id: "contenido", color: "azul", t: "Contenido y ventas con Claude",
    d: "De la idea al reel, del comentario al DM y del DM a la propuesta.",
    pasos: ["treinta-dias-de-ideas-de-contenido", "guiones-de-reels-con-tu-voz", "carruseles-con-claude-paso-a-paso", "claude-te-edita-el-reel",
            "palabra-clave-en-comentarios-con-manychat", "responder-dms-y-calificar-prospectos", "propuesta-comercial-con-claude",
            "seguimiento-de-prospectos-sin-ser-pesado", "landing-en-tres-preguntas", "linkedin-agent-11-skills"]
  }
];
