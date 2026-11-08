/* Íconos de línea para las categorías y grupos de la biblioteca (reemplazan a los emojis, que cambian según el sistema). */
var ICONOS_CAT = (function () {
  var P = {
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/>',
    rayo: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    moneda: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.5-.8-1.5-1.2-2.8-1.2-1.7 0-2.8.8-2.8 2s1 1.7 2.8 2 2.8.8 2.8 2-1.1 2-2.8 2c-1.3 0-2.3-.4-2.8-1.2M12 6.5V8m0 8v1.5"/>',
    maletin: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M3 13h18"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
    diana: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    chispa: '<path d="M12 3l1.9 5.6L19.5 10.5 13.9 12.4 12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    enchufe: '<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5"/>',
    robot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13v1M15 13v1M9.5 17h5"/>',
    capas: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    local: '<path d="M4 10v10h16V10M3 10l2-6h14l2 6zM10 20v-5h4v5"/>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>',
    codigo: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>',
    llave: '<path d="M14.7 6.3a4 4 0 0 0-5.3 5.3L3 18l3 3 6.4-6.4a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.3-.6-.6-2.3z"/>',
    libro: '<path d="M4 4h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v15h-6a2 2 0 0 0-2 1 2 2 0 0 0-2-1H4z"/><path d="M12 5v15"/>',
    rayos: '<path d="M4 6h16M4 12h10M4 18h7"/>',
    paralelo: '<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/>',
    globo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3z"/>',
    engranaje: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    estrella: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    gente: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>'
  };
  var M = {
    "primeros-pasos": "play", "mas-jugo": "rayo", "ahorrar": "moneda", "negocio": "maletin", "contenido": "video", "clientes": "diana",
    "skills": "chispa", "conectores": "enchufe", "agentes": "robot", "sistema-base": "capas", "rubros": "local", "claude-code": "terminal", "desarrollo": "codigo",
    "sk-oficiales": "estrella", "sk-negocio": "maletin", "sk-colecciones": "libro", "sk-metodos": "rayos", "sk-ahorro": "moneda",
    "mcp-negocio": "maletin", "mcp-auto": "engranaje", "mcp-web": "globo", "mcp-dev": "codigo",
    "h-apps": "terminal", "h-ahorro": "moneda", "h-paralelo": "paralelo", "h-dev": "codigo", "h-agentes": "robot"
  };
  return function (id) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[M[id]] || P.chispa) + '</svg>';
  };
})();
