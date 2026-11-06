// Menú lateral de Recursos:
// cada opción enseña solo su sección. En móvil, el menú se abre con el botón ☰ de la cabecera.
var ICONO_MENU = {
  inicio: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  rutas: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
  clases: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
  guias: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5"/>',
  "guias-web": '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5"/>',
  prompts: '<path d="M4 5h16v11H8l-4 4zM8 9h8M8 12h5"/>',
  skills: '<path d="M12 2l3 6 6 .9-4.5 4.3 1 6.3L12 16.5 6.5 19.5l1-6.3L3 8.9 9 8z"/>',
  mcp: '<path d="M9 7V3M15 7V3M7 7h10v5a5 5 0 0 1-10 0zM12 17v4"/>',
  herramientas: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  posts: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/>',
  mapa: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  comunidad: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.7z"/><path d="M9 9.5c0 2.5 2.5 5 5 5l1.2-1.2-1.8-1-1 .8a4 4 0 0 1-2-2l.8-1-1-1.8z"/>',
  llamada: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'
};

var MENU = [
  { id: "inicio", t: "Inicio" },
  { id: "rutas", t: "Rutas de aprendizaje" },
  { id: "guias-web", t: "Guías" },
  { id: "prompts", t: "Prompts" },
  { id: "skills", t: "Skills y plugins" },
  { id: "mcp", t: "MCP" },
  { id: "herramientas", t: "Herramientas" },
  { id: "posts", t: "De mis reels" }
];

function svgMenu(id) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICONO_MENU[id] + '</svg>';
}

function menuLateral() {
  var cuenta = {};
  SECCIONES.forEach(function (s) { cuenta[s.id] = s.n; });
  cuenta.rutas = RUTAS.length;
  // title: con el menú plegado solo se ven los iconos, y al pasar el ratón sale el nombre
  var items = MENU.map(function (m) {
    return '<a class="m-item" href="#' + m.id + '" data-vista="' + m.id + '" title="' + m.t + '">' + svgMenu(m.id) + '<span>' + m.t + '</span>' +
      (cuenta[m.id] ? '<em>' + cuenta[m.id] + '</em>' : '') + '</a>';
  }).join("");
  var aside = document.createElement("aside");
  aside.className = "menu";
  aside.innerHTML = '<a class="marca" href="#inicio">' + LOGO + '<span>juampiacosta<b>.ai</b></span></a>' +
    '<button class="menu-plegar" type="button" aria-label="Plegar menú" title="Plegar menú"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg></button>' +
    '<nav>' + items + '</nav>' +
    '<div class="m-pie"><a class="btn m-llamada" href="' + REDES.dm + '" target="_blank" rel="noopener" title="Escribime">' + svgMenu("llamada") + '<span>Escribime</span>→</a></div>';
  document.body.appendChild(aside);
  // Plegar a solo iconos (solo en ordenador). Se recuerda para la próxima visita.
  var plegar = aside.querySelector(".menu-plegar");
  function plegarMenu(plegado) {
    document.body.classList.toggle("menu-plegado", plegado);
    plegar.setAttribute("aria-label", plegado ? "Abrir menú" : "Plegar menú");
    plegar.title = plegado ? "Abrir menú" : "Plegar menú";
  }
  try { plegarMenu(localStorage.getItem("menuPlegado") === "1"); } catch (e) {}
  plegar.addEventListener("click", function () {
    var plegado = !document.body.classList.contains("menu-plegado");
    plegarMenu(plegado);
    try { localStorage.setItem("menuPlegado", plegado ? "1" : "0"); } catch (e) {}
  });
  // En móvil, tocar «Escribime» cierra el menú
  aside.querySelector(".m-llamada").addEventListener("click", cerrarMenu);
  var velo = document.createElement("div");
  velo.className = "menu-velo";
  velo.addEventListener("click", cerrarMenu);
  document.body.appendChild(velo);
  document.body.classList.add("con-menu");

  // Botón ☰ en la cabecera (solo se ve en móvil y tablet)
  var boton = document.createElement("button");
  boton.className = "menu-boton";
  boton.setAttribute("aria-label", "Abrir menú");
  boton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  boton.addEventListener("click", function () { document.body.classList.toggle("menu-abierto"); });
  var cab = document.querySelector(".cab");
  cab.insertBefore(boton, cab.firstChild);

  // «Explorar la biblioteca ↓» baja a las clases dentro de Inicio, sin cambiar de vista
  document.querySelectorAll("[data-bajar-a]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      document.getElementById(a.dataset.bajarA).scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  window.addEventListener("hashchange", function () { verVista(location.hash.slice(1)); });
  verVista(location.hash.slice(1));
}

function cerrarMenu() { document.body.classList.remove("menu-abierto"); }

// Enseña solo la sección elegida. «pro» (llamada) no es una vista: baja al formulario desde cualquier sección.
function verVista(id) {
  if (id === "pro" || id === "buscar") {
    cerrarMenu();
    if (document.body.dataset.vista) return;
    id = "inicio";
  }
  var existe = id && document.getElementById(id) && document.getElementById(id).parentNode.tagName === "MAIN";
  var vista = existe ? id : "inicio";
  document.body.dataset.vista = vista;
  document.querySelectorAll("main > section").forEach(function (s) { s.classList.toggle("vista-activa", s.id === vista); });
  document.querySelectorAll(".menu .m-item[data-vista]").forEach(function (a) { a.classList.toggle("activo", a.dataset.vista === vista); });
  // En pantallas bajas la lista del menú se desplaza: que la sección activa quede a la vista
  var activo = document.querySelector(".menu .m-item.activo"), lista = document.querySelector(".menu nav");
  if (activo && lista) {
    var a = activo.getBoundingClientRect(), l = lista.getBoundingClientRect();
    if (a.bottom > l.bottom) lista.scrollTop += a.bottom - l.bottom + 8;
    else if (a.top < l.top) lista.scrollTop -= l.top - a.top + 8;
  }
  cerrarMenu();
  // El navegador salta al ancla después; volvemos arriba para que se vea el buscador
  window.scrollTo(0, 0);
  setTimeout(function () { window.scrollTo(0, 0); }, 0);
}

// Inicio: los 3 primeros pasos recomendados
function empiezaAqui(caja) {
  var porSlug = {};
  GUIAS_WEB.forEach(function (g) { porSlug[g.slug] = g; });
  caja.innerHTML = '<div class="tit"><div><span class="mono">Paso a paso</span><h2>Ruta recomendada</h2></div></div>' +
    '<p class="sub">Tres guías en orden. El resto de la biblioteca sigue disponible en el menú.</p><div class="e-pasos">' +
    EMPIEZA.map(function (s, i) {
      var g = porSlug[s];
      return '<a class="e-paso glass" href="guias/' + s + '.html"><b>' + (i + 1) + '</b><div><span class="mono">Paso ' + (i + 1) + ' · ' + g.min + ' min</span><h3>' + g.t + '</h3></div><span class="flecha">→</span></a>';
    }).join("") + '</div>';
}

// Inicio: los 4 primeros recursos de «De mis posts».
// «Ver todos» lleva a la sección completa (#posts cambia de vista con el menú)
function ultimosPosts(caja) {
  var ultimos = GUIAS_WEB.filter(function (g) { return g.post; }).slice(0, 4);
  caja.innerHTML = '<div class="tit"><div><span class="mono">Instagram</span><h2>Lo último de mis reels</h2></div></div>' +
    '<p class="sub">Lo que prometí en mis últimos reels, listo para usar.</p><div class="herrs">' +
    ultimos.map(function (g) {
      return '<a class="herr glass" href="guias/' + g.slug + '.html">' +
        '<div class="herr-cab"><span class="tipo">Palabra · ' + g.post + '</span><span class="herr-meta">' + g.min + ' min</span></div>' +
        '<h3>' + g.t + '</h3><p>' + g.d + '</p><span class="bajar">Leer la guía →</span></a>';
    }).join("") + '</div><a class="ver-todos chip" href="#posts">Ver todos →</a>';
}

// Rutas: cada una se abre y enseña sus guías en orden
function pintarRutas(caja) {
  var porSlug = {};
  GUIAS_WEB.forEach(function (g) { porSlug[g.slug] = g; });
  caja.innerHTML = RUTAS.map(function (r) {
    var pasos = r.pasos.map(function (p, i) {
      var g = typeof p === "string" ? { t: porSlug[p].t, url: "guias/" + p + ".html", min: porSlug[p].min } : p;
      return '<li><a href="' + g.url + '"><b>' + (i + 1) + '</b><span>' + g.t + '</span>' + (g.min ? '<small>' + g.min + ' min</small>' : '') + '</a></li>';
    }).join("");
    var min = r.pasos.reduce(function (t, p) { return t + (typeof p === "string" ? porSlug[p].min : 0); }, 0);
    return '<details class="ruta glass ruta-' + r.color + '" data-buscar="' + r.t + ' ' + r.d + ' ruta"><summary><i>' + svgMenu("rutas") + '</i><div><h3>' + r.t + '</h3><p>' + r.d + '</p>' +
      '<span class="meta">' + r.pasos.length + ' pasos · unos ' + min + ' min de lectura</span></div><span class="abrir">⌄</span></summary><ol>' + pasos + '</ol></details>';
  }).join("");
}
