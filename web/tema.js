// Modo claro / oscuro. Va en <head> para que la página no parpadee al cargar.
// La primera vez sigue al móvil u ordenador de la persona; si pulsa el botón, se recuerda lo que eligió.
(function () {
  var raiz = document.documentElement;
  var sistema = window.matchMedia ? matchMedia("(prefers-color-scheme: light)") : null;
  var boton = null;
  var SOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var LUNA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function guardado() { try { return localStorage.getItem("tema"); } catch (e) { return null; } }

  function poner(tema) {
    raiz.dataset.tema = tema;
    if (!boton) return;
    var claro = tema === "claro";
    // En claro se enseña la luna (para volver a oscuro) y al revés
    boton.innerHTML = claro ? LUNA : SOL;
    boton.title = claro ? "Modo oscuro" : "Modo claro";
    boton.setAttribute("aria-label", claro ? "Cambiar a modo oscuro" : "Cambiar a modo claro");
  }

  poner(guardado() || (sistema && sistema.matches ? "claro" : "oscuro"));
  if (sistema && sistema.addEventListener) {
    sistema.addEventListener("change", function (e) { if (!guardado()) poner(e.matches ? "claro" : "oscuro"); });
  }

  // El botón va en la cabecera: la de la biblioteca y las guías (.cab nav), la del mapa de repos (.top-right)
  // o la de la landing (.cm-header__nav)
  document.addEventListener("DOMContentLoaded", function () {
    var sitio = document.querySelector(".cab nav, .top-right, .cm-header__nav");
    if (!sitio) return;
    boton = document.createElement("button");
    boton.type = "button";
    boton.className = "tema-boton";
    boton.addEventListener("click", function () {
      var tema = raiz.dataset.tema === "claro" ? "oscuro" : "claro";
      try { localStorage.setItem("tema", tema); } catch (e) {}
      poner(tema);
    });
    sitio.insertBefore(boton, sitio.firstChild);
    poner(raiz.dataset.tema);
  });
})();
