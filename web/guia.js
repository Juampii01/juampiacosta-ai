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
// Descarga un archivo generado en el navegador
function bajar(nombre, datos, tipo) {
  var url = URL.createObjectURL(new Blob([datos], { type: tipo }));
  var a = document.createElement("a");
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
}

// ZIP sin compresión (método «store»): alcanza para archivos de texto y lo abre cualquier sistema
function zip(archivos) {
  var enc = new TextEncoder(), partes = [], central = [], offset = 0;
  var tabla = zip.tabla || (zip.tabla = (function () {
    var t = [];
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })());
  function crc(bytes) { var c = 0xffffffff; for (var i = 0; i < bytes.length; i++) c = tabla[(c ^ bytes[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  function cab(tam) { var b = new DataView(new ArrayBuffer(tam)); return b; }
  archivos.forEach(function (f) {
    var nombre = enc.encode(f.archivo), datos = enc.encode(f.contenido), c = crc(datos);
    var l = cab(30);
    l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x0800, true); l.setUint16(8, 0, true);
    l.setUint32(14, c, true); l.setUint32(18, datos.length, true); l.setUint32(22, datos.length, true); l.setUint16(26, nombre.length, true);
    partes.push(new Uint8Array(l.buffer), nombre, datos);
    var d = cab(46);
    d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint16(8, 0x0800, true);
    d.setUint32(16, c, true); d.setUint32(20, datos.length, true); d.setUint32(24, datos.length, true); d.setUint16(28, nombre.length, true);
    d.setUint32(42, offset, true);
    central.push(new Uint8Array(d.buffer), nombre);
    offset += 30 + nombre.length + datos.length;
  });
  var tamCentral = central.reduce(function (t, x) { return t + x.length; }, 0);
  var fin = cab(22);
  fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, tamCentral, true); fin.setUint32(16, offset, true);
  return new Blob(partes.concat(central, [new Uint8Array(fin.buffer)]));
}

function fechaLarga(iso) {
  var m = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var p = String(iso).split("-");
  return p.length === 3 ? (+p[2]) + " de " + m[+p[1] - 1] + " de " + p[0] : iso;
}

function svgGuia(id) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONO_GUIA[id] + '</svg>';
}

function dosCifras(n) { return (n < 10 ? "0" : "") + n; }

/** Repos de GitHub (autor, nombre) que aparecen en cualquier parte de la guía, sin repetir. */
function creditosDe(g) {
  var vistos = {}, salida = [], re = /github\.com\/([\w-]+)\/([\w.-]+)/g, m;
  var texto = JSON.stringify(g);
  while ((m = re.exec(texto))) {
    var autor = m[1], repo = m[2].replace(/\.git$/, "").replace(/\.+$/, "");
    if (!repo || autor === "en" || autor === "orgs" || autor === "settings") continue;
    var k = (autor + "/" + repo).toLowerCase();
    if (vistos[k]) continue;
    vistos[k] = 1; salida.push([autor, repo]);
  }
  return salida;
}

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
        '<h3>¡Terminaste la ruta!</h3><p>Elige otra ruta para seguir aprendiendo.</p><span class="g-ruta-boton">Ver las rutas' + svgGuia("flecha") + '</span></a>';
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
  if (g.ejemplo) atajos.push(["ejemplo", "Ejemplo resuelto"]);
  if (g.si_falla && g.si_falla.length) atajos.push(["si-falla", "Si algo falla"]);
  if (g.kit && g.kit.length) atajos.push(["kit", "Tu kit"]);
  if (g.faq && g.faq.length) atajos.push(["preguntas", "Preguntas"]);

  var html = '<a class="volver" href="' + RAIZ + 'recursos.html#' + (g.post ? 'posts' : 'guias-web') + '">← Volver a la biblioteca</a>';

  // Portada, con un brillo del color de la herramienta principal detrás
  html += '<header class="g-portada" style="--marca:' + colorPortada() + '">' +
    (logos.length ? '<div class="g-logos">' + logos.map(function (l) { return placaLogo(l, RAIZ); }).join("") + '</div>' : '') +
    '<div class="meta"><span class="tipo">' + (g.post ? 'Recurso · ' + g.post : 'Guía · ' + g.tema) + '</span>' +
    '<span class="g-dato">' + svgGuia("reloj") + g.min + ' min</span>' +
    (pasos ? '<span class="g-dato">' + pasos + ' pasos</span>' : '') +
    (prompts ? '<span class="g-dato">' + prompts + (prompts === 1 ? ' prompt' : ' prompts') + '</span>' : '') +
    (g.kit && g.kit.length ? '<span class="g-dato">' + svgGuia("caja") + 'Kit de ' + g.kit.length + (g.kit.length === 1 ? ' archivo' : ' archivos') + '</span>' : '') +
    (g.verificada ? '<span class="g-dato g-verificada" title="Cada dato revisado contra la documentación oficial">' + svgGuia("check") + 'Verificada el ' + fechaLarga(g.verificada) + '</span>' : '') + '</div>' +
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
        '<button onclick="copiarGuia(this)">Copiar prompt</button></div><pre><code>' + huecos(esc(x.c)) + '</code></pre></div>';
    });
    if (s.aviso) html += '<div class="g-aviso"><i>' + svgGuia("ojo") + '</i><p><b>Ojo:</b> ' + adornar(s.aviso) + '</p></div>';
    html += '</section>';
  });

  // Ejemplo resuelto, si algo falla y kit descargable (vienen de contenido/mejoras/)
  var n = g.secciones.length;
  if (g.ejemplo) {
    var ej = g.ejemplo; n++;
    html += '<section id="ejemplo" class="g-parte"><span class="g-num"><i>' + svgGuia("persona") + '</i>' + dosCifras(n) + ' · Ejemplo</span><h2>' + ej.titulo + '</h2>' +
      '<div class="g-ejemplo glass"><div class="g-ej-quien"><span class="g-etq">El negocio</span><p>' + adornar(ej.negocio) + '</p></div>' +
      '<div class="g-ej-antes"><span class="g-etq">Antes</span><p>' + adornar(ej.punto_de_partida) + '</p></div>' +
      '<ol class="g-ej-pasos">' + ej.pasos.map(function (p) { return '<li>' + adornar(p) + '</li>'; }).join("") + '</ol>' +
      '<div class="g-ej-fin"><span class="g-etq">Cómo quedó</span><p>' + adornar(ej.resultado) + '</p></div>' +
      '<p class="g-ej-nota">Ejemplo ilustrativo: el negocio es inventado, los pasos son los de esta guía.</p></div></section>';
  }
  if (g.si_falla && g.si_falla.length) {
    n++;
    html += '<section id="si-falla" class="g-parte"><span class="g-num"><i>' + svgGuia("ojo") + '</i>' + dosCifras(n) + ' · Si algo falla</span><h2>Si algo no sale como esperabas</h2>' +
      '<div class="g-fallas">' + g.si_falla.map(function (f) {
        return '<details class="glass"><summary>' + f.sintoma + '</summary><p>' + adornar(f.solucion) + '</p></details>';
      }).join("") + '</div></section>';
  }
  if (g.kit && g.kit.length) {
    n++;
    html += '<section id="kit" class="g-parte"><span class="g-num"><i>' + svgGuia("caja") + '</i>' + dosCifras(n) + ' · Kit</span><h2>Tu kit para descargar</h2>' +
      '<p>Archivos listos para usar con esta guía. Los armamos nosotros: no los vas a encontrar en otro lado.</p><div class="g-kit">' +
      g.kit.map(function (k, i) {
        return '<div class="g-kit-item glass"><i>' + svgGuia("instalar") + '</i><div><b>' + esc(k.archivo) + '</b><span>' + adornar(k.que_es) + '</span></div>' +
          '<button type="button" data-kit="' + i + '">Descargar</button></div>';
      }).join("") + (g.kit.length > 1 ? '<button type="button" class="g-kit-todo" data-kit="todo">Descargar todo el kit</button>' : '') + '</div></section>';
  }

  // Preguntas
  if (g.faq && g.faq.length) {
    html += '<section id="preguntas" class="g-parte"><span class="g-num"><i>' + svgGuia("duda") + '</i>' + dosCifras(g.secciones.length + 1) + ' · Dudas</span><h2>Preguntas frecuentes</h2>' +
      g.faq.map(function (f) { return '<details class="glass"><summary>' + f.q + '</summary><p>' + adornar(f.a) + '</p></details>'; }).join("") + '</section>';
  }

  // Créditos: cada repo de GitHub que aparece en la guía, con su autor
  var repos = creditosDe(g);
  if (repos.length) {
    html += '<section class="g-fuentes g-creditos"><span class="g-etq">Créditos</span><p>Estos proyectos son de sus autores. Aquí solo te explicamos para qué sirven y cómo usarlos. Si te sirven, dales una estrella en GitHub.</p><ul>' + repos.map(function (r) {
      return '<li><a href="https://github.com/' + r[0] + '/' + r[1] + '" target="_blank" rel="noopener">' + r[1] + '</a> · de ' + r[0] + '</li>';
    }).join("") + '</ul></section>';
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
  html += '<section class="relacionadas"><span class="g-etq">Sigue leyendo</span><div class="rel">' + rel.map(function (x) {
    var l = logosDe(x)[0];
    return '<a class="glass" href="' + x.slug + '.html">' + (l ? placaLogo(l, RAIZ) : '') + '<span class="tipo">' + x.tema + '</span><b>' + x.t + '</b><small>' + x.min + ' min</small></a>';
  }).join("") + '</div></section>';

  // Plan gratis: después de una guía abierta, mostrar lo que hay del otro lado
  if (/(?:^|;\s*)jpa_nivel=gratis/.test(document.cookie)) {
    var abiertas = GUIAS_WEB.filter(function (x) { return x.gratis; }).length;
    html += '<a class="g-mas-acceso glass" href="/?plan=1#precio"><span class="g-etq">Plan gratis</span><b>Tienes abiertas ' + abiertas + ' de las ' + GUIAS_WEB.length + ' guías de la biblioteca.</b>' +
      '<span>Con el acceso completo abres las ' + (GUIAS_WEB.length - abiertas) + ' que faltan, más los prompts para copiar y las herramientas con su instalación.</span><em>Ver el acceso completo →</em></a>';
  }
  html += '<div class="cta-card"><h3>¿Quieres que te lo instale en tu negocio?</h3><p>Escríbeme por Instagram, cuéntame qué haces y te digo qué le automatizaría.</p><a class="btn-blanco" href="' + REDES.dm + '" target="_blank" rel="noopener">Escríbeme →</a></div>';
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

  // Descargas del kit: los archivos salen del contenido de la guía (sin servidor).
  // Un archivo dentro de una carpeta (por ejemplo una skill: carpeta/SKILL.md) baja como .zip con su carpeta,
  // que es como se sube una skill a Claude. «Descargar todo» arma un solo .zip con el kit entero.
  caja.addEventListener("click", function (e) {
    var b = e.target.closest("[data-kit]");
    if (!b) return;
    if (b.dataset.kit === "todo") bajar(g.slug + "-kit.zip", zip(g.kit), "application/zip");
    else {
      var k = g.kit[+b.dataset.kit];
      if (k.archivo.indexOf("/") > -1) bajar(k.archivo.split("/")[0] + ".zip", zip([k]), "application/zip");
      else bajar(k.archivo, k.contenido, "text/plain;charset=utf-8");
    }
    b.textContent = "✓ Descargado";
  });

  // Progreso: la guía queda como «última abierta» y se marca leída al llegar al final
  PROGRESO.abrir(g.slug);
  var fin = caja.querySelector(".relacionadas") || caja.querySelector(".cta-card");
  if (fin && "IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      obs.disconnect();
      if (PROGRESO.marcar(g.slug)) {
        var t = document.createElement("div");
        t.className = "g-leida-toast";
        var total = Object.keys(PROGRESO.leidas()).length;
        t.textContent = "✓ Guía leída · llevas " + total + " de " + GUIAS_WEB.length;
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 3200);
      }
    }, { threshold: .2 });
    obs.observe(fin);
  }
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
