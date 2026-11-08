/* Biblioteca organizada: partes -> categorías -> tarjetas, con un índice arriba y un buscador que mira todo.
   Las partes y categorías vienen de web/categorias.js (generado desde contenido/orden.json).
   organizar(caja, items, tarjeta, { prefijo, visibles, palabra, buscar, leidas })
   Con op.grupos (lista de {id, e, n, d}) y op.clave (campo del item) arma una sola parte sin títulos de parte: lo usan Skills, MCP y Herramientas. */
function organizar(caja, items, tarjeta, op) {
  var leidas = op.leidas ? PROGRESO.leidas() : null;
  var clave = op.clave || "cat";
  var partes = op.grupos ? [{ id: "_", n: "", d: "" }] : PARTES;
  var cats = op.grupos ? op.grupos.map(function (g) { return { id: g.id, parte: "_", e: g.e, n: g.n, d: g.d }; }) : CATEGORIAS;
  var porCat = {};
  items.forEach(function (x) { (porCat[x[clave]] = porCat[x[clave]] || []).push(x); });
  var pref = op.prefijo, visibles = op.visibles || 4, palabra = op.palabra || "guías";

  // Índice: un mapa con una columna por parte (o una sola fila de botones en Skills, MCP y Herramientas)
  var indice;
  if (op.grupos) {
    indice = '<nav class="org-indice org-indice--simple" aria-label="Categorías"><div class="org-chips">' + cats.filter(function (c) { return porCat[c.id]; }).map(function (c) {
      return '<a class="org-chip" href="#' + pref + c.id + '">' + ICONOS_CAT(c.id) + c.n + '<b>' + porCat[c.id].length + '</b></a>';
    }).join("") + '</div></nav>';
  } else {
    indice = '<nav class="org-mapa" aria-label="Categorías">' + partes.map(function (p, i) {
      var enParte = cats.filter(function (c) { return c.parte === p.id && porCat[c.id]; });
      if (!enParte.length) return "";
      var total = enParte.reduce(function (t, c) { return t + porCat[c.id].length; }, 0);
      return '<div class="org-col"><a class="org-col-cab" href="#' + pref + 'parte-' + p.id + '"><b>' + (i + 1) + '</b><span><small>Parte ' + (i + 1) + '</small>' + p.n.replace(/^Parte \d+ · /, "") + '</span><em>' + total + '</em></a>' +
        enParte.map(function (c) {
          return '<a class="org-fila-cat' + (c.destacada ? ' org-fila-cat--dest' : '') + '" href="#' + pref + c.id + '">' + ICONOS_CAT(c.id) + '<span>' + c.n + '</span><b>' + porCat[c.id].length + '</b></a>';
        }).join("") + '</div>';
    }).join("") + '</nav>';
  }

  var cuerpo = partes.map(function (p, i) {
    var enParte = cats.filter(function (c) { return c.parte === p.id && porCat[c.id]; });
    if (!enParte.length) return "";
    return '<div class="org-parte" id="' + pref + 'parte-' + p.id + '">' + (op.grupos ? '' : '<div class="org-parte-cab"><span class="mono">Parte ' + (i + 1) + '</span><h3>' + p.n.replace(/^Parte \d+ · /, "") + '</h3><p>' + p.d + '</p></div>') +
      enParte.map(function (c) {
        var lista = porCat[c.id], mas = lista.length - visibles;
        return '<div class="org-cat' + (c.destacada ? ' org-cat--dest' : '') + '" id="' + pref + c.id + '">' +
          '<header class="org-cat-cab"><i>' + ICONOS_CAT(c.id) + '</i><div><h4>' + c.n + '</h4><p>' + c.d + '</p></div><span>' +
          (leidas ? lista.filter(function (x) { return leidas[x.slug]; }).length + ' de ' + lista.length + ' leídas' : lista.length + ' ' + palabra) + '</span></header>' +
          '<div class="herrs org-lista">' + lista.map(function (x, k) { return tarjeta(x).replace(/^<(\w+) class="/, '<$1 class="' + (k >= visibles ? 'org-extra ' : '') + (leidas && leidas[x.slug] ? 'leida ' : '')); }).join("") + '</div>' +
          (mas > 0 ? '<button type="button" class="org-mas chip" data-n="' + lista.length + '">Ver las ' + lista.length + ' ' + palabra + ' ↓</button>' : '') +
          '</div>';
      }).join("") + '</div>';
  }).join("");

  caja.innerHTML = '<label class="buscar buscar-seccion">' + ICONO.lupa + '<input type="search" placeholder="' + op.buscar + '" autocomplete="off"></label>' +
    indice + cuerpo + '<p class="sin-resultados-seccion">No hay nada con esa palabra en esta sección.</p>';

  caja.addEventListener("click", function (e) {
    var b = e.target.closest(".org-mas");
    if (b) {
      var cat = b.closest(".org-cat"), abierta = cat.classList.toggle("abierta");
      b.textContent = abierta ? "Ver menos ↑" : "Ver las " + b.dataset.n + " " + palabra + " ↓";
      if (!abierta) cat.scrollIntoView({ block: "start" });
      return;
    }
    var a = e.target.closest(".org-chip, .org-fila-cat, .org-col-cab");
    if (a) {
      e.preventDefault();
      var destino = document.getElementById(a.getAttribute("href").slice(1));
      if (destino) destino.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  var input = caja.querySelector("input"), aviso = caja.querySelector(".sin-resultados-seccion");
  input.addEventListener("input", function () {
    var q = input.value.trim().toLowerCase(), total = 0;
    caja.classList.toggle("org-buscando", !!q);
    caja.querySelectorAll(".org-cat").forEach(function (cat) {
      var vistos = 0;
      cat.querySelectorAll(".org-lista > *").forEach(function (el) {
        var ok = !q || (el.getAttribute("data-buscar") || "").toLowerCase().indexOf(q) > -1;
        el.classList.toggle("no-coincide-seccion", !ok);
        if (ok) vistos++;
      });
      cat.hidden = !!q && !vistos;
      total += vistos;
    });
    caja.querySelectorAll(".org-parte").forEach(function (p) { p.hidden = !p.querySelector(".org-cat:not([hidden])"); });
    aviso.style.display = q && !total ? "block" : "none";
  });
}
