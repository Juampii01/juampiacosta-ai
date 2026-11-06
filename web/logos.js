// Logos de las herramientas que salen en las guías.
// Archivos en web/logos/: Simple Icons 16.33.0 (licencia CC0, c = su color oficial) y Lobe Icons 1.95.1 (MIT, lb-*).
//   f: archivo de una sola tinta, se pinta con el color c   ·   img: archivo ya a color   ·   letra: sin logo libre
// Las que no tienen logo libre llevan su inicial; si no sé su color oficial, el azul de la marca (#ff5a1f).
// El orden importa: «Claude Code» va antes que «Claude» para que no cuente dos veces.
var LOGOS = [
  { n: "Claude Code", f: "claude", c: "#D97757" },
  { n: "Claude", f: "claude", c: "#D97757" },
  { n: "ChatGPT", f: "lb-openai", c: "#000000", re: "\\bChatGPT\\b|\\bOpenAI\\b" },
  { n: "Codex", img: "lb-codex-color" },
  { n: "Gemini", f: "googlegemini", c: "#8E75B2" },
  { n: "Google Drive", f: "googledrive", c: "#4285F4", re: "\\bDrive\\b" },
  { n: "Google Sheets", f: "googlesheets", c: "#34A853", re: "\\bSheets\\b" },
  { n: "Google Docs", f: "googledocs", c: "#4285F4" },
  { n: "Gmail", f: "gmail", c: "#EA4335" },
  { n: "NotebookLM", f: "notebooklm", c: "#000000" },
  { n: "Google", f: "google", c: "#4285F4" },
  { n: "Instagram", f: "instagram", c: "#FF0069" },
  { n: "Meta", f: "meta", c: "#0467DF" },
  { n: "Facebook", f: "facebook", c: "#0866FF" },
  { n: "WhatsApp", f: "whatsapp", c: "#25D366" },
  { n: "TikTok", f: "tiktok", c: "#000000" },
  { n: "YouTube", f: "youtube", c: "#FF0000" },
  { n: "LinkedIn", letra: "in", c: "#0A66C2" },
  { n: "Threads", f: "threads", c: "#000000" },
  { n: "Pinterest", f: "pinterest", c: "#BD081C" },
  { n: "Reddit", f: "reddit", c: "#FF4500" },
  { n: "Discord", f: "discord", c: "#5865F2" },
  { n: "Telegram", f: "telegram", c: "#26A5E4" },
  { n: "Spotify", f: "spotify", c: "#1ED760" },
  { n: "Perplexity", f: "perplexity", c: "#1FB8CD" },
  { n: "Grok", f: "lb-grok", c: "#000000" },
  { n: "DeepSeek", f: "deepseek", c: "#5786FE" },
  { n: "Kimi", img: "lb-kimi-color" },
  { n: "Qwen", img: "lb-qwen-color" },
  { n: "Ollama", f: "ollama", c: "#000000" },
  { n: "Copilot", f: "githubcopilot", c: "#000000" },
  { n: "n8n", f: "n8n", c: "#EA4B71" },
  { n: "Make", f: "make", c: "#6D00CC" },
  { n: "Zapier", f: "zapier", c: "#FF4F00" },
  { n: "Supabase", f: "supabase", c: "#3FCF8E" },
  { n: "GitHub", f: "github", c: "#181717", re: "\\bGitHub\\b|github\\.com" },
  { n: "Cursor", f: "cursor", c: "#000000" },
  { n: "Vercel", f: "vercel", c: "#000000" },
  { n: "Netlify", f: "netlify", c: "#00C7B7" },
  { n: "Replit", f: "replit", c: "#F26207" },
  { n: "Lovable", img: "lb-lovable-color" },
  { n: "Node.js", f: "nodedotjs", c: "#5FA04E", re: "\\bNode(\\.js)?\\b" },
  { n: "Python", f: "python", c: "#3776AB" },
  { n: "Chrome", f: "googlechrome", c: "#4285F4" },
  { n: "Apple", f: "apple", c: "#000000" },
  { n: "Notion", f: "notion", c: "#000000" },
  { n: "Obsidian", f: "obsidian", c: "#7C3AED" },
  { n: "Airtable", f: "airtable", c: "#18BFFF" },
  { n: "Figma", f: "figma", c: "#F24E1E" },
  { n: "Shopify", f: "shopify", c: "#7AB55C" },
  { n: "ElevenLabs", f: "elevenlabs", c: "#000000" },
  { n: "Suno", f: "suno", c: "#000000" },
  { n: "Midjourney", f: "lb-midjourney", c: "#000000" },
  { n: "Ideogram", f: "lb-ideogram", c: "#000000" },
  { n: "Krea", f: "lb-krea", c: "#000000" },
  { n: "Runway", f: "lb-runway", c: "#000000" },
  { n: "Kling", img: "lb-kling-color" },
  { n: "Nano Banana", img: "lb-nanobanana-color" },
  { n: "CapCut", f: "lb-capcut", c: "#000000" },
  { n: "Manus", f: "lb-manus", c: "#000000" },
  { n: "Excel", letra: "X", c: "#217346" },
  { n: "Word", letra: "W", c: "#2B579A" },
  { n: "PowerPoint", letra: "P", c: "#B7472A" },
  { n: "Outlook", letra: "O", c: "#0078D4" },
  { n: "Teams", letra: "T", c: "#6264A7" },
  { n: "Slack", letra: "S", c: "#4A154B" },
  { n: "Canva", letra: "C", c: "#00C4CC" },
  { n: "Playwright", letra: "P", c: "#2EAD33" },
  { n: "Higgsfield", letra: "H", c: "#ff5a1f" },
  { n: "HeyGen", letra: "H", c: "#ff5a1f" },
  { n: "Apify", letra: "A", c: "#ff5a1f" },
  { n: "Gamma", letra: "G", c: "#ff5a1f" },
  { n: "ManyChat", letra: "M", c: "#ff5a1f" },
  { n: "Firecrawl", letra: "F", c: "#ff5a1f" }
];

// Herramientas que nombra una guía, de la que más sale a la que menos (máximo 4, sin repetir logo)
function logosDe(g) {
  var texto = JSON.stringify(g);
  var vistos = {};
  return LOGOS.map(function (l) {
    var veces = (texto.match(new RegExp(l.re || "\\b" + l.n.replace(/ /g, "\\s").replace(/\./g, "\\.") + "\\b", "g")) || []).length;
    if (l.n === "Claude") veces -= (texto.match(/\bClaude Code\b/g) || []).length;
    // «Google» cuenta solo cuando va solo (no en Google Drive, Docs o Sheets)
    if (l.n === "Google") veces -= (texto.match(/\bGoogle (Drive|Docs|Sheets)\b/g) || []).length;
    return { l: l, veces: veces };
  }).filter(function (x) {
    var clave = x.l.f || x.l.img || x.l.n;
    if (x.veces <= 0 || vistos[clave]) return false;
    vistos[clave] = true;
    return true;
  }).sort(function (a, b) { return b.veces - a.veces; }).slice(0, 4).map(function (x) { return x.l; });
}

// Placa blanca con el logo: pintado en su color (el SVG hace de máscara), la imagen a color o la inicial
function placaLogo(l, raiz) {
  var dentro = l.img ? '<img src="' + raiz + 'web/logos/' + l.img + '.svg" alt="">'
    : l.letra ? '<b style="color:' + l.c + '">' + l.letra + '</b>'
    : '<i style="--c:' + l.c + ';--logo:url(' + raiz + 'web/logos/' + l.f + '.svg)"></i>';
  return '<span class="placa-logo" title="' + l.n + '">' + dentro + '</span>';
}
