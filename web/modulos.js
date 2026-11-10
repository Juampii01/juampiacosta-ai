// Fases y módulos del Classroom, armados desde contenido/orden.json (PARTES y CATEGORIAS de categorias.js) y GUIAS_WEB.
// Cada parte es una fase; cada categoría, un módulo (M01, M02…). Lo usan el Classroom y la lista de la derecha de cada guía.
var MODULOS = (function () {
  function cookieNivel() { var m = document.cookie.match(/(?:^|;\s*)jpa_nivel=(pago|gratis)/); return m ? m[1] : "pago"; }
  var gratis = cookieNivel() === "gratis";
  var n = 0;
  var lista = CATEGORIAS.map(function (c) {
    n++;
    var guias = GUIAS_WEB.filter(function (g) { return g.cat === c.id; });
    return { id: c.id, parte: c.parte, codigo: "M" + (n < 10 ? "0" : "") + n, nombre: c.n, desc: c.d, guias: guias };
  }).filter(function (m) { return m.guias.length; });
  var fases = PARTES.map(function (p, i) {
    var mods = lista.filter(function (m) { return m.parte === p.id; });
    return { id: p.id, numero: i + 1, nombre: p.n.split(" · ").slice(-1)[0], desc: p.d, modulos: mods,
      guias: mods.reduce(function (t, m) { return t + m.guias.length; }, 0) };
  });
  function abierta(g) { return !gratis || g.gratis; }
  function estado(m, leidas) {
    var vistas = m.guias.filter(function (g) { return leidas[g.slug]; }).length;
    var abiertas = m.guias.filter(abierta).length;
    var bloqueado = abiertas === 0;
    var pct = Math.round(vistas / m.guias.length * 100);
    var e = bloqueado ? "Bloqueado" : vistas === 0 ? "Sin empezar" : vistas >= m.guias.length ? "Completo" : "En curso";
    var siguiente = m.guias.filter(function (g) { return abierta(g) && !leidas[g.slug]; })[0] || m.guias.filter(abierta)[0];
    return { vistas: vistas, abiertas: abiertas, bloqueado: bloqueado, pct: pct, estado: e, siguiente: siguiente };
  }
  function deGuia(slug) {
    for (var i = 0; i < lista.length; i++) if (lista[i].guias.some(function (g) { return g.slug === slug; })) return lista[i];
    return null;
  }
  return { lista: lista, fases: fases, gratis: gratis, abierta: abierta, estado: estado, deGuia: deGuia };
})();
