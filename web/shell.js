// Forja IA: barra lateral + barra de arriba (usuario, avisos, modo claro/oscuro) para todas las páginas de adentro.
// Uso: <body class="fj-app" data-seccion="classroom" data-raiz="../"> y este script justo después de abrir <body>
// (después de guias-web.js y comun.js). Lo que se ve según el plan es solo visual: lo que se abre lo decide middleware.js.

var FJ = (function () {
  var cuerpo = document.body;
  var raiz = cuerpo.dataset.raiz || "/";
  var seccion = cuerpo.dataset.seccion || "";
  function cookie(n) { var m = document.cookie.match(new RegExp("(?:^|;\\s*)" + n + "=([^;]+)")); try { return m ? decodeURIComponent(m[1]) : ""; } catch (e) { return ""; } }
  var nivel = cookie("jpa_nivel") || "pago";
  var nombre = (cookie("jpa_nombre") || "").replace(/[<>&"]/g, "");
  var admin = cookie("jpa_rol") === "admin";
  var gratis = nivel === "gratis";
  var total = typeof GUIAS_WEB !== "undefined" ? GUIAS_WEB.length : 0;
  var abiertas = typeof GUIAS_WEB !== "undefined" ? GUIAS_WEB.filter(function (g) { return g.gratis; }).length : 0;

  var LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#17110e"/><path d="M9 22h14l-2-5H11z" fill="#ff5a1f"/><path d="M16 6c3 3 4 5 2 8-1-1-2-1-3 0-2-2-1-5 1-8z" fill="#ffb27a"/></svg>';
  var I = {
    classroom: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    comunidad: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    sistemas: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    biblioteca: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
    maestro: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    panel: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/>',
    lupa: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    abajo: '<path d="M6 9l6 6 6-6"/>',
    candado: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    check: '<path d="M5 12l5 5L20 7"/>'
  };
  function svg(id, extra) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (extra || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[id] + '</svg>'; }
  function item(id, texto, href, cola) {
    return '<a class="fj-item" href="' + href + '"' + (seccion === id ? ' aria-current="page"' : '') + '>' + svg(id) + '<span>' + texto + '</span>' + (cola || '') + '</a>';
  }

  // ---- Barra lateral
  var lado = document.createElement("aside");
  lado.className = "fj-side";
  lado.setAttribute("aria-label", "Menú principal");
  var sub = seccion === "biblioteca" ? '<div class="fj-sub">' +
    [["posts", "De mis reels"], ["prompts", "Prompts"], ["skills", "Skills"], ["mcp", "Conectores (MCP)"], ["herramientas", "Herramientas"], ["rutas", "Rutas"]]
      .map(function (s) { return '<a href="' + raiz + 'biblioteca#' + s[0] + '" data-sub="' + s[0] + '">' + s[1] + '</a>'; }).join("") + '</div>' : '';
  lado.innerHTML = '<a class="fj-marca" href="' + raiz + 'recursos">' + LOGO + '<span>Forja <b>IA</b></span></a>' +
    '<nav class="fj-nav" aria-label="Secciones">' +
      item("classroom", "Classroom", raiz + "recursos", '<em>' + total + '</em>') +
      item("comunidad", "Comunidad", raiz + "comunidad") +
      item("sistemas", "Sistemas", raiz + "sistemas") +
      item("biblioteca", "Biblioteca", raiz + "biblioteca#posts", seccion === "biblioteca" ? '' : svg("abajo", 2)) + sub +
    '</nav>' +
    '<nav class="fj-nav" aria-label="Herramientas IA"><div class="fj-nav-tit">HERRAMIENTAS IA</div>' + item("maestro", "Maestro", raiz + "maestro", '<span class="fj-badge">IA</span>') + '</nav>' +
    (admin ? '<nav class="fj-nav" aria-label="Equipo"><div class="fj-nav-tit">EQUIPO</div>' + item("panel", "Panel", raiz + "panel") + '</nav>' : '') +
    (gratis ? '<div class="fj-plan"><b>Plan gratis</b><div class="fj-barra"><i style="width:' + (total ? Math.round(abiertas / total * 100) : 0) + '%"></i></div>' +
      '<small>' + abiertas + ' de ' + total + ' guías abiertas</small><a class="fj-btn fj-btn-primario" href="/?plan=1#precio">Desbloquear todo</a></div>'
      : '<div class="fj-plan"><b>Acceso completo</b><small>Las ' + total + ' guías y todo lo que se sume. Para siempre.</small></div>');
  cuerpo.insertBefore(lado, cuerpo.firstChild);
  var velo = document.createElement("div");
  velo.className = "fj-velo";
  velo.addEventListener("click", function () { cuerpo.classList.remove("fj-menu-abierto"); });
  cuerpo.insertBefore(velo, lado.nextSibling);

  // ---- Barra de arriba
  var top = document.createElement("header");
  top.className = "fj-top";
  var inicial = (nombre || "T").charAt(0).toUpperCase();
  top.innerHTML = '<button type="button" class="fj-icono-btn fj-menu-btn" aria-label="Abrir menú">' + svg("menu", 2) + '</button>' +
    '<label class="fj-buscar">' + svg("lupa", 2) + '<span class="fj-oculto">Buscar</span><input type="search" id="fj-buscar" placeholder="Buscar guías, prompts y sistemas" autocomplete="off"><kbd>/</kbd></label>' +
    '<div class="fj-top-esp"></div>' +
    '<div class="fj-top-acciones" style="display:flex;gap:10px;align-items:center"></div>' +
    '<div class="fj-usuario"><button type="button" aria-haspopup="true" aria-expanded="false" aria-label="Tu cuenta">' +
      '<span class="fj-avatar">' + inicial + '</span><span class="fj-usuario-txt"><b>' + (nombre || "Tu cuenta") + '</b><small>' + (gratis ? "Plan gratis" : "Acceso completo") + '</small></span>' + svg("abajo", 2) + '</button>' +
      '<div class="fj-menu-usuario" hidden><span class="fj-menu-email" id="fj-email"></span>' +
      '<a href="' + raiz + 'cuenta">Mi cuenta</a>' + (gratis ? '<a href="/?plan=1#precio">Desbloquear todo</a>' : '') +
      '<a href="https://ig.me/m/juampiiacosta.ia" target="_blank" rel="noopener">Escríbeme por Instagram</a>' +
      '<button type="button" id="fj-salir">Cerrar sesión</button></div></div>';
  var main = document.querySelector("main");
  cuerpo.insertBefore(top, main || null);

  top.querySelector(".fj-menu-btn").addEventListener("click", function () { cuerpo.classList.add("fj-menu-abierto"); });
  var uBtn = top.querySelector(".fj-usuario > button"), uMenu = top.querySelector(".fj-menu-usuario");
  uBtn.addEventListener("click", function (e) { e.stopPropagation(); var a = uMenu.hidden; uMenu.hidden = !a; uBtn.setAttribute("aria-expanded", String(a)); });
  document.addEventListener("click", function (e) { if (!uMenu.hidden && !uMenu.contains(e.target)) { uMenu.hidden = true; uBtn.setAttribute("aria-expanded", "false"); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { uMenu.hidden = true; cuerpo.classList.remove("fj-menu-abierto"); } });
  document.getElementById("fj-salir").addEventListener("click", function () {
    fetch("/api/salir", { method: "POST", credentials: "same-origin" }).then(function () { location.href = "/entrar"; }, function () { location.href = "/entrar"; });
  });

  // Buscador de arriba: en la biblioteca filtra la lista; en el resto, lleva a la biblioteca con lo buscado
  var buscar = document.getElementById("fj-buscar");
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); buscar.focus(); }
  });
  if (typeof activarBuscador === "function" && seccion === "biblioteca") activarBuscador(buscar);
  else buscar.addEventListener("keydown", function (e) { if (e.key === "Enter" && buscar.value.trim()) location.href = raiz + "biblioteca?q=" + encodeURIComponent(buscar.value.trim()) + "#guias-web"; });

  // Email de la cuenta en el menú (la cookie de acceso no se puede leer desde la página)
  fetch("/api/cuenta?p=" + encodeURIComponent(location.pathname), { credentials: "same-origin" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (d && d.email) document.getElementById("fj-email").textContent = d.email;
  }).catch(function () {});

  // Progreso guardado en tu cuenta: se mezcla con el del navegador para que se vea igual en el móvil y en la compu
  if (typeof PROGRESO !== "undefined") {
    var marcarLocal = PROGRESO.marcar;
    PROGRESO.marcar = function (slug) {
      var nuevo = marcarLocal(slug);
      fetch("/api/progreso", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ slug: slug }) }).catch(function () {});
      return nuevo;
    };
    PROGRESO.sincronizar = fetch("/api/progreso", { credentials: "same-origin" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.vistas) return false;
      var l = PROGRESO.leidas(), cambio = false;
      d.vistas.forEach(function (s) { if (!l[s]) { l[s] = Date.now(); cambio = true; } });
      var subir = Object.keys(l).filter(function (s) { return d.vistas.indexOf(s) < 0; });
      if (subir.length) fetch("/api/progreso", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ slugs: subir.slice(0, 200) }) }).catch(function () {});
      try { localStorage.setItem("jpa_leidas", JSON.stringify(l)); } catch (e) {}
      return cambio;
    }).catch(function () { return false; });
  }

  return { raiz: raiz, gratis: gratis, admin: admin, nombre: nombre, svg: svg, total: total, abiertas: abiertas, cookie: cookie,
    esc: function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); } };
})();
