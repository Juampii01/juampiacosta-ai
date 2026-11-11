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
    inicio: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    classroom: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    comunidad: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    sistemas: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    biblioteca: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
    maquina: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
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
  lado.innerHTML = '<a class="fj-marca" href="' + raiz + 'inicio">' + LOGO + '<span>Forja <b>IA</b></span></a>' +
    '<nav class="fj-nav" aria-label="Secciones">' +
      item("inicio", "Inicio", raiz + "inicio") +
      item("classroom", "Classroom", raiz + "recursos", '<em>' + total + '</em>') +
      item("comunidad", "Comunidad", raiz + "comunidad") +
      item("sistemas", "Sistemas", raiz + "sistemas") +
      item("biblioteca", "Biblioteca", raiz + "biblioteca#posts", seccion === "biblioteca" ? '' : svg("abajo", 2)) + sub +
    '</nav>' +
    '<nav class="fj-nav" aria-label="Herramientas IA"><div class="fj-nav-tit">HERRAMIENTAS IA</div>' + item("maestro", "Maestro", raiz + "maestro", '<span class="fj-badge">IA</span>') +
      item("maquina", "Máquina de Contenido", raiz + "maquina", gratis ? '<span class="fj-badge">GRATIS</span>' : '') + '</nav>' +
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
      '<a href="https://ig.me/m/juampiiacosta.ai" target="_blank" rel="noopener">Escríbeme por Instagram</a>' +
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
    if (d && d.subio) location.reload(); // acaba de acreditarse el pago: recarga con todo abierto
    if (d && d.oferta && FJ.ofertaUnica) FJ.ofertaUnica(d.oferta, d.email, d.perfil);
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

// Ventana «Desbloquear todo»: quien ya está adentro con el plan gratis no vuelve a la página de venta.
// Cualquier link a /?plan=1#precio (guías con candado, «Desbloquear todo», etc.) abre esta ventana.
// También se abre sola con ?desbloquear= en la URL (middleware.js lo manda acá cuando abre una guía paga).
(function () {
  if (!FJ.gratis) return;
  var HOTMART = "https://pay.hotmart.com/J108404247X?off=8flev061", MPAGO = "https://mpago.la/1Q8PbXK";
  var email = "", caja = null, previo = null;
  fetch("/api/cuenta", { credentials: "same-origin" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d && d.email) email = d.email; }).catch(function () {});
  function ok(t) { return '<li><svg viewBox="0 0 24 24" aria-hidden="true">' + '<path d="M5 12l5 5L20 7"/>' + '</svg><span>' + t + '</span></li>'; }
  function armar() {
    caja = document.createElement("div");
    caja.className = "fj-paywall"; caja.hidden = true;
    caja.innerHTML = '<div class="fj-paywall-fondo" data-cerrar></div>' +
      '<div class="fj-paywall-caja" role="dialog" aria-modal="true" aria-labelledby="fj-pw-titulo">' +
      '<button type="button" class="fj-paywall-x" data-cerrar aria-label="Cerrar">×</button>' +
      '<span class="fj-eyebrow">Acceso completo · pago único</span>' +
      '<h2 id="fj-pw-titulo">Desbloquea todo Forja IA</h2>' +
      '<p class="fj-paywall-sub">Lo que tienes abierto es la puerta. Adentro está el sistema completo para usar IA en serio y venderla a negocios.</p>' +
      '<ul class="fj-paywall-lista">' +
        ok('<b>Las ' + FJ.total + ' guías</b> paso a paso (hoy tienes ' + FJ.abiertas + ' abiertas)') +
        ok('<b>El roadmap completo para vender IA:</b> prospección, llamada de venta, cómo ponerle precio, objeciones y entrega') +
        ok('<b>222 prompts</b> listos para copiar, skills y conectores') +
        ok('<b>Sistemas listos para replicar</b> y vendérselos a un cliente') +
        ok('<b>Maestro</b>, tu tutor con IA, y todo lo que se sume después') +
      '</ul>' +
      '<div class="fj-paywall-valor">Todo esto armado como curso vale tranquilamente más de US$ 200. Y con un solo cliente al que le vendas un sistema lo recuperas varias veces.</div>' +
      '<div class="fj-paywall-precio"><s>US$ 44,90</s><b>US$ 24,90</b><span>pago único · es tuyo para siempre<br>precio de lanzamiento hasta el 30 de noviembre</span></div>' +
      '<a class="fj-btn fj-btn-primario fj-paywall-pagar" id="fj-pw-hotmart" href="' + HOTMART + '" target="_blank" rel="noopener">Desbloquear todo · US$ 24,90</a>' +
      '<a class="fj-btn fj-btn-borde fj-paywall-mp" href="' + MPAGO + '" target="_blank" rel="noopener">Estoy en Argentina: Mercado Pago ($ 39.000)</a>' +
      '<p class="fj-paywall-nota" id="fj-pw-nota"></p>' +
      '</div>';
    document.body.appendChild(caja);
    caja.addEventListener("click", function (e) {
      if (e.target.closest("[data-cerrar]")) return cerrar();
      if (e.target.closest("#fj-pw-hotmart")) anotar("hotmart");
      else if (e.target.closest(".fj-paywall-mp")) anotar("mpago");
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !caja.hidden) cerrar(); });
  }
  function anotar(evento, detalle) {
    try { fetch("/api/interes", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", keepalive: true, body: JSON.stringify({ evento: evento, detalle: detalle || "" }) }).catch(function () {}); } catch (e) {}
  }
  FJ.anotar = anotar;
  function abrir(origen) {
    if (!caja) armar();
    anotar("ventana", typeof origen === "string" ? origen : (document.body.dataset.seccion || ""));
    var h = document.getElementById("fj-pw-hotmart");
    h.href = HOTMART + (email ? "&email=" + encodeURIComponent(email) : "");
    document.getElementById("fj-pw-nota").innerHTML = (email ? 'Paga con el mismo mail de tu cuenta (<b>' + FJ.esc(email) + '</b>). ' : 'Paga con el mismo mail con el que entras. ') +
      'Con Hotmart se abre todo solo en unos minutos: vuelve a esta página y recárgala. Con Mercado Pago, mándame el comprobante por Instagram y te lo activo.';
    previo = document.activeElement;
    caja.hidden = false; document.documentElement.style.overflow = "hidden";
    h.focus();
  }
  function cerrar() { caja.hidden = true; document.documentElement.style.overflow = ""; if (previo && previo.focus) previo.focus(); }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href*="plan=1#precio"], a[href*="#precio"][href^="/?"]');
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault(); abrir();
  }, true);
  FJ.desbloquear = abrir;

  // Oferta por única vez (se prende desde el Panel): le aparece una sola vez a cada uno. Apenas se ve queda anotada,
  // así que si cierra la pestaña tampoco le vuelve a salir. Si el formulario de bienvenida está abierto, espera a que cierre.
  FJ.ofertaUnica = function (o, mail, perfil) {
    FJ.oferta = o;
    var guardado = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
    // En una guía no se le cruza nada: la oferta espera a la próxima página que abra
    if (/^\/guias\//.test(location.pathname)) return;
    var conPerfil = !!perfil || guardado("jpa_perfil_" + mail) === "1";
    if (conPerfil) return setTimeout(function () { mostrarOferta(o, mail); }, 1200);
    // Recién registrado: el formulario de bienvenida ya pregunta por la oferta (y «Sí, ahora» la abre).
    // Cuando el formulario se cierra: si respondió otra cosa, la oferta cuenta como vista y pasada; si no llegó a esa pregunta, aparece.
    var vueltas = 0;
    (function cuando() {
      var bv = document.querySelector(".bv");
      if ((!bv || !bv.hidden) && vueltas++ < 900) return setTimeout(cuando, 1000);
      if (FJ.ofertaMostrada) return;
      var r = {}; try { r = JSON.parse(guardado("jpa_respuestas") || "{}"); } catch (e) {}
      if (r.inversion && r.inversion !== "Sí, ahora") { FJ.ofertaMostrada = true; anotar("oferta_vista", "formulario"); anotar("oferta_no", "formulario"); return; }
      setTimeout(function () { mostrarOferta(o, mail); }, 1200);
    })();
  };
  function mostrarOferta(o, mail) {
    if (FJ.ofertaMostrada) return;
    FJ.ofertaMostrada = true;
    var num = function (s) { return parseFloat(String(s).replace(",", ".")) || 0; };
    var off = num(o.antes) ? Math.round((1 - num(o.precio) / num(o.antes)) * 100) : 0;
    var hot = o.hotmart + (mail ? (o.hotmart.indexOf("?") < 0 ? "?" : "&") + "email=" + encodeURIComponent(mail) : "");
    var v = document.createElement("div");
    v.className = "fj-paywall fj-oferta-unica";
    v.innerHTML = '<div class="fj-paywall-fondo" data-pasar></div>' +
      '<div class="fj-paywall-caja" role="dialog" aria-modal="true" aria-labelledby="fj-ou-tit">' +
      '<button type="button" class="fj-paywall-x" data-pasar aria-label="Cerrar">×</button>' +
      '<span class="fj-eyebrow">Solo por esta vez' + (off ? ' · ' + off + '% OFF' : '') + '</span>' +
      '<h2 id="fj-ou-tit">El acceso completo a US$ ' + FJ.esc(o.precio) + '</h2>' +
      '<p class="fj-paywall-sub">Las ' + FJ.total + ' guías, los sistemas listos para replicar, NovaCut completo y Maestro. Pago único: es tuyo para siempre.</p>' +
      '<div class="fj-paywall-precio"><s>US$ ' + FJ.esc(o.antes) + '</s><b>US$ ' + FJ.esc(o.precio) + '</b><span>Si cierras esta ventana, la oferta desaparece y no vuelve a salir.</span></div>' +
      '<a class="fj-btn fj-btn-primario fj-paywall-pagar" data-pago="hotmart" href="' + FJ.esc(hot) + '" target="_blank" rel="noopener">La quiero ahora · US$ ' + FJ.esc(o.precio) + '</a>' +
      (o.mpago ? '<a class="fj-btn fj-btn-borde fj-paywall-mp" data-pago="mpago" href="' + FJ.esc(o.mpago) + '" target="_blank" rel="noopener">Estoy en Argentina: Mercado Pago' + (o.pesos ? ' ($ ' + FJ.esc(o.pesos) + ')' : '') + '</a>' : '') +
      '<button type="button" class="fj-ou-pasar" data-pasar>Pasar</button>' +
      '<p class="fj-paywall-nota">Paga con el mismo mail de tu cuenta' + (mail ? ' (<b>' + FJ.esc(mail) + '</b>)' : '') + '. Con Hotmart se abre todo solo en unos minutos; con Mercado Pago, mándame el comprobante por Instagram.</p>' +
      '</div>';
    document.body.appendChild(v);
    document.documentElement.style.overflow = "hidden";
    anotar("oferta_vista");
    var cerrarO = function () { v.remove(); document.documentElement.style.overflow = ""; document.removeEventListener("keydown", esc); };
    var esc = function (e) { if (e.key === "Escape") { anotar("oferta_no"); cerrarO(); } };
    document.addEventListener("keydown", esc);
    v.addEventListener("click", function (e) {
      var pago = e.target.closest("[data-pago]");
      if (pago) { anotar("oferta_si", pago.getAttribute("data-pago")); return; }
      if (e.target.closest("[data-pasar]")) { anotar("oferta_no"); cerrarO(); }
    });
    v.querySelector(".fj-paywall-pagar").focus();
  }
  FJ.mostrarOferta = function () { if (FJ.oferta && !FJ.ofertaMostrada) { mostrarOferta(FJ.oferta, email); return true; } return false; };
  var pedida = (location.search.match(/[?&]desbloquear=([a-z0-9-]{1,120})/) || [])[1];
  if (pedida) {
    history.replaceState(null, "", location.pathname + location.hash);
    if (pedida !== "1") anotar("guia_paga", pedida);
    setTimeout(function () { abrir(pedida === "1" ? "precio" : "guia:" + pedida); }, 300);
  }

  // Aviso arriba del Classroom: «¿Te gustaría tener el acceso completo por solo US$ 24,90?»
  // «Sí, lo quiero» abre la ventana de compra; «Ahora no» lo esconde 3 días. Todo queda anotado para el Panel.
  if (/^\/recursos(\.html)?$/.test(location.pathname)) {
    var NO = "fj_oferta_no", esconder = false;
    try { esconder = Date.now() - Number(localStorage.getItem(NO) || 0) < 3 * 864e5; } catch (e) {}
    var main = document.querySelector("main");
    if (!esconder && main) {
      var av = document.createElement("section");
      av.className = "fj-oferta";
      av.innerHTML = '<div class="tx"><span class="eb"><i></i>Precio de lanzamiento · hasta el 30 de noviembre</span>' +
        '<h2>¿Te gustaría tener el acceso completo por solo <b>US$ 24,90</b>?</h2>' +
        '<p>Las ' + FJ.total + ' guías, el roadmap para vender IA, los sistemas listos para replicar y Maestro. Pago único, es tuyo para siempre. Desde el 1/12 pasa a US$ 44,90.</p></div>' +
        '<div class="acc"><button type="button" class="si">Sí, lo quiero →</button>' +
        '<span class="mini">Hoy tienes ' + FJ.abiertas + ' de ' + FJ.total + ' abiertas</span>' +
        '<button type="button" class="no">Ahora no</button></div>';
      main.insertBefore(av, main.firstChild);
      var banda = document.getElementById("cl-plan"); if (banda) banda.classList.add("fj-oculta-oferta");
      anotar("aviso");
      av.querySelector(".si").addEventListener("click", function () { anotar("si"); abrir("aviso"); });
      av.querySelector(".no").addEventListener("click", function () {
        anotar("no"); try { localStorage.setItem(NO, String(Date.now())); } catch (e) {}
        av.remove(); if (banda) banda.classList.remove("fj-oculta-oferta");
      });
    }
  }
})();
