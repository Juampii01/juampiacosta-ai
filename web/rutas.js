// Rutas de aprendizaje: caminos en orden, de fácil a difícil, con las guías de la biblioteca.
// Cada paso es el slug de una guía (guias/<slug>.html).
var EMPIEZA = ["configura-claude-en-10-minutos", "las-formas-de-usar-claude", "5-cosas-para-montar-con-claude-el-finde"];

var RUTAS = [
  {
    id: "empezar", color: "azul", t: "Empieza con Claude",
    d: "De cero a usarlo todos los días: configurarlo, elegir el modelo, pedirle bien y que tu plan rinda.",
    pasos: ["configura-claude-en-10-minutos", "las-formas-de-usar-claude", "que-modelo-de-claude-uso", "formula-para-pedirle-bien-a-claude",
            "proyectos-de-claude-para-tu-negocio", "errores-que-agotan-tu-plan-de-claude", "por-que-claude-se-vuelve-torpe-en-chats-largos"]
  },
  {
    id: "conectar", color: "azul", t: "Conecta Claude a tus apps",
    d: "Mail, calendario, archivos y la web: que Claude trabaje con tus cosas de verdad.",
    pasos: ["conectores-claude-dentro-de-tus-apps", "5-cosas-para-montar-con-claude-el-finde", "4-conectores-que-claude-deberia-tener",
            "markitdown-para-ahorrar-tokens", "como-elegir-y-revisar-un-mcp-antes-de-instalarlo", "mcp-oficiales-para-tu-negocio"]
  },
  {
    id: "skills", color: "azul", t: "Skills: enséñale a Claude tu forma de trabajar",
    d: "Qué es una skill, cómo armar la tuya y las que conviene tener en un negocio.",
    pasos: ["que-es-una-skill-y-como-crear-la-tuya", "convertir-una-tarea-manual-en-skill", "skills-globales-o-por-proyecto",
            "skill-de-tu-marca", "skill-de-presupuestos-para-tu-negocio", "skill-para-responder-clientes", "instalar-skills-de-github", "plugins-de-claude-desde-cero"]
  },
  {
    id: "negocio", color: "azul", t: "IA en tu negocio",
    d: "Qué automatizar primero, cómo armarlo y cuánto cobrar si lo haces para otros.",
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
  },
  {
    id: "agentes", color: "azul", t: "Arma tus propios agentes",
    d: "Qué es un agente de verdad, cómo diseñarlo, los que más sirven en un negocio y cómo usarlos con cuidado.",
    pasos: ["que-es-un-agente-de-ia-de-verdad", "disena-tu-agente-en-una-hoja", "agente-de-investigacion", "agente-de-atencion-con-base-de-conocimiento",
            "agente-que-califica-prospectos", "agente-de-contenido-semanal", "equipos-de-agentes-cuando-conviene", "seguridad-de-agentes", "agentes-con-el-claude-agent-sdk"]
  },
  {
    id: "claude-code", color: "azul", t: "Claude Code a fondo",
    d: "Sistemas que corren en tu computadora: instalarlo sin miedo, planificar, trabajar con subagentes y dejar tareas programadas.",
    pasos: ["claude-code-de-cero-sin-miedo", "comandos-de-claude-code-de-todos-los-dias", "modo-plan-de-claude-code", "claude-md-la-memoria-del-proyecto",
            "permisos-y-modo-automatico-con-cuidado", "subagentes-en-claude-code", "tareas-programadas-en-claude-code", "claude-code-desde-el-celular-y-la-web",
            "codex-dentro-de-claude-code", "tu-propio-jarvis-con-claude"]
  },
  {
    id: "desarrollo", color: "azul", t: "Desarrolla tu app con Claude Code",
    d: "De la idea a una app publicada, con base de datos, usuarios, cobros y lo que necesita para usarse de verdad.",
    pasos: ["escribi-la-especificacion-antes-de-programar", "de-idea-a-app-publicada-con-claude-code", "git-y-github-para-no-perder-nada",
            "base-de-datos-con-supabase-y-claude-code", "usuarios-y-login-sin-romperte-la-cabeza", "cobrar-dentro-de-tu-app",
            "publicar-tu-app-y-conectar-tu-dominio", "de-demo-a-producto", "mantener-una-app-hecha-con-ia"]
  },
  {
    id: "vender", color: "azul", t: "Vende servicios de IA",
    d: "Qué armar para otros negocios, con qué herramientas y cómo presentarlo y cobrarlo.",
    pasos: ["el-plano-de-un-negocio-con-ia", "7-repos-para-vender-a-empresas", "4-agentes-whatsapp-para-vender", "oficina-de-agentes-ia",
            "cuanto-cobrar-por-automatizar-con-ia", "propuesta-comercial-con-claude", "seguimiento-de-prospectos-sin-ser-pesado"]
  },
  {
    id: "roadmap", color: "azul", t: "El roadmap: de cero a tu primer cliente",
    d: "El camino completo para vender IA a negocios: los números, cómo prospectar, la llamada de venta, el precio y la entrega.",
    pasos: ["roadmap-de-cero-a-vender-ia", "tu-cadena-de-numeros", "el-tablero-diario-de-prospeccion", "elegir-solucion-y-rubros-para-empezar",
            "los-metodos-para-conseguir-clientes", "la-llamada-en-frio-que-consigue-la-reunion", "secuencia-de-seguimiento-de-14-dias",
            "la-llamada-de-venta-en-cuatro-fases", "calcula-el-retorno-de-tu-propuesta", "objeciones-y-como-responderlas",
            "precios-de-referencia-y-formas-de-pago", "entregar-un-agente-de-punta-a-punta", "la-rutina-del-que-vende-ia"]
  },
  {
    id: "sistema-base", color: "azul", t: "El sistema base para vender IA a negocios",
    d: "El método completo, módulo por módulo: la oferta, a quién venderle, el primer mensaje, el diagnóstico, la propuesta, la instalación, la entrega y el mantenimiento.",
    pasos: ["sistema-base-modulo-1-la-oferta", "sistema-base-modulo-2-elegir-a-quien-venderle", "sistema-base-modulo-3-el-primer-mensaje",
            "sistema-base-modulo-4-la-llamada-de-diagnostico", "sistema-base-modulo-5-propuesta-y-precio", "sistema-base-modulo-6-la-instalacion-paso-a-paso",
            "sistema-base-modulo-7-entrega-y-capacitacion", "sistema-base-modulo-8-mantenimiento-mensual", "sistema-base-modulo-9-contrato-y-cuidados"]
  }
];
