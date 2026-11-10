// Classroom: «Sigue donde te quedaste», el plan y las fases con sus módulos (tarjetas con candado y progreso).
(function () {
  var esc = FJ.esc, svg = FJ.svg;
  var candado = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

  function pintar() {
    var leidas = PROGRESO.leidas(), ult = PROGRESO.ultima();
    var totalVistas = GUIAS_WEB.filter(function (g) { return leidas[g.slug]; }).length;

    // Saludo y en qué fase vas
    var actual = null;
    MODULOS.fases.some(function (f) { return f.modulos.some(function (m) { var e = MODULOS.estado(m, leidas); if (!e.bloqueado && e.vistas < m.guias.length && e.siguiente) { actual = { f: f, m: m }; return true; } }); });
    if (FJ.nombre) document.getElementById("cl-titulo").textContent = "Hola, " + FJ.nombre + ". " + (actual ? "Vas por la Fase " + actual.f.numero + "." : "Este es tu camino.");
    document.getElementById("cl-eyebrow").textContent = "Classroom · " + MODULOS.fases.length + " fases · " + MODULOS.lista.length + " módulos";

    // Sigue donde te quedaste (o empieza por aquí)
    var g = ult && GUIAS_WEB.filter(function (x) { return x.slug === ult.slug && MODULOS.abierta(x) && !leidas[x.slug]; })[0];
    var etiqueta = "Sigue donde te quedaste";
    if (!g) {
      etiqueta = totalVistas ? "Tu próximo paso" : "Empieza por aquí";
      g = actual && MODULOS.estado(actual.m, leidas).siguiente;
    }
    var caja = document.getElementById("cl-seguir");
    if (g) {
      var m = MODULOS.deGuia(g.slug), pos = m ? m.guias.indexOf(g) + 1 : 0;
      caja.href = "/guias/" + g.slug;
      caja.innerHTML = '<small>' + etiqueta + '</small><b>' + esc(g.t) + '</b><span>' + (m ? m.codigo + ' · ' + esc(m.nombre) + ' · guía ' + pos + ' de ' + m.guias.length + ' · ' : '') + g.min + ' min</span><em>Continuar →</em>';
    } else {
      caja.href = "/?plan=1#precio";
      caja.innerHTML = '<small>Leíste todo lo abierto</small><b>Desbloquea las ' + GUIAS_WEB.length + ' guías y sigue el camino</b><em>Ver el acceso →</em>';
    }

    // Plan gratis
    if (MODULOS.gratis) {
      var ab = GUIAS_WEB.filter(function (x) { return x.gratis; }).length, plan = document.getElementById("cl-plan");
      plan.hidden = false;
      plan.innerHTML = '<div><b>Plan gratis: tienes abiertas <span style="color:var(--fj-acento-txt)">' + ab + ' de ' + GUIAS_WEB.length + ' guías</span></b>' +
        '<div class="fj-barra"><i style="width:' + Math.round(ab / GUIAS_WEB.length * 100) + '%"></i></div></div>' +
        '<p>Acceso completo: las ' + GUIAS_WEB.length + ' guías, los prompts, los sistemas y todo lo que se sume. Un solo pago, para siempre.</p>' +
        '<a class="fj-btn fj-btn-primario" href="/?plan=1#precio">Desbloquear todo</a>';
    }

    // Fases y módulos
    document.getElementById("cl-fases").innerHTML = MODULOS.fases.map(function (f) {
      var vistasFase = f.modulos.reduce(function (t, m) { return t + MODULOS.estado(m, leidas).vistas; }, 0);
      return '<section class="fj-fase" id="fase-' + f.numero + '"><div class="fj-fase-cab"><div><span class="fj-eyebrow">Fase ' + f.numero + '</span><h2>' + esc(f.nombre) + '</h2><p>' + esc(f.desc) + '</p></div>' +
        '<span class="fj-fase-meta">' + f.modulos.length + ' módulos · ' + f.guias + ' guías' + (vistasFase ? ' · ' + Math.round(vistasFase / f.guias * 100) + '% hecho' : '') + '</span></div>' +
        '<div class="fj-modulos">' + f.modulos.map(function (m) {
          var e = MODULOS.estado(m, leidas);
          var esActual = actual && actual.m === m;
          var href = e.bloqueado ? "/?bloqueada=" + m.guias[0].slug + "#precio" : "/guias/" + e.siguiente.slug;
          var chip = esActual ? (e.vistas ? "En curso" : "Empieza aquí") : e.estado;
          var meta = m.guias.length + ' guías · ' + (e.bloqueado ? 'todas con candado' : (MODULOS.gratis && e.abiertas < m.guias.length ? e.abiertas + ' abiertas · ' : '') + e.vistas + ' vistas');
          return '<a class="fj-card fj-modulo' + (esActual ? ' actual' : '') + (e.bloqueado ? ' bloqueado' : '') + '" href="' + href + '" aria-label="' + m.codigo + ' ' + esc(m.nombre) + (e.bloqueado ? ', bloqueado' : '') + '">' +
            '<div class="fj-portada"><span class="cod">' + m.codigo + '</span><span class="nom">' + esc(m.nombre) + '</span><span class="sello"><i></i>FORJA IA</span>' +
            '<span class="fj-estado' + (e.estado === "Completo" ? ' completo' : '') + '">' + chip.toUpperCase() + '</span>' +
            (e.bloqueado ? '<div class="fj-candado"><span>' + candado + 'Solo en el acceso completo</span></div>' : '') + '</div>' +
            '<div class="fj-modulo-cuerpo"><h3><span>' + m.codigo + '</span>' + esc(m.nombre) + '</h3><p>' + esc(m.desc) + '</p><span class="meta">' + meta + '</span><span class="esp"></span>' +
            (e.bloqueado ? '<span class="fj-lock">' + candado + 'Bloqueado</span>'
              : '<span class="prog"><span class="fj-barra"><i style="width:' + e.pct + '%"></i></span><span>' + e.pct + '%</span></span>') +
            '</div></a>';
        }).join("") + '</div></section>';
    }).join("");
  }
  pintar();
  if (PROGRESO.sincronizar) PROGRESO.sincronizar.then(function (cambio) { if (cambio) pintar(); });
})();
