// Piezas comunes: iconos, cabecera, buscador, copiar y «Ver todos»
var ICONO = {
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  yt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .6 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-4.8 31 31 0 0 0-.4-4.8zM9.7 15.1V8.9L15.5 12z"/></svg>',
  lupa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  bajar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12m0 0-5-5m5 5 5-5M5 20h14"/></svg>'
};

// Logo: monograma «J» en el color de la marca
var LOGO = '<i class="logo"><svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#ff5a1f"/><path d="M38 16v22a10 10 0 0 1-20 0" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg></i>';

function cabecera() {
  return '<header class="cab glass">' +
    '<a class="marca" href="#">' + LOGO + '<span>juampiacosta<b>.ai</b></span></a>' +
    '<nav><div class="redes">' +
    '<a class="red" href="' + REDES.ig + '" target="_blank" rel="noopener">' + ICONO.ig + '<span class="txt">' + REDES.igUsuario + '</span></a>' +
    '</div><a class="btn" href="' + REDES.dm + '" target="_blank" rel="noopener"><span>Escribime<span class="largo"> por Instagram</span></span>→</a></nav><i class="progreso"></i></header>';
}

window.addEventListener("scroll", function () {
  var barra = document.querySelector(".progreso");
  if (!barra) return;
  var max = document.documentElement.scrollHeight - innerHeight;
  barra.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
}, { passive: true });

// Filtra todo lo que tenga [data-buscar] por el texto escrito
function activarBuscador(input) {
  input.addEventListener("input", function () {
    var q = input.value.trim().toLowerCase();
    var vistos = 0;
    // Mientras buscas se ven todos los resultados, aunque la sección esté recogida
    document.body.classList.toggle("buscando", !!q);
    document.querySelectorAll("[data-buscar]").forEach(function (el) {
      var ok = !q || el.getAttribute("data-buscar").toLowerCase().indexOf(q) > -1;
      el.classList.toggle("no-coincide", !ok);
      if (ok) vistos++;
    });
    var nada = document.querySelector(".sin-resultados");
    if (nada) nada.style.display = vistos ? "none" : "block";
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== input) { e.preventDefault(); input.focus(); }
  });
}

// Solo dice «Copiado» si de verdad se copió; si el navegador no deja, selecciona el texto para copiarlo a mano
function copiar(boton) {
  var code = boton.parentNode.querySelector("code");
  function aviso(texto) {
    boton.textContent = texto;
    setTimeout(function () { boton.textContent = "Copiar"; }, 1500);
  }
  function seleccionar() {
    var rango = document.createRange();
    rango.selectNodeContents(code);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(rango);
    aviso("Seleccionalo y copialo");
  }
  if (!navigator.clipboard) return seleccionar();
  navigator.clipboard.writeText(code.textContent).then(function () { aviso("Copiado ✓"); }, seleccionar);
}

// Buscador propio de una sección: filtra solo esa lista. El buscador grande de arriba sigue buscando en todo.
function buscadorSeccion(lista, texto) {
  var caja = document.createElement("label");
  caja.className = "buscar buscar-seccion";
  caja.innerHTML = ICONO.lupa + '<input type="search" placeholder="' + texto + '" autocomplete="off">';
  lista.parentNode.insertBefore(caja, lista);
  var input = caja.querySelector("input");
  var aviso = document.createElement("p");
  aviso.className = "sin-resultados-seccion";
  aviso.textContent = "No hay nada con esa palabra en esta sección.";
  lista.after(aviso);
  input.addEventListener("input", function () {
    var q = input.value.trim().toLowerCase();
    var vistos = 0;
    // Mientras buscas en la sección se ven todos los que coinciden, aunque la lista esté recogida
    lista.classList.toggle("buscando-seccion", !!q);
    Array.prototype.forEach.call(lista.children, function (el) {
      var ok = !q || (el.getAttribute("data-buscar") || "").toLowerCase().indexOf(q) > -1;
      el.classList.toggle("no-coincide-seccion", !ok);
      if (ok) vistos++;
    });
    aviso.style.display = q && !vistos ? "block" : "none";
  });
}

// Muestra solo los primeros `n` elementos de una lista y un botón «Ver todos» para el resto
function recoger(lista, n, etiqueta) {
  var items = lista.children;
  if (items.length <= n) return;
  for (var i = n; i < items.length; i++) items[i].classList.add("extra");
  var boton = document.createElement("button");
  boton.className = "ver-todos chip";
  boton.textContent = "Ver " + (etiqueta || "todos") + " (" + items.length + ") ↓";
  boton.addEventListener("click", function () {
    var abierta = lista.classList.toggle("abierta");
    boton.textContent = abierta ? "Ver menos ↑" : "Ver " + (etiqueta || "todos") + " (" + items.length + ") ↓";
    if (!abierta) lista.scrollIntoView({ block: "start" });
  });
  lista.after(boton);
}

function buscable(o) {
  return [o.t || o.n, o.d || "", o.cat || ""].join(" ").replace(/"/g, "");
}
