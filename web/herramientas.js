// Skills, MCP y herramientas. Comandos sacados de la documentación oficial de cada una.
// cat: "Skills" | "MCP" | "Herramientas". estrellas y licencia son opcionales.
var HERRAMIENTAS = [
  {
    cat: "Skills", tipo: "Pack de skills", t: "LinkedIn Agent: 11 skills",
    d: "Posts con 21 fórmulas de ganchos, comentarios, respuestas ordenadas, nota a tu perfil, plan semanal, humanizador y detector de IA.",
    para: "Llevar tu LinkedIn con Claude sin que publique nada por vos.",
    cmds: [{ donde: "Descarga", c: "https://github.com/Juampii01/linkedin-agent-skills/raw/main/dist/pack-linkedin-11-skills.zip" }],
    url: "https://github.com/Juampii01/linkedin-agent-skills", repo: "Juampii01/linkedin-agent-skills", licencia: "MIT"
  },
  {
    cat: "MCP", tipo: "MCP", t: "Context7",
    d: "Documentación actualizada de librerías y herramientas, para que Claude no programe con información vieja.",
    para: "Que el código que te arma Claude use la versión actual de cada librería.",
    cmds: [{ donde: "Claude Code", c: "claude mcp add --scope user --transport http context7 https://mcp.context7.com/mcp" }],
    url: "https://github.com/upstash/context7", repo: "upstash/context7"
  },
  {
    cat: "MCP", tipo: "MCP", t: "Firecrawl",
    d: "Saca el contenido de cualquier página web en texto limpio para que Claude lo trabaje.",
    para: "Investigar competencia, precios o documentación sin copiar y pegar.",
    cmds: [{ donde: "Claude Code", c: "claude mcp add --scope user --transport http firecrawl https://mcp.firecrawl.dev/v2/mcp-oauth" }],
    url: "https://github.com/firecrawl/firecrawl-mcp-server", repo: "firecrawl/firecrawl-mcp-server"
  },
  {
    cat: "MCP", tipo: "MCP", t: "Playwright",
    d: "Un navegador de verdad: Claude hace clic, completa formularios y prueba tu web como una persona.",
    para: "Que Claude revise y arregle su propio trabajo en la web.",
    cmds: [{ donde: "Claude Code", c: "claude mcp add --scope user playwright -- npx @playwright/mcp@latest" }],
    url: "https://github.com/microsoft/playwright-mcp", repo: "microsoft/playwright-mcp"
  },
  {
    cat: "MCP", tipo: "MCP", t: "Composio",
    d: "Conecta Claude a más de 1.000 apps (Gmail, Notion, Slack, GitHub, HubSpot…) con una sola conexión.",
    para: "Automatizar tareas entre tus apps desde un solo chat.",
    cmds: [{ donde: "Claude Code", c: "claude mcp add --scope user --transport http composio https://connect.composio.dev/mcp" }],
    url: "https://docs.composio.dev/docs/composio-connect", repo: "composio.dev"
  },
  {
    cat: "MCP", tipo: "MCP", t: "MarkItDown",
    d: "Convierte PDF, Word, Excel, PowerPoint y videos de YouTube en texto limpio. Claude lo lee mejor y gasta menos.",
    para: "Trabajar con archivos pesados sin quemar tu límite.",
    cmds: [{ donde: "Prueba", c: "uvx markitdown-mcp --help" }],
    url: "https://github.com/microsoft/markitdown", repo: "microsoft/markitdown", licencia: "MIT"
  },
  {
    cat: "Herramientas", tipo: "Plugin", t: "Codex dentro de Claude Code",
    d: "El plugin oficial de OpenAI: Claude arma el plan y Codex ejecuta y revisa, cada uno con su propio límite.",
    para: "Repartir el trabajo entre tus dos suscripciones.",
    cmds: [{ donde: "Claude Code", c: "/plugin marketplace add openai/codex-plugin-cc" }, { donde: "Claude Code", c: "/plugin install codex@openai-codex" }],
    url: "https://github.com/openai/codex-plugin-cc", repo: "openai/codex-plugin-cc"
  },
  {
    cat: "Herramientas", tipo: "App", t: "Jarvis por voz",
    d: "Le hablás a Claude Code y te contesta con voz, con tu mail y tu calendario conectados.",
    para: "Tener un asistente que te dice qué es importante sin abrir diez apps.",
    cmds: [{ donde: "Claude Code", c: "Descargá https://github.com/Juampii01/jarvi-os y dejá listo el Jarvis por voz de la carpeta \"voz\"." }],
    url: "https://github.com/Juampii01/jarvi-os/tree/main/voz", repo: "Juampii01/jarvi-os", licencia: "MIT"
  }
];
