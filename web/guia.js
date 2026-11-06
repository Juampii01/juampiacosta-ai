// Página de una guía, versión visual.
// Portada con logos y el color de la herramienta, «En corto» con atajos, ficha con iconos, usos en tarjetas de color,
// partes numeradas con icono, pasos que se marcan como hechos, huecos de los prompts y comandos resaltados,
// y el siguiente paso de la ruta. Ficha y usos solo salen si la guía los tiene.
var RAIZ = "../";
var ICONO_GUIA = {
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  ojo: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/>',
  prompt: '<path d="M4 17l6-5-6-5M12 19h8"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  instalar: '<path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 19h16"/>',
  escalera: '<path d="M4 20h5v-5h5v-5h5V5"/>',
  lista: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  libro: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5"/>',
  duda: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  persona: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  caja: '<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>',
  dinero: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
  enlace: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  no: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  rayo: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  ruta: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>'
};
function svgGuia(id) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONO_GUIA[id] + '</svg>';
}

function dosCifras(n) { return (n < 10 ? "0" : "") + n; }

// Convierte «github.com/usuario/repo» suelto en enlace
function enlazar(texto) {
  return texto.replace(/(^|[\s(])((?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+)/g, function (m, antes, url) {
    return antes + '<a href="' + (url.indexOf("http") === 0 ? url : "https://" + url) + '" target="_blank" rel="noopener">' + url.replace(/^https?:\/\//, "") + '</a>';
  });
}

// Comandos como /yt-script en pastilla de código (solo si van sueltos: no toca enlaces ni rutas como a/b)
function comandos(texto) {
  return texto.replace(/(^|[\s(«])(\/[a-z][a-z0-9-]{1,30})(?=[\s,.;:)»]|$)/g, '$1<code class="g-cmd">$2</code>');
}
function adornar(texto) { return comandos(enlazar(texto)); }

// En los prompts, lo que hay que cambiar ([NICHO], [PEGA AQUÍ EL LINK]…) va en una pastilla amarilla
function huecos(texto) {
  return texto.replace(/\[[^\]\n]{2,60}\]/g, function (h) { return '<mark class="g-hueco">' + h + '</mark>'; });
}

// «/yt-script: de una idea…» -> título en negrita y texto debajo
function tarjetaLista(x) {
  var m = x.match(/^([^:]{2,42}):\s+(.+)$/);
  var cuerpo = m ? '<b>' + comandos(m[1]) + '</b><span>' + adornar(m[2].charAt(0).toUpperCase() + m[2].slice(1)) + '</span>' : '<span>' + adornar(x) + '</span>';
  return '<li class="g-tarjeta glass"><i class="g-check">' + svgGuia("check") + '</i><div>' + cuerpo + '</div></li>';
}

// Tipo de cada parte, para su icono y su etiqueta
function tipoParte(s) {
  if (/inst[aá]l/i.test(s.h)) return ["instalar", "Instalar"];
  if (s.pasos) return ["escalera", "Paso a paso"];
  if (s.prompts && !s.lista) return ["prompt", "Prompts"];
  if (s.lista) return ["lista", "Lo clave"];
  return ["libro", "Contexto"];
}

// Icono de cada fila de la ficha según su nombre
function iconoFicha(k) {
  var t = k.toLowerCase();
  if (/qué es|que es/.test(t)) return "info";
  if (/quién|quien/.test(t)) return "persona";
  if (/necesit/.test(t)) return "caja";
  if (/tiempo|dura/.test(t)) return "reloj";
  if (/cuesta|precio|consumo|pagar|cobrar|incluido/.test(t)) return "dinero";
  if (/repo|enlace|web|dirección/.test(t)) return "enlace";
  if (/comando|incluye|cómo pedir/.test(t)) return "prompt";
  if (/no hace|cuándo no|qué no borrar/.test(t)) return "no";
  if (/^ojo|norma|señal/.test(t)) return "ojo";
  if (/empezar|después|cuándo|cada cuánto/.test(t)) return "flecha";
  if (/dónde/.test(t)) return "ruta";
  return "rayo";
}

// Brillo de la portada: siempre el azul de la marca
function colorPortada() { return "#ff5a1f"; }

// Pasos que se marcan como hechos. Se guarda en el navegador de cada persona (pasos:<slug>:<parte>)
function clavePasos(slug, i) { return "pasos:" + slug + ":" + i; }
function leerPasos(clave) { try { return JSON.parse(localStorage.getItem(clave)) || []; } catch (e) { return []; } }
function listaPasos(slug, i, pasos) {
  var hechos = leerPasos(clavePasos(slug, i));
  return '<div class="g-progreso" data-clave="' + clavePasos(slug, i) + '"><span><b>' + hechos.length + '</b> de ' + pasos.length + ' hechos</span><i><em style="width:' + (hechos.length / pasos.length * 100) + '%"></em></i></div>' +
    '<ol class="g-pasos">' + pasos.map(function (x, j) {
      var hecho = hechos.indexOf(j) >= 0;
      return '<li class="' + (hecho ? 'hecho' : '') + '"><button type="button" data-paso="' + j + '" aria-pressed="' + hecho + '" title="Marcar como hecho"><b>' + (j + 1) + '</b><i>' + svgGuia("check") + '</i></button><p>' + adornar(x) + '</p></li>';
    }).join("") + '</ol>';
}
function activarPasos(caja) {
  caja.querySelectorAll(".g-pasos button").forEach(function (b) {
    b.addEventListener("click", function () {
      var li = b.closest("li"), ol = b.closest("ol"), barra = ol.previousElementSibling;
      var hecho = li.classList.toggle("hecho");
      b.setAttribute("aria-pressed", hecho);
      var hechos = [].map.call(ol.querySelectorAll("li"), function (x, j) { return x.classList.contains("hecho") ? j : -1; }).filter(function (j) { return j >= 0; });
      try { localStorage.setItem(barra.dataset.clave, JSON.stringify(hechos)); } catch (e) {}
      var total = ol.querySelectorAll("li").length;
      barra.querySelector("b").textContent = hechos.length;
      barra.querySelector("em").style.width = (hechos.length / total * 100) + "%";
      barra.classList.toggle("completo", hechos.length === total);
    });
  });
}

// Si la guía está en una ruta de aprendizaje, la tarjeta con el siguiente paso
function siguienteDeRuta(g) {
  if (typeof RUTAS === "undefined") return "";
  for (var r = 0; r < RUTAS.length; r++) {
    var i = RUTAS[r].pasos.indexOf(g.slug);
    if (i < 0) continue;
    var ruta = RUTAS[r], total = ruta.pasos.length, sig = ruta.pasos[i + 1];
    var cab = '<span class="g-ruta-etq">' + svgGuia("ruta") + 'Ruta · ' + ruta.t + ' · paso ' + (i + 1) + ' de ' + total + '</span>' +
      '<div class="g-ruta-barra"><em style="width:' + ((i + 1) / total * 100) + '%"></em></div>';
    if (!sig) {
      return '<a class="g-ruta glass ruta-' + ruta.color + '" href="' + RAIZ + 'recursos.html#rutas">' + cab +
        '<h3>¡Terminaste la ruta!</h3><p>Elegí otra ruta para seguir aprendiendo.</p><span class="g-ruta-boton">Ver las rutas' + svgGuia("flecha") + '</span></a>';
    }
    var destino = typeof sig === "string" ? GUIAS_WEB.filter(function (x) { return x.slug === sig; })[0] : null;
    var titulo = destino ? destino.t : sig.t;
    var url = destino ? sig + ".html" : RAIZ + sig.url;
    return '<a class="g-ruta glass ruta-' + ruta.color + '" href="' + url + '">' + cab +
      '<span class="g-ruta-sig">Siguiente paso</span><h3>' + titulo + '</h3>' + (destino ? '<p>' + destino.d + '</p>' : '') +
      '<span class="g-ruta-boton">Seguir con la ruta' + svgGuia("flecha") + '</span></a>';
  }
  return "";
}

function pintarGuia(caja, g) {
  var logos = logosDe(g);
  var pasos = g.secciones.reduce(function (t, s) { return t + (s.pasos ? s.pasos.length : 0); }, 0);
  var prompts = g.secciones.reduce(function (t, s) { return t + (s.prompts ? s.prompts.length : 0); }, 0);

  // Atajos «Ir directo a»: ficha, usos, cada parte y preguntas
  var atajos = [];
  if (g.ficha) atajos.push(["ficha", "Ficha"]);
  if (g.usos) atajos.push(["usos", "Para qué sirve"]);
  g.secciones.forEach(function (s, i) { atajos.push(["parte-" + (i + 1), s.h]); });
  if (g.faq && g.faq.length) atajos.push(["preguntas", "Preguntas"]);

  var html = '<a class="volver" href="' + RAIZ + 'recursos.html#' + (g.post ? 'posts' : 'guias-web') + '">← Volver a la biblioteca</a>';

  // Portada, con un brillo del color de la herramienta principal detrás
  html += '<header class="g-portada" style="--marca:' + colorPortada() + '">' +
    (logos.length ? '<div class="g-logos">' + logos.map(function (l) { return placaLogo(l, RAIZ); }).join("") + '</div>' : '') +
    '<div class="meta"><span class="tipo">' + (g.post ? 'Recurso · ' + g.post : 'Guía · ' + g.tema) + '</span>' +
    '<span class="g-dato">' + svgGuia("reloj") + g.min + ' min</span>' +
    (pasos ? '<span class="g-dato">' + pasos + ' pasos</span>' : '') +
    (prompts ? '<span class="g-dato">' + prompts + (prompts === 1 ? ' prompt' : ' prompts') + '</span>' : '') + '</div>' +
    '<h1>' + g.t + '</h1></header>';

  // En corto
  html += '<div class="g-corto glass"><span class="g-etq">En corto</span><p class="g-resumen">' + g.d + '</p>' +
    '<span class="g-etq">Ir directo a</span><nav class="g-atajos">' +
    atajos.map(function (a, i) { return '<a href="#' + a[0] + '"><em>' + dosCifras(i + 1) + '</em><span>' + a[1] + '</span>' + svgGuia("flecha") + '</a>'; }).join("") + '</nav>' +
    '<div class="g-tags">' + [g.tema].concat(logos.map(function (l) { return l.n; }))
      .filter(function (t, i, todas) { return todas.indexOf(t) === i; })
      .map(function (t) { return '<span>' + t + '</span>'; }).join("") + '</div></div>';

  // Ficha
  if (g.ficha) {
    html += '<section id="ficha" class="g-ficha glass"><span class="g-etq g-etq-pastilla">Ficha</span>' + (g.fichaNombre ? '<h2>' + g.fichaNombre + '</h2>' : '') + '<dl>' +
      g.ficha.map(function (f) { return '<div><dt><i>' + svgGuia(iconoFicha(f[0])) + '</i>' + f[0] + '</dt><dd>' + adornar(f[1]) + '</dd></div>'; }).join("") + '</dl></section>';
  }

  // Para qué sirve
  if (g.usos) {
    html += '<section id="usos"><span class="g-etq">Para qué lo vas a usar</span><div class="g-usos">' +
      g.usos.map(function (u) { return '<div class="g-uso uso-' + u.c + '"><span class="g-uso-etq">' + u.e + '</span><h3>' + u.t + '</h3><p>' + adornar(u.d) + '</p></div>'; }).join("") +
      '</div></section>';
  }

  // Partes numeradas, con icono según lo que llevan
  g.secciones.forEach(function (s, i) {
    var tipo = tipoParte(s);
    html += '<section id="parte-' + (i + 1) + '" class="g-parte"><span class="g-num"><i>' + svgGuia(tipo[0]) + '</i>' + dosCifras(i + 1) + ' · ' + tipo[1] + '</span><h2>' + s.h + '</h2>';
    (s.p || []).forEach(function (p) { html += '<p>' + adornar(p) + '</p>'; });
    if (s.lista) html += '<ul class="g-lista">' + s.lista.map(tarjetaLista).join("") + '</ul>';
    if (s.pasos) html += listaPasos(g.slug, i, s.pasos);
    (s.prompts || []).forEach(function (x) {
      html += '<div class="g-prompt glass"><div class="g-prompt-cab"><i>' + svgGuia("prompt") + '</i><span>' + x.t + '</span>' +
        '<button onclick="copiarGuia(this)">Copiar prompt</button></div><pre><code>' + huecos(x.c) + '</code></pre></div>';
    });
    if (s.aviso) html += '<div class="g-aviso"><i>' + svgGuia("ojo") + '</i><p><b>Ojo:</b> ' + adornar(s.aviso) + '</p></div>';
    html += '</section>';
  });

  // Preguntas
  if (g.faq && g.faq.length) {
    html += '<section id="preguntas" class="g-parte"><span class="g-num"><i>' + svgGuia("duda") + '</i>' + dosCifras(g.secciones.length + 1) + ' · Dudas</span><h2>Preguntas frecuentes</h2>' +
      g.faq.map(function (f) { return '<details class="glass"><summary>' + f.q + '</summary><p>' + adornar(f.a) + '</p></details>'; }).join("") + '</section>';
  }

  // Fuentes oficiales que respaldan la guía
  if (g.fuentes && g.fuentes.length) {
    html += '<section class="g-fuentes"><span class="g-etq">Fuentes</span><ul>' + g.fuentes.map(function (u) {
      var limpio = u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
      return '<li><a href="' + u + '" target="_blank" rel="noopener">' + limpio + '</a></li>';
    }).join("") + '</ul></section>';
  }

  // Siguiente paso de la ruta (si la guía está en una)
  html += siguienteDeRuta(g);

  // Sigue leyendo: mismo tema primero
  var rel = GUIAS_WEB.filter(function (x) { return x.slug !== g.slug && x.tema === g.tema; }).slice(0, 3);
  if (rel.length < 3) rel = rel.concat(GUIAS_WEB.filter(function (x) { return x.slug !== g.slug && rel.indexOf(x) < 0; }).slice(0, 3 - rel.length));
  html += '<section class="relacionadas"><span class="g-etq">Seguí leyendo</span><div class="rel">' + rel.map(function (x) {
    var l = logosDe(x)[0];
    return '<a class="glass" href="' + x.slug + '.html">' + (l ? placaLogo(l, RAIZ) : '') + '<span class="tipo">' + x.tema + '</span><b>' + x.t + '</b><small>' + x.min + ' min</small></a>';
  }).join("") + '</div></section>';

  html += '<div class="cta-card"><h3>¿Querés que te lo instale en tu negocio?</h3><p>Escribime por Instagram, contame qué hacés y te digo qué le automatizaría.</p><a class="btn-blanco" href="' + REDES.dm + '" target="_blank" rel="noopener">Escribime →</a></div>';
  caja.innerHTML = html;
  activarPasos(caja);
  caja.querySelectorAll(".g-progreso").forEach(function (b) {
    b.classList.toggle("completo", b.querySelector("b").textContent === String(b.nextElementSibling.querySelectorAll("li").length));
  });

  // Índice fijo al lado (solo en pantallas anchas): marca la parte que estás leyendo
  var indice = document.createElement("nav");
  indice.className = "g-indice";
  indice.innerHTML = '<span class="g-etq">En esta guía</span>' + atajos.map(function (a) { return '<a href="#' + a[0] + '">' + a[1] + '</a>'; }).join("");
  document.body.appendChild(indice);
  var enlaces = indice.querySelectorAll("a");
  function marcarIndice() {
    var actual = 0;
    atajos.forEach(function (a, i) { var el = document.getElementById(a[0]); if (el && el.getBoundingClientRect().top < 140) actual = i; });
    enlaces.forEach(function (e, i) { e.classList.toggle("activo", i === actual); });
  }
  window.addEventListener("scroll", marcarIndice, { passive: true });
  marcarIndice();
}

// Copia el prompt y cambia el texto del botón un momento
function copiarGuia(b) {
  var texto = b.closest(".g-prompt").querySelector("code").innerText;
  navigator.clipboard.writeText(texto).then(function () {
    b.textContent = "¡Copiado!";
    b.classList.add("hecho");
    setTimeout(function () { b.textContent = "Copiar prompt"; b.classList.remove("hecho"); }, 1600);
  });
}
