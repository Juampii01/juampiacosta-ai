// Guía dentro de la plataforma: ruta arriba, acciones (vista, copiar para Claude, anterior/siguiente),
// saltos a las partes, el contenido (pintarGuia de guia.js) y la lista de guías del módulo a la derecha.
(function () {
  var g = GUIA, esc = FJ.esc;
  var candado = '<svg width="16" height="16" style="flex:none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>';

  pintarGuia(document.getElementById("guia"), g);
  var mod = MODULOS.deGuia(g.slug);
  var guias = mod ? mod.guias : [];
  var pos = guias.map(function (x) { return x.slug; }).indexOf(g.slug);

  document.getElementById("fj-miga").innerHTML = '<a href="/recursos">Classroom</a><span aria-hidden="true">›</span>' +
    (mod ? '<a href="/recursos#fase-' + (MODULOS.fases.filter(function (f) { return f.id === mod.parte; })[0] || {}).numero + '">' + mod.codigo + ' · ' + esc(mod.nombre) + '</a><span aria-hidden="true">›</span><b>Guía ' + (pos + 1) + ' de ' + guias.length + '</b>' : '<b>' + esc(g.t) + '</b>');

  // Acciones
  function vecina(paso) {
    for (var i = pos + paso; i >= 0 && i < guias.length; i += paso) return guias[i];
    return null;
  }
  var ant = vecina(-1), sig = vecina(1);
  var acc = document.getElementById("fj-acciones");
  function pintarAcciones() {
    var vista = !!PROGRESO.leidas()[g.slug];
    acc.innerHTML = '<button type="button" class="fj-btn fj-btn-borde' + (vista ? ' hecho' : '') + '" id="fj-vista"' + (vista ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + (vista ? check + 'Vista' : '<span style="width:16px;height:16px;border-radius:50%;border:1.5px solid var(--fj-muted)"></span>Marcar como vista') + '</button>' +
      '<button type="button" class="fj-btn fj-btn-borde" id="fj-copiar">Copiar para Claude</button>' +
      '<a class="fj-btn fj-btn-borde" href="/maestro?guia=' + g.slug + '">✦ Pregúntale a Maestro</a><span class="esp"></span>' +
      (ant ? '<a class="fj-btn fj-btn-borde" href="/guias/' + ant.slug + '" aria-label="Guía anterior: ' + esc(ant.t) + '">←</a>' : '') +
      (sig ? (MODULOS.abierta(sig) ? '<a class="fj-btn fj-btn-primario" href="/guias/' + sig.slug + '">Siguiente guía →</a>'
        : '<a class="fj-btn fj-btn-primario" href="/?plan=1#precio">' + candado + 'Siguiente: acceso completo</a>') : '<a class="fj-btn fj-btn-primario" href="/recursos">Volver al Classroom</a>');
    document.getElementById("fj-vista").addEventListener("click", function () { PROGRESO.marcar(g.slug); pintarAcciones(); pintarLista(); });
    document.getElementById("fj-copiar").addEventListener("click", function () {
      var b = this, txt = "# " + g.t + "\n\n" + g.d + "\n\n" + g.secciones.map(function (s) {
        return "## " + s.h + "\n" + (s.p || []).join("\n\n") + (s.lista ? "\n" + s.lista.map(function (x) { return "- " + (typeof x === "string" ? x : (x.t ? x.t + ": " : "") + (x.d || "")); }).join("\n") : "") +
          (s.pasos ? "\n" + s.pasos.map(function (x, i) { return (i + 1) + ". " + x; }).join("\n") : "") +
          (s.prompts ? "\n" + s.prompts.map(function (x) { return "Prompt «" + x.t + "»:\n" + x.c; }).join("\n\n") : "");
      }).join("\n\n") + "\n\nUsa esta guía para ayudarme paso a paso con mi caso.";
      navigator.clipboard.writeText(txt).then(function () { b.textContent = "Copiado ✓"; setTimeout(function () { b.textContent = "Copiar para Claude"; }, 1600); });
    });
  }
  pintarAcciones();

  // Saltos a las partes que importan
  var saltos = [["guia", "Tutorial"]];
  var conPrompt = document.querySelector("#guia .g-prompt");
  if (conPrompt) saltos.push([conPrompt.closest("section").id, "Prompts"]);
  [["ejemplo", "Ejemplo"], ["si-falla", "Si algo falla"], ["kit", "Kit"], ["preguntas", "Preguntas"]].forEach(function (s) { if (document.getElementById(s[0])) saltos.push(s); });
  var fu = document.querySelector("#guia .g-fuentes");
  if (fu) { fu.id = "fuentes"; saltos.push(["fuentes", "Fuentes"]); }
  var nav = document.getElementById("fj-saltos");
  nav.innerHTML = saltos.map(function (s, i) { return '<a href="#' + s[0] + '"' + (i === 0 ? ' class="activo"' : '') + '>' + s[1] + '</a>'; }).join("");
  if (saltos.length < 3) nav.hidden = true;
  var links = nav.querySelectorAll("a");
  window.addEventListener("scroll", function () {
    var actual = 0;
    saltos.forEach(function (s, i) { var el = document.getElementById(s[0]); if (el && el.getBoundingClientRect().top < 180) actual = i; });
    links.forEach(function (a, i) { a.classList.toggle("activo", i === actual); });
  }, { passive: true });

  // Lista del módulo
  function pintarLista() {
    var caja = document.getElementById("fj-lista");
    if (!mod) { caja.hidden = true; return; }
    var leidas = PROGRESO.leidas(), e = MODULOS.estado(mod, leidas);
    var cerradas = guias.length - e.abiertas;
    caja.innerHTML = '<a class="fj-lista-cab" href="/recursos"><span class="mini">' + mod.codigo + '</span><div><b>' + esc(mod.nombre) + '</b><small>' + e.vistas + ' de ' + guias.length + ' vistas' + (MODULOS.gratis ? ' · ' + e.abiertas + ' abiertas' : '') + '</small></div>' +
      '<span class="fj-anillo" style="--p:' + e.pct + '">' + e.pct + '%</span></a>' +
      '<div class="fj-lista"><div class="fj-lista-tit">GUÍAS</div>' + guias.map(function (x, i) {
        var bloq = !MODULOS.abierta(x), vista = !!leidas[x.slug], actual = x.slug === g.slug;
        return '<a class="fj-fila' + (actual ? ' actual' : '') + (vista ? ' vista' : '') + (bloq ? ' bloq' : '') + '" href="' + (bloq ? '/?plan=1#precio' : '/guias/' + x.slug) + '"' + (actual ? ' aria-current="page"' : '') + ' aria-label="' + esc(x.t) + (bloq ? ', bloqueada' : vista ? ', vista' : '') + '">' +
          '<span class="marca">' + (vista ? '✓' : (i < 9 ? '0' : '') + (i + 1)) + '</span><span class="t">' + esc(x.t) + '</span>' + (bloq ? candado : '<small>' + x.min + ' min</small>') + '</a>';
      }).join("") + '</div>' +
      (MODULOS.gratis && cerradas ? '<div class="fj-lista-pie">' + cerradas + (cerradas === 1 ? ' guía de este módulo está' : ' guías de este módulo están') + ' en el acceso completo.<a class="fj-btn fj-btn-primario" href="/?plan=1#precio">Desbloquear todo</a></div>' : '');
    var act = caja.querySelector(".fj-fila.actual");
    if (act) { var l = caja.querySelector(".fj-lista"); l.scrollTop = act.offsetTop - l.offsetTop - 60; }
  }
  pintarLista();
  if (PROGRESO.sincronizar) PROGRESO.sincronizar.then(function (c) { if (c) { pintarLista(); pintarAcciones(); } });
})();
